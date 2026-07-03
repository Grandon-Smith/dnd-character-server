import mongoose, { Schema } from 'mongoose';

const referenceClassSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    skillChoices: { type: Number, default: 0, min: 0 },
    skills: { type: [String], default: [] },
    autoProficiencies: { type: [String], default: [] },
  },
  { timestamps: true },
);

const ReferenceClass = mongoose.model(
  'ReferenceClass',
  referenceClassSchema,
  'reference_classes',
);

export default ReferenceClass;
