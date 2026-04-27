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
            await targetActor.update(safeUpdateData);
            console.log("D35E Importer | Actor base data updated:", safeUpdateData);
        }

        // Create embedded items (classes, feats, special abilities)
        if (embeddedItems.length > 0) {
            try {
                console.log(`D35E Importer | Creating ${embeddedItems.length} embedded items...`);
                await targetActor.createEmbeddedDocuments("Item", embeddedItems);
                console.log("D35E Importer | Embedded items created successfully.");
            } catch (err) {
                console.error("D35E Importer | Failed to create some embedded items:", err);
                ui.notifications.warn("Some items (feats/classes) could not be created. Check the console for details.");
            }
        }

        ui.notifications.info(game.i18n.localize('D35EImporter.ImportSuccess'));
        this.close();
    }
}
