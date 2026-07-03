import CharacterModel from '../models/Character.js';

// Data-access layer returns plain objects for list endpoints via .lean().
export async function findCharactersByPlayer(playerId, { skip, limit }) {
  return CharacterModel.find({ player: playerId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

export async function countCharactersByPlayer(playerId) {
  // Separate count query supports predictable pagination metadata.
  return CharacterModel.countDocuments({ player: playerId });
}

export async function createCharacter(payload) {
  return CharacterModel.create(payload);
}

export async function findCharacterByIdAndPlayer(characterId, playerId) {
  return CharacterModel.findOne({ _id: characterId, player: playerId }).exec();
}

export async function updateCharacterAvatarUrl(characterId, playerId, avatarUrl) {
  return CharacterModel.findOneAndUpdate(
    { _id: characterId, player: playerId },
    { avatarUrl },
    { new: true },
  ).exec();
}

export async function updateCharacterAbilityScores(characterId, playerId, abilityScores) {
  return CharacterModel.findOneAndUpdate(
    { _id: characterId, player: playerId },
    { abilityScores },
    { new: true },
  ).exec();
}

export async function deleteCharacterByIdAndPlayer(characterId, playerId) {
  return CharacterModel.findOneAndDelete({ _id: characterId, player: playerId }).exec();
}

export async function updateCharacterHitPoints(characterId, playerId, hitPoints) {
  return CharacterModel.findOneAndUpdate(
    { _id: characterId, player: playerId },
    { hitPoints },
    { new: true },
  ).exec();
}

export async function updateCharacterByIdAndPlayer(characterId, playerId, updates) {
  return CharacterModel.findOneAndUpdate(
    { _id: characterId, player: playerId },
    updates,
    { new: true },
  ).exec();
}
