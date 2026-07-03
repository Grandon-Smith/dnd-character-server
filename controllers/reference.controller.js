import ReferenceClass from '../models/ReferenceClass.js';
import ReferenceFeat from '../models/ReferenceFeat.js';
import ReferenceRace from '../models/ReferenceRace.js';
import ReferenceSkill from '../models/ReferenceSkill.js';
import { asyncHandler } from '../utils/async-handler.js';
import mongoose from 'mongoose';

async function getCollectionData(collectionName) {
  return mongoose.connection
    .collection(collectionName)
    .find({})
    .sort({ name: 1 })
    .toArray();
}

// Reference endpoints are public read-only content used by both server and client rules.
export const getReferenceClasses = asyncHandler(async (_req, res) => {
  const classes = await ReferenceClass.find({}).sort({ name: 1 }).lean();
  return res.status(200).json({ data: classes });
});

export const getReferenceRaces = asyncHandler(async (_req, res) => {
  const races = await ReferenceRace.find({}).sort({ name: 1 }).lean();
  return res.status(200).json({ data: races });
});

export const getReferenceSkills = asyncHandler(async (_req, res) => {
  const skills = await ReferenceSkill.find({}).sort({ name: 1 }).lean();
  return res.status(200).json({ data: skills });
});

export const getReferenceFeats = asyncHandler(async (_req, res) => {
  const feats = await ReferenceFeat.find({}).sort({ name: 1 }).lean();
  return res.status(200).json({ data: feats });
});

export const getReferenceEquipment = asyncHandler(async (_req, res) => {
  const equipment = await getCollectionData('reference_equipment');
  return res.status(200).json({ data: equipment });
});

export const getReferenceMagicItems = asyncHandler(async (_req, res) => {
  const magicItems = await getCollectionData('reference_magic-items');
  return res.status(200).json({ data: magicItems });
});

export const getReferenceBootstrap = asyncHandler(async (_req, res) => {
  const [classes, races, skills, feats, equipment, magicItems] = await Promise.all([
    ReferenceClass.find({}).sort({ name: 1 }).lean(),
    ReferenceRace.find({}).sort({ name: 1 }).lean(),
    ReferenceSkill.find({}).sort({ name: 1 }).lean(),
    ReferenceFeat.find({}).sort({ name: 1 }).lean(),
    getCollectionData('reference_equipment'),
    getCollectionData('reference_magic-items'),
  ]);

  return res.status(200).json({
    data: {
      classes,
      races,
      skills,
      feats,
      equipment,
      magicItems,
    },
  });
});
