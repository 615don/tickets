/**
 * Rate limiting middleware
 * Protects endpoints from abuse and brute force attacks
 */

import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for OAuth endpoints
 * Limits: 5 requests per 15 minutes per IP
 */
export const oauthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'TooManyRequests',
    message: 'Too many OAuth attempts from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for successful responses (only count failed attempts)
  skipSuccessfulRequests: false,
});

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
