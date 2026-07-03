import express from 'express';
const router = express.Router();

import { isAuthenticated } from '../utils/passport.js';
import { validateRequest } from '../middleware/validate-request.js';
import {
  validateForgotPasswordIdentityBody,
  validateForgotPasswordResetBody,
  validateLoginBody,
  validateRegisterBody,
} from '../middleware/validators/auth.validators.js';
import {
  resetForgotPasswordHandler,
  newUserHandler,
  loginHandler,
  logoutHandler,
  profileHandler,
  getCurrentUser,
  verifyForgotPasswordIdentityHandler,
} from '../controllers/auth.controllers.js';

// Existing endpoints preserved for client compatibility.
// validateRequest runs before the controller and attaches normalized values to req.validated.
router.post('/new-user', validateRequest({ body: validateRegisterBody }), newUserHandler);
router.post('/login', validateRequest({ body: validateLoginBody }), loginHandler);
router.post('/logout', logoutHandler);
router.post(
  '/forgot-password/verify',
  validateRequest({ body: validateForgotPasswordIdentityBody }),
  verifyForgotPasswordIdentityHandler,
);
router.post(
  '/forgot-password/reset',
  validateRequest({ body: validateForgotPasswordResetBody }),
  resetForgotPasswordHandler,
);
router.get('/profile', isAuthenticated, profileHandler);
router.get('/current-user', getCurrentUser);

// REST-style aliases for future endpoint expansion.
// Aliases let new clients adopt resource-style paths without breaking old ones.
router.post('/register', validateRequest({ body: validateRegisterBody }), newUserHandler);
router.post('/session', validateRequest({ body: validateLoginBody }), loginHandler);
router.delete('/session', logoutHandler);
router.get('/me', isAuthenticated, profileHandler);

export default router;
