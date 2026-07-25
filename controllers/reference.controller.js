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
  const classes = await getCollectionData('reference_classes');
  return res.status(200).json({ data: classes });
});

export const getReferenceRaces = asyncHandler(async (_req, res) => {
  const races = await getCollectionData('reference_races');
  return res.status(200).json({ data: races });
});

export const getReferenceSkills = asyncHandler(async (_req, res) => {
  const skills = await getCollectionData('reference_skills');
  return res.status(200).json({ data: skills });
});

export const getReferenceFeats = asyncHandler(async (_req, res) => {
  const feats = await getCollectionData('reference_feats');
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
    getCollectionData('reference_classes'),
    getCollectionData('reference_races'),
    getCollectionData('reference_skills'),
    getCollectionData('reference_feats'),
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
