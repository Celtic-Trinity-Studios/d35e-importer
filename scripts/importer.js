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
                    // Build a comprehensive index from compendiums + world items
                    const gameIndex = await D35EImporterDialog._buildGameIndex();
                    updateData = await StatblockParser.parse(jsonText, gameIndex);
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

        // Build the actor update data (will be applied AFTER items)
        const safeUpdateData = {};
        if (updateData.name) safeUpdateData.name = updateData.name;
        if (updateData.system) safeUpdateData.system = updateData.system;

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
                        console.log(`D35E Importer | Matched '${parsedItem.name}' to item '${foundItemDoc.name}' (type: ${foundItemDoc.type}).`);
                        const baseData = foundItemDoc.toObject();
                        delete baseData._id;

                        // Merge in specific overrides from the parsed item
                        if (parsedItem.system) {
                            if ('quantity' in parsedItem.system) baseData.system.quantity = parsedItem.system.quantity;
                            if ('equipped' in parsedItem.system) baseData.system.equipped = parsedItem.system.equipped;
                            if ('carried' in parsedItem.system) baseData.system.carried = parsedItem.system.carried;
                            if ('masterwork' in parsedItem.system) baseData.system.masterwork = parsedItem.system.masterwork;
                            if ('enh' in parsedItem.system) baseData.system.enh = parsedItem.system.enh;
                            // Only override levels for non-template class items
                            if ('levels' in parsedItem.system && baseData.system?.classType !== "template") {
                                baseData.system.levels = parsedItem.system.levels;
                            }
                            if ('hp' in parsedItem.system) baseData.system.hp = parsedItem.system.hp;
                            if ('actionType' in parsedItem.system && parsedItem.type === "attack") baseData.system.actionType = parsedItem.system.actionType;
                        }
                        
                        // For templates, keep the SRD compendium name; for others retain parsed name (+1 etc.)
                        if (baseData.system?.classType !== "template") {
                            baseData.name = parsedItem.name;
                        }
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
                    // Track desired levels BEFORE D35E potentially zeros them
                    const desiredLevels = new Map();
                    for (const cls of classItems) {
                        desiredLevels.set(cls.id, cls.system?.levels || 1);
                    }
                    let totalLevel = Array.from(desiredLevels.values()).reduce((a, b) => a + b, 0);
                    
                    if (totalLevel > 0) {
                        // Calculate minimum XP for this level
                        let minXP = 0;
                        try {
                            minXP = targetActor.getLevelExp(totalLevel - 1) || 0;
                        } catch(e) {
                            const xpTable = [0, 1000, 3000, 6000, 10000, 15000, 21000, 28000, 36000, 45000, 55000, 66000, 78000, 91000, 105000, 120000, 136000, 153000, 171000, 190000];
                            minXP = xpTable[Math.min(totalLevel - 1, xpTable.length - 1)] || 0;
                        }
                        
                        // Step 1: Enable level progression. D35E creates empty levelUpData entries.
                        await targetActor.update({
                            "system.details.level.available": totalLevel,
                            "system.details.levelUpProgression": true,
                            "system.details.xp.value": minXP
                        });
                        console.log(`D35E Importer | Level progression enabled (level ${totalLevel}, XP ${minXP})`);
                        
                        // Step 2: Read back the levelUpData array, modify classIds, write back as COMPLETE array
                        const currentLevelUpData = foundry.utils.duplicate(targetActor.system.details.levelUpData || []);
                        console.log("D35E Importer | Current levelUpData from actor:", currentLevelUpData);
                        
                        let idx = 0;
                        for (const cls of classItems) {
                            const lvl = desiredLevels.get(cls.id) || 1;
                            for (let i = 0; i < lvl; i++) {
                                if (idx < currentLevelUpData.length) {
                                    currentLevelUpData[idx].classId = cls.id;
                                    currentLevelUpData[idx].class = cls.name;
                                    currentLevelUpData[idx].classImage = cls.img || null;
                                    currentLevelUpData[idx].hp = idx === 0
                                        ? (cls.system?.hp || cls.system?.hd || 8)
                                        : Math.floor((cls.system?.hd || 8) / 2) + 1;
                                }
                                idx++;
                            }
                        }
                        
                        // Write back the complete array and restore class levels
                        await targetActor.update({
                            "system.details.levelUpData": currentLevelUpData
                        });
                        console.log("D35E Importer | LevelUpData written with classIds:", currentLevelUpData);
                        
                        // Step 3: Restore class item levels (D35E's updater may have zeroed them)
                        for (const cls of classItems) {
                            const lvl = desiredLevels.get(cls.id) || 1;
                            try {
                                await targetActor.updateEmbeddedDocuments("Item", [{
                                    _id: cls.id,
                                    "system.levels": lvl
                                }], {stopUpdates: true});
                            } catch(e) {
                                console.warn(`D35E Importer | Could not restore levels for ${cls.name}: ${e.message}`);
                            }
                        }
                        
                        // Final refresh to recalculate everything
                        try { await targetActor.update({}); } catch(e) {}
                        console.log("D35E Importer | Class levels restored and actor refreshed.");
                    }
                }
            } catch (err) {
                console.error("D35E Importer | Failed to create some embedded items:", err);
                ui.notifications.warn("Some items (feats/classes/gear) could not be created. Check the console for details.");
            }
        }

        // Apply actor stats LAST — after items (including templates) are created.
        // This ensures template bonuses don't double-apply since the statblock
        // already has final stats including all template modifications.
        if (Object.keys(safeUpdateData).length > 0) {
            await targetActor.update(foundry.utils.flattenObject(safeUpdateData));
            console.log("D35E Importer | Actor base data set (post-items):", safeUpdateData);
        }

        ui.notifications.info(game.i18n.localize('D35EImporter.ImportSuccess'));
        this.close();
    }

    /**
     * Build a comprehensive game index from all compendiums and world items.
     * Returns { classIndex, raceNames, itemTypes }
     *   classIndex: Map of lowercase class name -> { hd, hp, bab, skillsPerLevel, fort, ref, will, classType }
     *   raceNames: Set of lowercase race names from compendiums
     *   itemTypes: Map of lowercase item name -> item type (for classification)
     */
    static async _buildGameIndex() {
        const classIndex = new Map();
        const raceNames = new Set();
        const itemTypes = new Map();
        
        // 1. Scan world items
        for (const item of game.items) {
            const name = item.name.toLowerCase();
            if (item.type === "class" && !classIndex.has(name)) {
                classIndex.set(name, {
                    hd: item.system?.hd || 8,
                    hp: item.system?.hp || item.system?.hd || 8,
                    bab: item.system?.bab || "med",
                    skillsPerLevel: item.system?.skillsPerLevel || 4,
                    fort: item.system?.savingThrows?.fort?.value || "low",
                    ref: item.system?.savingThrows?.ref?.value || "low",
                    will: item.system?.savingThrows?.will?.value || "high",
                    classType: item.system?.classType || "base"
                });
            }
            if (item.type === "race") raceNames.add(name);
            if (!itemTypes.has(name)) itemTypes.set(name, item.type);
        }
        
        // 2. Scan all Item compendiums
        const packs = game.packs.filter(p => p.metadata.type === "Item");
        for (const pack of packs) {
            try {
                const index = await pack.getIndex({fields: [
                    "name", "type", 
                    "system.hd", "system.hp", "system.bab", "system.skillsPerLevel", 
                    "system.savingThrows", "system.classType",
                    "system.creatureType"
                ]});
                for (const entry of index) {
                    const name = entry.name.toLowerCase();
                    
                    if (entry.type === "class" && !classIndex.has(name)) {
                        classIndex.set(name, {
                            hd: entry.system?.hd || 8,
                            hp: entry.system?.hp || entry.system?.hd || 8,
                            bab: entry.system?.bab || "med",
                            skillsPerLevel: entry.system?.skillsPerLevel || 4,
                            fort: entry.system?.savingThrows?.fort?.value || "low",
                            ref: entry.system?.savingThrows?.ref?.value || "low",
                            will: entry.system?.savingThrows?.will?.value || "high",
                            classType: entry.system?.classType || "base"
                        });
                    }
                    if (entry.type === "race") raceNames.add(name);
                    if (!itemTypes.has(name)) itemTypes.set(name, entry.type);
                }
            } catch(e) {
                // Skip packs that can't be indexed
            }
        }
        
        console.log(`D35E Importer | Game index: ${classIndex.size} classes, ${raceNames.size} races, ${itemTypes.size} total items from compendiums and world.`);
        return { classIndex, raceNames, itemTypes };
    }
}
