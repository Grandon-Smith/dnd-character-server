import { CLASS_SAVING_THROWS } from '../utils/constants.js';
import { AppError } from '../utils/app-error.js';
import {
  countCharactersByPlayer,
  createCharacter,
  deleteCharacterByIdAndPlayer,
  findCharacterByIdAndPlayer,
  findCharactersByPlayer,
  updateCharacterByIdAndPlayer,
  updateCharacterAbilityScores,
  updateCharacterAvatarUrl,
  updateCharacterHitPoints,
} from '../repositories/character.repository.js';

const ABILITY_KEYS = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
];

// Coerces query values safely; service keeps pagination defaults consistent.
export function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export async function listCharactersForUser(userId, query) {
  if (!userId) {
    throw new AppError('User not found', 404);
  }

  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 20), 100);
  const skip = (page - 1) * limit;

  // Run independent DB calls in parallel for lower response latency.
  const [characters, total] = await Promise.all([
    findCharactersByPlayer(userId, { skip, limit }),
    countCharactersByPlayer(userId),
  ]);

  const includeMeta = query.includeMeta === true;

  if (!includeMeta) {
    return { legacyData: characters };
  }

  return {
    data: characters,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createCharacterForUser(userId, payload) {
  if (!userId) {
    throw new AppError('User not found', 404);
  }

  // Derive class-based saving throws server-side so clients stay lightweight.
  const primaryClass = payload.classes[0]?.name?.toLowerCase();

  const characterPayload = {
    ...payload,
    player: userId,
    savingThrowProficiencies: CLASS_SAVING_THROWS[primaryClass] || [],
  };

  return createCharacter(characterPayload);
}

export async function setCharacterAvatarForUser(userId, characterId, avatarUrl) {
  if (!userId) {
    throw new AppError('User not found', 404);
  }

  const ownedCharacter = await findCharacterByIdAndPlayer(characterId, userId);

  if (!ownedCharacter) {
    throw new AppError('Character not found', 404);
  }

  return updateCharacterAvatarUrl(characterId, userId, avatarUrl);
}

export async function getCharacterForUser(userId, characterId) {
  if (!userId) {
    throw new AppError('User not found', 404);
  }

  const ownedCharacter = await findCharacterByIdAndPlayer(characterId, userId);

  if (!ownedCharacter) {
    throw new AppError('Character not found', 404);
  }

  return ownedCharacter;
}

export async function updateAbilityScoresForUser(userId, characterId, abilityScores) {
  if (!userId) {
    throw new AppError('User not found', 404);
  }

  const ownedCharacter = await findCharacterByIdAndPlayer(characterId, userId);

  if (!ownedCharacter) {
    throw new AppError('Character not found', 404);
  }

  if (!abilityScores || typeof abilityScores !== 'object') {
    throw new AppError('abilityScores payload is required.', 400);
  }

  for (const key of ABILITY_KEYS) {
    const value = Number(abilityScores[key]);

    if (!Number.isInteger(value) || value < 3 || value > 24) {
      throw new AppError(`${key} must be an integer between 3 and 24.`, 400);
    }
  }

  return updateCharacterAbilityScores(characterId, userId, {
    strength: Number(abilityScores.strength),
    dexterity: Number(abilityScores.dexterity),
    constitution: Number(abilityScores.constitution),
    intelligence: Number(abilityScores.intelligence),
    wisdom: Number(abilityScores.wisdom),
    charisma: Number(abilityScores.charisma),
  });
}

export async function deleteCharacterForUser(userId, characterId) {
  if (!userId) {
    throw new AppError('User not found', 404);
  }

  const deletedCharacter = await deleteCharacterByIdAndPlayer(characterId, userId);

  if (!deletedCharacter) {
    throw new AppError('Character not found', 404);
  }

  return deletedCharacter;
}

export async function updateHitPointsForUser(userId, characterId, hitPoints) {
  if (!userId) {
    throw new AppError('User not found', 404);
  }

  const ownedCharacter = await findCharacterByIdAndPlayer(characterId, userId);

  if (!ownedCharacter) {
    throw new AppError('Character not found', 404);
  }

  const max = ownedCharacter.hitPoints.max;
  const current = Number(hitPoints.current);
  const temporary = Number(hitPoints.temporary ?? 0);

  if (!Number.isInteger(current) || current < 0 || current > max) {
    throw new AppError(`currentHP must be an integer between 0 and ${max}.`, 400);
  }

  if (!Number.isInteger(temporary) || temporary < 0) {
    throw new AppError('temporaryHP must be a non-negative integer.', 400);
  }

  return updateCharacterHitPoints(characterId, userId, {
    max,
    current,
    temporary,
  });
}

export async function updateCharacterForUser(userId, characterId, payload) {
  if (!userId) {
    throw new AppError('User not found', 404);
  }

  const ownedCharacter = await findCharacterByIdAndPlayer(characterId, userId);

  if (!ownedCharacter) {
    throw new AppError('Character not found', 404);
  }

  const normalizedClasses = Array.isArray(payload.classes) ? payload.classes : [];
  const computedLevel = normalizedClasses.reduce(
    (sum, cls) => sum + Number(cls?.level || 0),
    0,
  );
  const primaryClass = normalizedClasses[0]?.name?.toLowerCase();

  const updatePayload = {
    name: payload.name,
    race: payload.race,
    classes: normalizedClasses,
    level: computedLevel,
    abilityScores: payload.abilityScores,
    hitPoints: payload.hitPoints,
    armorClass: payload.armorClass,
    speed: payload.speed,
    initiative: payload.initiative,
    background: payload.background,
    skillProficiencies: payload.skillProficiencies,
    feats: payload.feats,
    savingThrowProficiencies:
      payload.savingThrowProficiencies && payload.savingThrowProficiencies.length
        ? payload.savingThrowProficiencies
        : CLASS_SAVING_THROWS[primaryClass] || [],
    inventory: payload.inventory,
    spells: payload.spells,
    notes: payload.notes,
  };

  return updateCharacterByIdAndPlayer(characterId, userId, updatePayload);
}
