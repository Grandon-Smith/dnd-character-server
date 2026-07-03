import mongoose, { Schema } from 'mongoose';

// Embedded scores keep core stats together and avoid extra joins/collections.
const StatSchema = new mongoose.Schema(
  {
    strength: { type: Number, required: true, min: 1 },
    dexterity: { type: Number, required: true, min: 1 },
    constitution: { type: Number, required: true, min: 1 },
    intelligence: { type: Number, required: true, min: 1 },
    wisdom: { type: Number, required: true, min: 1 },
    charisma: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const ClassSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    subclass: { type: String, trim: true, default: '' },
    level: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const HitPointsSchema = new Schema(
  {
    max: { type: Number, required: true, min: 0 },
    current: { type: Number, required: true, min: 0 },
    temporary: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

// Character document is user-owned and query-optimized for list endpoints.
const Character = mongoose.model(
  'Character',
  new Schema(
    {
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
      name: { type: String, required: true, trim: true, maxlength: 80 },
      race: { type: String, required: true, trim: true, maxlength: 80 },
      classes: {
        type: [ClassSchema],
        validate: {
          validator: (classes) => Array.isArray(classes) && classes.length > 0,
          message: 'At least one class is required',
        },
      },
      level: { type: Number, default: 1, min: 1 },
      background: { type: String, required: true, trim: true, maxlength: 120 },
      alignment: { type: String, trim: true, maxlength: 40 },
      experiencePoints: { type: Number, default: 0, min: 0 },
      abilityScores: { type: StatSchema, required: true },
      hitPoints: { type: HitPointsSchema, required: true },
      armorClass: { type: Number, required: true, min: 0 },
      speed: { type: Number, required: true, min: 0 },
      initiative: { type: Number, required: true },
      skillProficiencies: { type: [String], default: [] },
      feats: { type: [String], default: [] },
      savingThrowProficiencies: { type: [String], default: [] },
      inventory: { type: [Schema.Types.Mixed], default: [] },
      spells: { type: [String], default: [] },
      avatarUrl: { type: String, trim: true, default: '' },
      notes: { type: String, maxlength: 5000 },
    },
    {
      timestamps: true,
    },
  ),
);

Character.schema.index({ player: 1, createdAt: -1 });

export default Character;
