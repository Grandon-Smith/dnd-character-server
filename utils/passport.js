import passport from "passport";
import passportlocal from "passport-local";
import bcrypt from "bcrypt";

const LocalStrategy = passportlocal.Strategy;

// Configure passport local strategy factory function
export function setupPassport(UserModel) {
  //username is email
  const strategy = new LocalStrategy(
    {
      usernameField: "email",
    },
    async (email, password, done) => {
      try {
        const user = await UserModel.findOne({ email });

        if (!user) {
          return done(null, false, {
            message: "User not found",
          });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
          return done(null, false, {
            message: "Incorrect password",
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  );

  passport.use(strategy);

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await UserModel.findById(id).select("-password");

      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

// Auth middleware for protecting routes
export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  // If not authenticated, send a 401 response
  return res.status(401).json({
    message: "Access denied. Please log in.",
  });
}
