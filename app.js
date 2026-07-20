import express from "express";
import UserModel from "./models/User.js";
import passport from "passport";
import cors from "cors";
import { setupPassport, isAuthenticated } from "./utils/passport.js";
import { connectToDb } from "./config/db.js";
import session from "express-session";
import env from "./config/env.js";
import { corsOptions } from "./config/cors-config.js";
import { sessionConfig } from "./config/session-config.js";
import { errorHandler, notFoundHandler } from "./utils/error-middleware.js";
import path from "path";

// Routes
import authRoutes from "./routes/auth.routes.js";
import characterRoutes from "./routes/character.routes.js";
import referenceRoutes from "./routes/reference.routes.js";
const app = express();

// Initialize passport with the UserModel
setupPassport(UserModel);

/*
Request lifecycle:
1) Route middleware runs auth + validateRequest and stores normalized input on req.validated.
2) Controllers map HTTP I/O and delegate business logic to services.
3) Services apply domain rules and call repositories for DB access.
4) Repositories execute mongoose queries; thrown errors flow to global errorHandler.
*/
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

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
app.use("/api/reference", referenceRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, environment: env.nodeEnv });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await connectToDb();
    app.listen(env.port, () => {
      console.log(`listening on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

startServer();

export default app;
