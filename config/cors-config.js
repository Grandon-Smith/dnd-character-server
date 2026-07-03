import env from "./env.js";

export const corsOptions = {
  origin: env.clientOrigin,
  credentials: true,
};
