import { connectToDb, disconnectFromDb } from '../db.js';
import ReferenceClass from '../models/ReferenceClass.js';
import ReferenceFeat from '../models/ReferenceFeat.js';
import ReferenceRace from '../models/ReferenceRace.js';
import ReferenceSkill from '../models/ReferenceSkill.js';

const classes = [
  {
    key: 'barbarian',
    name: 'Barbarian',
    skillChoices: 2,
    skills: [
      'Animal Handling',
      'Athletics',
      'Intimidation',
      'Nature',
      'Perception',
      'Survival',
    ],
    autoProficiencies: [],
  },
  {
    key: 'bard',
    name: 'Bard',
    skillChoices: 3,
    skills: [
      'Acrobatics',
      'Animal Handling',
      'Arcana',
      'Athletics',
      'Deception',
      'History',
      'Insight',
      'Intimidation',
      'Investigation',
      'Medicine',
      'Nature',
      'Perception',
      'Performance',
      'Persuasion',
      'Religion',
      'Sleight of Hand',
      'Stealth',
      'Survival',
    ],
    autoProficiencies: [],
  },
  {
    key: 'cleric',
    name: 'Cleric',
    skillChoices: 2,
    skills: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
    autoProficiencies: [],
  },
  {
    key: 'druid',
    name: 'Druid',
    skillChoices: 2,
    skills: [
      'Arcana',
      'Animal Handling',
      'Insight',
      'Medicine',
      'Nature',
      'Perception',
      'Religion',
      'Survival',
    ],
    autoProficiencies: [],
  },
  {
    key: 'fighter',
    name: 'Fighter',
    skillChoices: 2,
    skills: [
      'Acrobatics',
      'Animal Handling',
      'Athletics',
      'History',
      'Insight',
      'Intimidation',
      'Perception',
      'Survival',
    ],
    autoProficiencies: [],
  },
  {
    key: 'monk',
    name: 'Monk',
    skillChoices: 2,
    skills: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'],
    autoProficiencies: [],
  },
  {
    key: 'paladin',
    name: 'Paladin',
    skillChoices: 2,
    skills: [
      'Athletics',
      'Insight',
      'Intimidation',
      'Medicine',
      'Persuasion',
      'Religion',
    ],
    autoProficiencies: [],
  },
  {
    key: 'ranger',
    name: 'Ranger',
    skillChoices: 3,
    skills: [
      'Animal Handling',
      'Athletics',
      'Insight',
      'Investigation',
      'Nature',
      'Perception',
      'Stealth',
      'Survival',
    ],
    autoProficiencies: [],
  },
  {
    key: 'rogue',
    name: 'Rogue',
    skillChoices: 4,
    skills: [
      'Acrobatics',
      'Athletics',
      'Deception',
      'Insight',
      'Intimidation',
      'Investigation',
      'Perception',
      'Performance',
      'Persuasion',
      'Sleight of Hand',
      'Stealth',
    ],
    autoProficiencies: ['Stealth', "Thieves' Tools"],
  },
  {
    key: 'sorcerer',
    name: 'Sorcerer',
    skillChoices: 2,
    skills: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'],
    autoProficiencies: [],
  },
  {
    key: 'warlock',
    name: 'Warlock',
    skillChoices: 2,
    skills: [
      'Arcana',
      'Deception',
      'History',
      'Intimidation',
      'Investigation',
      'Nature',
      'Religion',
    ],
    autoProficiencies: [],
  },
  {
    key: 'wizard',
    name: 'Wizard',
    skillChoices: 2,
    skills: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'],
    autoProficiencies: ['Arcana'],
  },
];

const races = [
  { key: 'human', name: 'Human', skillChoices: 0, skills: [], autoProficiencies: [] },
  {
    key: 'variant human',
    name: 'Variant Human',
    skillChoices: 1,
    skills: [
      'Acrobatics',
      'Animal Handling',
      'Arcana',
      'Athletics',
      'Deception',
      'History',
      'Insight',
      'Intimidation',
      'Investigation',
      'Medicine',
      'Nature',
      'Perception',
      'Performance',
      'Persuasion',
      'Religion',
      'Sleight of Hand',
      'Stealth',
      'Survival',
    ],
    autoProficiencies: [],
  },
  { key: 'elf', name: 'Elf', skillChoices: 0, skills: [], autoProficiencies: [] },
  {
    key: 'wood elf',
    name: 'Wood Elf',
    skillChoices: 0,
    skills: [],
    autoProficiencies: ['Perception'],
  },
  {
    key: 'high elf',
    name: 'High Elf',
    skillChoices: 0,
    skills: [],
    autoProficiencies: [],
  },
  { key: 'dwarf', name: 'Dwarf', skillChoices: 0, skills: [], autoProficiencies: [] },
  {
    key: 'halfling',
    name: 'Halfling',
    skillChoices: 0,
    skills: [],
    autoProficiencies: [],
  },
  {
    key: 'halfelf',
    name: 'Half-Elf',
    skillChoices: 2,
    skills: [
      'Acrobatics',
      'Animal Handling',
      'Arcana',
      'Athletics',
      'Deception',
      'History',
      'Insight',
      'Intimidation',
      'Investigation',
      'Medicine',
      'Nature',
      'Perception',
      'Performance',
      'Persuasion',
      'Religion',
      'Sleight of Hand',
      'Stealth',
      'Survival',
    ],
    autoProficiencies: [],
  },
  {
    key: 'halforc',
    name: 'Half-Orc',
    skillChoices: 0,
    skills: [],
    autoProficiencies: ['Intimidation'],
  },
  {
    key: 'tiefling',
    name: 'Tiefling',
    skillChoices: 0,
    skills: [],
    autoProficiencies: [],
  },
];

const skills = [
  { key: 'acrobatics', name: 'Acrobatics', ability: 'dexterity' },
  { key: 'animalHandling', name: 'Animal Handling', ability: 'wisdom' },
  { key: 'arcana', name: 'Arcana', ability: 'intelligence' },
  { key: 'athletics', name: 'Athletics', ability: 'strength' },
  { key: 'deception', name: 'Deception', ability: 'charisma' },
  { key: 'history', name: 'History', ability: 'intelligence' },
  { key: 'insight', name: 'Insight', ability: 'wisdom' },
  { key: 'intimidation', name: 'Intimidation', ability: 'charisma' },
  { key: 'investigation', name: 'Investigation', ability: 'intelligence' },
  { key: 'medicine', name: 'Medicine', ability: 'wisdom' },
  { key: 'nature', name: 'Nature', ability: 'intelligence' },
  { key: 'perception', name: 'Perception', ability: 'wisdom' },
  { key: 'performance', name: 'Performance', ability: 'charisma' },
  { key: 'persuasion', name: 'Persuasion', ability: 'charisma' },
  { key: 'religion', name: 'Religion', ability: 'intelligence' },
  { key: 'sleightOfHand', name: 'Sleight of Hand', ability: 'dexterity' },
  { key: 'stealth', name: 'Stealth', ability: 'dexterity' },
  { key: 'survival', name: 'Survival', ability: 'wisdom' },
];

// Feat entries use concise summaries and bonus tags for UI display.
const feats = [
  {
    key: 'actor',
    name: 'Actor',
    bonuses: ['+1 CHA'],
    description: 'Improve performance and deception when impersonating others.',
  },
  {
    key: 'alert',
    name: 'Alert',
    bonuses: ['+5 initiative'],
    description: 'Exceptional awareness helps avoid surprise and react quickly.',
  },
  {
    key: 'athlete',
    name: 'Athlete',
    bonuses: ['+1 STR or DEX'],
    description: 'Improved climbing, jumping, and getting up from prone.',
  },
  {
    key: 'charger',
    name: 'Charger',
    bonuses: ['dash attack option'],
    description: 'After dashing, make a stronger melee shove or strike.',
  },
  {
    key: 'crossbow expert',
    name: 'Crossbow Expert',
    bonuses: ['ignore loading'],
    description: 'Use crossbows effectively in close quarters and bonus attacks.',
  },
  {
    key: 'defensive duelist',
    name: 'Defensive Duelist',
    bonuses: ['reaction AC'],
    description: 'Use finesse weapon reactions to increase AC vs one attack.',
  },
  {
    key: 'dual wielder',
    name: 'Dual Wielder',
    bonuses: ['+1 AC'],
    description: 'Better two-weapon fighting and broader weapon pairing options.',
  },
  {
    key: 'dungeon delver',
    name: 'Dungeon Delver',
    bonuses: ['trap utility'],
    description: 'Spot, resist, and disarm dungeon traps more effectively.',
  },
  {
    key: 'durable',
    name: 'Durable',
    bonuses: ['+1 CON'],
    description: 'Improved resilience and better minimum healing from Hit Dice.',
  },
  {
    key: 'elemental adept',
    name: 'Elemental Adept',
    bonuses: ['spell damage reliability'],
    description: 'Specialize in one element and reduce low damage variance.',
  },
  {
    key: 'grappler',
    name: 'Grappler',
    bonuses: ['grapple utility'],
    description: 'Gain advantages while grappling and restraining targets.',
  },
  {
    key: 'great weapon master',
    name: 'Great Weapon Master',
    bonuses: ['power attack'],
    description: 'Trade accuracy for heavier hits and bonus follow-up attacks.',
  },
  {
    key: 'healer',
    name: 'Healer',
    bonuses: ['healing kit boost'],
    description: 'Restore more HP with healer kits and emergency aid.',
  },
  {
    key: 'heavily armored',
    name: 'Heavily Armored',
    bonuses: ['+1 STR'],
    description: 'Gain heavy armor training for improved protection.',
  },
  {
    key: 'heavy armor master',
    name: 'Heavy Armor Master',
    bonuses: ['+1 STR'],
    description: 'Reduce incoming nonmagical weapon damage in heavy armor.',
  },
  {
    key: 'inspiring leader',
    name: 'Inspiring Leader',
    bonuses: ['temp HP aura'],
    description: 'Grant temporary hit points through motivational speeches.',
  },
  {
    key: 'keen mind',
    name: 'Keen Mind',
    bonuses: ['+1 INT'],
    description: 'Sharper recall, orientation, and time awareness.',
  },
  {
    key: 'lightly armored',
    name: 'Lightly Armored',
    bonuses: ['+1 STR or DEX'],
    description: 'Gain light armor proficiency and improve survivability.',
  },
  {
    key: 'linguist',
    name: 'Linguist',
    bonuses: ['+1 INT'],
    description: 'Learn additional languages and create coded writing.',
  },
  {
    key: 'lucky',
    name: 'Lucky',
    bonuses: ['luck points'],
    description: 'Reroll attacks, checks, or saves using limited luck points.',
  },
  {
    key: 'mage slayer',
    name: 'Mage Slayer',
    bonuses: ['anti-caster'],
    description: 'Pressure nearby spellcasters and disrupt concentration.',
  },
  {
    key: 'magic initiate',
    name: 'Magic Initiate',
    bonuses: ['cantrips + spell'],
    description: 'Learn limited spells from another class list.',
  },
  {
    key: 'martial adept',
    name: 'Martial Adept',
    bonuses: ['battle maneuvers'],
    description: 'Gain a couple maneuvers and a superiority die.',
  },
  {
    key: 'medium armor master',
    name: 'Medium Armor Master',
    bonuses: ['DEX cap improvement'],
    description: 'Improve medium armor stealth and Dexterity benefit.',
  },
  {
    key: 'mobile',
    name: 'Mobile',
    bonuses: ['+10 speed'],
    description: 'Move faster and avoid opportunity attacks after melee strikes.',
  },
  {
    key: 'moderately armored',
    name: 'Moderately Armored',
    bonuses: ['+1 STR or DEX'],
    description: 'Gain medium armor and shield proficiency.',
  },
  {
    key: 'mounted combatant',
    name: 'Mounted Combatant',
    bonuses: ['mounted defense'],
    description: 'Improve offense and defense while mounted.',
  },
  {
    key: 'observant',
    name: 'Observant',
    bonuses: ['+1 INT or WIS'],
    description: 'Sharpen passive perception and lip-reading capability.',
  },
  {
    key: 'polearm master',
    name: 'Polearm Master',
    bonuses: ['bonus attack'],
    description: 'Gain bonus-end attacks and opportunity attacks on approach.',
  },
  {
    key: 'resilient',
    name: 'Resilient',
    bonuses: ['+1 ability'],
    description: 'Improve one ability score and gain save proficiency for it.',
  },
  {
    key: 'ritual caster',
    name: 'Ritual Caster',
    bonuses: ['ritual book'],
    description: 'Cast ritual spells from a curated ritual spellbook.',
  },
  {
    key: 'savage attacker',
    name: 'Savage Attacker',
    bonuses: ['damage reroll'],
    description: 'Reroll melee weapon damage once per turn.',
  },
  {
    key: 'sentinel',
    name: 'Sentinel',
    bonuses: ['control reactions'],
    description: 'Pin enemies in place and punish disengagement attempts.',
  },
  {
    key: 'sharpshooter',
    name: 'Sharpshooter',
    bonuses: ['ranged power attack'],
    description: 'Ignore key ranged penalties and trade accuracy for damage.',
  },
  {
    key: 'shield master',
    name: 'Shield Master',
    bonuses: ['shield shove'],
    description: 'Use shields aggressively and improve Dexterity defenses.',
  },
  {
    key: 'skilled',
    name: 'Skilled',
    bonuses: ['+3 skills/tools'],
    description: 'Gain broad additional training in skills or tools.',
  },
  {
    key: 'skulker',
    name: 'Skulker',
    bonuses: ['stealth utility'],
    description: 'Hide more effectively and miss less punishment in dim light.',
  },
  {
    key: 'spell sniper',
    name: 'Spell Sniper',
    bonuses: ['double range'],
    description: 'Extend spell range and ignore partial cover with spell attacks.',
  },
  {
    key: 'tavern brawler',
    name: 'Tavern Brawler',
    bonuses: ['+1 STR or CON'],
    description: 'Improved improvised combat and bonus grapple follow-up.',
  },
  {
    key: 'tough',
    name: 'Tough',
    bonuses: ['+2 HP per level'],
    description: 'Significantly increase maximum hit points over time.',
  },
  {
    key: 'war caster',
    name: 'War Caster',
    bonuses: ['concentration utility'],
    description: 'Maintain concentration better and cast while hands are occupied.',
  },
  {
    key: 'weapon master',
    name: 'Weapon Master',
    bonuses: ['+1 STR or DEX'],
    description: 'Gain proficiency with four additional weapon choices.',
  },
];

async function seed() {
  await connectToDb();

  await Promise.all([
    Promise.all(
      classes.map((item) =>
        ReferenceClass.findOneAndUpdate({ key: item.key }, item, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }),
      ),
    ),
    Promise.all(
      races.map((item) =>
        ReferenceRace.findOneAndUpdate({ key: item.key }, item, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }),
      ),
    ),
    Promise.all(
      skills.map((item) =>
        ReferenceSkill.findOneAndUpdate({ key: item.key }, item, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }),
      ),
    ),
    Promise.all(
      feats.map((item) =>
        ReferenceFeat.findOneAndUpdate({ key: item.key }, item, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }),
      ),
    ),
  ]);

  console.log('Reference data seeded successfully.');
}

seed()
  .catch((error) => {
    console.error('Failed to seed reference data', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFromDb();
  });
