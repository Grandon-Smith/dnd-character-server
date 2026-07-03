import dotenv from 'dotenv';

dotenv.config();

function getRequiredEnvVar(name) {
  const value = process.env[name];

  if (!value) {
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

const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: parseNumber(process.env.PORT, 3000),
  mongodbUri: getRequiredEnvVar('MONGODB_URI'),
  sessionSecret: getRequiredEnvVar('SESSION_SECRET'),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  sessionMaxAgeMs: parseNumber(process.env.SESSION_MAX_AGE_MS, 86400000),
  saltRounds: parseNumber(process.env.SALT_ROUNDS, 10),
};

export default Object.freeze(env);
