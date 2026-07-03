import mongoose, { Schema } from 'mongoose';

const referenceFeatSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    bonuses: { type: [String], default: [] },
    description: { type: String, required: true, trim: true },
    source: { type: String, default: 'Core 5e', trim: true },
  },
  { timestamps: true },
);

const ReferenceFeat = mongoose.model(
  'ReferenceFeat',
  referenceFeatSchema,
  'reference_feats',
);

export default ReferenceFeat;
