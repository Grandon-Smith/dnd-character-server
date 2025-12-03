import mongoose, { Schema } from "mongoose";

const StatSchema = new mongoose.Schema(
	{
		strength: { type: Number, required: true },
		dexterity: { type: Number, required: true },
		constitution: { type: Number, required: true },
		intelligence: { type: Number, required: true },
		wisdom: { type: Number, required: true },
		charisma: { type: Number, required: true },
	},
	{ _id: false }
);

const Character = mongoose.model(
	"Character",
	new Schema({
		player: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		name: { type: String, required: true },
		race: { type: String, required: true },
		classes: [
			{
				name: { type: String, required: true }, // e.g., "Wizard"
				level: { type: Number, required: true }, // e.g., 3
			},
		],
		level: { type: Number, default: 1 },
		background: { type: String },
		alignment: { type: String },
		experiencePoints: { type: Number, default: 0 },
		abilityScores: { type: StatSchema, required: true },
		hitPoints: {
			max: { type: Number, required: true },
			current: { type: Number, required: true },
			temporary: { type: Number, default: 0 },
		},
		armorClass: { type: Number, required: true },
		speed: { type: Number, required: true },
		initiative: { type: Number, required: true },
		skillProficiencies: [String],
		background: { type: String, required: true },
		savingThrowProficiencies: [String],
		inventory: [],
		spells: [String],
		notes: { type: String },
	})
);

export default Character;
