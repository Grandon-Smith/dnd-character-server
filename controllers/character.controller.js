import {
  createCharacterForUser,
  deleteCharacterForUser,
  getCharacterForUser,
  listCharactersForUser,
  setCharacterAvatarForUser,
  updateAbilityScoresForUser,
  updateCharacterForUser,
  updateHitPointsForUser,
} from '../services/character.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_URL_REGEX = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/;

// Controller maps HTTP request/response; service handles business and persistence rules.
export const getAllCharacters = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const query = req.validated?.query ?? req.query;
  const normalizedQuery = {
    ...query,
    includeMeta: query.includeMeta === true || req.path === '/',
  };
  const result = await listCharactersForUser(userId, normalizedQuery);

  if (result.legacyData) {
    return res.status(200).json(result.legacyData);
  }

  return res.status(200).json(result);
});

export const createCharacter = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const payload = req.validated?.body ?? req.body;
  const savedCharacter = await createCharacterForUser(userId, payload);
  return res.status(201).json(savedCharacter);
});

async function saveAvatarFromDataUrl(dataUrl, characterId) {
  const match = DATA_URL_REGEX.exec(dataUrl || '');

  if (!match) {
    throw new Error('Avatar must be a PNG, JPEG, or WEBP base64 data URL.');
  }

  const [, format, base64] = match;
  const extension = format === 'jpeg' || format === 'jpg' ? 'jpg' : format;
  const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
  const filename = `${characterId}-${Date.now()}.${extension}`;
  const outputPath = path.join(uploadsDir, filename);
  const imageBuffer = Buffer.from(base64, 'base64');

  // Keep avatar payloads small to avoid oversized session-era requests.
  if (imageBuffer.length > 5 * 1024 * 1024) {
    throw new Error('Avatar image is too large. Max size is 5MB.');
  }

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(outputPath, imageBuffer);

  return `/uploads/avatars/${filename}`;
}

async function removeOldAvatar(oldUrl) {
  if (!oldUrl || typeof oldUrl !== 'string' || !oldUrl.startsWith('/uploads/avatars/')) {
    return;
  }

  const oldPath = path.join(process.cwd(), oldUrl.replace(/^\//, ''));

  try {
    await fs.unlink(oldPath);
  } catch {
    // Ignore missing files to keep avatar updates resilient.
  }
}

export const uploadCharacterAvatar = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const characterId = req.params.id;
  const avatarDataUrl = req.body?.avatarDataUrl;

  if (!avatarDataUrl) {
    return res.status(400).json({ message: 'avatarDataUrl is required.' });
  }

  const character = await getCharacterForUser(userId, characterId);
  const newAvatarUrl = await saveAvatarFromDataUrl(avatarDataUrl, characterId);
  const updatedCharacter = await setCharacterAvatarForUser(
    userId,
    characterId,
    newAvatarUrl,
  );

  await removeOldAvatar(character.avatarUrl);

  return res.status(200).json({
    avatarUrl: updatedCharacter.avatarUrl,
    character: updatedCharacter,
  });
});

export const updateCharacterAbilityScores = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const characterId = req.params.id;
  const abilityScores = req.body?.abilityScores;

  const updatedCharacter = await updateAbilityScoresForUser(
    userId,
    characterId,
    abilityScores,
  );

  return res.status(200).json({
    character: updatedCharacter,
  });
});

export const deleteCharacter = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const characterId = req.params.id;

  const deletedCharacter = await deleteCharacterForUser(userId, characterId);
  await removeOldAvatar(deletedCharacter.avatarUrl);

  return res.status(200).json({
    ok: true,
    deletedId: deletedCharacter._id,
  });
});

export const updateCharacterHitPoints = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const characterId = req.params.id;
  const hitPoints = req.body?.hitPoints;

  if (!hitPoints || typeof hitPoints !== 'object') {
    return res.status(400).json({ message: 'hitPoints payload is required.' });
  }

  const updatedCharacter = await updateHitPointsForUser(userId, characterId, hitPoints);

  return res.status(200).json({ character: updatedCharacter });
});

export const updateCharacter = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const characterId = req.params.id;
  const payload = req.body;

  const updatedCharacter = await updateCharacterForUser(userId, characterId, payload);

  return res.status(200).json({ character: updatedCharacter });
});
