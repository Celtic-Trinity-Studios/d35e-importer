class StatblockParser {
    /**
     * Parses a standard d20 Statblock (HTML or Plain Text) from Hero Lab
     * @param {string} textData The raw HTML or Text
     * @returns {Object} An object containing D35E compatible update data
     */
    static async parse(textData) {
        console.log("D35E Importer | Parsing Hero Lab Statblock...");
        
        // Preserve newlines before stripping HTML for easier line-by-line parsing
        let linesText = textData.replace(/<br\s*\/?>/gi, '\n')
                                .replace(/<[^>]+>/g, '') // strip remaining HTML tags
                                .replace(/&nbsp;/g, ' ')
                                .replace(/\r\n/g, '\n');

        const updateData = {
            name: "Imported Statblock Character",
            system: {
                attributes: {},
                details: {}
            }
        };

        try {
            // Extract Name (Usually the first non-empty line before "CR")
            const lines = linesText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length > 0) {
                // Matches "PAITH    CR 1"
                const nameLineMatch = lines[0].match(/^([A-Za-z0-9\s]+)(?:CR\s*\d+)?/i);
                if (nameLineMatch) {
                    updateData.name = nameLineMatch[1].trim();
                }
            }

            // Initiative
            const initMatch = linesText.match(/Init\s+([+-]?\d+)/i);
            if (initMatch) updateData.system.attributes.init = { value: parseInt(initMatch[1]) };

            // Hit Points
            const hpMatch = linesText.match(/hp\s+(\d+)/i);
            if (hpMatch) updateData.system.attributes.hp = { value: parseInt(hpMatch[1]), max: parseInt(hpMatch[1]) };

            // Armor Class
            const acMatch = linesText.match(/AC\s+(\d+)/i);
            if (acMatch) {
                updateData.system.attributes.ac = { normal: { value: parseInt(acMatch[1]) } };
                const touchMatch = linesText.match(/touch\s+(\d+)/i);
                if (touchMatch) updateData.system.attributes.ac.touch = { value: parseInt(touchMatch[1]) };
                const ffMatch = linesText.match(/flat-footed\s+(\d+)/i);
                if (ffMatch) updateData.system.attributes.ac.flatFooted = { value: parseInt(ffMatch[1]) };
            }

            // Saving Throws
            const fortMatch = linesText.match(/Fort\s+([+-]?\d+)/i);
            if (fortMatch) updateData.system.attributes.fort = { value: parseInt(fortMatch[1]) };
            const refMatch = linesText.match(/Ref\s+([+-]?\d+)/i);
            if (refMatch) updateData.system.attributes.ref = { value: parseInt(refMatch[1]) };
            const willMatch = linesText.match(/Will\s+([+-]?\d+)/i);
            if (willMatch) updateData.system.attributes.will = { value: parseInt(willMatch[1]) };

            // Ability Scores (if present in the block)
            const strMatch = linesText.match(/Str\s+(\d+)/i);
            if (strMatch) updateData.system.attributes.str = { value: parseInt(strMatch[1]) };
            const dexMatch = linesText.match(/Dex\s+(\d+)/i);
            if (dexMatch) updateData.system.attributes.dex = { value: parseInt(dexMatch[1]) };
            const conMatch = linesText.match(/Con\s+(\d+)/i);
            if (conMatch) updateData.system.attributes.con = { value: parseInt(conMatch[1]) };
            const intMatch = linesText.match(/Int\s+(\d+)/i);
            if (intMatch) updateData.system.attributes.int = { value: parseInt(intMatch[1]) };
            const wisMatch = linesText.match(/Wis\s+(\d+)/i);
            if (wisMatch) updateData.system.attributes.wis = { value: parseInt(wisMatch[1]) };
            const chaMatch = linesText.match(/Cha\s+(\d+)/i);
            if (chaMatch) updateData.system.attributes.cha = { value: parseInt(chaMatch[1]) };

            console.log("D35E Importer | Statblock Parse Result:", updateData);
            return updateData;

        } catch (error) {
            console.error("D35E Importer | Failed to parse statblock:", error);
            throw new Error("Could not parse the provided statblock data.");
        }
    }
}
