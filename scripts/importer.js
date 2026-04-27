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
        html.find('#d35e-import-submit').click(this._onImport.bind(this));
    }

    async _onImport(event) {
        event.preventDefault();
        
        const fileInput = this.element.find('#d35e-import-file')[0];
        const jsonText = this.element.find('#d35e-import-text').val();

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const extension = file.name.split('.').pop().toLowerCase();
            
            try {
                ui.notifications.info(game.i18n.localize('D35EImporter.ImportStarted'));
                let updateData = null;

                if (extension === 'pdf') {
                    // Pass the file directly to the PDF parser
                    updateData = await PDFTextParser.parse(file);
                } else if (extension === 'por') {
                    // Read .por as array buffer for JSZip
                    const arrayBuffer = await file.arrayBuffer();
                    const zip = await JSZip.loadAsync(arrayBuffer);
                    
                    // A Hero Lab portfolio usually has an internal statblocks.xml or similar
                    // We search for an xml file inside the zip
                    const xmlFiles = Object.keys(zip.files).filter(name => name.endsWith('.xml'));
                    if (xmlFiles.length === 0) throw new Error("No XML found in the Hero Lab Portfolio.");
                    
                    const xmlString = await zip.file(xmlFiles[0]).async("string");
                    updateData = await HeroLabXMLParser.parse(xmlString);
                } else {
                    // Read as text for JSON/XML
                    const text = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsText(file);
                    });
                    
                    if (extension === 'xml') {
                        updateData = await HeroLabXMLParser.parse(text);
                    } else if (extension === 'json') {
                        updateData = JSON.parse(text);
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
                if (jsonText.trim().startsWith('<')) {
                    // Assume XML
                    updateData = await HeroLabXMLParser.parse(jsonText);
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
        
        if (!targetActor) {
            targetActor = await Actor.create({
                name: updateData.name || "Imported Character",
                type: "character"
            });
        }

        // Clean up data to only update what exists to avoid errors on nested objects
        const safeUpdateData = {};
        if (updateData.name) safeUpdateData.name = updateData.name;
        if (updateData.system) safeUpdateData.system = updateData.system;
        
        if (Object.keys(safeUpdateData).length > 0) {
            await targetActor.update(safeUpdateData);
        }

        ui.notifications.info(game.i18n.localize('D35EImporter.ImportSuccess'));
        this.close();
    }
}
