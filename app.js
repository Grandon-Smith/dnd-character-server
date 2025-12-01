import express, { json } from "express";
import bodyParser from "body-parser";
import UserModel from "./models/User.js";
import CharacterModel from "./models/Character.js";
import SpellModel from "./models/Spell.js";
import passport from "passport";
import passportlocal from "passport-local";
import cors from "cors";
import bcrypt from "bcrypt";
import { connectToDb } from "./db.js";
import session from "express-session";
import jwt from "jsonwebtoken";

const LocalStrategy = passportlocal.Strategy;
const SALTROUNDS = 10;
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(cors({ credentials: true, origin: "http://localhost:5173" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
	session({
		secret: "your_secret",
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: false,
		},
	})
);
app.use(passport.initialize());
app.use(passport.session());

//db connection
connectToDb("mongodb://0.0.0.0:27017/character-builder");

function decodeText(string) {
	// decode basic hash from the front end for extra security
	const dec = new TextDecoder();
	return dec.decode(
		Uint8Array.from(string.match(/../g), (point) =>
			parseInt(point, 16)
		)
	);
}

passport.use(
	new LocalStrategy(
		{
			usernameField: "email",
		},
		async (email, password, done) => {
			const user = await UserModel.findOne({ email: email });
			console.log("user", user);
			if (!user)
				return done(null, false, { message: "User not found" });
			const decodedPassword = decodeText(password);
			console.log(decodedPassword);
			if (!bcrypt.compareSync(decodedPassword, user.password))
				return done(null, false, { message: "Incorrect password" });
			return done(null, user);
		}
	)
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
	const user = await UserModel.findOne({ _id: id });
	done(null, user);
});

app.post("/api/auth/newUser", async (req, res) => {
	const { email, password, username } = req.body;
	const DECODEPASS = decodeText(password);

	const emailExists = await UserModel.findOne({
		email: email,
	}).exec();

	if (emailExists !== null) {
		return res.json({
			errorMsg: "That email is already in use.",
			error: true,
			ok: false,
			status: 400,
		});
	}

	await bcrypt.hash(DECODEPASS, SALTROUNDS).then((hash) => {
		const USERDATA = { email, password: hash, username };
		const User = new UserModel(USERDATA);

		User.save()
			.then((user) => {
				res.json({
					errorMsg: null,
					error: false,
					ok: true,
					status: 201,
					data: user,
				});
			})
			.catch((error) => {
				res.json({
					errorMsg: error,
					error: true,
					ok: false,
					status: 400,
				});
			});
	});
});

app.post("/api/auth/login", (req, res, next) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return res.json({
			errorMsg: "There was an error",
			error: true,
			ok: false,
			status: 500,
		});
	}

	passport.authenticate("local", (err, user, info) => {
		if (err) return next(err);
		if (!user) return res.status(401).json({ message: info.message });

		req.login(user, (err) => {
			if (err) return next(err);
			const token = jwt.sign(
				{ id: user.id, email: user.email },
				"jwt_secret",
				{
					expiresIn: "24h",
				}
			);
			res.json({
				message: "Login successful",
				token,
				user: {
					id: user.id,
					email: user.email,
					username: user.username,
				},
			});
		});
	})(req, res, next);
});

app.post("/api/auth/logout", (req, res) => {
	req.logout(() => res.json({ message: "Logged out" }));
});

app.get("/api/auth/profile", async (req, res) => {
	const user = await UserModel.findOne({
		email: "grandon.smith@yahoo.com",
	});
	res.send({ user });
});

app.post("/api/character/create", async (req, res) => {
	try {
		const characterData = req.body;

		// Basic validation (optional)
		if (
			!characterData.name ||
			!characterData.race ||
			!characterData.classes?.length
		) {
			return res
				.status(400)
				.json({ message: "Missing required fields." });
		}

		//find user based on id. NEED TO UPDATE FOR USE WITH JWT
		const user = await UserModel.findOne({
			email: "grandon.smith@yahoo.com",
		});

		// Attach real user ID instead of trusting client data
		characterData.player = user._id;

		// assign saving throws based on class chosen
		characterData.savingThrowProficiencies =
			CLASS_SAVING_THROWS[
				characterData.classes[0].name.toLowerCase()
			];
		// Save character
		const savedCharacter = await CharacterModel.create(characterData);

		return res.status(201).json(savedCharacter);
	} catch (err) {
		console.error("Error creating character:", err);
		return res
			.status(500)
			.json({ message: "Server error", error: err.message });
	}
});

app.get("/api/character/get-all", async (req, res) => {
	try {
		// Temporary hardcoded user until JWT is added
		const user = await UserModel.findOne({
			email: "grandon.smith@yahoo.com",
		});

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Find all characters that belong to this user
		const characters = await CharacterModel.find({
			player: user._id,
		});

		return res.status(200).json(characters);
	} catch (err) {
		console.error("Error fetching characters:", err);
		return res
			.status(500)
			.json({ message: "Server error", error: err.message });
	}
});

app.listen(PORT, () => console.log("listening on port...", PORT));

const CLASS_SAVING_THROWS = {
	barbarian: ["strength", "constitution"],
	bard: ["dexterity", "charisma"],
	cleric: ["wisdom", "charisma"],
	druid: ["intelligence", "wisdom"],
	fighter: ["strength", "constitution"],
	monk: ["strength", "dexterity"],
	paladin: ["wisdom", "charisma"],
	ranger: ["dexterity", "wisdom"],
	rogue: ["dexterity", "intelligence"],
	sorcerer: ["constitution", "charisma"],
	warlock: ["wisdom", "charisma"],
	wizard: ["intelligence", "wisdom"],
};

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
