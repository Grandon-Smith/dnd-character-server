import mongoose, { Schema } from 'mongoose';

const referenceSkillSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    ability: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'strength',
        'dexterity',
        'constitution',
        'intelligence',
        'wisdom',
        'charisma',
      ],
    },
  },
  { timestamps: true },
);

const ReferenceSkill = mongoose.model(
  'ReferenceSkill',
  referenceSkillSchema,
  'reference_skills',
);

export default ReferenceSkill;
