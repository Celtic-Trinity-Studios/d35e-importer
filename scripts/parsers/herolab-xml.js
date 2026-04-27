class HeroLabXMLParser {
    /**
     * Parses Hero Lab XML (either standalone or extracted from a .por file)
     * @param {string} xmlString The raw XML text
     * @returns {Object} An object containing D35E compatible update data
     *
     * D35E paths (from template.json):
     *   system.abilities.[str|dex|con|int|wis|cha].value
     *   system.attributes.hp.value / .max / .base
     *   system.attributes.savingThrows.[fort|ref|will].total
     *   system.attributes.init.total
     *   system.attributes.ac.normal.total / .touch.total / .flatFooted.total
     *   system.attributes.bab.value
     *   system.attributes.speed.land.base
     *   system.details.level.value
     *   system.details.alignment
     */
    static async parse(xmlString) {
        console.log("D35E Importer | Parsing Hero Lab XML...");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        
        // Basic error checking
        const errorNode = xmlDoc.querySelector("parsererror");
        if (errorNode) {
            throw new Error("Invalid XML document.");
        }

        const character = xmlDoc.querySelector("character");
        if (!character) {
            throw new Error("Could not find <character> tag in XML.");
        }

        // Initialize update data mapped to D35E actor schema
        const updateData = {
            name: character.getAttribute("name") || "Imported Character",
            system: {
                abilities: {},
                attributes: {
                    savingThrows: {},
                    ac: {},
                    speed: {}
                },
                details: {},
                skills: {}
            }
        };

        // ---- Extract Ability Scores ----
        // D35E stores these under system.abilities, NOT system.attributes
        const attributes = character.querySelectorAll("attributes > attribute");
        attributes.forEach(attr => {
            const name = attr.getAttribute("name").toLowerCase().substring(0, 3);
            const val = parseInt(attr.querySelector("attrvalue")?.getAttribute("base") || "10");
            if (["str", "dex", "con", "int", "wis", "cha"].includes(name)) {
                const mod = Math.floor((val - 10) / 2);
                updateData.system.abilities[name] = {
                    value: val,
                    total: val,
                    mod: mod
                };
            }
        });

        // ---- Extract Hit Points ----
        const health = character.querySelector("health");
        if (health) {
            const hp = parseInt(health.getAttribute("hitpoints"));
            updateData.system.attributes.hp = { value: hp, max: hp, base: hp };
        }

        // ---- Extract Saving Throws ----
        const saves = character.querySelectorAll("saves > save");
        saves.forEach(save => {
            const saveName = save.getAttribute("abbr")?.toLowerCase();
            const saveTotal = parseInt(save.getAttribute("save") || "0");
            const saveBase = parseInt(save.getAttribute("base") || "0");
            if (saveName === "fort") {
                updateData.system.attributes.savingThrows.fort = { total: saveTotal, base: saveBase };
            } else if (saveName === "ref") {
                updateData.system.attributes.savingThrows.ref = { total: saveTotal, base: saveBase };
            } else if (saveName === "will") {
                updateData.system.attributes.savingThrows.will = { total: saveTotal, base: saveBase };
            }
        });

        // ---- Extract Initiative ----
        const init = character.querySelector("initiative");
        if (init) {
            const initTotal = parseInt(init.getAttribute("total") || "0");
            updateData.system.attributes.init = { total: initTotal, bonus: initTotal };
        }

        // ---- Extract Armor Class ----
        const ac = character.querySelector("armorclass");
        if (ac) {
            const acTotal = parseInt(ac.getAttribute("ac") || "10");
            const touchAC = parseInt(ac.getAttribute("touch") || "10");
            const ffAC = parseInt(ac.getAttribute("flatfooted") || "10");
            updateData.system.attributes.ac.normal = { total: acTotal };
            updateData.system.attributes.ac.touch = { total: touchAC };
            updateData.system.attributes.ac.flatFooted = { total: ffAC };
        }

        // ---- Extract BAB ----
        const attack = character.querySelector("attack");
        if (attack) {
            const bab = parseInt(attack.getAttribute("baseattack") || "0");
            updateData.system.attributes.bab = { value: bab, total: bab };
        }

        // ---- Extract Speed ----
        const movement = character.querySelector("movement > speed");
        if (movement) {
            const speedVal = parseInt(movement.getAttribute("value") || "30");
            updateData.system.attributes.speed.land = { base: speedVal };
        }

        // ---- Extract Classes / Level ----
        const classes = character.querySelectorAll("classes > class");
        let totalLevel = 0;
        classes.forEach(c => {
            totalLevel += parseInt(c.getAttribute("level") || "0");
        });
        updateData.system.details.level = { value: totalLevel };

        // ---- Extract Alignment ----
        const align = character.querySelector("alignment");
        if (align) {
            const alignName = align.getAttribute("name") || "";
            const alignMap = {
                'Lawful Good': 'lg', 'Neutral Good': 'ng', 'Chaotic Good': 'cg',
                'Lawful Neutral': 'ln', 'True Neutral': 'tn', 'Neutral': 'tn', 'Chaotic Neutral': 'cn',
                'Lawful Evil': 'le', 'Neutral Evil': 'ne', 'Chaotic Evil': 'ce'
            };
            updateData.system.details.alignment = alignMap[alignName] || '';
        }

        // Note: A full implementation would also create Embedded Items
        // for feats, spells, inventory, and class items.

        console.log("D35E Importer | Hero Lab Parse Result:", updateData);
        return updateData;
    }
}
