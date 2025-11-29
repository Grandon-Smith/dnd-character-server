import mongoose, { Schema } from "mongoose";

const spellSchema = new Schema({}, { strict: false });

const Spell = mongoose.model("Spell", spellSchema);

export default Spell;
