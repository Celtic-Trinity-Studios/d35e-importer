class D35EImporterDialog extends Application {
    constructor(actor = null, options = {}) {
        super(options);
        this.actor = actor;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'd35e-importer-dialog',
            template: 'modules/d35e-importer/templates/import-dialog.html',
            title: game.i18n.localize('D35EImporter.DialogTitle'),
            width: 400,
            height: 'auto',
            classes: ['d35e-importer-dialog']
        });
    }

    getData() {
        return {
            actor: this.actor
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        
        // Support both jQuery (V12) and plain DOM (V13)
        const element = html instanceof jQuery ? html[0] : (html?.element ?? html);
        
        const submitBtn = element.querySelector('#d35e-import-submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', this._onImport.bind(this));
        }
    }

    _getFormElement() {
        // ApplicationV2 uses this.element as a plain DOM node
        // V12 uses this.element as a jQuery object
        if (this.element instanceof jQuery) {
            return this.element[0];
        }
        return this.element?.element ?? this.element;
    }

    async _onImport(event) {
        event.preventDefault();
        
        const el = this._getFormElement();
        const fileInput = el.querySelector('#d35e-import-file');
        const textArea = el.querySelector('#d35e-import-text');
        const jsonText = textArea ? textArea.value : '';

        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const extension = file.name.split('.').pop().toLowerCase();
            
            try {
                ui.notifications.info(game.i18n.localize('D35EImporter.ImportStarted'));
                let updateData = null;

                if (extension === 'pdf') {
                    updateData = await PDFTextParser.parse(file);
                } else if (extension === 'por') {
                    const arrayBuffer = await file.arrayBuffer();
                    const zip = await JSZip.loadAsync(arrayBuffer);
                    
                    const xmlFiles = Object.keys(zip.files).filter(name => name.endsWith('.xml'));
                    if (xmlFiles.length === 0) throw new Error("No XML found in the Hero Lab Portfolio.");
                    
                    const xmlString = await zip.file(xmlFiles[0]).async("string");
                    updateData = await HeroLabXMLParser.parse(xmlString);
                } else {
                    // Read as text for JSON/XML/HTML/TXT
                    const text = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsText(file);
                    });
                    
                    if (extension === 'xml') {
                        updateData = await HeroLabXMLParser.parse(text);
                    } else if (extension === 'json') {
                        updateData = JSON.parse(text);
                    } else if (extension === 'txt' || extension === 'html' || extension === 'htm') {
                        updateData = await StatblockParser.parse(text);
                    } else {
                        throw new Error(`Unsupported file extension: ${extension}`);
                    }
                }

                if (updateData) {
                    await this.applyUpdate(updateData);
                }

            } catch (err) {
                console.error('D35E Importer | Import failed:', err);
                ui.notifications.error(err.message || game.i18n.localize('D35EImporter.ImportError'));
            }

        } else if (jsonText.trim() !== '') {
            try {
                ui.notifications.info(game.i18n.localize('D35EImporter.ImportStarted'));
                let updateData;
                if (jsonText.trim().startsWith('<character') || jsonText.includes('<?xml')) {
                    // Assume Hero Lab XML
                    updateData = await HeroLabXMLParser.parse(jsonText);
                } else if (jsonText.includes('Init') || jsonText.includes('<html')) {
                    // Assume HTML or Text Statblock
                    updateData = await StatblockParser.parse(jsonText);
                } else {
                    // Assume JSON
                    updateData = JSON.parse(jsonText);
                }
                await this.applyUpdate(updateData);
            } catch (err) {
                console.error('D35E Importer | Text Parse failed:', err);
                ui.notifications.error(err.message || game.i18n.localize('D35EImporter.ImportError'));
            }
        } else {
            ui.notifications.warn(game.i18n.localize('D35EImporter.NoDataWarn'));
        }
    }

    async applyUpdate(updateData) {
        let targetActor = this.actor;
        
        // Extract embedded items before creating/updating the actor
        const embeddedItems = updateData.items || [];
        delete updateData.items;

        if (!targetActor) {
            targetActor = await Actor.create({
                name: updateData.name || "Imported Character",
                type: "character"
            });
        }

        // Build the actor update data
        const safeUpdateData = {};
        if (updateData.name) safeUpdateData.name = updateData.name;
        if (updateData.system) safeUpdateData.system = updateData.system;
        
        if (Object.keys(safeUpdateData).length > 0) {
            await targetActor.update(foundry.utils.flattenObject(safeUpdateData));
            console.log("D35E Importer | Actor base data updated:", safeUpdateData);
        }

        // Create embedded items (classes, feats, special abilities)
        if (embeddedItems.length > 0) {
            try {
                console.log(`D35E Importer | Resolving ${embeddedItems.length} items from world and compendiums...`);
                
                const finalItemsToCreate = [];
                // Load compendium indexes once for performance
                const packs = game.packs.filter(p => p.metadata.type === "Item");
                const packIndexes = [];
                for (let pack of packs) {
                    try {
                        const index = await pack.getIndex({fields: ["name", "type"]});
                        packIndexes.push({ pack, index });
                    } catch (e) {
                        // Ignore if index can't be loaded
                    }
                }

                for (const parsedItem of embeddedItems) {
                    let itemDataToCreate = parsedItem;
                    let foundItemDoc = null;

                    // Clean up item name to help with matching
                    // Many parser generated names have trailing " (Su)" or " (Ex)" or " (Sp)" or bonus numbers
                    let searchName = parsedItem.name.replace(/\s*\((Su|Ex|Sp)\)\s*$/i, '');
                    searchName = searchName.replace(/^\+\d+\s+/, ''); // remove +1
                    searchName = searchName.replace(/masterwork\s+/i, ''); // remove masterwork
                    searchName = searchName.replace(/mwk\s+/i, '').trim();

                    // 1. Search World Items
                    foundItemDoc = game.items.find(i => i.name.toLowerCase() === searchName.toLowerCase());

                    // 2. Search Compendiums
                    if (!foundItemDoc) {
                        for (const {pack, index} of packIndexes) {
                            const entry = index.find(e => e.name.toLowerCase() === searchName.toLowerCase());
                            if (entry) {
                                try {
                                    foundItemDoc = await pack.getDocument(entry._id);
                                } catch(e) {
                                    console.warn(`D35E Importer | Could not fetch '${entry.name}' from pack ${pack.metadata.id}: ${e.message}`);
                                }
                                if (foundItemDoc) break;
                            }
                        }
                    }

                    if (foundItemDoc) {
                        console.log(`D35E Importer | Matched '${parsedItem.name}' to item '${foundItemDoc.name}'.`);
                        const baseData = foundItemDoc.toObject();
                        delete baseData._id;

                        // Merge in specific overrides from the parsed item
                        if (parsedItem.system) {
                            if ('quantity' in parsedItem.system) baseData.system.quantity = parsedItem.system.quantity;
                            if ('equipped' in parsedItem.system) baseData.system.equipped = parsedItem.system.equipped;
                            if ('carried' in parsedItem.system) baseData.system.carried = parsedItem.system.carried;
                            if ('masterwork' in parsedItem.system) baseData.system.masterwork = parsedItem.system.masterwork;
                            if ('enh' in parsedItem.system) baseData.system.enh = parsedItem.system.enh;
                            if ('levels' in parsedItem.system) baseData.system.levels = parsedItem.system.levels;
                            if ('hp' in parsedItem.system) baseData.system.hp = parsedItem.system.hp;
                            if ('actionType' in parsedItem.system && parsedItem.type === "attack") baseData.system.actionType = parsedItem.system.actionType;
                        }
                        
                        // Retain original parsed name to keep "+1" etc.
                        baseData.name = parsedItem.name;
                        itemDataToCreate = baseData;
                    } else {
                        console.log(`D35E Importer | No compendium match for '${parsedItem.name}', creating from raw parse.`);
                    }

                    finalItemsToCreate.push(itemDataToCreate);
                }

                console.log(`D35E Importer | Creating ${finalItemsToCreate.length} embedded items...`);
                // Create items one at a time so a single failure doesn't block the rest
                const createdItems = [];
                for (const itemData of finalItemsToCreate) {
                    try {
                        const result = await targetActor.createEmbeddedDocuments("Item", [itemData], {stopUpdates: true});
                        if (result && result.length > 0) createdItems.push(result[0]);
                    } catch(e) {
                        console.warn(`D35E Importer | Failed to create item '${itemData.name}': ${e.message}`);
                    }
                }
                // Trigger a single refresh after all items are created
                try { await targetActor.update({}); } catch(e) {}
                console.log(`D35E Importer | Created ${createdItems.length}/${finalItemsToCreate.length} embedded items.`);

                // Automatically map levelUpData for the actor based on imported classes
                const classItems = createdItems.filter(i => i.type === "class");
                if (classItems.length > 0) {
                    let totalLevel = classItems.reduce((sum, cls) => sum + (cls.system?.levels || 1), 0);
                    
                    if (totalLevel > 0) {
                        // Calculate minimum XP for this level
                        let minXP = 0;
                        try {
                            minXP = targetActor.getLevelExp(totalLevel - 1) || 0;
                        } catch(e) {
                            const xpTable = [0, 1000, 3000, 6000, 10000, 15000, 21000, 28000, 36000, 45000, 55000, 66000, 78000, 91000, 105000, 120000, 136000, 153000, 171000, 190000];
                            minXP = xpTable[Math.min(totalLevel - 1, xpTable.length - 1)] || 0;
                        }
                        
                        // Step 1: Set XP and level.available. D35E's updater will
                        // auto-create levelUpData entries (all with classId: null)
                        await targetActor.update({
                            "system.details.level.available": totalLevel,
                            "system.details.levelUpProgression": true,
                            "system.details.xp.value": minXP
                        });
                        console.log(`D35E Importer | Level progression enabled (level ${totalLevel}, XP ${minXP})`);
                        
                        // Step 2: Patch classIds onto the auto-created levelUpData entries
                        // Use individual dot-notation keys so D35E's updater doesn't resize
                        const patchUpdate = {};
                        let levelIdx = 0;
                        for (const cls of classItems) {
                            const classLevel = cls.system?.levels || 1;
                            for (let i = 0; i < classLevel; i++) {
                                patchUpdate[`system.details.levelUpData.${levelIdx}.classId`] = cls.id;
                                patchUpdate[`system.details.levelUpData.${levelIdx}.class`] = cls.name;
                                patchUpdate[`system.details.levelUpData.${levelIdx}.classImage`] = cls.img || null;
                                patchUpdate[`system.details.levelUpData.${levelIdx}.hp`] = levelIdx === 0 
                                    ? (cls.system?.hp || cls.system?.hd || 8) 
                                    : Math.floor((cls.system?.hd || 8) / 2) + 1;
                                levelIdx++;
                            }
                        }
                        await targetActor.update(patchUpdate);
                        console.log("D35E Importer | ClassIds patched onto levelUpData:", patchUpdate);
                    }
                }
            } catch (err) {
                console.error("D35E Importer | Failed to create some embedded items:", err);
                ui.notifications.warn("Some items (feats/classes/gear) could not be created. Check the console for details.");
            }
        }

        ui.notifications.info(game.i18n.localize('D35EImporter.ImportSuccess'));
        this.close();
    }
}
