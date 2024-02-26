import express, { json } from "express";
import mongoose, { Schema } from "mongoose";
import UserModel from "./models/user.js";
import { connectToDb } from "./db.js";

const PORT = process.env.PORT || 3000;
const APP = express();
APP.use(express.json());

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

//db connection
connectToDb("mongodb://0.0.0.0:27017/character-builder");

APP.post("/newUser", (req, res) => {
	const user = new UserModel(req.body);
	user
		.save()
		.then((user) => {
			res.status(201).send(user);
		})
		.catch((error) => {
			res.status(400).send(error);
		});
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
