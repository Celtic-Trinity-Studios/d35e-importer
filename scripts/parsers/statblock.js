class StatblockParser {
    /**
     * D35E skill name → 3-letter code mapping
     * Based on the D35E system template.json
     */
    static SKILL_MAP = {
        'appraise': 'apr',
        'balance': 'blc',
        'bluff': 'blf',
        'climb': 'clm',
        'concentration': 'coc',
        'craft': 'crf',
        'decipher script': 'dsc',
        'diplomacy': 'dip',
        'disable device': 'dev',
        'disguise': 'dis',
        'escape artist': 'esc',
        'forgery': 'fog',
        'gather information': 'gif',
        'handle animal': 'han',
        'heal': 'hea',
        'hide': 'hid',
        'intimidate': 'int',
        'jump': 'jmp',
        'knowledge (arcana)': 'kar',
        'knowledge (dungeoneering)': 'kdu',
        'knowledge (engineering)': 'ken',
        'knowledge (geography)': 'kge',
        'knowledge (history)': 'khi',
        'knowledge (local)': 'klo',
        'knowledge (nature)': 'kna',
        'knowledge (nobility)': 'kno',
        'knowledge (nobility and royalty)': 'kno',
        'knowledge (the planes)': 'kpl',
        'knowledge (planes)': 'kpl',
        'knowledge (religion)': 'kre',
        'knowledge (psionics)': 'kps',
        'listen': 'lis',
        'move silently': 'mos',
        'open lock': 'opl',
        'perform': 'prf',
        'profession': 'pro',
        'ride': 'rid',
        'search': 'src',
        'sense motive': 'sen',
        'sleight of hand': 'slt',
        'speak language': 'spk',
        'spellcraft': 'spl',
        'spot': 'spt',
        'survival': 'sur',
        'swim': 'swm',
        'tumble': 'tmb',
        'use magic device': 'umd',
        'use rope': 'uro',
        'autohypnosis': 'aut',
        'psicraft': 'psi',
        'use psionic device': 'upd'
    };

    /**
     * Size name → D35E code mapping
     */
    static SIZE_MAP = {
        'fine': 'fine',
        'diminutive': 'dim',
        'tiny': 'tiny',
        'small': 'sm',
        'medium': 'med',
        'large': 'lg',
        'huge': 'huge',
        'gargantuan': 'grg',
        'colossal': 'col'
    };

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
     *   system.attributes.speed.land.base                  — base land speed
     *   system.attributes.bab.value                        — base attack bonus
     *   system.attributes.sr.total                         — spell resistance
     *   system.attributes.cmd.total                        — CMD
     *   system.attributes.cmb.total                        — CMB
     *   system.skills.<code>.rank                          — skill ranks
     *   system.details.alignment                           — alignment string
     *   system.details.level.value                         — total character level
     *   system.traits.size                                 — size category
     *
     * Embedded Items (via createEmbeddedDocuments):
     *   type: "class"  — { name, levels, hd, bab, savingThrows, ... }
     *   type: "feat"   — { name, featType, description, ... }
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
            name: "Imported Character",
            system: {
                abilities: {},
                attributes: {
                    savingThrows: {},
                    ac: {},
                    speed: {},
                    senses: {}
                },
                details: {},
                skills: {},
                traits: {}
            },
            items: []  // Embedded items: classes, feats, etc.
        };

        try {
            const lines = linesText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            // ---- Extract Character Name ----
            // First line is usually the character name, possibly followed by CR
            // Examples: "Paith", "Goblin Warrior CR 1/2", "Bob the Fighter"
            if (lines.length > 0) {
                let nameLine = lines[0];
                // Remove CR designation if present
                nameLine = nameLine.replace(/\s+CR\s+[\d\/]+\s*$/i, '').trim();
                if (nameLine.length > 0) {
                    updateData.name = nameLine;
                }
            }

            // ---- Race / Class / Level line ----
            // Usually on line 2, e.g.: "Male Human Fighter 5" or "Female Elf Wizard 3/Rogue 2"
            // Or for monsters: "NE Medium Undead"
            let classLine = '';
            for (let i = 0; i < Math.min(lines.length, 5); i++) {
                // Look for a line with class+level patterns like "Fighter 5" or size+type
                if (lines[i].match(/(?:Male|Female)?\s*\w+\s+(?:Fighter|Wizard|Rogue|Cleric|Ranger|Paladin|Barbarian|Bard|Druid|Monk|Sorcerer|Warlock|Artificer)/i) ||
                    lines[i].match(/\b(?:Fine|Diminutive|Tiny|Small|Medium|Large|Huge|Gargantuan|Colossal)\b/i)) {
                    classLine = lines[i];
                    break;
                }
            }

            // ---- Alignment ----
            const alignMatch = linesText.match(/\b(LG|NG|CG|LN|TN|CN|LE|NE|CE)\b/);
            if (alignMatch) {
                const alignMap = {
                    'LG': 'lg', 'NG': 'ng', 'CG': 'cg',
                    'LN': 'ln', 'TN': 'tn', 'N': 'tn', 'CN': 'cn',
                    'LE': 'le', 'NE': 'ne', 'CE': 'ce'
                };
                updateData.system.details.alignment = alignMap[alignMatch[1]] || '';
            }

            // ---- Size ----
            const sizeMatch = linesText.match(/\b(Fine|Diminutive|Tiny|Small|Medium|Large|Huge|Gargantuan|Colossal)\b/i);
            if (sizeMatch) {
                const sizeCode = StatblockParser.SIZE_MAP[sizeMatch[1].toLowerCase()];
                if (sizeCode) {
                    updateData.system.traits.size = sizeCode;
                }
            }

            // ---- Extract Classes and Levels ----
            // Match patterns like "Fighter 5", "Wizard 3/Rogue 2", etc.
            const classPatterns = classLine.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(\d+)/g);
            let totalLevel = 0;
            if (classPatterns) {
                for (const cp of classPatterns) {
                    const cpMatch = cp.match(/^(.+?)\s+(\d+)$/);
                    if (cpMatch) {
                        const className = cpMatch[1].trim();
                        const classLevel = parseInt(cpMatch[2]);
                        // Skip words that are race/gender/alignment/size, not classes
                        const skipWords = ['Male', 'Female', 'Fine', 'Diminutive', 'Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan', 'Colossal', 'Human', 'Elf', 'Dwarf', 'Halfling', 'Gnome', 'Half'];
                        if (skipWords.includes(className)) continue;
                        
                        totalLevel += classLevel;
                        updateData.items.push({
                            name: className,
                            type: "class",
                            system: {
                                levels: classLevel,
                                classType: "base",
                                hd: 8,
                                description: { value: `Imported from statblock: ${className} level ${classLevel}` }
                            }
                        });
                    }
                }
            }
            if (totalLevel > 0) {
                updateData.system.details.level = { value: totalLevel };
            }

            // ---- Initiative ----
            const initMatch = linesText.match(/Init\s+([+-]?\d+)/i);
            if (initMatch) {
                updateData.system.attributes.init = {
                    total: parseInt(initMatch[1]),
                    bonus: parseInt(initMatch[1])
                };
            }

            // ---- Senses ----
            const sensesMatch = linesText.match(/Senses\s+(.+?)(?:$|\n)/im);
            if (sensesMatch) {
                const sensesStr = sensesMatch[1];
                const dvMatch = sensesStr.match(/darkvision\s+(\d+)\s*ft/i);
                if (dvMatch) updateData.system.attributes.senses.darkvision = parseInt(dvMatch[1]);
                const bsMatch = sensesStr.match(/blindsight\s+(\d+)\s*ft/i);
                if (bsMatch) updateData.system.attributes.senses.blindsight = parseInt(bsMatch[1]);
                const llMatch = sensesStr.match(/low-light\s+vision/i);
                if (llMatch) updateData.system.attributes.senses.lowLight = true;
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
            // Match pattern like "(5d10+15)" after hp
            const hdMatch = linesText.match(/hp\s+\d+\s*\((\d+)d(\d+)/i);
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

            // ---- Grapple (3.5e) / CMB / CMD ----
            const grpMatch = linesText.match(/Grp\s+([+-]?\d+)/i);
            if (grpMatch) {
                updateData.system.attributes.cmb = { total: parseInt(grpMatch[1]) };
            }
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
            const speedMatch = linesText.match(/(?:Speed|Spd)\s+(\d+)\s*ft/i);
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
            const climbSpeedMatch = linesText.match(/climb\s+(\d+)\s*ft/i);
            if (climbSpeedMatch) {
                updateData.system.attributes.speed.climb = { base: parseInt(climbSpeedMatch[1]) };
            }
            const burrowMatch = linesText.match(/burrow\s+(\d+)\s*ft/i);
            if (burrowMatch) {
                updateData.system.attributes.speed.burrow = { base: parseInt(burrowMatch[1]) };
            }

            // ---- Ability Scores ----
            // These go under system.abilities, NOT system.attributes
            const abilityNames = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
            // Look for the ability line: "Str 18, Dex 14, Con 16, Int 10, Wis 12, Cha 8"
            const abilityLineMatch = linesText.match(/Str\s+(\d+|-+)[\s,]+Dex\s+(\d+|-+)[\s,]+Con\s+(\d+|-+)[\s,]+Int\s+(\d+|-+)[\s,]+Wis\s+(\d+|-+)[\s,]+Cha\s+(\d+|-+)/i);
            if (abilityLineMatch) {
                for (let i = 0; i < abilityNames.length; i++) {
                    const raw = abilityLineMatch[i + 1];
                    if (raw === '-' || raw === '--' || raw === '---') continue; // Non-ability (e.g., undead have no Con)
                    const score = parseInt(raw);
                    if (!isNaN(score)) {
                        const mod = Math.floor((score - 10) / 2);
                        updateData.system.abilities[abilityNames[i]] = {
                            value: score,
                            total: score,
                            mod: mod
                        };
                    }
                }
            } else {
                // Fallback: try individual matches
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
            }

            // ---- Skills ----
            // Format: "Skills Climb +8, Jump +5, Listen +4, Spot +4"
            // or "Skills: Climb +8, Jump +5"
            const skillsMatch = linesText.match(/Skills:?\s+(.+?)(?=\n(?:Feats|Languages|Possessions|Special|SQ|$)|\n\n)/is);
            if (skillsMatch) {
                const skillsStr = skillsMatch[1].replace(/\n/g, ', ');
                // Match individual skills: "Skill Name +/-N" or "Skill Name (subtype) +/-N"
                const skillEntries = skillsStr.match(/([A-Za-z][A-Za-z\s]*(?:\([^)]+\))?)\s+([+-]\d+)/g);
                if (skillEntries) {
                    for (const entry of skillEntries) {
                        const entryMatch = entry.match(/^(.+?)\s+([+-]?\d+)$/);
                        if (entryMatch) {
                            const skillName = entryMatch[1].trim().toLowerCase();
                            const skillMod = parseInt(entryMatch[2]);
                            
                            // Try to find the D35E skill code
                            const code = StatblockParser.SKILL_MAP[skillName];
                            if (code) {
                                // We store the modifier value; the system will compute from rank + ability + misc
                                // Since we can't perfectly decompose the total, we store as mod
                                updateData.system.skills[code] = {
                                    rank: Math.max(0, skillMod), // Approximation: use total as rank
                                    mod: skillMod
                                };
                            } else {
                                // Try partial match for knowledge/perform/craft/profession subtypes
                                let found = false;
                                for (const [key, val] of Object.entries(StatblockParser.SKILL_MAP)) {
                                    if (skillName.startsWith(key.split(' ')[0]) && skillName.includes('(')) {
                                        updateData.system.skills[val] = {
                                            rank: Math.max(0, skillMod),
                                            mod: skillMod
                                        };
                                        found = true;
                                        break;
                                    }
                                }
                                if (!found) {
                                    console.log(`D35E Importer | Unknown skill: "${skillName}" with modifier ${skillMod}`);
                                }
                            }
                        }
                    }
                }
            }

            // ---- Feats ----
            // Format: "Feats Alertness, Power Attack, Weapon Focus (Longsword)"
            // or "Feats: Alertness, Power Attack"
            const featsMatch = linesText.match(/Feats:?\s+(.+?)(?=\n(?:Skills|Languages|Possessions|Special|SQ|Environment|$)|\n\n)/is);
            if (featsMatch) {
                const featsStr = featsMatch[1].replace(/\n/g, ', ');
                // Split on commas, but be careful of parenthetical content
                const featNames = StatblockParser._splitOnCommas(featsStr);
                for (const featName of featNames) {
                    const trimmed = featName.trim();
                    if (trimmed.length === 0) continue;
                    // Skip if it looks like a section header that leaked in
                    if (trimmed.match(/^(Skills|Languages|Possessions|Special)/i)) break;
                    
                    updateData.items.push({
                        name: trimmed,
                        type: "feat",
                        system: {
                            featType: "feat",
                            description: { value: `Imported from statblock` }
                        }
                    });
                }
            }

            // ---- Special Attacks ----
            const saMatch = linesText.match(/Special\s+Attacks?:?\s+(.+?)(?=\n(?:Special\s+Qualities|SQ|Feats|Skills|$)|\n\n)/is);
            if (saMatch) {
                const saStr = saMatch[1].replace(/\n/g, ', ');
                const saNames = StatblockParser._splitOnCommas(saStr);
                for (const sa of saNames) {
                    const trimmed = sa.trim();
                    if (trimmed.length === 0) continue;
                    if (trimmed.match(/^(Special\s+Qualities|SQ|Feats|Skills)/i)) break;
                    updateData.items.push({
                        name: trimmed,
                        type: "feat",
                        system: {
                            featType: "classFeat",
                            abilityType: "su",
                            description: { value: `Special Attack imported from statblock` }
                        }
                    });
                }
            }

            // ---- Special Qualities ----
            const sqMatch = linesText.match(/(?:Special\s+Qualities|SQ):?\s+(.+?)(?=\n(?:Feats|Skills|Possessions|$)|\n\n)/is);
            if (sqMatch) {
                const sqStr = sqMatch[1].replace(/\n/g, ', ');
                const sqNames = StatblockParser._splitOnCommas(sqStr);
                for (const sq of sqNames) {
                    const trimmed = sq.trim();
                    if (trimmed.length === 0) continue;
                    if (trimmed.match(/^(Feats|Skills|Possessions)/i)) break;
                    updateData.items.push({
                        name: trimmed,
                        type: "feat",
                        system: {
                            featType: "classFeat",
                            abilityType: "ex",
                            description: { value: `Special Quality imported from statblock` }
                        }
                    });
                }
            }

            // ---- Languages ----
            const langMatch = linesText.match(/Languages?\s+(.+?)(?=\n|$)/im);
            if (langMatch) {
                const langStr = langMatch[1].trim();
                const langs = langStr.split(/[,;]/).map(l => l.trim()).filter(l => l.length > 0);
                updateData.system.traits.languages = {
                    custom: langs.join(';')
                };
            }

            // ---- Gender / Deity ----
            const genderMatch = classLine.match(/^(Male|Female)\b/i);
            if (genderMatch) {
                updateData.system.details.gender = genderMatch[1];
            }

            console.log("D35E Importer | Statblock Parse Result:", updateData);
            return updateData;

        } catch (error) {
            console.error("D35E Importer | Failed to parse statblock:", error);
            throw new Error("Could not parse the provided statblock data.");
        }
    }

    /**
     * Split a string on commas, respecting parenthetical groupings
     * e.g., "Power Attack, Weapon Focus (Longsword), Improved Initiative"
     * → ["Power Attack", "Weapon Focus (Longsword)", "Improved Initiative"]
     */
    static _splitOnCommas(str) {
        const result = [];
        let current = '';
        let depth = 0;
        for (const char of str) {
            if (char === '(') depth++;
            else if (char === ')') depth--;
            else if (char === ',' && depth === 0) {
                result.push(current.trim());
                current = '';
                continue;
            }
            current += char;
        }
        if (current.trim().length > 0) result.push(current.trim());
        return result;
    }
}
