import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir, writeFile } from 'fs/promises';

const API_ORIGIN = 'https://www.dnd5eapi.co';
const EQUIPMENT_PATH = '/api/2014/equipment';
const MAGIC_ITEMS_PATH = '/api/2014/magic-items';
const DEFAULT_CONCURRENCY = 8;
const DEFAULT_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 20000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EQUIPMENT_OUTPUT_DIR = path.resolve(__dirname, '../db-seeding/equipment');

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

function sanitizeReferenceValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeReferenceValue(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const cleaned = {};

  for (const [rawKey, rawVal] of Object.entries(value)) {
    if (rawKey === 'url') {
      continue;
    }

    const nextKey = rawKey === 'index' ? 'key' : rawKey;
    if (Object.prototype.hasOwnProperty.call(cleaned, nextKey)) {
      continue;
    }

    if (rawKey === 'index') {
      const normalizedIndex = String(rawVal ?? '').replace(/-/g, '_');
      cleaned[nextKey] = normalizedIndex;
      continue;
    }

    cleaned[nextKey] = sanitizeReferenceValue(rawVal);
  }

  return cleaned;
}

function sortByName(items) {
  return [...items].sort((a, b) => {
    const aName = String(a?.name ?? '');
    const bName = String(b?.name ?? '');
    return aName.localeCompare(bName);
  });
}

async function fetchAllReferenceDetails(listPath, concurrency) {
  const listPayload = await fetchJsonWithRetry(toAbsoluteUrl(listPath));
  const results = Array.isArray(listPayload?.results) ? listPayload.results : [];

  const detailDescriptors = results
    .map((item) => normalizePath(item?.url))
    .filter(Boolean);

  const entries = await mapWithConcurrency(
    detailDescriptors,
    concurrency,
    async (detailPath) => {
      const rawItem = await fetchJsonWithRetry(toAbsoluteUrl(detailPath));
      return sanitizeReferenceValue(rawItem);
    },
  );

  return sortByName(entries);
}

async function writeReferenceFiles(equipment, magicItems) {
  await mkdir(EQUIPMENT_OUTPUT_DIR, { recursive: true });

  const equipmentPath = path.join(EQUIPMENT_OUTPUT_DIR, 'equipment.json');
  const magicItemsPath = path.join(EQUIPMENT_OUTPUT_DIR, 'magic-items.json');

  await writeFile(equipmentPath, `${JSON.stringify(equipment, null, 2)}\n`, 'utf8');
  await writeFile(magicItemsPath, `${JSON.stringify(magicItems, null, 2)}\n`, 'utf8');
}

function parseArgs(argv) {
  const options = {
    concurrency: DEFAULT_CONCURRENCY,
  };

  for (const arg of argv) {
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
  const { concurrency } = parseArgs(process.argv.slice(2));

  console.log('Fetching equipment index...');
  const equipment = await fetchAllReferenceDetails(EQUIPMENT_PATH, concurrency);

  console.log('Fetching magic items index...');
  const magicItems = await fetchAllReferenceDetails(MAGIC_ITEMS_PATH, concurrency);

  console.log(`Fetched ${equipment.length} equipment entries.`);
  console.log(`Fetched ${magicItems.length} magic item entries.`);

  await writeReferenceFiles(equipment, magicItems);

  console.log('Reference sync complete.');
  console.log(`Output directory: ${EQUIPMENT_OUTPUT_DIR}`);
  console.log('Files written: equipment.json, magic-items.json');
}

run().catch((error) => {
  console.error('5e sync failed:', error);
  process.exit(1);
});
