import express, { json } from "express";
import mongoose, { Schema } from "mongoose";
import bodyParser from "body-parser";
import UserModel from "./models/user.js";
import passport from "passport";
import passportlocal from "passport-local";
import cors from "cors";
import bcrypt from "bcrypt";
import { connectToDb } from "./db.js";
// import { DotenvConfigOptions } from "dotenv";

const LocalStrategy = passportlocal.Strategy;
const SALTROUNDS = 10;
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("serve-static")(__dirname + "/../../public"));
app.use(require("cookie-parser")());
app.use(
	require("express-session")({
		secret: "keyboard cat",
		resave: true,
		saveUninitialized: true,
	})
);
app.use(passport.initialize());
app.use(passport.session());
const CORSOPTIONS = {
	origin: ["http://localhost:3000", "http://localhost:5713"],
	credentials: true,
	optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(CORSOPTIONS));

function decodeText(string) {
	const dec = new TextDecoder();
	return dec.decode(
		Uint8Array.from(string.match(/../g), (point) =>
			parseInt(point, 16)
		)
	);
}

//db connection
connectToDb("mongodb://0.0.0.0:27017/character-builder");

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
	const DECODEPASS = decodeText(password);

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
