import mongoose from 'mongoose';
import env from '../config/env.js';
import { connectToDb, disconnectFromDb } from '../db.js';
import fs from 'fs/promises';
import path from 'path';

async function seedTraits() {
  try {
    await connectToDb();
    console.log('Connected to MongoDB...');

    const traitsPath = path.resolve(process.cwd(), 'server/db-seeding/racial-traits/traits.json');
    const traitsData = JSON.parse(await fs.readFile(traitsPath, 'utf8'));

    console.log(`Seeding ${traitsData.length} traits into "reference_traits" collection...`);

    // Clear existing data to ensure a clean seed
    const deleteResult = await mongoose.connection.db.collection('reference_traits').deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing records.`);

    // Insert new data
    const insertResult = await mongoose.connection.db.collection('reference_traits').insertMany(traitsData);
    console.log(`Successfully inserted ${insertResult.insertedCount} records.`);

    await disconnectFromDb();
    console.log('Seeding complete.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedTraits();
