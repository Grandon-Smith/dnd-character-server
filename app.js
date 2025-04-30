import express, { json } from "express";
import bodyParser from "body-parser";
import UserModel from "./models/User.js";
import CharacterModel from "./models/Character.js";
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
// const CORS_OPTIONS = {
// 	origin: ["http://localhost:5713"],
// 	credentials: true,
// 	optionsSuccessStatus: 200,
// };

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
				user: { id: user.id, email: user.email },
			});
		});
	})(req, res, next);
});

app.post("/api/character/create", async (req, res) => {
	try {
		const characterData = req.body;

		// Optional: Validate required fields manually if needed
		if (
			!characterData.name ||
			!characterData.race ||
			!characterData.classes?.length
		) {
			return res
				.status(400)
				.json({ message: "Missing required fields." });
		}

		// Create and save character
		const savedCharacter = CharacterModel.create(req.body);
		return res.status(201).json(savedCharacter);
	} catch (err) {
		console.error("Error creating character:", err);
		return res
			.status(500)
			.json({ message: "Server error", error: err.message });
	}
});

app.get("/api/auth/profile", (req, res) => {
	// if (!req.isAuthenticated())
	// 	return res.status(401).json({ message: "Unauthorized" });
	// console.log(req.user);
	res.send({ user: req.user });
});

app.post("/api/auth/logout", (req, res) => {
	req.logout(() => res.json({ message: "Logged out" }));
});

// app.post("/api/auth/login", async (req, res) => {
// 	const { email, password } = req.body;
// 	console.log("info", email, password);
// 	if (!email || !password) {
// 		return res.json({
// 			errorMsg: "There was an error",
// 			error: true,
// 			ok: false,
// 			status: 500,
// 		});
// 	}

// 	const DECODEPASS = decodeText(password);
// 	console.log("info", email, DECODEPASS);

// 	const user = await UserModel.findOne({
// 		email: email,
// 	}).exec();

// 	if (user === null) {
// 		return res.json({
// 			errorMsg: "We didn't find that email in our system.",
// 			error: true,
// 			ok: false,
// 			status: 404,
// 		});
// 	}

// 	bcrypt
// 		.compare(DECODEPASS, user.password)
// 		.then((result) => {
// 			console.log("resulte", result);
// 			if (result === false) {
// 				res.json({
// 					errorMsg: "Password incorrect.",
// 					error: true,
// 					ok: false,
// 					status: 404,
// 				});
// 			} else {
// 				res.json({
// 					errorMsg: null,
// 					error: false,
// 					ok: true,
// 					status: 200,
// 					data: null,
// 				});
// 			}
// 		})
// 		.catch((err) => console.log(err));
// });

app.listen(PORT, () => console.log("listening on port...", PORT));
