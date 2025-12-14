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

// Routes
import characterRoutes from "./routes/character.routes.js";

const LocalStrategy = passportlocal.Strategy;
const SALTROUNDS = 10;
const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors({ credentials: true, origin: "http://localhost:5173" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "g78raedFGEg89rysgsg",
    resave: false, // Prevents unnecessary saving if session data didn't change
    saveUninitialized: false, // Prevents creating sessions for unauthenticated requests
    cookie: {
      secure: false, // Must be false for HTTP
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);
app.use(passport.initialize());
app.use((req, res, next) => {
  // Log the entire session object on every request
  // On a subsequent request, req.session should contain data from the previous request
  console.log("--- Current Request Session Data ---", req.session);
  next();
});
app.use(passport.session());

//db connection
connectToDb("mongodb://0.0.0.0:27017/character-builder");

function decodeText(string) {
  // decode basic hash from the front end for extra security
  const dec = new TextDecoder();
  return dec.decode(
    Uint8Array.from(string.match(/../g), (point) => parseInt(point, 16))
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
      if (!user) return done(null, false, { message: "User not found" });
      const decodedPassword = decodeText(password);
      console.log(decodedPassword);
      if (!bcrypt.compareSync(decodedPassword, user.password))
        return done(null, false, { message: "Incorrect password" });
      return done(null, user);
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("user serialized", user);
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await UserModel.findOne({ _id: id });
  console.log("user deserialized", user);

  done(null, user);
});

// Auth middleware for protecting server routes
export function isAuthenticated(req, res, next) {
  console.log(req.isAuthenticated());

  if (req.isAuthenticated()) {
    // req.isAuthenticated() is a helper method added by Passport
    return next();
  }
  // If not authenticated, send a 401 response
  res.status(401).send({ message: "Access denied. Please log in." });
}

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
      const token = jwt.sign({ id: user.id, email: user.email }, "jwt_secret", {
        expiresIn: "24h",
      });
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

app.get("/api/auth/profile", isAuthenticated, async (req, res) => {
  console.log("user: ", req.user);

  const user = await UserModel.findOne({
    email: req.user.email,
  });

  res.send({ user });
});

app.post("/api/test/user", isAuthenticated, (req, res) => {
  try {
    // The authenticated user object is available here as req.user
    const user = req.user;

    // Check if a user is actually logged in
    if (!user) {
      return res.status(401).send({ message: "User not authenticated" });
    }

    // Send the user data
    res.send({ user });
  } catch (error) {
    console.error(error); // Use console.error for better logging
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Prefix routes with namespace
app.use("/api/character", characterRoutes);

app.listen(PORT, () => console.log("listening on port...", PORT));

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
