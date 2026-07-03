import mongoose, { Schema } from 'mongoose';

// Keeps spell payload flexible for external API ingestion while indexing key fields.
const spellSchema = new Schema(
  {
    index: { type: String, index: true },
    name: { type: String, index: true },
  },
  {
    strict: false,
    timestamps: true,
  },
);

const Spell = mongoose.model('Spell', spellSchema);

export default Spell;
