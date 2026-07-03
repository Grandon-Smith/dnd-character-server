import { setupPassport } from '../config/passport-config.js';

// Auth middleware for protecting routes
export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  // If not authenticated, send a 401 response
  return res.status(401).json({
    message: 'Access denied. Please log in.',
  });
}

export { setupPassport };
