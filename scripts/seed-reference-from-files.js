import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { connectToDb, disconnectFromDb } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_SEEDING_DIR = path.resolve(__dirname, "..", "db-seeding");

// Maps a seed folder directly to its target collection.
function folderToCollectionName(folderName) {
  return `reference_${folderName}`;
}

// Recursively sorts object keys so deep equality checks are stable across key order.
function stableObject(value) {
  if (Array.isArray(value)) {
    return value.map(stableObject);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableObject(value[key]);
        return acc;
      }, {});
  }

  return value;
}

// Compares documents while ignoring Mongo-generated fields.
function documentsMatch(existingDoc, incomingDoc) {
  if (!existingDoc) {
    return false;
  }

  const existingPlain = stableObject(
    existingDoc.toObject ? existingDoc.toObject() : existingDoc,
  );
  const incomingPlain = stableObject(incomingDoc);

  delete existingPlain._id;
  delete existingPlain.__v;

  return JSON.stringify(existingPlain) === JSON.stringify(incomingPlain);
}

// Reads and parses a JSON file.
async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

// Loads all JSON docs in a folder and normalizes file-shape differences.
async function readFolderJsonFiles(folderName) {
  const folderPath = path.join(DB_SEEDING_DIR, folderName);
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const jsonFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  const docs = [];

  for (const fileName of jsonFiles) {
    const filePath = path.join(folderPath, fileName);
    const parsed = await readJsonFile(filePath);

    if (Array.isArray(parsed)) {
      docs.push(...parsed);
      continue;
    }

    // Subclasses files are wrapped by classKey and subclasses array.
    if (parsed && Array.isArray(parsed.subclasses)) {
      docs.push(...parsed.subclasses);
      continue;
    }

    docs.push(parsed);
  }

  return docs;
}

// Upserts all docs by key and returns a summary for reporting.
async function upsertByKey(collectionName, documents) {
  const collection = mongoose.connection.db.collection(collectionName);

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;

  for (const doc of documents) {
    if (!doc || typeof doc !== "object" || !doc.key) {
      throw new Error(
        `Collection ${collectionName} contains a document without a key.`,
      );
    }

    const existing = await collection.findOne({ key: doc.key });

    if (!existing) {
      await collection.insertOne(doc);
      inserted += 1;
      continue;
    }

    if (documentsMatch(existing, doc)) {
      unchanged += 1;
      continue;
    }

    await collection.updateOne(
      { key: doc.key },
      {
        $set: doc,
      },
    );
    updated += 1;
  }

  return {
    inserted,
    updated,
    unchanged,
    total: documents.length,
  };
}

// Seed task for backgrounds.
async function seedBackgrounds() {
  const folderName = "backgrounds";
  const collectionName = folderToCollectionName(folderName);
  const docs = await readFolderJsonFiles(folderName);
  return upsertByKey(collectionName, docs);
}

// Seed task for class features.
async function seedClassFeatures() {
  const folderName = "class_features";
  const collectionName = folderToCollectionName(folderName);
  const docs = await readFolderJsonFiles(folderName);
  return upsertByKey(collectionName, docs);
}

// Seed task for classes.
async function seedClasses() {
  const folderName = "classes";
  const collectionName = folderToCollectionName(folderName);
  const docs = await readFolderJsonFiles(folderName);
  return upsertByKey(collectionName, docs);
}

// Seed task for feats.
async function seedFeats() {
  const folderName = "feats";
  const collectionName = folderToCollectionName(folderName);
  const docs = await readFolderJsonFiles(folderName);
  return upsertByKey(collectionName, docs);
}

// Seed task for races.
async function seedRaces() {
  const folderName = "races";
  const collectionName = folderToCollectionName(folderName);
  const docs = await readFolderJsonFiles(folderName);
  return upsertByKey(collectionName, docs);
}

// Seed task for racial traits.
async function seedRacialTraits() {
  const folderName = "racial_traits";
  const collectionName = folderToCollectionName(folderName);
  const docs = await readFolderJsonFiles(folderName);
  return upsertByKey(collectionName, docs);
}

// Seed task for subclasses.
async function seedSubclasses() {
  const folderName = "subclasses";
  const collectionName = folderToCollectionName(folderName);
  const docs = await readFolderJsonFiles(folderName);
  return upsertByKey(collectionName, docs);
}

const SEED_TASKS = [
  { name: "backgrounds", run: seedBackgrounds },
  { name: "class_features", run: seedClassFeatures },
  { name: "classes", run: seedClasses },
  { name: "feats", run: seedFeats },
  { name: "races", run: seedRaces },
  { name: "racial_traits", run: seedRacialTraits },
  { name: "subclasses", run: seedSubclasses },
];

// Parses an optional folder flag from CLI or npm_config_* vars.
function parseSeedFolderArg(argv) {
  const allowed = new Set(SEED_TASKS.map((task) => task.name));
  const argvFlags = argv
    .filter((arg) => arg.startsWith("-") && arg.length > 1)
    .map((arg) => (arg.startsWith("--") ? arg.slice(2) : arg.slice(1)).trim())
    .filter(Boolean);

  const envFlags = Array.from(allowed).filter((folderName) => {
    const npmConfigKey = `npm_config_${folderName}`;
    const raw = process.env[npmConfigKey];

    if (typeof raw === "undefined") {
      return false;
    }

    const normalized = String(raw).toLowerCase();
    return normalized !== "false" && normalized !== "0" && normalized !== "";
  });

  const selectedFlags = [...new Set([...argvFlags, ...envFlags])];

  if (selectedFlags.length === 0) {
    return null;
  }

  if (selectedFlags.length > 1) {
    throw new Error(
      `Only one folder flag is supported. Received: ${selectedFlags.join(", ")}`,
    );
  }

  const folderName = selectedFlags[0];

  if (!allowed.has(folderName)) {
    throw new Error(
      `Unknown folder flag -${folderName}. Allowed: ${Array.from(allowed).join(", ")}`,
    );
  }

  return folderName;
}

// Creates a lightweight terminal spinner while async work is running.
function createSpinner(message) {
  const frames = ["|", "/", "-", "\\"];
  let index = 0;
  let timer = null;

  return {
    start() {
      if (timer) {
        return;
      }

      process.stdout.write(`${message} ${frames[index]}`);
      timer = setInterval(() => {
        index = (index + 1) % frames.length;
        process.stdout.write(`\r${message} ${frames[index]}`);
      }, 100);
    },
    stop(finalMessage) {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }

      process.stdout.write(`\r${finalMessage}\n`);
    },
  };
}

// Runs all seed tasks and returns a summary keyed by folder name.
async function seedAllReferenceData() {
  const summary = {};

  for (const task of SEED_TASKS) {
    const result = await task.run();
    summary[task.name] = result;
    console.log(
      `[${task.name}] total=${result.total}, inserted=${result.inserted}, updated=${result.updated}, unchanged=${result.unchanged}`,
    );
  }

  return summary;
}

// Runs one seed task by folder name and returns a summary.
async function seedSingleReferenceFolder(folderName) {
  const task = SEED_TASKS.find((candidate) => candidate.name === folderName);

  if (!task) {
    throw new Error(`No seeding task found for folder: ${folderName}`);
  }

  const result = await task.run();
  console.log(
    `[${task.name}] total=${result.total}, inserted=${result.inserted}, updated=${result.updated}, unchanged=${result.unchanged}`,
  );

  return {
    [task.name]: result,
  };
}

// Main script flow: parse flags, connect, seed, print summary, disconnect.
async function run() {
  const selectedFolder = parseSeedFolderArg(process.argv.slice(2));
  const spinnerMessage = selectedFolder
    ? `Seeding ${selectedFolder}`
    : "Seeding reference folders";
  const spinner = createSpinner(spinnerMessage);

  await connectToDb();
  spinner.start();

  try {
    const summary = selectedFolder
      ? await seedSingleReferenceFolder(selectedFolder)
      : await seedAllReferenceData();

    spinner.stop("Seeding complete.");
    console.log("Reference data seeding complete.");
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    spinner.stop("Seeding failed.");
    throw error;
  } finally {
    await disconnectFromDb();
  }
}

run().catch((error) => {
  console.error("Failed to seed reference data from files:", error);
  process.exit(1);
});
