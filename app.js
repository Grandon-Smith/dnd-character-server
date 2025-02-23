import express, { json } from "express";
import mongoose, { Schema } from "mongoose";
import bodyParser from "body-parser";
import UserModel from "./models/user.js";
import passport from "passport";
import passportlocal from "passport-local";
import cors from "cors";
import bcrypt from "bcrypt";
import { connectToDb } from "./db.js";
// import session from "express-session";

// const LocalStrategy = passportlocal.Strategy;
const SALTROUNDS = 10;
const PORT = process.env.PORT || 3000;
const app = express();
const CORSOPTIONS = {
	origin: ["http://localhost:3000", "http://localhost:5713"],
	credentials: true,
	optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cors(CORSOPTIONS));
app.use(cors());
// app.use(
// 	session({
// 		secret: 12345,
// 		resave: true,
// 		saveUninitialized: true,
// 	})
// );

function decodeText(string) {
	// decode basic hash from the front end for extra security
	const dec = new TextDecoder();
	return dec.decode(
		Uint8Array.from(string.match(/../g), (point) =>
			parseInt(point, 16)
		)
	);
}

//db connection
connectToDb("mongodb://0.0.0.0:27017/character-builder");

// passport.use(
// 	"local",
// 	new LocalStrategy(
// 		{ passReqToCallback: true },
// 		(req, username, password, done) => {
// 			console.log("local strategy verify!");
// 			return done(null, { id: "test" });
// 			const user = users.find((u) => u.username === username);
// 			if (!user)
// 				return done(null, false, { message: "Incorrect username." });

// 			bcrypt.compare(password, user.password, (err, res) => {
// 				if (err) return done(err);
// 				if (!res)
// 					return done(null, false, {
// 						message: "Incorrect password.",
// 					});

// 				return done(null, user);
// 			});
// 		}
// 	)
// );

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

app.post("/api/auth/login", async (req, res) => {
	const { email, password } = req.body;
	console.log("info", email, password);
	if (!email || !password) {
		return res.json({
			errorMsg: "There was an error",
			error: true,
			ok: false,
			status: 500,
		});
	}

	const DECODEPASS = decodeText(password);
	console.log("info", email, DECODEPASS);

	const user = await UserModel.findOne({
		email: email,
	}).exec();

	if (user === null) {
		return res.json({
			errorMsg: "We didn't find that email in our system.",
			error: true,
			ok: false,
			status: 404,
		});
	}

	bcrypt
		.compare(DECODEPASS, user.password)
		.then((result) => {
			console.log("resulte", result);
			if (result === false) {
				res.json({
					errorMsg: "Password incorrect.",
					error: true,
					ok: false,
					status: 404,
				});
			} else {
				res.json({
					errorMsg: null,
					error: false,
					ok: true,
					status: 200,
					data: null,
				});
			}
		})
		.catch((err) => console.log(err));
});

app.listen(PORT, () => console.log("listening on port...", PORT));
