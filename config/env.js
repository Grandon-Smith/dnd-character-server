import dotenv from 'dotenv';

dotenv.config();

function getEnvVar(name, fallback) {
  const value = process.env[name];
  return value ?? fallback;
}

function getRequiredInProductionEnvVar(name, fallback, isProduction) {
  const value = getEnvVar(name, fallback);

  if (!value && isProduction) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseNumber(value, fallback) {
  const parsed = Number(value ?? fallback);

  if (Number.isNaN(parsed)) {
    throw new Error(`Expected a number but received: ${value}`);
  }

  return parsed;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';

const env = {
  nodeEnv,
  isProduction,
  port: parseNumber(process.env.PORT, 3000),
  mongodbUri: getRequiredInProductionEnvVar(
    'MONGODB_URI',
    'mongodb://127.0.0.1:27017/character-builder',
    isProduction,
  ),
  sessionSecret: getRequiredInProductionEnvVar(
    'SESSION_SECRET',
    'dev-session-secret-change-me',
    isProduction,
  ),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  sessionMaxAgeMs: parseNumber(process.env.SESSION_MAX_AGE_MS, 86400000),
  saltRounds: parseNumber(process.env.SALT_ROUNDS, 10),
};

export default Object.freeze(env);
