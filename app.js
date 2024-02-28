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
APP.use(cors());

const dbUri =
	"mongodb+srv://grandonsmith:HvXMQJi50TCmyb80@dnd-server.hs2qbe7.mongodb.net/?retryWrites=true&w=majority&appName=dnd-server";
// "mongodb+srv://grandonsmith:HvXMQJi50TCmyb80@dnd-server.hs2qbe7.mongodb.net/?retryWrites=true&w=majority";

// mongoose.connect("mongodb://localhost:27017/character-builder");
// 	.then((info) => {
// 		APP.listen(PORT, () => console.log("listening on port...", PORT));
// 		console.log("success", info);
// 	})
// 	.catch((err) => {
// 		console.log(err);
// 	});

// MongoCreds: USER: grandonsmith Pass: HvXMQJi50TCmyb80
// mongodb+srv://grandonsmith:HvXMQJi50TCmyb80@dnd-server.hs2qbe7.mongodb.net/?retryWrites=true&w=majority&appName=dnd-server

// const courses = [
// 	{ id: 1, name: "course1" },
// 	{ id: 2, name: "course2" },
// 	{ id: 3, name: "course3" },
// ];

function decodeText(string) {
	// Step 1: instantiate the text decoder
	const dec = new TextDecoder();

	// Step 2: split the string into a hex array
	// this uses a regex to split into 2-character groups
	const hexArr = string.match(/../g);

	// Step 3: Convert the 'normal' array to a Uint8 array.
	// As above, the `.from()` method takes a map function as
	// the second parameter, this time converting the hex string
	// to a number
	const buffer = Uint8Array.from(hexArr, (point) =>
		parseInt(point, 16)
	);

	// Step 4: Decode the buffer into text
	const text = dec.decode(buffer);

	// Step 5: return the decoded string
	return text;

	//also, as above, this can be boiled down to one line:
	// return dec.decode(Uint8Array.from(string.match(/../g), point => parseInt(point, 16)));
}

//db connection
connectToDb("mongodb://0.0.0.0:27017/character-builder");

APP.post("/api/auth/newUser", async (req, res) => {
	const { email, password, username } = req.body;
	const DECODEPASS = decodeText(password);

	const emailExists = await UserModel.findOne({
		email: email,
	}).exec();

	if (emailExists !== null) {
		return res.status(400);
	}

	await bcrypt.hash(DECODEPASS, saltRounds).then((hash) => {
		const USERDATA = { email, password: hash, username };
		const User = new UserModel(USERDATA);

		User.save()
			.then((user) => {
				res.status(201).send(user);
			})
			.catch((error) => {
				res.status(400).send("Something went wrong.");
			});
	});
});

APP.post("/api/auth/login", async (req, res) => {
	const { email, password } = req.body;
	const DECODEPASS = decodeText(password);
	console.log("I see you", password, DECODEPASS);

	// await bcrypt.hash(DECODEPASS, saltRounds, function (err, hash) {
	// 	// Store hash in your password DB.
	// 	console.log("hash", hash, err);
	// });

	// bcrypt.compare(
	// 	DECODEPASS,
	// 	"$2b$05$bnYZDTtsmfVlc4sUM21bJOr4RIOK/HJfp1VU2vVYgGpfn.njpIaE6",
	// 	function (err, result) {
	// 		// result == true
	// 		console.log("success?", result, err);
	// 	}
	// );

	//$2b$05$bnYZDTtsmfVlc4sUM21bJOr4RIOK/HJfp1VU2vVYgGpfn.njpIaE6
	res.send(JSON.stringify({ msg: "hi there!!" }));
});

// {
// 	"email": "Testing",
// 	"username": "Still testing",
// 	"password": "Testing password",
// }

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
