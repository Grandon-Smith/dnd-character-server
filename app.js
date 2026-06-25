import dotenv from "dotenv";
import express from "express";
import UserModel from "./models/User.js";
import CharacterModel from "./models/Character.js";
import SpellModel from "./models/Spell.js";
import passport from "passport";
import cors from "cors";
import bcrypt from "bcrypt";
import { setupPassport, isAuthenticated } from "./utils/passport.js";

// Auth middleware for protecting server routes - imported from ./utils/passport.js
import { connectToDb } from "./db.js";
import session from "express-session";

// Routes
import authRoutes from "./routes/auth.routes.js";
import characterRoutes from "./routes/character.routes.js";
dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();

// Initialize passport with the UserModel
setupPassport(UserModel);

app.use(cors({ credentials: true, origin: "http://localhost:5173" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false, // Prevents unnecessary saving if session data didn't change
    saveUninitialized: false, // Prevents creating sessions for unauthenticated requests
    cookie: {
      secure: false, // Must be false for HTTP
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

//db connection
connectToDb("mongodb://0.0.0.0:27017/character-builder");

app.post("/api/test/user", isAuthenticated, (req, res) => {
  try {
    // The authenticated user object is available here as req.user
    res.send({ user: req.user });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/character", characterRoutes);

app.listen(PORT, () => console.log("listening on port...", PORT));
// app.use((req, res, next) => {
//   // Log the entire session object on every request
//   // On a subsequent request, req.session should contain data from the previous request
//   console.log("--- Current Request Session Data ---", req.session);
//   next();
// });

//  SPELL SCRAPER CODE TO BE WORKED ON!------------------------------->
// const BASE_URL = "https://www.dnd5eapi.co";

// async function connectDB() {
// 	await mongoose.connect(process.env.MONGO_URI, {
// 		useNewUrlParser: true,

// 		useUnifiedTopology: true,
// 	});

// 	console.log("🗃️ Connected to MongoDB");
// }

// async function fetchAndStoreSpells() {
//   console.log('fetching stuff')
// 	try {
//     const listResponse = await fetch(`${BASE_URL}/api/2014/spells`);
// 		const spellList = listResponse.data.results;
// 		for (const spell of spellList) {
// 			const detailResponse = await fetch(
// 				`${BASE_URL}${spell.url}`
// 			);
// 			const spellData = detailResponse.data;
// 			await SpellModel.findOneAndUpdate(
// 				{ index: spellData.index },
// 				spellData,
// 				{ upsert: true, new: true }
// 			);
// 			console.log(`✅ Saved: ${spellData.name}`);
// 		}
// 	} catch (err) {
// 		console.error("❌ Error fetching spells:", err.message);
// 	}
// }

// (async () => {
// 	await connectDB();
// 	await fetchAndStoreSpells();
// 	mongoose.disconnect();
// })();

// (async () => {
//   await connectDB();
//   await fetchAndStoreSpells();
//   mongoose.disconnect();
// })();
