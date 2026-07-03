import passport from 'passport';
import {
  registerUser,
  resetForgotPassword,
  sanitizeUser,
  verifyForgotPasswordIdentity,
} from '../services/auth.service.js';
import { asyncHandler } from '../utils/async-handler.js';

// Registration uses pre-validated input when available, then delegates rules to service.
export const newUserHandler = asyncHandler(async (req, res) => {
  const payload = req.validated?.body ?? req.body;
  const user = await registerUser(payload);

  return res.status(201).json({
    error: false,
    ok: true,
    data: user,
  });
});

export const loginHandler = async (req, res, next) => {
  // Keep passport local strategy input normalized through route validators.
  if (req.validated?.body) {
    req.body.email = req.validated.body.email;
    req.body.password = req.validated.body.password;
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        ok: false,
        message: info?.message || 'Invalid credentials',
      });
    }

    req.login(user, (err) => {
      if (err) return next(err);
      return res.status(200).json({
        ok: true,
        message: 'Login successful',
        user: sanitizeUser(user),
      });
    });
  })(req, res, next);
};

export const logoutHandler = (req, res) => {
  // Logout clears both passport user state and session cookie.
  req.logout((error) => {
    if (error) {
      return res
        .status(500)
        .json({ ok: false, message: error.message || 'Logout failed' });
    }

    if (!req.session) {
      res.clearCookie('connect.sid');
      return res.status(200).json({ ok: true, message: 'Logged out' });
    }

    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      return res.status(200).json({ ok: true, message: 'Logged out' });
    });
  });
};

export const profileHandler = async (req, res) => {
  return res.status(200).json({ user: req.user ? sanitizeUser(req.user) : null });
};

export const getCurrentUser = (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(200).json({
      authenticated: false,
      user: null,
    });
  }

  return res.status(200).json({
    authenticated: true,
    user: sanitizeUser(req.user),
  });
};

export const verifyForgotPasswordIdentityHandler = asyncHandler(async (req, res) => {
  const payload = req.validated?.body ?? req.body;
  const user = await verifyForgotPasswordIdentity(payload);

  return res.status(200).json({
    ok: true,
    user,
  });
});

export const resetForgotPasswordHandler = asyncHandler(async (req, res) => {
  const payload = req.validated?.body ?? req.body;
  await resetForgotPassword(payload);

  return res.status(200).json({
    ok: true,
    message: 'Password updated successfully.',
  });
});
