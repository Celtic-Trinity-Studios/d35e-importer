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
        'archivist':  { hd: 6,  hp: 6,  bab: 'med',  fort: 'low',  ref: 'low',  will: 'high', skillsPerLevel: 4 },
        'beguiler':   { hd: 6,  hp: 6,  bab: 'med',  fort: 'low',  ref: 'low',  will: 'high', skillsPerLevel: 6 },
        'dragon shaman':{ hd: 10, hp: 10, bab: 'med',  fort: 'high', ref: 'low',  will: 'high', skillsPerLevel: 2 },
        'factotum':   { hd: 8,  hp: 8,  bab: 'med',  fort: 'high', ref: 'high', will: 'high', skillsPerLevel: 6 },
        'marshal':    { hd: 8,  hp: 8,  bab: 'med',  fort: 'high', ref: 'low',  will: 'high', skillsPerLevel: 4 },
        'healer':     { hd: 8,  hp: 8,  bab: 'med',  fort: 'high', ref: 'low',  will: 'high', skillsPerLevel: 4 },
        'spellthief': { hd: 6,  hp: 6,  bab: 'med',  fort: 'low',  ref: 'high', will: 'high', skillsPerLevel: 4 },
        'totemist':   { hd: 8,  hp: 8,  bab: 'med',  fort: 'high', ref: 'low',  will: 'low',  skillsPerLevel: 4 },
        'incarnate':  { hd: 6,  hp: 6,  bab: 'med',  fort: 'high', ref: 'low',  will: 'high', skillsPerLevel: 4 },
        'soulborn':   { hd: 10, hp: 10, bab: 'high', fort: 'high', ref: 'low',  will: 'low',  skillsPerLevel: 2 },
        'crusader':   { hd: 10, hp: 10, bab: 'high', fort: 'high', ref: 'low',  will: 'low',  skillsPerLevel: 4 },
        'swordsage':  { hd: 8,  hp: 8,  bab: 'med',  fort: 'low',  ref: 'high', will: 'high', skillsPerLevel: 6 },
        'warblade':   { hd: 12, hp: 12, bab: 'high', fort: 'high', ref: 'low',  will: 'low',  skillsPerLevel: 4 },
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

    // Weapon database: name -> { weaponType, weaponSubtype, damageRoll, critRange, critMult, damageType, range }
    static WEAPON_DATA = {
        'dagger':           { weaponType:'simple', weaponSubtype:'light', damage:'1d4', critRange:'19', critMult:2, damageType:'Piercing', range:10 },
        'punching dagger':  { weaponType:'simple', weaponSubtype:'light', damage:'1d4', critRange:'20', critMult:3, damageType:'Piercing' },
        'spiked gauntlet':  { weaponType:'simple', weaponSubtype:'light', damage:'1d4', critRange:'20', critMult:2, damageType:'Piercing' },
        'light mace':       { weaponType:'simple', weaponSubtype:'light', damage:'1d6', critRange:'20', critMult:2, damageType:'Bludgeoning' },
        'sickle':           { weaponType:'simple', weaponSubtype:'light', damage:'1d6', critRange:'20', critMult:2, damageType:'Slashing' },
        'club':             { weaponType:'simple', weaponSubtype:'1h', damage:'1d6', critRange:'20', critMult:2, damageType:'Bludgeoning', range:10 },
        'heavy mace':       { weaponType:'simple', weaponSubtype:'1h', damage:'1d8', critRange:'20', critMult:2, damageType:'Bludgeoning' },
        'morningstar':      { weaponType:'simple', weaponSubtype:'1h', damage:'1d8', critRange:'20', critMult:2, damageType:'Bludgeoning and Piercing' },
        'shortspear':       { weaponType:'simple', weaponSubtype:'1h', damage:'1d6', critRange:'20', critMult:2, damageType:'Piercing', range:20 },
        'longspear':        { weaponType:'simple', weaponSubtype:'2h', damage:'1d8', critRange:'20', critMult:3, damageType:'Piercing' },
        'quarterstaff':     { weaponType:'simple', weaponSubtype:'2h', damage:'1d6', critRange:'20', critMult:2, damageType:'Bludgeoning' },
        'spear':            { weaponType:'simple', weaponSubtype:'2h', damage:'1d8', critRange:'20', critMult:3, damageType:'Piercing', range:20 },
        'crossbow, heavy':  { weaponType:'simple', weaponSubtype:'ranged', damage:'1d10', critRange:'19', critMult:2, damageType:'Piercing', range:120 },
        'heavy crossbow':   { weaponType:'simple', weaponSubtype:'ranged', damage:'1d10', critRange:'19', critMult:2, damageType:'Piercing', range:120 },
        'crossbow, light':  { weaponType:'simple', weaponSubtype:'ranged', damage:'1d8', critRange:'19', critMult:2, damageType:'Piercing', range:80 },
        'light crossbow':   { weaponType:'simple', weaponSubtype:'ranged', damage:'1d8', critRange:'19', critMult:2, damageType:'Piercing', range:80 },
        'dart':             { weaponType:'simple', weaponSubtype:'ranged', damage:'1d4', critRange:'20', critMult:2, damageType:'Piercing', range:20 },
        'javelin':          { weaponType:'simple', weaponSubtype:'ranged', damage:'1d6', critRange:'20', critMult:2, damageType:'Piercing', range:30 },
        'sling':            { weaponType:'simple', weaponSubtype:'ranged', damage:'1d4', critRange:'20', critMult:2, damageType:'Bludgeoning', range:50 },
        'handaxe':          { weaponType:'martial', weaponSubtype:'light', damage:'1d6', critRange:'20', critMult:3, damageType:'Slashing' },
        'kukri':            { weaponType:'martial', weaponSubtype:'light', damage:'1d4', critRange:'18', critMult:2, damageType:'Slashing' },
        'light hammer':     { weaponType:'martial', weaponSubtype:'light', damage:'1d4', critRange:'20', critMult:2, damageType:'Bludgeoning', range:20 },
        'light pick':       { weaponType:'martial', weaponSubtype:'light', damage:'1d4', critRange:'20', critMult:4, damageType:'Piercing' },
        'sap':              { weaponType:'martial', weaponSubtype:'light', damage:'1d6', critRange:'20', critMult:2, damageType:'Bludgeoning' },
        'short sword':      { weaponType:'martial', weaponSubtype:'light', damage:'1d6', critRange:'19', critMult:2, damageType:'Piercing' },
        'battleaxe':        { weaponType:'martial', weaponSubtype:'1h', damage:'1d8', critRange:'20', critMult:3, damageType:'Slashing' },
        'flail':            { weaponType:'martial', weaponSubtype:'1h', damage:'1d8', critRange:'20', critMult:2, damageType:'Bludgeoning' },
        'longsword':        { weaponType:'martial', weaponSubtype:'1h', damage:'1d8', critRange:'19', critMult:2, damageType:'Slashing' },
        'heavy pick':       { weaponType:'martial', weaponSubtype:'1h', damage:'1d6', critRange:'20', critMult:4, damageType:'Piercing' },
        'rapier':           { weaponType:'martial', weaponSubtype:'1h', damage:'1d6', critRange:'18', critMult:2, damageType:'Piercing' },
        'scimitar':         { weaponType:'martial', weaponSubtype:'1h', damage:'1d6', critRange:'18', critMult:2, damageType:'Slashing' },
        'trident':          { weaponType:'martial', weaponSubtype:'1h', damage:'1d8', critRange:'20', critMult:2, damageType:'Piercing', range:10 },
        'warhammer':        { weaponType:'martial', weaponSubtype:'1h', damage:'1d8', critRange:'20', critMult:3, damageType:'Bludgeoning' },
        'falchion':         { weaponType:'martial', weaponSubtype:'2h', damage:'2d4', critRange:'18', critMult:2, damageType:'Slashing' },
        'glaive':           { weaponType:'martial', weaponSubtype:'2h', damage:'1d10', critRange:'20', critMult:3, damageType:'Slashing' },
        'greataxe':         { weaponType:'martial', weaponSubtype:'2h', damage:'1d12', critRange:'20', critMult:3, damageType:'Slashing' },
        'greatclub':        { weaponType:'martial', weaponSubtype:'2h', damage:'1d10', critRange:'20', critMult:2, damageType:'Bludgeoning' },
        'greatsword':       { weaponType:'martial', weaponSubtype:'2h', damage:'2d6', critRange:'19', critMult:2, damageType:'Slashing' },
        'guisarme':         { weaponType:'martial', weaponSubtype:'2h', damage:'2d4', critRange:'20', critMult:3, damageType:'Slashing' },
        'halberd':          { weaponType:'martial', weaponSubtype:'2h', damage:'1d10', critRange:'20', critMult:3, damageType:'Piercing or Slashing' },
        'lance':            { weaponType:'martial', weaponSubtype:'2h', damage:'1d8', critRange:'20', critMult:3, damageType:'Piercing' },
        'ranseur':          { weaponType:'martial', weaponSubtype:'2h', damage:'2d4', critRange:'20', critMult:3, damageType:'Piercing' },
        'scythe':           { weaponType:'martial', weaponSubtype:'2h', damage:'2d4', critRange:'20', critMult:4, damageType:'Piercing or Slashing' },
        'longbow':          { weaponType:'martial', weaponSubtype:'ranged', damage:'1d8', critRange:'20', critMult:3, damageType:'Piercing', range:100 },
        'composite longbow':{ weaponType:'martial', weaponSubtype:'ranged', damage:'1d8', critRange:'20', critMult:3, damageType:'Piercing', range:110 },
        'shortbow':         { weaponType:'martial', weaponSubtype:'ranged', damage:'1d6', critRange:'20', critMult:3, damageType:'Piercing', range:60 },
        'composite shortbow':{ weaponType:'martial', weaponSubtype:'ranged', damage:'1d6', critRange:'20', critMult:3, damageType:'Piercing', range:70 },
        'bastard sword':    { weaponType:'exotic', weaponSubtype:'1h', damage:'1d10', critRange:'19', critMult:2, damageType:'Slashing' },
        'dwarven waraxe':   { weaponType:'exotic', weaponSubtype:'1h', damage:'1d10', critRange:'20', critMult:3, damageType:'Slashing' },
        'whip':             { weaponType:'exotic', weaponSubtype:'1h', damage:'1d3', critRange:'20', critMult:2, damageType:'Slashing' },
        'spiked chain':     { weaponType:'exotic', weaponSubtype:'2h', damage:'2d4', critRange:'20', critMult:2, damageType:'Piercing' },
        'hand crossbow':    { weaponType:'exotic', weaponSubtype:'ranged', damage:'1d4', critRange:'19', critMult:2, damageType:'Piercing', range:30 },
        'repeating heavy crossbow': { weaponType:'exotic', weaponSubtype:'ranged', damage:'1d10', critRange:'19', critMult:2, damageType:'Piercing', range:120 },
        'repeating light crossbow': { weaponType:'exotic', weaponSubtype:'ranged', damage:'1d8', critRange:'19', critMult:2, damageType:'Piercing', range:80 },
        'net':              { weaponType:'exotic', weaponSubtype:'ranged', damage:'', critRange:'20', critMult:2, damageType:'', range:10 },
        'shuriken':         { weaponType:'exotic', weaponSubtype:'ranged', damage:'1d2', critRange:'20', critMult:2, damageType:'Piercing', range:10 },
        'kama':             { weaponType:'exotic', weaponSubtype:'light', damage:'1d6', critRange:'20', critMult:2, damageType:'Slashing' },
        'nunchaku':         { weaponType:'exotic', weaponSubtype:'light', damage:'1d6', critRange:'20', critMult:2, damageType:'Bludgeoning' },
        'siangham':         { weaponType:'exotic', weaponSubtype:'light', damage:'1d6', critRange:'20', critMult:2, damageType:'Piercing' },
    };

    // Armor database: name -> { equipmentType, equipmentSubtype, acBonus, maxDex, acp, spellFailure, weight, price }
    static ARMOR_DATA = {
        'padded':           { equipmentSubtype:'lightArmor', acBonus:1, maxDex:8, acp:0, spellFailure:5, weight:10, price:5 },
        'padded armor':     { equipmentSubtype:'lightArmor', acBonus:1, maxDex:8, acp:0, spellFailure:5, weight:10, price:5 },
        'leather':          { equipmentSubtype:'lightArmor', acBonus:2, maxDex:6, acp:0, spellFailure:10, weight:15, price:10 },
        'leather armor':    { equipmentSubtype:'lightArmor', acBonus:2, maxDex:6, acp:0, spellFailure:10, weight:15, price:10 },
        'studded leather':  { equipmentSubtype:'lightArmor', acBonus:3, maxDex:5, acp:-1, spellFailure:15, weight:20, price:25 },
        'chain shirt':      { equipmentSubtype:'lightArmor', acBonus:4, maxDex:4, acp:-2, spellFailure:20, weight:25, price:100 },
        'hide':             { equipmentSubtype:'mediumArmor', acBonus:3, maxDex:4, acp:-3, spellFailure:20, weight:25, price:15 },
        'hide armor':       { equipmentSubtype:'mediumArmor', acBonus:3, maxDex:4, acp:-3, spellFailure:20, weight:25, price:15 },
        'scale mail':       { equipmentSubtype:'mediumArmor', acBonus:4, maxDex:3, acp:-4, spellFailure:25, weight:30, price:50 },
        'chainmail':        { equipmentSubtype:'mediumArmor', acBonus:5, maxDex:2, acp:-5, spellFailure:30, weight:40, price:150 },
        'chain mail':       { equipmentSubtype:'mediumArmor', acBonus:5, maxDex:2, acp:-5, spellFailure:30, weight:40, price:150 },
        'breastplate':      { equipmentSubtype:'mediumArmor', acBonus:5, maxDex:3, acp:-4, spellFailure:25, weight:30, price:200 },
        'splint mail':      { equipmentSubtype:'heavyArmor', acBonus:6, maxDex:0, acp:-7, spellFailure:40, weight:45, price:200 },
        'banded mail':      { equipmentSubtype:'heavyArmor', acBonus:6, maxDex:1, acp:-6, spellFailure:35, weight:35, price:250 },
        'half-plate':       { equipmentSubtype:'heavyArmor', acBonus:7, maxDex:0, acp:-7, spellFailure:40, weight:50, price:600 },
        'half plate':       { equipmentSubtype:'heavyArmor', acBonus:7, maxDex:0, acp:-7, spellFailure:40, weight:50, price:600 },
        'full plate':       { equipmentSubtype:'heavyArmor', acBonus:8, maxDex:1, acp:-6, spellFailure:35, weight:50, price:1500 },
        'buckler':          { equipmentSubtype:'shield', acBonus:1, maxDex:null, acp:-1, spellFailure:5, weight:5, price:15 },
        'light shield':     { equipmentSubtype:'shield', acBonus:1, maxDex:null, acp:-1, spellFailure:5, weight:5, price:3 },
        'light wooden shield':  { equipmentSubtype:'shield', acBonus:1, maxDex:null, acp:-1, spellFailure:5, weight:5, price:3 },
        'light steel shield':   { equipmentSubtype:'shield', acBonus:1, maxDex:null, acp:-1, spellFailure:5, weight:6, price:9 },
        'heavy shield':     { equipmentSubtype:'shield', acBonus:2, maxDex:null, acp:-2, spellFailure:15, weight:10, price:7 },
        'heavy wooden shield':  { equipmentSubtype:'shield', acBonus:2, maxDex:null, acp:-2, spellFailure:15, weight:10, price:7 },
        'heavy steel shield':   { equipmentSubtype:'shield', acBonus:2, maxDex:null, acp:-2, spellFailure:15, weight:15, price:20 },
        'tower shield':     { equipmentSubtype:'shield', acBonus:4, maxDex:2, acp:-10, spellFailure:50, weight:45, price:30 },
        'mithral shirt':    { equipmentSubtype:'lightArmor', acBonus:4, maxDex:6, acp:0, spellFailure:10, weight:10, price:1100 },
        'mithral chain shirt': { equipmentSubtype:'lightArmor', acBonus:4, maxDex:6, acp:0, spellFailure:10, weight:10, price:1100 },
        'mithral breastplate': { equipmentSubtype:'mediumArmor', acBonus:5, maxDex:5, acp:-1, spellFailure:15, weight:15, price:4200 },
        'mithral full plate':  { equipmentSubtype:'heavyArmor', acBonus:8, maxDex:3, acp:-3, spellFailure:15, weight:25, price:10500 },
    };

    static async parse(textData, gameIndex = null) {
        console.log("D35E Importer | Parsing Hero Lab Statblock...");
        
        // Extract indexes from gameIndex
        const classIndex = gameIndex?.classIndex || null;
        const srdRaceNames = gameIndex?.raceNames || new Set();
        const srdItemTypes = gameIndex?.itemTypes || new Map();

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

            // Merge hardcoded CLASS_DATA with dynamic classIndex from compendiums
            const allClassNames = new Set(Object.keys(StatblockParser.CLASS_DATA));
            if (classIndex) {
                for (const name of classIndex.keys()) {
                    allClassNames.add(name);
                }
            }
            const allClassNamesArr = Array.from(allClassNames);
            
            // Merge hardcoded RACES with dynamic race names from compendiums
            const allRaceNames = new Set(StatblockParser.RACES.map(r => r.toLowerCase()));
            for (const rn of srdRaceNames) {
                allRaceNames.add(rn);
            }
            const allRaceNamesArr = Array.from(allRaceNames);

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
            // e.g., "Male Human Wizard 1" or "Male Human Archivist 3 Rogue 1"
            let classLine = '';
            let classLineIdx = -1;
            // Match known classes from both hardcoded and compendium sources
            const knownClassRegex = new RegExp('\\b(' + allClassNamesArr.map(c => c.replace(/\s+/g, '\\s+')).join('|') + ')\\b\\s+\\d+', 'i');
            // Fallback: any line with a capitalized word followed by a number
            const genericClassRegex = /\b[A-Z][a-z]+\s+\d+/;

            for (let i = 0; i < Math.min(lines.length, 8); i++) {
                if (knownClassRegex.test(lines[i]) || genericClassRegex.test(lines[i])) {
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
                // Try to identify race from SRD compendiums + hardcoded list
                let foundRace = null;
                // Sort by length descending so multi-word races match first (e.g. "Half-Elf" before "Elf")
                const sortedRaces = allRaceNamesArr.sort((a, b) => b.length - a.length);
                for (const race of sortedRaces) {
                    const raceRegex = new RegExp('^' + race.replace(/-/g, '[-\\s]?') + '\\b', 'i');
                    if (raceRegex.test(racePart)) {
                        foundRace = race;
                        break;
                    }
                }
                if (foundRace) {
                    const displayRace = foundRace.split(/[-\s]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    console.log(`D35E Importer | Matched race: ${displayRace} (source: ${srdRaceNames.has(foundRace.toLowerCase()) ? 'compendium' : 'hardcoded'})`);
                    updateData.items.push({
                        name: displayRace,
                        type: "race",
                        system: {
                            creatureType: "humanoid",
                            description: { value: `Race: ${displayRace}` }
                        }
                    });
                }
            }

            // ---- Extract Template from parentheses on class line ----
            // Hero Lab format: "(Half-Dragon Template +3)" → SRD name is "Half-Dragon"
            if (classLine) {
                const templateParenMatch = classLine.match(/\(([^)]*Template[^)]*)\)/i);
                if (templateParenMatch) {
                    const templateStr = templateParenMatch[1].trim();
                    // Extract name and optional CR adjustment: "Half-Dragon Template +3"
                    const tMatch = templateStr.match(/^(.+?)(?:\s+\+?(\d+))?$/);
                    if (tMatch) {
                        let tRawName = tMatch[1].trim();
                        const tLevel = tMatch[2] ? parseInt(tMatch[2]) : 0;
                        // Strip the word "Template" to match SRD naming (e.g. "Half-Dragon Template" → "Half-Dragon")
                        const tName = tRawName.replace(/\s*Template\s*/i, '').trim();
                        
                        // Look up in classIndex for SRD template data
                        const tData = classIndex?.get(tName.toLowerCase()) || null;
                        const displayName = tData ? tName : tRawName; // Use SRD name if found
                        
                        console.log(`D35E Importer | Found template: ${displayName} (CR adj: +${tLevel}, source: ${tData ? 'compendium' : 'fallback'})`);
                        updateData.items.push({
                            name: displayName,
                            type: "class",
                            system: {
                                levels: 1,
                                classType: "template",
                                hd: tData?.hd || 0,
                                hp: tData?.hp || 0,
                                bab: tData?.bab || "~",
                                skillsPerLevel: tData?.skillsPerLevel || 0,
                                savingThrows: {
                                    fort: { value: tData?.fort || "low" },
                                    ref: { value: tData?.ref || "low" },
                                    will: { value: tData?.will || "low" }
                                },
                                crOffset: tLevel,
                                description: { value: `Template: ${displayName} (CR adjustment +${tLevel})` }
                            }
                        });
                    }
                    // Remove template parenthetical from classLine so it doesn't confuse class parsing
                    classLine = classLine.replace(/\s*\([^)]*Template[^)]*\)/i, '').trim();
                }
            }

            // ---- Extract Classes and Levels ----
            let totalLevel = 0;
            const foundClasses = new Set();
            if (classLine) {
                // Helper: look up class data from dynamic index first, then hardcoded fallback
                const lookupClassData = (name) => {
                    const lower = name.toLowerCase();
                    // 1. Check compendium/world classIndex (has real system data)
                    if (classIndex && classIndex.has(lower)) {
                        return classIndex.get(lower);
                    }
                    // 2. Check hardcoded CLASS_DATA
                    if (StatblockParser.CLASS_DATA[lower]) {
                        return StatblockParser.CLASS_DATA[lower];
                    }
                    return null;
                };

                // First pass: match all known classes (compendium + hardcoded)
                for (const className of allClassNamesArr) {
                    const cRegex = new RegExp('\\b' + className.replace(/\s+/g, '\\s+') + '\\s+(\\d+)', 'i');
                    const cMatch = classLine.match(cRegex);
                    if (cMatch) {
                        const level = parseInt(cMatch[1]);
                        totalLevel += level;
                        const displayName = className.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        foundClasses.add(displayName.toLowerCase());
                        const cData = lookupClassData(className);
                        const classType = cData?.classType || "base";
                        console.log(`D35E Importer | Matched class: ${displayName} ${level} (source: ${classIndex?.has(className.toLowerCase()) ? 'compendium' : 'hardcoded'}, type: ${classType})`);
                        updateData.items.push({
                            name: displayName,
                            type: "class",
                            system: {
                                levels: level,
                                classType: classType,
                                hd: cData?.hd || 8,
                                hp: cData?.hp || cData?.hd || 8,
                                bab: cData?.bab || "med",
                                skillsPerLevel: cData?.skillsPerLevel || 4,
                                savingThrows: {
                                    fort: { value: cData?.fort || "low" },
                                    ref: { value: cData?.ref || "low" },
                                    will: { value: cData?.will || "high" }
                                },
                                description: { value: `${displayName} level ${level}` }
                            }
                        });
                    }
                }
                
                // Second pass: catch any remaining "ClassName Number" patterns not matched
                // This handles classes not in any source (e.g. homebrew not yet added)
                let remaining = classLine;
                remaining = remaining.replace(/^(Male|Female)\s+/i, '');
                for (const race of allRaceNamesArr) {
                    remaining = remaining.replace(new RegExp('\\b' + race.replace(/-/g, '[-\\s]?') + '\\b', 'i'), '');
                }
                remaining = remaining.replace(/\b(LG|NG|CG|LN|TN|CN|LE|NE|CE)\b/g, '');
                remaining = remaining.replace(/\b(Fine|Diminutive|Tiny|Small|Medium|Large|Huge|Gargantuan|Colossal)\b/gi, '');
                remaining = remaining.replace(/\b(Humanoid|Outsider|Aberration|Animal|Construct|Dragon|Fey|Giant|Magical Beast|Monstrous Humanoid|Ooze|Plant|Undead|Vermin|Elemental)\b/gi, '');
                remaining = remaining.trim();
                
                const unknownClassRegex = /\b([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*)\s+(\d+)\b/g;
                let ucMatch;
                while ((ucMatch = unknownClassRegex.exec(remaining)) !== null) {
                    const ucName = ucMatch[1].trim();
                    const ucLevel = parseInt(ucMatch[2]);
                    if (foundClasses.has(ucName.toLowerCase())) continue;
                    if (ucLevel > 0 && ucLevel <= 40) {
                        totalLevel += ucLevel;
                        foundClasses.add(ucName.toLowerCase());
                        // Check if this unknown name exists in compendiums as a template
                        const cData = lookupClassData(ucName);
                        const classType = cData?.classType || "base";
                        console.log(`D35E Importer | Found unmatched class: ${ucName} ${ucLevel} (type: ${classType})`);
                        updateData.items.push({
                            name: ucName,
                            type: "class",
                            system: {
                                levels: ucLevel,
                                classType: classType,
                                hd: cData?.hd || 6,
                                hp: cData?.hp || 6,
                                bab: cData?.bab || "med",
                                skillsPerLevel: cData?.skillsPerLevel || 4,
                                savingThrows: {
                                    fort: { value: cData?.fort || "low" },
                                    ref: { value: cData?.ref || "low" },
                                    will: { value: cData?.will || "high" }
                                },
                                description: { value: `${ucName} level ${ucLevel} (auto-detected)` }
                            }
                        });
                    }
                }
                
                // Third pass: detect templates (words on the class line without level numbers)
                // Templates in D35E have classType "template" and appear without a number
                // e.g. "Half-Dragon Human Fighter 5" or "Lich Human Wizard 10"
                if (classIndex) {
                    let templateCheck = classLine;
                    templateCheck = templateCheck.replace(/^(Male|Female)\s+/i, '');
                    for (const race of allRaceNamesArr) {
                        templateCheck = templateCheck.replace(new RegExp('\\b' + race.replace(/-/g, '[-\\s]?') + '\\b', 'i'), '');
                    }
                    // Remove already-found classes and their levels
                    for (const fc of foundClasses) {
                        templateCheck = templateCheck.replace(new RegExp('\\b' + fc.replace(/\s+/g, '\\s+') + '\\s+\\d+', 'i'), '');
                    }
                    templateCheck = templateCheck.replace(/\b(LG|NG|CG|LN|TN|CN|LE|NE|CE)\b/g, '');
                    templateCheck = templateCheck.replace(/\b(Fine|Diminutive|Tiny|Small|Medium|Large|Huge|Gargantuan|Colossal)\b/gi, '');
                    templateCheck = templateCheck.replace(/\b(Humanoid|Outsider|Aberration|Animal|Construct|Dragon|Fey|Giant|Magical Beast|Monstrous Humanoid|Ooze|Plant|Undead|Vermin|Elemental)\b/gi, '');
                    templateCheck = templateCheck.trim();
                    
                    // Check remaining words against compendium for template-type entries
                    if (templateCheck.length > 0) {
                        // Try multi-word and single-word matches
                        const templateWords = templateCheck.split(/\s+/).filter(w => w.length > 1);
                        for (let len = templateWords.length; len > 0; len--) {
                            for (let start = 0; start <= templateWords.length - len; start++) {
                                const candidateName = templateWords.slice(start, start + len).join(' ');
                                const lower = candidateName.toLowerCase();
                                if (classIndex.has(lower) && classIndex.get(lower).classType === "template") {
                                    if (!foundClasses.has(lower)) {
                                        foundClasses.add(lower);
                                        const tData = classIndex.get(lower);
                                        console.log(`D35E Importer | Found template: ${candidateName} (from compendium)`);
                                        updateData.items.push({
                                            name: candidateName.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                                            type: "class",
                                            system: {
                                                levels: 1,
                                                classType: "template",
                                                hd: tData?.hd || 0,
                                                hp: tData?.hp || 0,
                                                bab: tData?.bab || "~",
                                                skillsPerLevel: tData?.skillsPerLevel || 0,
                                                savingThrows: {
                                                    fort: { value: tData?.fort || "low" },
                                                    ref: { value: tData?.ref || "low" },
                                                    will: { value: tData?.will || "low" }
                                                },
                                                description: { value: `Template: ${candidateName}` }
                                            }
                                        });
                                    }
                                }
                            }
                        }
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
            // Skill ability associations for calculating actual ranks
            const SKILL_ABILITY = {
                'apr':'int','ath':'wis','blc':'dex','blf':'cha','clm':'str','coc':'con',
                'crf':'int','dsc':'int','dip':'cha','dev':'int','dis':'cha','esc':'dex',
                'fog':'int','gat':'cha','han':'cha','hea':'wis','hid':'dex','int':'cha',
                'jmp':'str','kar':'int','kdu':'int','ken':'int','kge':'int','khi':'int',
                'klo':'int','kna':'int','kno':'int','kpl':'int','kre':'int','lis':'wis',
                'mos':'dex','opl':'dex','prf':'cha','pro':'wis','rid':'dex','src':'int',
                'sen':'wis','soh':'dex','spl':'int','spt':'wis','sur':'wis','swm':'str',
                'tmb':'dex','umd':'cha','uro':'dex'
            };
            const skillsMatch = linesText.match(/Skills:?\s+(.+?)(?=\n(?:Feats|Languages|Possessions|Special|SQ|$)|\n\n)/is);
            if (skillsMatch) {
                const skillsStr = skillsMatch[1].replace(/\n/g, ', ');
                const skillEntries = skillsStr.match(/([A-Za-z][A-Za-z\s]*(?:\([^)]+\))?)\s+([+-]\d+)/g);
                if (skillEntries) {
                    for (const entry of skillEntries) {
                        const entryMatch = entry.match(/^(.+?)\s+([+-]?\d+)$/);
                        if (!entryMatch) continue;
                        const skillName = entryMatch[1].trim().toLowerCase();
                        const skillTotal = parseInt(entryMatch[2]);
                        let code = StatblockParser.SKILL_MAP[skillName];
                        if (!code) {
                            for (const [key, val] of Object.entries(StatblockParser.SKILL_MAP)) {
                                if (skillName.startsWith(key.split(' ')[0]) && skillName.includes('(')) {
                                    code = val; break;
                                }
                            }
                        }
                        if (code) {
                            // Subtract the relevant ability modifier to get actual skill points
                            let abilityMod = 0;
                            const abilityKey = SKILL_ABILITY[code];
                            if (abilityKey && updateData.system.abilities[abilityKey]) {
                                const score = updateData.system.abilities[abilityKey].value || 10;
                                abilityMod = Math.floor((score - 10) / 2);
                            }
                            const points = Math.max(0, skillTotal - abilityMod);
                            updateData.system.skills[code] = { points: points };
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
            // Track existing feat names to avoid duplicates
            const existingItemNames = new Set(updateData.items.map(i => (i.name || '').toLowerCase()));
            const sqMatch = linesText.match(/(?:Special\s+Qualities|SQ):?\s+(.+?)(?=\n(?:Feats|Skills|Possessions|$)|\n\n)/is);
            if (sqMatch) {
                for (const sq of StatblockParser._splitOnCommas(sqMatch[1].replace(/\n/g, ', '))) {
                    const t = sq.trim();
                    if (!t || t.match(/^(Feats|Skills|Possessions)/i)) break;
                    // Skip if this SQ name already exists as a feat (avoid duplicates)
                    if (existingItemNames.has(t.toLowerCase())) {
                        console.log(`D35E Importer | Skipping duplicate SQ: ${t} (already exists as feat)`);
                        continue;
                    }
                    existingItemNames.add(t.toLowerCase());
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

            // ---- Melee Attacks ----
            const meleeMatch = linesText.match(/Melee(?:\s+weapon)?:?\s+(.+?)(?=\n(?:Ranged|Space|Special|Spell-Like|Spells|Abilities|Str\b|Base\s+Atk|Atk\s+Options|Combat\s+Gear)|$)/is);
            if (meleeMatch) {
                const meleeAttacks = StatblockParser._parseAttackLine(meleeMatch[1], 'mwak');
                for (const atk of meleeAttacks) {
                    updateData.items.push(atk);
                }
            }

            // ---- Ranged Attacks ----
            const rangedMatch = linesText.match(/Ranged(?:\s+weapon)?:?\s+(.+?)(?=\n(?:Space|Special|Spell-Like|Spells|Abilities|Str\b|Base\s+Atk|Atk\s+Options|Combat\s+Gear)|$)/is);
            if (rangedMatch) {
                const rangedAttacks = StatblockParser._parseAttackLine(rangedMatch[1], 'rwak');
                for (const atk of rangedAttacks) {
                    updateData.items.push(atk);
                }
            }

            // ---- Spells ----
            // Parse "Cleric Spells Prepared (CL 1, ...):" and "Wizard Spells Prepared (CL 1, ...):"
            const spellSectionRegex = /(\w[\w\s]*?)\s+Spells\s+Prepared\s*\(CL\s+(\d+)[^)]*\):?\s*((?:(?!\w[\w\s]*?\s+Spells\s+Prepared).)*)/gis;
            let spellSection;
            while ((spellSection = spellSectionRegex.exec(linesText)) !== null) {
                const casterClass = spellSection[1].trim();
                const casterLevel = parseInt(spellSection[2]);
                const spellBlock = spellSection[3];
                
                // Parse each spell level line: "1 (DC 13, 2/day) - Bless, Bless Water, Make Whole"
                const spellLineRegex = /^\s*(?:\(?(\d+)\)?)?\s*\(DC\s+(\d+)(?:,\s*(\d+)\/day)?\)\s*-\s*(.+)$/gm;
                let spellLine;
                while ((spellLine = spellLineRegex.exec(spellBlock)) !== null) {
                    const spellLevel = parseInt(spellLine[1] || '0');
                    const spellDC = parseInt(spellLine[2]);
                    const perDay = spellLine[3] ? parseInt(spellLine[3]) : null;
                    const spellNames = spellLine[4].split(',').map(s => s.trim()).filter(s => s.length > 0);
                    
                    for (const spellName of spellNames) {
                        if (!spellName || spellName.length > 80) continue;
                        updateData.items.push({
                            name: spellName,
                            type: "spell",
                            system: {
                                level: spellLevel,
                                school: "",
                                spellDuration: {},
                                spellArea: {},
                                description: { value: `${casterClass} spell (CL ${casterLevel}, DC ${spellDC})` }
                            }
                        });
                    }
                }
            }

            // ---- Possessions / Equipment ----
            // Only match "Possessions" (not "Combat Gear" which appears before spells)
            // Use strict stop conditions to prevent leaking into spell/ability sections
            const possMatch = linesText.match(/Possessions:?\s+(.+?)(?=\n(?:Spells|Special|Languages|Feats|Skills|Abilities|SQ|\w+\s+Spells|$)|\n\n)/is);
            if (possMatch) {
                let possText = possMatch[1].replace(/\n/g, ', ');
                // Filter out "combat gear plus" prefix and "(none)" entries
                possText = possText.replace(/combat\s+gear\s+plus\s*/i, '').trim();
                if (possText && !/^\(none\)$/i.test(possText.trim()) && possText.length > 1) {
                    const possItems = StatblockParser._parsePossessions(possText);
                    for (const item of possItems) {
                        updateData.items.push(item);
                    }
                }
            }

            // ---- Currency / Gold ----
            const gpMatch = linesText.match(/(\d[\d,]*)\s*gp/i);
            if (gpMatch) updateData.system.currency = { ...(updateData.system.currency || {}), gp: parseInt(gpMatch[1].replace(/,/g, '')) };
            const spMatch = linesText.match(/(\d[\d,]*)\s*sp/i);
            if (spMatch) updateData.system.currency = { ...(updateData.system.currency || {}), sp: parseInt(spMatch[1].replace(/,/g, '')) };
            const ppMatch = linesText.match(/(\d[\d,]*)\s*pp/i);
            if (ppMatch) updateData.system.currency = { ...(updateData.system.currency || {}), pp: parseInt(ppMatch[1].replace(/,/g, '')) };

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

    /**
     * Parse a Melee or Ranged attack line into D35E 'attack' items.
     * Format: "masterwork longsword +9/+4 (1d8+4/19-20)" or "+1 longsword +10 (1d8+5/19-20/x2)"
     * Multiple attacks separated by " or " or ","
     */
    static _parseAttackLine(text, actionType) {
        const items = [];
        // Strip template/source parentheticals like "(Half-Dragon Template)" from attack text
        let cleanText = text.replace(/\([^)]*Template[^)]*\)/gi, '').replace(/\s{2,}/g, ' ');
        // Split on " and " or " or " to separate individual attacks
        const attackStrings = cleanText.split(/\s+(?:and|or)\s+/i);

        for (const atkStr of attackStrings) {
            const trimmed = atkStr.trim().replace(/\n/g, ' ');
            if (!trimmed) continue;

            // Pattern: [optional prefix] name +bonus[/+bonus...] (damage/crit)
            const atkMatch = trimmed.match(/^(.+?)\s+([+-]\d+(?:\/[+-]?\d+)*)\s*\(([^)]+)\)/);
            if (!atkMatch) {
                // Fallback: just create an attack with the name
                const cleanName = trimmed.replace(/\s*\(.*\)/, '').replace(/\s+[+-]\d+.*$/, '').trim();
                if (cleanName.length > 0 && cleanName.length < 80) {
                    items.push({
                        name: StatblockParser._titleCase(cleanName),
                        type: "attack",
                        system: {
                            attackType: "weapon",
                            actionType: actionType,
                            primaryAttack: true,
                            proficient: true,
                            showInQuickbar: true,
                            description: { value: `Imported: ${trimmed}` }
                        }
                    });
                }
                continue;
            }

            const weaponName = atkMatch[1].trim();
            const attackBonuses = atkMatch[2]; // e.g. "+9/+4"
            const damageInfo = atkMatch[3];    // e.g. "1d8+4/19-20" or "2d6+7/19-20/x3"

            // Parse damage, crit range, crit mult from damageInfo
            const dmgParts = damageInfo.split('/');
            const damageRoll = dmgParts[0].trim(); // "1d8+4"
            let critRange = '20';
            let critMult = 2;

            for (let i = 1; i < dmgParts.length; i++) {
                const part = dmgParts[i].trim();
                if (part.startsWith('x') || part.startsWith('×')) {
                    critMult = parseInt(part.substring(1)) || 2;
                } else if (/^\d+-\d+$/.test(part)) {
                    critRange = part.split('-')[0]; // "19-20" -> "19"
                } else if (/^\d+$/.test(part)) {
                    critRange = part;
                }
            }

            // Determine enhancement bonus from weapon name
            const enhMatch = weaponName.match(/^\+(\d+)\s+/);
            const enh = enhMatch ? parseInt(enhMatch[1]) : null;
            const isMasterwork = /masterwork|mwk/i.test(weaponName);
            const cleanWeaponName = weaponName.replace(/^\+\d+\s+/, '')
                                              .replace(/masterwork\s+/i, '')
                                              .replace(/mwk\s+/i, '').trim();

            // Try to look up base weapon data
            const baseWeapon = StatblockParser._findWeaponData(cleanWeaponName);

            const attackItem = {
                name: StatblockParser._titleCase(weaponName),
                type: "attack",
                system: {
                    attackType: "weapon",
                    actionType: actionType,
                    primaryAttack: true,
                    proficient: true,
                    showInQuickbar: true,
                    masterwork: isMasterwork || enh !== null,
                    enh: enh,
                    weaponSubtype: baseWeapon ? baseWeapon.weaponSubtype : (actionType === 'mwak' ? '1h' : 'ranged'),
                    attackBonus: attackBonuses.split('/')[0],
                    ability: {
                        attack: actionType === 'mwak' ? 'str' : 'dex',
                        damage: actionType === 'mwak' ? 'str' : null,
                        damageMult: 1,
                        critRange: critRange,
                        critMult: critMult
                    },
                    damage: {
                        parts: [[damageRoll, baseWeapon ? baseWeapon.damageType : '']]
                    },
                    description: { value: `Attack: ${trimmed}` }
                }
            };

            items.push(attackItem);
        }

        return items;
    }

    /**
     * Parse possessions/gear text into appropriate D35E item types.
     * Classifies into: weapon, equipment (armor/shields), consumable, or loot.
     */
    static _parsePossessions(text) {
        const items = [];
        const entries = StatblockParser._splitOnCommas(text);

        for (let entry of entries) {
            entry = entry.trim();
            if (!entry || entry.length > 120) continue;
            // Stop if we hit another section header
            if (/^(Spells|Special|Languages|Feats|Skills|Str\b|Dex\b|Con\b|Abilities\b|SQ\b)/i.test(entry)) break;
            // Skip junk entries
            if (/^\(none\)$/i.test(entry)) continue;
            if (/^(none|money|combat\s+gear)$/i.test(entry)) continue;
            // Skip spell section lines that leaked through
            if (/Spells\s+Prepared/i.test(entry)) continue;
            if (/^\d+\s*\(DC\s+\d+/i.test(entry)) continue;
            if (/^\(\d+\)\s*\(DC/i.test(entry)) continue;
            // Skip "(Free)" qualifier items only if they're just outfit placeholders
            entry = entry.replace(/\s*\(Free\)/i, '').trim();
            if (!entry) continue;

            // Extract quantity: "potion of cure light wounds (x2)" or "(2)"
            let quantity = 1;
            const qtyMatch = entry.match(/\((?:x|\u00d7)?(\d+)\)$/i);
            if (qtyMatch) {
                quantity = parseInt(qtyMatch[1]);
                entry = entry.replace(/\s*\((?:x|\u00d7)?\d+\)$/i, '').trim();
            }
            // Also handle "2 potions of ..."
            const leadQty = entry.match(/^(\d+)\s+/);
            if (leadQty && parseInt(leadQty[1]) < 100) {
                quantity = parseInt(leadQty[1]);
                entry = entry.replace(/^\d+\s+/, '').trim();
            }

            // Detect enhancement bonus
            const enhMatch = entry.match(/^\+(\d+)\s+/);
            const enh = enhMatch ? parseInt(enhMatch[1]) : 0;
            const baseName = entry.replace(/^\+\d+\s+/, '').replace(/masterwork\s+/i, '').replace(/mwk\s+/i, '').trim();
            const isMasterwork = /masterwork|mwk/i.test(entry);

            // Try to classify the item
            const armorData = StatblockParser._findArmorData(baseName);
            const weaponData = StatblockParser._findWeaponData(baseName);
            const isConsumable = /potion|scroll|wand|oil|elixir|salve|antitoxin|tanglefoot|thunderstone|alchemist/i.test(entry);

            if (armorData) {
                // Armor or Shield
                items.push({
                    name: StatblockParser._titleCase(entry),
                    type: "equipment",
                    system: {
                        equipmentType: armorData.equipmentSubtype === 'shield' ? 'shield' : 'armor',
                        equipmentSubtype: armorData.equipmentSubtype,
                        equipped: true,
                        masterwork: isMasterwork || enh > 0,
                        armor: {
                            value: armorData.acBonus,
                            dex: armorData.maxDex,
                            acp: armorData.acp,
                            enh: enh
                        },
                        spellFailure: armorData.spellFailure,
                        quantity: quantity,
                        weight: armorData.weight,
                        price: armorData.price,
                        identified: true,
                        carried: true,
                        description: { value: `Imported: ${entry}` }
                    }
                });
            } else if (weaponData) {
                // Weapon item (inventory, not attack roll)
                items.push({
                    name: StatblockParser._titleCase(entry),
                    type: "weapon",
                    system: {
                        weaponType: weaponData.weaponType,
                        weaponSubtype: weaponData.weaponSubtype,
                        equipped: true,
                        masterwork: isMasterwork || enh > 0,
                        enh: enh || null,
                        quantity: quantity,
                        identified: true,
                        carried: true,
                        weaponData: {
                            damageRoll: weaponData.damage,
                            damageType: weaponData.damageType,
                            critRange: weaponData.critRange,
                            critMult: weaponData.critMult,
                            range: weaponData.range || null,
                            size: 'med'
                        },
                        description: { value: `Imported: ${entry}` }
                    }
                });
            } else if (isConsumable) {
                // Consumable item
                let consumableType = 'potion';
                if (/scroll/i.test(entry)) consumableType = 'scroll';
                else if (/wand/i.test(entry)) consumableType = 'wand';
                else if (/oil/i.test(entry)) consumableType = 'oil';

                items.push({
                    name: StatblockParser._titleCase(entry),
                    type: "consumable",
                    system: {
                        consumableType: consumableType,
                        quantity: quantity,
                        identified: true,
                        carried: true,
                        description: { value: `Imported: ${entry}` }
                    }
                });
            } else {
                // Generic loot / wondrous item
                const isWondrous = /cloak|ring|amulet|belt|boots|bracers|cape|circlet|gloves|goggles|hat|headband|helm|ioun|mantle|necklace|periapt|robe|vest/i.test(entry);
                items.push({
                    name: StatblockParser._titleCase(entry),
                    type: isWondrous ? "equipment" : "loot",
                    system: isWondrous ? {
                        equipmentType: 'misc',
                        equipmentSubtype: 'wondrous',
                        equipped: true,
                        quantity: quantity,
                        identified: true,
                        carried: true,
                        slot: 'slotless',
                        description: { value: `Imported: ${entry}` }
                    } : {
                        subType: 'misc',
                        quantity: quantity,
                        identified: true,
                        carried: true,
                        description: { value: `Imported: ${entry}` }
                    }
                });
            }
        }

        return items;
    }

    /**
     * Look up weapon data by name (fuzzy match).
     */
    static _findWeaponData(name) {
        const lower = name.toLowerCase().trim();
        // Direct lookup
        if (StatblockParser.WEAPON_DATA[lower]) return StatblockParser.WEAPON_DATA[lower];
        // Try removing trailing "s" for plurals (e.g., "daggers" -> "dagger")
        if (lower.endsWith('s') && StatblockParser.WEAPON_DATA[lower.slice(0, -1)]) {
            return StatblockParser.WEAPON_DATA[lower.slice(0, -1)];
        }
        // Substring match (e.g., "cold iron longsword" should match "longsword")
        for (const [key, data] of Object.entries(StatblockParser.WEAPON_DATA)) {
            if (lower.includes(key)) return data;
        }
        return null;
    }

    /**
     * Look up armor/shield data by name (fuzzy match).
     */
    static _findArmorData(name) {
        const lower = name.toLowerCase().trim();
        if (StatblockParser.ARMOR_DATA[lower]) return StatblockParser.ARMOR_DATA[lower];
        for (const [key, data] of Object.entries(StatblockParser.ARMOR_DATA)) {
            if (lower.includes(key)) return data;
        }
        return null;
    }

    /**
     * Title-case a string.
     */
    static _titleCase(str) {
        return str.replace(/\b\w+/g, word => {
            // Keep small words lowercase unless first
            const small = ['a','an','the','and','but','or','for','nor','of','to','in','on','at','by','with'];
            if (small.includes(word.toLowerCase())) return word.toLowerCase();
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).replace(/^./, c => c.toUpperCase());
    }
}
