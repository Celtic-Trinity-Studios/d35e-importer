class StatblockParser {
    /**
     * Parses a standard d20 Statblock (HTML or Plain Text) from Hero Lab
     * @param {string} textData The raw HTML or Text
     * @returns {Object} An object containing D35E compatible update data
     *
     * D35E Actor Data Schema (from template.json):
     *   system.abilities.[str|dex|con|int|wis|cha].value   — base ability score
     *   system.attributes.hp.value / .max                  — hit points
     *   system.attributes.ac.normal.total                  — normal AC
     *   system.attributes.ac.touch.total                   — touch AC
     *   system.attributes.ac.flatFooted.total              — flat-footed AC
     *   system.attributes.naturalAC                        — natural armor bonus
     *   system.attributes.savingThrows.fort.total           — Fortitude save
     *   system.attributes.savingThrows.ref.total            — Reflex save
     *   system.attributes.savingThrows.will.total           — Will save
     *   system.attributes.init.total                       — initiative modifier
     *   system.attributes.init.bonus                       — init bonus
     *   system.attributes.speed.land.base                  — base land speed
     *   system.attributes.speed.fly.base                   — fly speed
     *   system.attributes.speed.swim.base                  — swim speed
     *   system.attributes.speed.climb.base                 — climb speed
     *   system.attributes.speed.burrow.base                — burrow speed
     *   system.attributes.bab.value                        — base attack bonus
     *   system.attributes.sr.total                         — spell resistance
     *   system.attributes.cmd.total                        — CMD
     *   system.attributes.cmb.total                        — CMB
     *   system.attributes.hd.total                         — hit dice count
     *   system.details.alignment                           — alignment string
     *   system.details.level.value                         — total character level
     */
    static async parse(textData) {
        console.log("D35E Importer | Parsing Hero Lab Statblock...");

        // Normalize: convert <br> to newlines, strip HTML, fix entities
        let linesText = textData.replace(/<br\s*\/?>/gi, '\n')
                                .replace(/<[^>]+>/g, '')
                                .replace(/&nbsp;/g, ' ')
                                .replace(/&amp;/g, '&')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/\r\n/g, '\n');

        const updateData = {
            name: "Imported Statblock Character",
            system: {
                abilities: {},
                attributes: {
                    savingThrows: {},
                    ac: {},
                    speed: {}
                },
                details: {}
            }
        };

        try {
            // ---- Extract Character Name ----
            const lines = linesText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length > 0) {
                // Hero Lab format: "CharacterName    CR 1" or just "CharacterName"
                const nameLineMatch = lines[0].match(/^([A-Za-z0-9\s'-]+?)(?:\s+CR\s*\d+)?$/i);
                if (nameLineMatch) {
                    updateData.name = nameLineMatch[1].trim();
                }
            }

            // ---- Alignment ----
            const alignMatch = linesText.match(/\b(LG|NG|CG|LN|TN|N|CN|LE|NE|CE)\b/);
            if (alignMatch) {
                const alignMap = {
                    'LG': 'lg', 'NG': 'ng', 'CG': 'cg',
                    'LN': 'ln', 'TN': 'tn', 'N': 'tn', 'CN': 'cn',
                    'LE': 'le', 'NE': 'ne', 'CE': 'ce'
                };
                updateData.system.details.alignment = alignMap[alignMatch[1]] || '';
            }

            // ---- Initiative ----
            const initMatch = linesText.match(/Init\s+([+-]?\d+)/i);
            if (initMatch) {
                updateData.system.attributes.init = {
                    total: parseInt(initMatch[1]),
                    bonus: parseInt(initMatch[1])
                };
            }

            // ---- Hit Points ----
            const hpMatch = linesText.match(/hp\s+(\d+)/i);
            if (hpMatch) {
                const hp = parseInt(hpMatch[1]);
                updateData.system.attributes.hp = {
                    value: hp,
                    max: hp,
                    base: hp
                };
            }

            // ---- Hit Dice ----
            const hdMatch = linesText.match(/(\d+)d\d+/i);
            if (hdMatch) {
                updateData.system.attributes.hd = { total: parseInt(hdMatch[1]) };
            }

            // ---- Armor Class ----
            const acMatch = linesText.match(/AC\s+(\d+)/i);
            if (acMatch) {
                updateData.system.attributes.ac.normal = { total: parseInt(acMatch[1]) };

                const touchMatch = linesText.match(/touch\s+(\d+)/i);
                if (touchMatch) {
                    updateData.system.attributes.ac.touch = { total: parseInt(touchMatch[1]) };
                }

                const ffMatch = linesText.match(/flat-footed\s+(\d+)/i);
                if (ffMatch) {
                    updateData.system.attributes.ac.flatFooted = { total: parseInt(ffMatch[1]) };
                }
            }

            // ---- Natural Armor ----
            const natACMatch = linesText.match(/natural\s+armor\s*\+?(\d+)/i) 
                            || linesText.match(/\+(\d+)\s+natural/i);
            if (natACMatch) {
                updateData.system.attributes.naturalAC = parseInt(natACMatch[1]);
            }

            // ---- Saving Throws ----
            const fortMatch = linesText.match(/Fort\s+([+-]?\d+)/i);
            if (fortMatch) {
                updateData.system.attributes.savingThrows.fort = { total: parseInt(fortMatch[1]) };
            }
            const refMatch = linesText.match(/Ref\s+([+-]?\d+)/i);
            if (refMatch) {
                updateData.system.attributes.savingThrows.ref = { total: parseInt(refMatch[1]) };
            }
            const willMatch = linesText.match(/Will\s+([+-]?\d+)/i);
            if (willMatch) {
                updateData.system.attributes.savingThrows.will = { total: parseInt(willMatch[1]) };
            }

            // ---- Base Attack Bonus ----
            const babMatch = linesText.match(/Base\s+Atk\s+\+?(\d+)/i)
                          || linesText.match(/BAB\s+\+?(\d+)/i);
            if (babMatch) {
                updateData.system.attributes.bab = { value: parseInt(babMatch[1]), total: parseInt(babMatch[1]) };
            }

            // ---- CMB / CMD ----
            const cmbMatch = linesText.match(/CMB\s+([+-]?\d+)/i);
            if (cmbMatch) {
                updateData.system.attributes.cmb = { total: parseInt(cmbMatch[1]) };
            }
            const cmdMatch = linesText.match(/CMD\s+(\d+)/i);
            if (cmdMatch) {
                updateData.system.attributes.cmd = { total: parseInt(cmdMatch[1]) };
            }

            // ---- Spell Resistance ----
            const srMatch = linesText.match(/SR\s+(\d+)/i);
            if (srMatch) {
                updateData.system.attributes.sr = { total: parseInt(srMatch[1]) };
            }

            // ---- Speed ----
            const speedMatch = linesText.match(/Speed\s+(\d+)\s*ft/i)
                            || linesText.match(/Spd\s+(\d+)\s*ft/i);
            if (speedMatch) {
                updateData.system.attributes.speed.land = { base: parseInt(speedMatch[1]) };
            }
            const flyMatch = linesText.match(/fly\s+(\d+)\s*ft/i);
            if (flyMatch) {
                updateData.system.attributes.speed.fly = { base: parseInt(flyMatch[1]) };
                const manMatch = linesText.match(/fly\s+\d+\s*ft\.?\s*\((\w+)\)/i);
                if (manMatch) {
                    updateData.system.attributes.speed.fly.maneuverability = manMatch[1].toLowerCase();
                }
            }
            const swimMatch = linesText.match(/swim\s+(\d+)\s*ft/i);
            if (swimMatch) {
                updateData.system.attributes.speed.swim = { base: parseInt(swimMatch[1]) };
            }
            const climbMatch = linesText.match(/climb\s+(\d+)\s*ft/i);
            if (climbMatch) {
                updateData.system.attributes.speed.climb = { base: parseInt(climbMatch[1]) };
            }
            const burrowMatch = linesText.match(/burrow\s+(\d+)\s*ft/i);
            if (burrowMatch) {
                updateData.system.attributes.speed.burrow = { base: parseInt(burrowMatch[1]) };
            }

            // ---- Ability Scores ----
            // These go under system.abilities, NOT system.attributes
            const abilityNames = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
            for (const abl of abilityNames) {
                const regex = new RegExp(`\\b${abl}\\s+(\\d+)`, 'i');
                const match = linesText.match(regex);
                if (match) {
                    const score = parseInt(match[1]);
                    const mod = Math.floor((score - 10) / 2);
                    updateData.system.abilities[abl] = {
                        value: score,
                        total: score,
                        mod: mod
                    };
                }
            }

            // ---- Level (from class lines like "Fighter 5" or "Wizard 3/Rogue 2") ----
            const classLineMatch = linesText.match(/(?:Male|Female|male|female)?\s*\w+\s+((?:\w+\s+\d+\/?)+)/i);
            if (classLineMatch) {
                const classString = classLineMatch[1];
                const classLevels = classString.match(/\d+/g);
                if (classLevels) {
                    const totalLevel = classLevels.reduce((sum, lvl) => sum + parseInt(lvl), 0);
                    updateData.system.details.level = { value: totalLevel };
                }
            }

            console.log("D35E Importer | Statblock Parse Result:", updateData);
            return updateData;

        } catch (error) {
            console.error("D35E Importer | Failed to parse statblock:", error);
            throw new Error("Could not parse the provided statblock data.");
        }
    }
}
