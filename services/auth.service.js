import bcrypt from 'bcrypt';
import env from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import {
  createUser,
  findUserByEmail,
  findUserByEmailAndUsername,
  updateUserPasswordById,
} from '../repositories/user.repository.js';

// Prevent leaking internal fields (password hash, mongo internals) to API clients.
export function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
  };
}

export async function registerUser({ email, password, username }) {
  // Service layer owns business rules; controller only handles HTTP mapping.
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new AppError('That email is already in use.', 409);
  }

  const hash = await bcrypt.hash(password, env.saltRounds);
  const user = await createUser({
    email,
    password: hash,
    username,
  });

  return sanitizeUser(user);
}

export async function verifyForgotPasswordIdentity({ email, username }) {
  const user = await findUserByEmailAndUsername(email, username);

  if (!user) {
    throw new AppError('No matching account found for that email and username.', 404);
  }

  return sanitizeUser(user);
}

export async function resetForgotPassword({ email, username, newPassword }) {
  const user = await findUserByEmailAndUsername(email, username);

  if (!user) {
    throw new AppError('No matching account found for that email and username.', 404);
  }

  const hash = await bcrypt.hash(newPassword, env.saltRounds);
  await updateUserPasswordById(user.id, hash);

  return { ok: true };
}
