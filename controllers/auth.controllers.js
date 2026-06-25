import UserModel from "../models/User.js";
import bcrypt from "bcrypt";
import passport from "passport";

export const newUserHandler = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const emailExists = await UserModel.findOne({ email }).exec();

    if (emailExists !== null) {
      return res.json({
        errorMsg: "That email is already in use.",
        error: true,
        ok: false,
        status: 400,
      });
    }

    const hash = await bcrypt.hash(password, process.env.SALT_ROUNDS);
    const newUser = new UserModel({ email, password: hash, username });
    await newUser.save();

    res.status(201).json({
      errorMsg: null,
      error: false,
      ok: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
      },
    });
  } catch (error) {
    res.json({
      errorMsg: error.message,
      error: true,
      ok: false,
      status: 400,
    });
  }
};

export const loginHandler = async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info.message });

    req.login(user, (err) => {
      if (err) return next(err);
      res.json({
        message: "Login successful",
        user,
      });
    });
  })(req, res, next);
};

export const logoutHandler = (req, res) => {
  req.logout(() => res.json({ message: "Logged out" }));
};

export const profileHandler = async (req, res) => {
  res.send({ user: req.user });
};

export const getCurrentUser = (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(200).json({
      authenticated: false,
      user: null,
    });
  }

  return res.status(200).json({
    authenticated: true,
    user: req.user,
  });
};
