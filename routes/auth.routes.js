import express from "express";
const router = express.Router();

import { isAuthenticated } from "../utils/passport.js";
import {
  newUserHandler,
  loginHandler,
  logoutHandler,
  profileHandler,
  getCurrentUser,
} from "../controllers/auth.controllers.js";

router.post("/new-user", newUserHandler);
router.post("/login", loginHandler);
router.post("/logout", logoutHandler);
router.get("/profile", isAuthenticated, profileHandler);
router.get("/current-user", getCurrentUser);

export default router;
