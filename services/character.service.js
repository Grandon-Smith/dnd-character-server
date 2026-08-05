import mongoose from 'mongoose';
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
  updateCharacterEquipped,
  updateCharacterHitPoints,
  updateCharacterInventory,
} from '../repositories/character.repository.js';

const ABILITY_KEYS = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
];

const ATTUNEMENT_LIMIT = 3;

function toInventoryKey(value) {
  return String(value || '').trim();
}

async function findReferenceItemByKey(itemKey) {
  const equipment = await mongoose.connection
    .collection('reference_equipment')
    .findOne({ key: itemKey });

  if (equipment) {
    return { sourceType: 'equipment', item: equipment };
  }

  const magicItem = await mongoose.connection
    .collection('reference_magic-items')
    .findOne({ key: itemKey });

  if (magicItem) {
    return { sourceType: 'magic-item', item: magicItem };
  }

  return null;
}

function itemRequiresAttunement(item) {
  const text = Array.isArray(item?.desc) ? item.desc.join(' ').toLowerCase() : '';
  return text.includes('requires attunement');
}

function itemIsWeapon(item) {
  return (
    item?.equipment_category?.key === 'weapon' ||
    item?.equipment_category?.name === 'Weapon' ||
    typeof item?.weapon_category === 'string'
  );
}

function itemHasLightProperty(item) {
  return Array.isArray(item?.properties)
    ? item.properties.some((prop) => prop?.key === 'light')
    : false;
}

async function getSavingThrowsForPrimaryClass(primaryClassName) {
  if (!primaryClassName) {
    return [];
  }

  const normalizedPrimaryClass = String(primaryClassName).toLowerCase().trim();

  if (!normalizedPrimaryClass) {
    return [];
  }

  const classDoc = await mongoose.connection
    .collection('reference_classes')
    .findOne({ key: normalizedPrimaryClass });

  return Array.isArray(classDoc?.savingThrows) ? classDoc.savingThrows : [];
}

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
  const normalizedClasses = Array.isArray(payload.classes) ? payload.classes : [];
  const primaryClass = normalizedClasses[0]?.name;
  const savingThrowProficiencies = await getSavingThrowsForPrimaryClass(primaryClass);

  const characterPayload = {
    ...payload,
    classes: normalizedClasses,
    equipped: Array.isArray(payload?.equipped) ? payload.equipped : [],
    player: userId,
    savingThrowProficiencies,
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
  const primaryClass = normalizedClasses[0]?.name;
  const derivedSavingThrows = await getSavingThrowsForPrimaryClass(primaryClass);

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
        : derivedSavingThrows,
    inventory: payload.inventory,
    spells: payload.spells,
    notes: payload.notes,
  };

  if (Array.isArray(payload.equipped)) {
    updatePayload.equipped = payload.equipped;
  }

  return updateCharacterByIdAndPlayer(characterId, userId, updatePayload);
}

export async function updateInventoryForUser(userId, characterId, nextInventoryRaw) {
  if (!userId) {
    throw new AppError('User not found', 404);
  }

  const ownedCharacter = await findCharacterByIdAndPlayer(characterId, userId);

  if (!ownedCharacter) {
    throw new AppError('Character not found', 404);
  }

  if (!Array.isArray(nextInventoryRaw)) {
    throw new AppError('inventory must be an array.', 400);
  }

  const nextInventory = [
    ...new Set(nextInventoryRaw.map(toInventoryKey).filter(Boolean)),
  ];
  const inventorySet = new Set(nextInventory);
  const existingEquipped = Array.isArray(ownedCharacter.equipped)
    ? ownedCharacter.equipped
    : [];
  const prunedEquipped = existingEquipped.filter((entry) =>
    inventorySet.has(toInventoryKey(entry?.itemKey)),
  );

  const [characterWithInventory] = await Promise.all([
    updateCharacterInventory(characterId, userId, nextInventory),
    updateCharacterEquipped(characterId, userId, prunedEquipped),
  ]);

  return characterWithInventory;
}

export async function updateEquippedForUser(userId, characterId, nextEquippedRaw) {
  if (!userId) {
    throw new AppError('User not found', 404);
  }

  const ownedCharacter = await findCharacterByIdAndPlayer(characterId, userId);

  if (!ownedCharacter) {
    throw new AppError('Character not found', 404);
  }

  if (!Array.isArray(nextEquippedRaw)) {
    throw new AppError('equipped must be an array.', 400);
  }

  const inventorySet = new Set(
    (Array.isArray(ownedCharacter.inventory) ? ownedCharacter.inventory : [])
      .map(toInventoryKey)
      .filter(Boolean),
  );

  const referenceByKey = new Map();
  const normalizedEquipped = [];
  const seenSlotKeys = new Set();

  for (const rawEntry of nextEquippedRaw) {
    const itemKey = toInventoryKey(rawEntry?.itemKey);
    const slot = String(rawEntry?.slot || '').trim();
    const slotIdentity = `${itemKey}:${slot}`;

    if (!itemKey) {
      throw new AppError('Each equipped entry must include itemKey.', 400);
    }

    if (seenSlotKeys.has(slotIdentity)) {
      throw new AppError(`Duplicate equipped entry for ${itemKey}.`, 400);
    }

    if (!inventorySet.has(itemKey)) {
      throw new AppError(`Cannot equip ${itemKey} because it is not in inventory.`, 400);
    }

    let referenceItem = referenceByKey.get(itemKey);
    if (!referenceItem) {
      referenceItem = await findReferenceItemByKey(itemKey);
      if (!referenceItem) {
        throw new AppError(`Unknown item key: ${itemKey}.`, 400);
      }

      referenceByKey.set(itemKey, referenceItem);
    }

    const requestedSource = String(rawEntry?.sourceType || '').trim();
    if (requestedSource && requestedSource !== referenceItem.sourceType) {
      throw new AppError(`Invalid sourceType for item ${itemKey}.`, 400);
    }

    const attuned = Boolean(rawEntry?.attuned);
    if (attuned && !itemRequiresAttunement(referenceItem.item)) {
      throw new AppError(`${itemKey} does not require attunement.`, 400);
    }

    normalizedEquipped.push({
      itemKey,
      sourceType: referenceItem.sourceType,
      slot,
      attuned,
    });
    seenSlotKeys.add(slotIdentity);
  }

  const weaponEntries = normalizedEquipped.filter((entry) => {
    const ref = referenceByKey.get(entry.itemKey);
    return itemIsWeapon(ref?.item);
  });

  if (weaponEntries.length > 2) {
    throw new AppError('A character can equip at most two weapons.', 400);
  }

  if (weaponEntries.length === 2) {
    const offHandEntry =
      weaponEntries.find((entry) => entry.slot === 'off-hand') || weaponEntries[1];
    const offHandRef = referenceByKey.get(offHandEntry.itemKey);

    if (!itemHasLightProperty(offHandRef?.item)) {
      throw new AppError('Off-hand weapon must have the light property.', 400);
    }
  }

  const attunedCount = normalizedEquipped.reduce((count, entry) => {
    const ref = referenceByKey.get(entry.itemKey);
    if (entry.attuned && itemRequiresAttunement(ref?.item)) {
      return count + 1;
    }

    return count;
  }, 0);

  if (attunedCount > ATTUNEMENT_LIMIT) {
    throw new AppError('A character can attune to at most 3 magic items.', 400);
  }

  return updateCharacterEquipped(characterId, userId, normalizedEquipped);
}
