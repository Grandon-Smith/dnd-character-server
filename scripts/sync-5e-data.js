import mongoose from 'mongoose';
import { connectToDb, disconnectFromDb } from '../db.js';

const API_ORIGIN = 'https://www.dnd5eapi.co';
const API_INDEX_PATH = '/api/2014';
const EXCLUDED_ENDPOINTS = new Set(['monsters', 'rules', 'rule-sections']);
const DEFAULT_CONCURRENCY = 8;
const DEFAULT_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 20000;

function normalizePath(apiPath) {
  if (!apiPath) return null;

  if (apiPath.startsWith('http://') || apiPath.startsWith('https://')) {
    const url = new URL(apiPath);
    return `${url.pathname}${url.search}`;
  }

  return apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
}

function toAbsoluteUrl(apiPath) {
  const normalized = normalizePath(apiPath);
  if (!normalized) {
    throw new Error(`Cannot build URL from empty path: ${apiPath}`);
  }

  return `${API_ORIGIN}${normalized}`;
}

function chunkArray(items, size) {
  const chunks = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

function createResourceKey(payload, fallbackPath, fallbackIndex) {
  const raw =
    payload?.index ??
    payload?.slug ??
    payload?.name ??
    fallbackIndex ??
    normalizePath(fallbackPath) ??
    'unknown';

  return String(raw).trim();
}

function endpointCollectionName(endpoint) {
  return `reference_${endpoint.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()}`;
}

async function fetchJsonWithRetry(url, retries = DEFAULT_RETRIES) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        const backoffMs = 250 * attempt;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error(`Failed to fetch ${url}: ${lastError?.message ?? 'Unknown error'}`);
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let current = 0;

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (current < items.length) {
        const itemIndex = current;
        current += 1;
        results[itemIndex] = await mapper(items[itemIndex], itemIndex);
      }
    },
  );

  await Promise.all(workers);
  return results;
}

async function upsertMany(collection, operations) {
  if (!operations.length) return;

  const chunks = chunkArray(operations, 200);

  for (const batch of chunks) {
    await collection.bulkWrite(batch, { ordered: false });
  }
}

async function ensureIndexes(collection) {
  await collection.createIndex(
    { index: 1 },
    { unique: true, sparse: true, name: 'index_unique' },
  );
  await collection.createIndex({ index: 1 }, { name: 'index_idx' });
  await collection.createIndex({ syncedAt: -1 }, { name: 'syncedAt_idx' });
}

async function collectionExists(collectionName) {
  const matches = await mongoose.connection.db
    .listCollections({ name: collectionName }, { nameOnly: true })
    .toArray();

  return matches.length > 0;
}

async function syncEndpoint({ endpoint, apiPath, concurrency }) {
  const collectionName = endpointCollectionName(endpoint);
  const collection = mongoose.connection.collection(collectionName);

  if (await collectionExists(collectionName)) {
    await collection.deleteMany({});
  }

  await ensureIndexes(collection);

  const endpointPath = normalizePath(apiPath);
  const endpointUrl = toAbsoluteUrl(endpointPath);

  const listPayload = await fetchJsonWithRetry(endpointUrl);
  const listCount = Array.isArray(listPayload?.results)
    ? listPayload.results.length
    : null;

  const operations = [];

  let detailSynced = 0;

  if (Array.isArray(listPayload?.results) && listPayload.results.length > 0) {
    const detailDescriptors = listPayload.results
      .map((item, idx) => ({ item, idx, path: normalizePath(item?.url) }))
      .filter((entry) => Boolean(entry.path));

    const detailDocs = await mapWithConcurrency(
      detailDescriptors,
      concurrency,
      async ({ item, idx, path }) => {
        const detailPayload = await fetchJsonWithRetry(toAbsoluteUrl(path));

        return {
          path,
          payload: detailPayload,
          key: createResourceKey(detailPayload, path, item?.index ?? String(idx)),
        };
      },
    );

    for (const detail of detailDocs) {
      const key = String(detail.key);
      const payload = { ...detail.payload };
      delete payload.url;

      operations.push({
        updateOne: {
          filter: {
            index: key,
          },
          update: {
            $set: {
              key,
              index: detail.payload?.index ?? key,
              name: detail.payload?.name ?? key,
              ...payload,
              syncedAt: new Date(),
            },
          },
          upsert: true,
        },
      });
    }

    detailSynced = detailDocs.length;
  } else {
    const key = createResourceKey(listPayload, endpointPath, endpoint);
    const payload = { ...listPayload };
    delete payload.url;

    operations.push({
      updateOne: {
        filter: {
          index: key,
        },
        update: {
          $set: {
            key,
            index: listPayload?.index ?? key,
            name: listPayload?.name ?? endpoint,
            ...payload,
            syncedAt: new Date(),
          },
        },
        upsert: true,
      },
    });
  }

  await upsertMany(collection, operations);

  return {
    endpoint,
    collection: collection.collectionName,
    listCount,
    detailSynced,
    totalUpserts: operations.length,
  };
}

function parseArgs(argv) {
  const options = {
    endpointAllowList: null,
    concurrency: DEFAULT_CONCURRENCY,
  };

  for (const arg of argv) {
    if (arg.startsWith('--endpoints=')) {
      const value = arg.replace('--endpoints=', '').trim();
      options.endpointAllowList = value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
      continue;
    }

    if (arg.startsWith('--concurrency=')) {
      const value = Number(arg.replace('--concurrency=', '').trim());
      if (!Number.isNaN(value) && value > 0) {
        options.concurrency = Math.floor(value);
      }
    }
  }

  return options;
}

async function run() {
  const { endpointAllowList, concurrency } = parseArgs(process.argv.slice(2));

  await connectToDb();

  try {
    const indexPayload = await fetchJsonWithRetry(toAbsoluteUrl(API_INDEX_PATH));
    const entries = Object.entries(indexPayload).filter(([endpoint]) => {
      if (EXCLUDED_ENDPOINTS.has(endpoint)) return false;
      if (!endpointAllowList) return true;
      return endpointAllowList.includes(endpoint);
    });

    if (!entries.length) {
      console.log('No endpoints selected for sync.');
      return;
    }

    console.log(`Selected endpoints: ${entries.map(([name]) => name).join(', ')}`);

    const summary = [];

    for (const [endpoint, apiPath] of entries) {
      console.log(`\nSyncing endpoint: ${endpoint}`);
      const result = await syncEndpoint({
        endpoint,
        apiPath,
        concurrency,
      });
      summary.push(result);
      console.log(
        `Completed ${endpoint} -> ${result.collection}: upserts=${result.totalUpserts}, detailRecords=${result.detailSynced}, listed=${result.listCount ?? 'n/a'}`,
      );
    }

    const totals = summary.reduce(
      (acc, item) => {
        acc.upserts += item.totalUpserts;
        acc.details += item.detailSynced;
        return acc;
      },
      { upserts: 0, details: 0 },
    );

    console.log('\nSync complete.');
    console.log(`Endpoints synced: ${summary.length}`);
    console.log(`Detail records synced: ${totals.details}`);
    console.log(`Total upserts: ${totals.upserts}`);
    console.log(
      `Collections created/updated: ${summary.map((item) => item.collection).join(', ')}`,
    );
  } finally {
    await disconnectFromDb();
  }
}

run().catch((error) => {
  console.error('5e sync failed:', error);
  process.exit(1);
});
