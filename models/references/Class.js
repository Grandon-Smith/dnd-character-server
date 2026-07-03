import mongoose, { Schema } from 'mongoose';

const LevelSchema = new Schema(
  {
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },

    proficiencyBonus: {
      type: Number,
      required: true,
    },

    features: {
      type: [String], // feature keys
      default: [],
    },

    choices: {
      type: [String], // choice keys
      default: [],
    },

    resources: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false },
);

const SkillChoiceSchema = new Schema(
  {
    choose: Number,
    from: [String],
  },
  { _id: false },
);

const StartingEquipmentOptionSchema = new Schema(
  {
    choose: Number,
    from: [Schema.Types.Mixed], // can improve later
  },
  { _id: false },
);

const ClassSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: String,
    ruleset: {
      type: String,
      required: true,
      enum: ['2014', '2024'],
      index: true,
    },
    hitDie: {
      type: Number,
      required: true,
    },

    primaryAbilities: {
      type: [String],
      default: [],
    },

    savingThrows: {
      type: [String],
      default: [],
    },

    armorProficiencies: {
      type: [String],
      default: [],
    },

    weaponProficiencies: {
      type: [String],
      default: [],
    },

    toolProficiencies: {
      type: [String],
      default: [],
    },

    skillChoices: SkillChoiceSchema,

    startingEquipmentDescription: {
      type: [String],
      default: [],
    },

    startingEquipmentOptions: {
      type: [StartingEquipmentOptionSchema],
      default: [],
    },

    multiclass: {
      prerequisites: {
        type: Map,
        of: Number,
        default: {},
      },

      proficiencies: {
        armor: [String],
        weapons: [String],
        tools: [String],
        skills: [String],
      },
    },

    subclasses: {
      type: [String], // subclass keys
      default: [],
    },

    spellcasting: {
      type: Boolean,
      default: false,
    },

    levels: {
      type: [LevelSchema],
      validate: (levels) => levels.length === 20,
    },
  },
  {
    timestamps: true,
  },
);

const Class = mongoose.model('Class', ClassSchema, 'reference_classes');

export default Class;
