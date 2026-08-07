const rateLimit = require('express-rate-limit');

// General API rate limiter (protects overall endpoints)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Strict limiter for Login routes (prevents brute-force credential stuffing)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts from this IP, please try again after 15 minutes.' }
});

// Strict limiter for Financial Transfers & Bill Payments
const transactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each user/IP to 5 transaction requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many transaction requests. Please slow down.' }
});

module.exports = {
  globalLimiter,
  loginLimiter,
  transactionLimiter
};