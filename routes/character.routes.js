import express from 'express';
const router = express.Router();

import { isAuthenticated } from '../utils/passport.js';
import { validateRequest } from '../middleware/validate-request.js';
import {
  validateCharacterQuery,
  validateCreateCharacterBody,
} from '../middleware/validators/character.validators.js';
import {
  createCharacter,
  deleteCharacter,
  getAllCharacters,
  updateCharacter,
  updateCharacterAbilityScores,
  updateCharacterHitPoints,
  uploadCharacterAvatar,
} from '../controllers/character.controller.js';

// Existing endpoints preserved for client compatibility.
// Request flow: auth check -> input validation/normalization -> controller.
router.get(
  '/get-all',
  isAuthenticated,
  validateRequest({ query: validateCharacterQuery }),
  getAllCharacters,
);
router.post(
  '/create',
  isAuthenticated,
  validateRequest({ body: validateCreateCharacterBody }),
  createCharacter,
);
router.post('/:id/avatar', isAuthenticated, uploadCharacterAvatar);
router.patch('/:id', isAuthenticated, updateCharacter);
router.patch('/:id/ability-scores', isAuthenticated, updateCharacterAbilityScores);
router.patch('/:id/hit-points', isAuthenticated, updateCharacterHitPoints);
router.delete('/:id', isAuthenticated, deleteCharacter);

// REST-style aliases for future endpoint expansion.
router.get(
  '/',
  isAuthenticated,
  validateRequest({ query: validateCharacterQuery }),
  getAllCharacters,
);
router.post(
  '/',
  isAuthenticated,
  validateRequest({ body: validateCreateCharacterBody }),
  createCharacter,
);

export default router;
