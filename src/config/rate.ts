export const rate = {
    redis: {
      cacheTtl: parseInt(process.env.CACHE_TTL || "3600", 10),
      rateLimit: {
        windowMs: 15 * 60 * 1000, 
        defaultMessage: "Too many requests. Please try again later.",
      },
    },
    bcrypt: {
      saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10),
    },
    jwt: {
      secret: process.env.JWT_SECRET || (() => {
        throw new Error("JWT_SECRET is not defined");
      })(),
      expiresIn: "1d",
    },
  };