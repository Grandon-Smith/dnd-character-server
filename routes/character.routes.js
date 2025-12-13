import express from "express";
const router = express.Router();

import { isAuthenticated } from "../app.js";
import {
  createCharacter,
  getAllCharacters,
} from "../controllers/character.controller.js";

router.get("/get-all", isAuthenticated, getAllCharacters);
router.post("/create", isAuthenticated, createCharacter);

export default router;
