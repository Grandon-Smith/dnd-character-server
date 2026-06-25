import { CLASS_SAVING_THROWS } from "../utils/constants.js";
import CharacterModel from "../models/Character.js";
import UserModel from "../models/User.js";

export const getAllCharacters = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find all characters that belong to this user
    const characters = await CharacterModel.find({
      player: userId,
    });

    return res.status(200).json(characters);
  } catch (err) {
    console.error("Error fetching characters:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export const createCharacter = async (req, res) => {
  try {
    const characterData = req.body;

    // Basic validation (optional)
    if (
      !characterData.name ||
      !characterData.race ||
      !characterData.classes?.length
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const userId = req.user._id;

    characterData.player = userId;

    if (!userId) {
      return res.status(404).json({ message: "User not found" });
    }
    // assign saving throws based on class chosen
    characterData.savingThrowProficiencies =
      CLASS_SAVING_THROWS[characterData.classes[0].name.toLowerCase()];
    // Save character
    const savedCharacter = await CharacterModel.create(characterData);

    return res.status(201).json(savedCharacter);
  } catch (err) {
    console.error("Error creating character:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
