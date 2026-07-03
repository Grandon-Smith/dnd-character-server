import env from "./env.js";

export const sessionConfig = {
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.isProduction,
    httpOnly: true,
    sameSite: env.isProduction ? "none" : "lax",
    maxAge: env.sessionMaxAgeMs,
  },
};
