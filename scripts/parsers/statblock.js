class StatblockParser {
    static SKILL_MAP = {
        'appraise': 'apr', 'balance': 'blc', 'bluff': 'blf', 'climb': 'clm',
        'concentration': 'coc', 'craft': 'crf', 'decipher script': 'dsc',
        'diplomacy': 'dip', 'disable device': 'dev', 'disguise': 'dis',
        'escape artist': 'esc', 'forgery': 'fog', 'gather information': 'gif',
        'handle animal': 'han', 'heal': 'hea', 'hide': 'hid', 'intimidate': 'int',
        'jump': 'jmp', 'knowledge (arcana)': 'kar', 'knowledge (dungeoneering)': 'kdu',
        'knowledge (engineering)': 'ken', 'knowledge (geography)': 'kge',
        'knowledge (history)': 'khi', 'knowledge (local)': 'klo',
        'knowledge (nature)': 'kna', 'knowledge (nobility)': 'kno',
        'knowledge (nobility and royalty)': 'kno', 'knowledge (the planes)': 'kpl',
        'knowledge (planes)': 'kpl', 'knowledge (religion)': 'kre',
        'knowledge (psionics)': 'kps', 'listen': 'lis', 'move silently': 'mos',
        'open lock': 'opl', 'perform': 'prf', 'profession': 'pro', 'ride': 'rid',
        'search': 'src', 'sense motive': 'sen', 'sleight of hand': 'slt',
        'speak language': 'spk', 'spellcraft': 'spl', 'spot': 'spt',
        'survival': 'sur', 'swim': 'swm', 'tumble': 'tmb',
        'use magic device': 'umd', 'use rope': 'uro',
        'autohypnosis': 'aut', 'psicraft': 'psi', 'use psionic device': 'upd'
    };

    static SIZE_MAP = {
        'fine': 'fine', 'diminutive': 'dim', 'tiny': 'tiny', 'small': 'sm',
        'medium': 'med', 'large': 'lg', 'huge': 'huge', 'gargantuan': 'grg', 'colossal': 'col'
    };

    // Known D&D 3.5e classes with HD, BAB progression, and save progressions
    static CLASS_DATA = {
        'barbarian':  { hd: 12, hp: 12, bab: 'high', fort: 'high', ref: 'low',  will: 'low',  skillsPerLevel: 4 },
        'bard':       { hd: 6,  hp: 6,  bab: 'med',  fort: 'low',  ref: 'high', will: 'high', skillsPerLevel: 6 },
        'cleric':     { hd: 8,  hp: 8,  bab: 'med',  fort: 'high', ref: 'low',  will: 'high', skillsPerLevel: 2 },
        'druid':      { hd: 8,  hp: 8,  bab: 'med',  fort: 'high', ref: 'low',  will: 'high', skillsPerLevel: 4 },
        'fighter':    { hd: 10, hp: 10, bab: 'high', fort: 'high', ref: 'low',  will: 'low',  skillsPerLevel: 2 },
        'monk':       { hd: 8,  hp: 8,  bab: 'med',  fort: 'high', ref: 'high', will: 'high', skillsPerLevel: 4 },
        'paladin':    { hd: 10, hp: 10, bab: 'high', fort: 'high', ref: 'low',  will: 'low',  skillsPerLevel: 2 },
        'ranger':     { hd: 8,  hp: 8,  bab: 'high', fort: 'high', ref: 'high', will: 'low',  skillsPerLevel: 6 },
        'rogue':      { hd: 6,  hp: 6,  bab: 'med',  fort: 'low',  ref: 'high', will: 'low',  skillsPerLevel: 8 },
        'sorcerer':   { hd: 4,  hp: 4,  bab: 'low',  fort: 'low',  ref: 'low',  will: 'high', skillsPerLevel: 2 },
        'wizard':     { hd: 4,  hp: 4,  bab: 'low',  fort: 'low',  ref: 'low',  will: 'high', skillsPerLevel: 2 },
        'warlock':    { hd: 6,  hp: 6,  bab: 'med',  fort: 'low',  ref: 'low',  will: 'high', skillsPerLevel: 2 },
        'artificer':  { hd: 6,  hp: 6,  bab: 'med',  fort: 'high', ref: 'low',  will: 'high', skillsPerLevel: 4 },
        'scout':      { hd: 8,  hp: 8,  bab: 'med',  fort: 'low',  ref: 'high', will: 'low',  skillsPerLevel: 8 },
        'swashbuckler':{ hd: 10, hp: 10, bab: 'high', fort: 'high', ref: 'low',  will: 'low',  skillsPerLevel: 4 },
        'hexblade':   { hd: 10, hp: 10, bab: 'high', fort: 'low',  ref: 'low',  will: 'high', skillsPerLevel: 2 },
        'samurai':    { hd: 10, hp: 10, bab: 'high', fort: 'high', ref: 'low',  will: 'low',  skillsPerLevel: 2 },
        'ninja':      { hd: 6,  hp: 6,  bab: 'med',  fort: 'low',  ref: 'high', will: 'low',  skillsPerLevel: 6 },
        'shaman':     { hd: 8,  hp: 8,  bab: 'med',  fort: 'low',  ref: 'low',  will: 'high', skillsPerLevel: 4 },
        'favored soul':{ hd: 8,  hp: 8,  bab: 'med',  fort: 'high', ref: 'high', will: 'high', skillsPerLevel: 2 },
        'spirit shaman':{ hd: 8,  hp: 8,  bab: 'med',  fort: 'high', ref: 'low',  will: 'high', skillsPerLevel: 2 },
        'duskblade':  { hd: 8,  hp: 8,  bab: 'high', fort: 'high', ref: 'low',  will: 'high', skillsPerLevel: 2 },
        'knight':     { hd: 12, hp: 12, bab: 'high', fort: 'high', ref: 'low',  will: 'low',  skillsPerLevel: 2 },
        'warmage':    { hd: 6,  hp: 6,  bab: 'med',  fort: 'low',  ref: 'low',  will: 'high', skillsPerLevel: 2 },
        'wu jen':     { hd: 4,  hp: 4,  bab: 'low',  fort: 'low',  ref: 'low',  will: 'high', skillsPerLevel: 2 },
        'psion':      { hd: 4,  hp: 4,  bab: 'low',  fort: 'low',  ref: 'low',  will: 'high', skillsPerLevel: 2 },
        'psychic warrior':{ hd: 8,  hp: 8,  bab: 'med',  fort: 'high', ref: 'low',  will: 'low',  skillsPerLevel: 2 },
        'wilder':     { hd: 6,  hp: 6,  bab: 'med',  fort: 'low',  ref: 'low',  will: 'high', skillsPerLevel: 4 },
        'soulknife':  { hd: 10, hp: 10, bab: 'med',  fort: 'low',  ref: 'high', will: 'low',  skillsPerLevel: 4 },
    };

    // Known D&D 3.5e races
    static RACES = [
        'human', 'elf', 'half-elf', 'halfelf', 'dwarf', 'halfling', 'gnome',
        'half-orc', 'halforc', 'aasimar', 'tiefling', 'drow', 'orc', 'goblin',
        'kobold', 'hobgoblin', 'bugbear', 'ogre', 'troll', 'minotaur',
        'lizardfolk', 'troglodyte', 'yuan-ti', 'duergar', 'svirfneblin',
        'changeling', 'shifter', 'warforged', 'kalashtar', 'genasi',
        'goliath', 'raptorian', 'hadozee', 'catfolk', 'ratfolk'
    ];

    static async parse(textData) {
        console.log("D35E Importer | Parsing Hero Lab Statblock...");

        // Strip <title> tag content and <style> blocks before processing
        let cleanedHtml = textData.replace(/<title[^>]*>.*?<\/title>/gis, '')
                                   .replace(/<style[^>]*>.*?<\/style>/gis, '')
                                   .replace(/<head[^>]*>.*?<\/head>/gis, '');

        // Normalize: convert <br> to newlines, strip HTML, fix entities
        let linesText = cleanedHtml.replace(/<br\s*\/?>/gi, '\n')
                                .replace(/<[^>]+>/g, '')
                                .replace(/&nbsp;/g, ' ')
                                .replace(/&amp;/g, '&')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&reg;/gi, '')
                                .replace(/\u00AE/g, '')  // ® character
                                .replace(/\r\n/g, '\n');

        const updateData = {
            name: "Imported Character",
            system: {
                abilities: {},
                attributes: { savingThrows: {}, ac: {}, speed: {}, senses: {} },
                details: {},
                skills: {},
                traits: {}
            },
            items: []
        };

        try {
            let lines = linesText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            // Filter out Hero Lab branding/junk lines
            lines = lines.filter(l => {
                const lower = l.toLowerCase();
                return !lower.includes('created with hero lab') &&
                       !lower.includes('hero lab and the hero lab logo') &&
                       !lower.startsWith('hero lab') &&
                       l !== '-' && l !== '—';
            });

            // ---- Extract Character Name ----
            // First meaningful line is usually the name, possibly with "CR X"
            if (lines.length > 0) {
                let nameLine = lines[0];
                nameLine = nameLine.replace(/\s+CR\s+[\d\/]+\s*$/i, '').trim();
                // Remove leading dashes/hyphens
                nameLine = nameLine.replace(/^[-–—]+\s*/, '').trim();
                if (nameLine.length > 0 && nameLine.length < 100) {
                    updateData.name = nameLine;
                }
            }

            // ---- Find the Race/Class/Level line ----
            // e.g., "Male Human Wizard 1" or "Female Half-Elf Ranger 3/Rogue 2"
            let classLine = '';
            let classLineIdx = -1;
            const classNames = Object.keys(StatblockParser.CLASS_DATA);
            const classRegex = new RegExp('\\b(' + classNames.map(c => c.replace(/\s+/g, '\\s+')).join('|') + ')\\b\\s+\\d+', 'i');

            for (let i = 0; i < Math.min(lines.length, 8); i++) {
                if (classRegex.test(lines[i])) {
                    classLine = lines[i];
                    classLineIdx = i;
                    break;
                }
            }

            // ---- Alignment ----
            const alignMatch = linesText.match(/\b(LG|NG|CG|LN|TN|CN|LE|NE|CE)\b/);
            if (alignMatch) {
                const alignMap = { 'LG':'lg','NG':'ng','CG':'cg','LN':'ln','TN':'tn','N':'tn','CN':'cn','LE':'le','NE':'ne','CE':'ce' };
                updateData.system.details.alignment = alignMap[alignMatch[1]] || '';
            }

            // ---- Size ----
            const sizeMatch = linesText.match(/\b(Fine|Diminutive|Tiny|Small|Medium|Large|Huge|Gargantuan|Colossal)\b/i);
            if (sizeMatch) {
                const sizeCode = StatblockParser.SIZE_MAP[sizeMatch[1].toLowerCase()];
                if (sizeCode) updateData.system.traits.size = sizeCode;
            }

            // ---- Gender ----
            const genderMatch = classLine.match(/^(Male|Female)\b/i) || linesText.match(/\b(Male|Female)\b/i);
            if (genderMatch) {
                updateData.system.details.gender = genderMatch[1];
            }

            // ---- Extract Race ----
            if (classLine) {
                // Remove gender prefix
                let racePart = classLine.replace(/^(Male|Female)\s+/i, '');
                // Try to identify race by checking known races
                let foundRace = null;
                for (const race of StatblockParser.RACES) {
                    const raceRegex = new RegExp('^' + race.replace(/-/g, '[-\\s]?') + '\\b', 'i');
                    if (raceRegex.test(racePart)) {
                        foundRace = race;
                        break;
                    }
                }
                if (foundRace) {
                    const displayRace = foundRace.split(/[-\s]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
                    updateData.items.push({
                        name: displayRace.replace('-', ' '),
                        type: "race",
                        system: {
                            creatureType: "humanoid",
                            description: { value: `Race: ${displayRace}` }
                        }
                    });
                }
            }

            // ---- Extract Classes and Levels ----
            let totalLevel = 0;
            if (classLine) {
                for (const [className, cData] of Object.entries(StatblockParser.CLASS_DATA)) {
                    const cRegex = new RegExp('\\b' + className.replace(/\s+/g, '\\s+') + '\\s+(\\d+)', 'i');
                    const cMatch = classLine.match(cRegex);
                    if (cMatch) {
                        const level = parseInt(cMatch[1]);
                        totalLevel += level;
                        const displayName = className.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        updateData.items.push({
                            name: displayName,
                            type: "class",
                            system: {
                                levels: level,
                                classType: "base",
                                hd: cData.hd,
                                hp: cData.hp,
                                bab: cData.bab,
                                skillsPerLevel: cData.skillsPerLevel,
                                savingThrows: {
                                    fort: { value: cData.fort },
                                    ref: { value: cData.ref },
                                    will: { value: cData.will }
                                },
                                description: { value: `${displayName} level ${level}` }
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
                updateData.system.attributes.init = { total: parseInt(initMatch[1]), bonus: parseInt(initMatch[1]) };
            }

            // ---- Senses ----
            const sensesMatch = linesText.match(/Senses\s+(.+?)(?:$|\n)/im);
            if (sensesMatch) {
                const s = sensesMatch[1];
                const dvM = s.match(/darkvision\s+(\d+)/i);
                if (dvM) updateData.system.attributes.senses.darkvision = parseInt(dvM[1]);
                const bsM = s.match(/blindsight\s+(\d+)/i);
                if (bsM) updateData.system.attributes.senses.blindsight = parseInt(bsM[1]);
                if (/low-light\s+vision/i.test(s)) updateData.system.attributes.senses.lowLight = true;
            }

            // ---- Hit Points ----
            const hpMatch = linesText.match(/hp\s+(\d+)/i);
            if (hpMatch) {
                const hp = parseInt(hpMatch[1]);
                updateData.system.attributes.hp = { value: hp, max: hp, base: hp };
            }

            // ---- Hit Dice ----
            const hdMatch = linesText.match(/hp\s+\d+\s*\((\d+)d(\d+)/i);
            if (hdMatch) {
                updateData.system.attributes.hd = { total: parseInt(hdMatch[1]) };
            }

            // ---- Armor Class ----
            const acMatch = linesText.match(/AC\s+(\d+)/i);
            if (acMatch) {
                updateData.system.attributes.ac.normal = { total: parseInt(acMatch[1]) };
                const touchMatch = linesText.match(/touch\s+(\d+)/i);
                if (touchMatch) updateData.system.attributes.ac.touch = { total: parseInt(touchMatch[1]) };
                const ffMatch = linesText.match(/flat-footed\s+(\d+)/i);
                if (ffMatch) updateData.system.attributes.ac.flatFooted = { total: parseInt(ffMatch[1]) };
            }

            // ---- Natural Armor ----
            const natACMatch = linesText.match(/natural\s+armor\s*\+?(\d+)/i) || linesText.match(/\+(\d+)\s+natural/i);
            if (natACMatch) updateData.system.attributes.naturalAC = parseInt(natACMatch[1]);

            // ---- Saving Throws ----
            const fortMatch = linesText.match(/Fort\s+([+-]?\d+)/i);
            if (fortMatch) updateData.system.attributes.savingThrows.fort = { total: parseInt(fortMatch[1]) };
            const refMatch = linesText.match(/Ref\s+([+-]?\d+)/i);
            if (refMatch) updateData.system.attributes.savingThrows.ref = { total: parseInt(refMatch[1]) };
            const willMatch = linesText.match(/Will\s+([+-]?\d+)/i);
            if (willMatch) updateData.system.attributes.savingThrows.will = { total: parseInt(willMatch[1]) };

            // ---- Base Attack Bonus ----
            const babMatch = linesText.match(/Base\s+Atk\s+\+?(\d+)/i) || linesText.match(/BAB\s+\+?(\d+)/i);
            if (babMatch) updateData.system.attributes.bab = { value: parseInt(babMatch[1]), total: parseInt(babMatch[1]) };

            // ---- Grapple / CMB / CMD ----
            const grpMatch = linesText.match(/Grp\s+([+-]?\d+)/i);
            if (grpMatch) updateData.system.attributes.cmb = { total: parseInt(grpMatch[1]) };
            const cmbMatch = linesText.match(/CMB\s+([+-]?\d+)/i);
            if (cmbMatch) updateData.system.attributes.cmb = { total: parseInt(cmbMatch[1]) };
            const cmdMatch = linesText.match(/CMD\s+(\d+)/i);
            if (cmdMatch) updateData.system.attributes.cmd = { total: parseInt(cmdMatch[1]) };

            // ---- Spell Resistance ----
            const srMatch = linesText.match(/SR\s+(\d+)/i);
            if (srMatch) updateData.system.attributes.sr = { total: parseInt(srMatch[1]) };

            // ---- Speed ----
            const speedMatch = linesText.match(/(?:Speed|Spd)\s+(\d+)\s*ft/i);
            if (speedMatch) updateData.system.attributes.speed.land = { base: parseInt(speedMatch[1]) };
            const flyMatch = linesText.match(/fly\s+(\d+)\s*ft/i);
            if (flyMatch) {
                updateData.system.attributes.speed.fly = { base: parseInt(flyMatch[1]) };
                const manMatch = linesText.match(/fly\s+\d+\s*ft\.?\s*\((\w+)\)/i);
                if (manMatch) updateData.system.attributes.speed.fly.maneuverability = manMatch[1].toLowerCase();
            }
            const swimMatch = linesText.match(/swim\s+(\d+)\s*ft/i);
            if (swimMatch) updateData.system.attributes.speed.swim = { base: parseInt(swimMatch[1]) };
            const climbSpeedMatch = linesText.match(/climb\s+(\d+)\s*ft/i);
            if (climbSpeedMatch) updateData.system.attributes.speed.climb = { base: parseInt(climbSpeedMatch[1]) };
            const burrowMatch = linesText.match(/burrow\s+(\d+)\s*ft/i);
            if (burrowMatch) updateData.system.attributes.speed.burrow = { base: parseInt(burrowMatch[1]) };

            // ---- Ability Scores ----
            const abilityNames = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
            const abilityLineMatch = linesText.match(/Str\s+(\d+|-+)[\s,]+Dex\s+(\d+|-+)[\s,]+Con\s+(\d+|-+)[\s,]+Int\s+(\d+|-+)[\s,]+Wis\s+(\d+|-+)[\s,]+Cha\s+(\d+|-+)/i);
            if (abilityLineMatch) {
                for (let i = 0; i < abilityNames.length; i++) {
                    const raw = abilityLineMatch[i + 1];
                    if (raw === '-' || raw === '--' || raw === '---') continue;
                    const score = parseInt(raw);
                    if (!isNaN(score)) {
                        updateData.system.abilities[abilityNames[i]] = { value: score, total: score, mod: Math.floor((score - 10) / 2) };
                    }
                }
            } else {
                for (const abl of abilityNames) {
                    const match = linesText.match(new RegExp(`\\b${abl}\\s+(\\d+)`, 'i'));
                    if (match) {
                        const score = parseInt(match[1]);
                        updateData.system.abilities[abl] = { value: score, total: score, mod: Math.floor((score - 10) / 2) };
                    }
                }
            }

            // ---- Skills ----
            const skillsMatch = linesText.match(/Skills:?\s+(.+?)(?=\n(?:Feats|Languages|Possessions|Special|SQ|$)|\n\n)/is);
            if (skillsMatch) {
                const skillsStr = skillsMatch[1].replace(/\n/g, ', ');
                const skillEntries = skillsStr.match(/([A-Za-z][A-Za-z\s]*(?:\([^)]+\))?)\s+([+-]\d+)/g);
                if (skillEntries) {
                    for (const entry of skillEntries) {
                        const entryMatch = entry.match(/^(.+?)\s+([+-]?\d+)$/);
                        if (!entryMatch) continue;
                        const skillName = entryMatch[1].trim().toLowerCase();
                        const skillMod = parseInt(entryMatch[2]);
                        let code = StatblockParser.SKILL_MAP[skillName];
                        if (!code) {
                            for (const [key, val] of Object.entries(StatblockParser.SKILL_MAP)) {
                                if (skillName.startsWith(key.split(' ')[0]) && skillName.includes('(')) {
                                    code = val; break;
                                }
                            }
                        }
                        if (code) {
                            updateData.system.skills[code] = { rank: Math.max(0, skillMod), mod: skillMod };
                        }
                    }
                }
            }

            // ---- Feats ----
            const featsMatch = linesText.match(/Feats:?\s+(.+?)(?=\n(?:Skills|Languages|Possessions|Special|SQ|Environment|$)|\n\n)/is);
            if (featsMatch) {
                const featNames = StatblockParser._splitOnCommas(featsMatch[1].replace(/\n/g, ', '));
                for (const fn of featNames) {
                    const trimmed = fn.trim();
                    if (!trimmed || trimmed.match(/^(Skills|Languages|Possessions|Special)/i)) break;
                    updateData.items.push({
                        name: trimmed, type: "feat",
                        system: { featType: "feat", description: { value: "Imported from statblock" } }
                    });
                }
            }

            // ---- Special Attacks ----
            const saMatch = linesText.match(/Special\s+Attacks?:?\s+(.+?)(?=\n(?:Special\s+Qualities|SQ|Feats|Skills|$)|\n\n)/is);
            if (saMatch) {
                for (const sa of StatblockParser._splitOnCommas(saMatch[1].replace(/\n/g, ', '))) {
                    const t = sa.trim();
                    if (!t || t.match(/^(Special\s+Qualities|SQ|Feats|Skills)/i)) break;
                    updateData.items.push({
                        name: t, type: "feat",
                        system: { featType: "classFeat", abilityType: "su", description: { value: "Special Attack" } }
                    });
                }
            }

            // ---- Special Qualities ----
            const sqMatch = linesText.match(/(?:Special\s+Qualities|SQ):?\s+(.+?)(?=\n(?:Feats|Skills|Possessions|$)|\n\n)/is);
            if (sqMatch) {
                for (const sq of StatblockParser._splitOnCommas(sqMatch[1].replace(/\n/g, ', '))) {
                    const t = sq.trim();
                    if (!t || t.match(/^(Feats|Skills|Possessions)/i)) break;
                    updateData.items.push({
                        name: t, type: "feat",
                        system: { featType: "classFeat", abilityType: "ex", description: { value: "Special Quality" } }
                    });
                }
            }

            // ---- Languages ----
            const langMatch = linesText.match(/Languages?\s+(.+?)(?=\n|$)/im);
            if (langMatch) {
                const langs = langMatch[1].trim().split(/[,;]/).map(l => l.trim()).filter(l => l.length > 0);
                updateData.system.traits.languages = { custom: langs.join(';') };
            }

            console.log("D35E Importer | Statblock Parse Result:", updateData);
            return updateData;
        } catch (error) {
            console.error("D35E Importer | Failed to parse statblock:", error);
            throw new Error("Could not parse the provided statblock data.");
        }
    }

    static _splitOnCommas(str) {
        const result = [];
        let current = '';
        let depth = 0;
        for (const char of str) {
            if (char === '(') depth++;
            else if (char === ')') depth--;
            else if (char === ',' && depth === 0) { result.push(current.trim()); current = ''; continue; }
            current += char;
        }
        if (current.trim()) result.push(current.trim());
        return result;
    }
}
