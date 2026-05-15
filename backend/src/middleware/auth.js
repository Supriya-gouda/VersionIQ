import jwt from "jsonwebtoken";
import { ApiError } from "./error-handler.js";
import { env } from "../config/env.js";

/**
 * Middleware to verify JWT token
 */
export function verifyJwt(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw ApiError.unauthorized("NO_TOKEN", "No authorization token provided");
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw ApiError.unauthorized("INVALID_TOKEN_FORMAT", "Invalid authorization header format");
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw ApiError.unauthorized("TOKEN_EXPIRED", "Authorization token has expired");
      }
      if (error.name === "JsonWebTokenError") {
        throw ApiError.unauthorized("INVALID_TOKEN", "Invalid or malformed authorization token");
      }
      throw ApiError.unauthorized("UNKNOWN_TOKEN_ERROR", "Token verification failed");
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to optionally verify JWT (doesn't fail if missing)
 */
export function optionalJwt(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return next();
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      req.user = decoded;
    } catch {
      // Silently ignore token errors for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to require specific roles
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized("NOT_AUTHENTICATED", "Authentication required");
    }

    const userRole = req.user.role || "user";
    if (!roles.includes(userRole)) {
      throw ApiError.forbidden(
        "INSUFFICIENT_PERMISSIONS",
        `This action requires one of the following roles: ${roles.join(", ")}`,
      );
    }

    next();
  };
}

/**
 * Middleware to require user ownership
 */
export function requireOwnership(userField = "userId", paramField = "userId") {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized("NOT_AUTHENTICATED", "Authentication required");
    }

    const userId = req.user[userField];
    const resourceUserId = req.params[paramField] || req.body?.[paramField];

    if (userId !== resourceUserId) {
      throw ApiError.forbidden("NOT_OWNER", "You can only access your own resources");
    }

    next();
  };
}
