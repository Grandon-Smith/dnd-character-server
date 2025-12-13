import { CLASS_SAVING_THROWS } from "../utils/constants.js";
import CharacterModel from "../models/Character.js";
import UserModel from "../models/User.js";

export const getAllCharacters = async (req, res) => {
  try {
    // Temporary hardcoded user until JWT is added
    const user = await UserModel.findOne({
      email: req.user.email,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find all characters that belong to this user
    const characters = await CharacterModel.find({
      player: user._id,
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

    //find user based on id. NEED TO UPDATE FOR USE WITH JWT
    const user = await UserModel.findOne({
      email: req.user.email,
    });

    // Attach real user ID instead of trusting client data
    characterData.player = user._id;

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
