import { connectToDb, disconnectFromDb } from '../db.js';
import Class from '../models/references/Class.js';

function proficiencyBonusForLevel(level) {
  return 2 + Math.floor((level - 1) / 4);
}

function buildDefaultLevels() {
  return Array.from({ length: 20 }, (_, index) => {
    const level = index + 1;

    return {
      level,
      proficiencyBonus: proficiencyBonusForLevel(level),
      features: [],
      choices: [],
      resources: {},
    };
  });
}

const defaultLevels = buildDefaultLevels();

const classDocs = [
  {
    key: 'class-barbarian',
    name: 'Barbarian',
    description: 'A fierce warrior of primitive background who can enter a battle rage.',
    hitDie: 12,
    primaryAbilities: ['strength'],
    savingThrows: ['strength', 'constitution'],
    armorProficiencies: ['light-armor', 'medium-armor', 'shields'],
    weaponProficiencies: ['simple-weapons', 'martial-weapons'],
    toolProficiencies: [],
    skillChoices: {
      choose: 2,
      from: [
        'animal-handling',
        'athletics',
        'intimidation',
        'nature',
        'perception',
        'survival',
      ],
    },
    startingEquipmentDescription: [
      'Greataxe (or any martial melee weapon)',
      'Two handaxes (or any simple weapon)',
      "Explorer's pack",
      'Four javelins',
    ],
    startingEquipmentOptions: [],
    multiclass: {
      prerequisites: { strength: 13 },
      proficiencies: {
        armor: ['shields', 'light-armor', 'medium-armor'],
        weapons: ['simple-weapons', 'martial-weapons'],
        tools: [],
        skills: [],
      },
    },
    subclasses: [
      'path-of-the-berserker',
      'path-of-the-totem-warrior',
      'path-of-the-zealot',
    ],
    spellcasting: false,
    levels: defaultLevels,
  },
];

async function seedReferenceClasses() {
  await connectToDb();

  try {
    await Class.deleteMany({});
    const inserted = await Class.insertMany(classDocs, { ordered: true });
    console.log(`Seeded ${inserted.length} classes into reference_classes.`);
  } finally {
    await disconnectFromDb();
  }
}

seedReferenceClasses().catch((error) => {
  console.error('Failed to seed reference classes:', error);
  process.exit(1);
});
