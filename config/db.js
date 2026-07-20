import mongoose from "mongoose";
import env from "./env.js";

mongoose.set("strictQuery", true);

export async function connectToDb(dbUri = env.mongodbUri) {
  try {
    await mongoose.connect(dbUri);
    console.log("MongoDB connection successful");
  } catch (error) {
    console.error("MongoDB connection failed", error);
    throw error;
  }
}

export async function disconnectFromDb() {
  try {
    await mongoose.disconnect();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Failed to close MongoDB connection", error);
  }
}
