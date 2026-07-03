import express from 'express';
import {
  getReferenceBootstrap,
  getReferenceClasses,
  getReferenceEquipment,
  getReferenceFeats,
  getReferenceMagicItems,
  getReferenceRaces,
  getReferenceSkills,
} from '../controllers/reference.controller.js';

const router = express.Router();

router.get('/bootstrap', getReferenceBootstrap);
router.get('/classes', getReferenceClasses);
router.get('/races', getReferenceRaces);
router.get('/skills', getReferenceSkills);
router.get('/feats', getReferenceFeats);
router.get('/equipment', getReferenceEquipment);
router.get('/magic-items', getReferenceMagicItems);

export default router;
