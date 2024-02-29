import express, { json } from "express";
import mongoose, { Schema } from "mongoose";
import UserModel from "./models/user.js";
import { connectToDb } from "./db.js";
import cors from "cors";
import bcrypt from "bcrypt";
const saltRounds = 10;

const PORT = process.env.PORT || 3000;
const APP = express();
APP.use(express.json());

// var corsOptions = {
// 	origin: "http://localhost:5173",
// 	optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
// };

APP.use(cors());

const dbUri =
	"mongodb+srv://grandonsmith:HvXMQJi50TCmyb80@dnd-server.hs2qbe7.mongodb.net/?retryWrites=true&w=majority&appName=dnd-server";
// "mongodb+srv://grandonsmith:HvXMQJi50TCmyb80@dnd-server.hs2qbe7.mongodb.net/?retryWrites=true&w=majority";

// MongoCreds: USER: grandonsmith Pass: HvXMQJi50TCmyb80
// mongodb+srv://grandonsmith:HvXMQJi50TCmyb80@dnd-server.hs2qbe7.mongodb.net/?retryWrites=true&w=majority&appName=dnd-server

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

APP.post("/api/auth/newUser", async (req, res) => {
	const { email, password, username } = req.body;
	const DECODEPASS = decodeText(password);

	const emailExists = await UserModel.findOne({
		email: email,
	}).exec();
	console.log("here", emailExists);

	if (emailExists !== null) {
		return res.json({
			errorMsg: "That email is already in use.",
			error: true,
			ok: false,
			status: 400,
		});
	}

	await bcrypt.hash(DECODEPASS, saltRounds).then((hash) => {
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

APP.post("/api/auth/login", async (req, res) => {
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
			console.log("result", result);
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

APP.listen(PORT, () => console.log("listening on port...", PORT));

// APP.get("/", (req, res) => {
// 	res.send("hello world!");
// });

// APP.post("/api/courses", (req, res) => {
// 	// look into JOI package for validation
// 	//at top of file -> const Joi = require('joi');

// 	// const SCHEMA  = {
// 	//     name: Joi.string().min(3).required()
// 	// }

// 	// const RESULT Joi.validate(req.body, SCHEMA)

// 	if (!req.body.name || req.body.name.length < 3) {
// 		// 400 == bad request
// 		req.status(400).send("name is required and must be > 3 char");
// 		return;
// 	}
// 	const course = {
// 		id: courses.length + 1,
// 		name: req.body.name,
// 	};
// 	courses.push(course);
// 	res.send(course);
// });

// APP.put("/api/courses/:id", (req, res) => {
// 	//look up course
// 	// if not existing, return 404
// 	const course = courses.find(
// 		(c) => c.id === parseInt(req.params.id)
// 	);
// 	if (!course) {
// 		//return 404 status
// 		res.status(404).send("course with given ID not found");
// 	}

// 	//validate
// 	// if invalid, return 400 - bad request

// 	//update course
// });
