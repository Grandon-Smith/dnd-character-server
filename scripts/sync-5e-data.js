import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir, writeFile } from 'fs/promises';

const API_ORIGIN = 'https://www.dnd5eapi.co';
const SPELLS_PATH = '/api/2014/spells';
const DEFAULT_CONCURRENCY = 8;
const DEFAULT_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 20000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SPELLS_OUTPUT_DIR = path.resolve(__dirname, '../db-seeding/spells');

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

function sanitizeSpellValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeSpellValue(item));
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

    cleaned[nextKey] = sanitizeSpellValue(rawVal);
  }

  return cleaned;
}

function normalizeSpellLevel(levelValue) {
  const level = Number(levelValue);
  if (!Number.isInteger(level) || level < 0 || level > 9) {
    return null;
  }

  return level;
}

async function fetchAllSpellDetails(concurrency) {
  const listPayload = await fetchJsonWithRetry(toAbsoluteUrl(SPELLS_PATH));
  const results = Array.isArray(listPayload?.results) ? listPayload.results : [];

  const detailDescriptors = results
    .map((item) => normalizePath(item?.url))
    .filter(Boolean);

  const spells = await mapWithConcurrency(
    detailDescriptors,
    concurrency,
    async (spellPath) => {
      const rawSpell = await fetchJsonWithRetry(toAbsoluteUrl(spellPath));
      return sanitizeSpellValue(rawSpell);
    },
  );

  return spells;
}

function groupSpellsByLevel(spells) {
  const grouped = Array.from({ length: 10 }, () => []);

  for (const spell of spells) {
    const level = normalizeSpellLevel(spell?.level);
    if (level === null) {
      continue;
    }

    grouped[level].push(spell);
  }

  for (const levelSpells of grouped) {
    levelSpells.sort((a, b) => {
      const aName = String(a?.name ?? '');
      const bName = String(b?.name ?? '');
      return aName.localeCompare(bName);
    });
  }

  return grouped;
}

async function writeSpellFiles(groupedSpells) {
  await mkdir(SPELLS_OUTPUT_DIR, { recursive: true });

  for (let level = 0; level <= 9; level += 1) {
    const fileName = `level-${level}.json`;
    const filePath = path.join(SPELLS_OUTPUT_DIR, fileName);
    const payload = JSON.stringify(groupedSpells[level], null, 2);
    await writeFile(filePath, `${payload}\n`, 'utf8');
  }
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

  console.log('Fetching spell index...');
  const spells = await fetchAllSpellDetails(concurrency);

  console.log(`Fetched ${spells.length} spells.`);

  const groupedSpells = groupSpellsByLevel(spells);
  await writeSpellFiles(groupedSpells);

  const countsByLevel = groupedSpells.map((levelSpells, level) => {
    return `level-${level}: ${levelSpells.length}`;
  });

  console.log('Spell sync complete.');
  console.log(`Output directory: ${SPELLS_OUTPUT_DIR}`);
  console.log(`Files written: ${countsByLevel.join(', ')}`);
}

run().catch((error) => {
  console.error('5e sync failed:', error);
  process.exit(1);
});
