class HeroLabXMLParser {
    /**
     * Parses Hero Lab XML (either standalone or extracted from a .por file)
     * @param {string} xmlString The raw XML text
     * @returns {Object} An object containing D35E compatible update data
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
                attributes: {},
                details: {},
                skills: {}
            }
        };

        // Extract Attributes (Strength, Dexterity, etc.)
        const attributes = character.querySelectorAll("attributes > attribute");
        attributes.forEach(attr => {
            const name = attr.getAttribute("name").toLowerCase().substring(0, 3); // e.g., "str"
            const val = parseInt(attr.querySelector("attrvalue")?.getAttribute("base") || "10");
            if (["str", "dex", "con", "int", "wis", "cha"].includes(name)) {
                updateData.system.attributes[name] = { value: val };
            }
        });

        // Extract Hit Points
        const health = character.querySelector("health");
        if (health) {
            const hp = parseInt(health.getAttribute("hitpoints"));
            updateData.system.attributes.hp = { value: hp, max: hp };
        }

        // Extract Classes / Level
        const classes = character.querySelectorAll("classes > class");
        let totalLevel = 0;
        classes.forEach(c => {
            totalLevel += parseInt(c.getAttribute("level") || "0");
        });
        updateData.system.details.level = totalLevel;

        // Note: The above is a basic skeleton. A full implementation would need to create 
        // Embedded Items for feats, spells, inventory, and classes.

        console.log("D35E Importer | Hero Lab Parse Result:", updateData);
        return updateData;
    }
}
