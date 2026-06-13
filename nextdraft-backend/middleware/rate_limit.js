const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const isProd = () => process.env.NODE_ENV === "production";

const userOrIpKey = (req) => (req.user ? String(req.user._id) : ipKeyGenerator(req));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd() ? 10 : 100,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd() ? 5 : 100,
  message: { message: "Too many accounts created from this IP. Try later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd() ? 5 : 100,
  message: { message: "Too many password reset attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProd() ? 5 : 50,
  keyGenerator: userOrIpKey,
  message: { message: "Too many AI requests. Slow down a bit." },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProd() ? 10 : 100,
  keyGenerator: userOrIpKey,
  message: { message: "Too many payment requests. Try again shortly." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProd() ? 240 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  registerLimiter,
  passwordResetLimiter,
  aiLimiter,
  paymentLimiter,
  generalLimiter,
};
