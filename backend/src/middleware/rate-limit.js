import { ApiError } from "./error-handler.js";

/**
 * Simple in-memory rate limiting
 * For production with multiple servers, use Redis
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanup();
  }

  cleanup() {
    // Cleanup old entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        if (now - data.lastCleanup > 5 * 60 * 1000) {
          this.requests.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  isRateLimited(identifier, windowMs, maxRequests) {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, {
        requests: [now],
        lastCleanup: now,
      });
      return false;
    }

    const data = this.requests.get(identifier);
    data.requests = data.requests.filter((time) => time > windowStart);
    data.lastCleanup = now;

    if (data.requests.length >= maxRequests) {
      return true;
    }

    data.requests.push(now);
    return false;
  }

  reset(identifier) {
    this.requests.delete(identifier);
  }

  getStatus(identifier) {
    return this.requests.get(identifier) || { requests: [] };
  }
}

const limiter = new RateLimiter();

/**
 * Rate limiting middleware
 */
export function rateLimit({
  windowMs = 15 * 60 * 1000, // 15 minutes
  maxRequests = 100,
  keyGenerator = (req) => req.ip || req.socket.remoteAddress,
  onLimit = null,
  skipCondition = () => false,
} = {}) {
  return (req, res, next) => {
    if (skipCondition(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const isLimited = limiter.isRateLimited(key, windowMs, maxRequests);

    if (isLimited) {
      if (onLimit) {
        onLimit(req, res, key);
      }
      throw new ApiError(
        429,
        "RATE_LIMIT_EXCEEDED",
        "Too many requests. Please try again later."
      );
    }

    next();
  };
}

/**
 * Per-endpoint rate limiting helpers
 */
export const rateLimiters = {
  // Authentication endpoints: 5 attempts per 15 minutes
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  }),

  // API endpoints: 100 requests per 15 minutes
  api: rateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  }),

  // Upload endpoint: 10 uploads per hour
  upload: rateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  }),

  // Public endpoints: 1000 requests per hour
  public: rateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 1000,
  }),
};

export function getRateLimitStatus(identifier) {
  return limiter.getStatus(identifier);
}

export function resetRateLimit(identifier) {
  limiter.reset(identifier);
}
