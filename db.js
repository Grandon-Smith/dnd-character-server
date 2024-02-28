import mongoose from "mongoose";

export function connectToDb(dbUri) {
	mongoose
		.connect(dbUri)
		.then(() => {
			console.log("connection successful!");
		})
		.catch((err) => {
			console.log("error", err);
		});
}
