/**
 * Global error handling middleware
 * Must be placed last in middleware chain to catch all errors
 */
export function errorHandler(err, req, res, next) {
  let error = err || new Error("An unexpected error occurred");

  // Default error properties
  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || "Internal Server Error";
  let code = error.code || "INTERNAL_ERROR";

  // Handle legacy AppError format
  if (error.name === "AppError" && !error.code) {
    code = `HTTP_${statusCode}`;
  }

  // Handle JWT specific errors
  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    statusCode = 401;
    code = "UNAUTHORIZED";
    message = error.name === "TokenExpiredError" ? "Session expired" : "Invalid token";
  }

  // Log error with context
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    code,
    message,
    userId: req.user?.id,
  };

  if (statusCode >= 500) {
    console.error("❌ Error:", JSON.stringify(errorLog, null, 2));
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
  } else {
    console.warn("⚠️ Warning:", JSON.stringify(errorLog, null, 2));
  }

  // Send error response
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: process.env.NODE_ENV === "production" ? undefined : error.details,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Not found handler
 */
export function notFoundHandler(req, res, next) {
  const error = new ApiError(404, "NOT_FOUND", `Route not found: ${req.method} ${req.originalUrl}`);
  next(error);
}

/**
 * Wrap async route handlers to catch errors
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(code, message, details) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(code = "UNAUTHORIZED", message = "Unauthorized") {
    return new ApiError(401, code, message);
  }

  static forbidden(code = "FORBIDDEN", message = "Forbidden") {
    return new ApiError(403, code, message);
  }

  static notFound(code = "NOT_FOUND", message = "Resource not found") {
    return new ApiError(404, code, message);
  }

  static conflict(code, message) {
    return new ApiError(409, code, message);
  }

  static unprocessable(code, message, details) {
    return new ApiError(422, code, message, details);
  }

  static internal(code = "INTERNAL_ERROR", message = "Internal server error") {
    return new ApiError(500, code, message);
  }
}
