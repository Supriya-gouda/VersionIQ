import { ApiError } from "./error-handler.js";

/**
 * Middleware to validate request body, params, query
 */
export function validateRequest(schema, property = "body") {
  return (req, res, next) => {
    const valueToValidate = req[property];
    const validation = schema.validate(valueToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (validation.error) {
      const details = validation.error.details.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        type: err.type,
      }));

      throw ApiError.unprocessable("VALIDATION_ERROR", "Request validation failed", details);
    }

    // Update request with validated data
    req[property] = validation.value;
    next();
  };
}

/**
 * Built-in validators for common patterns
 */
export const validators = {
  email: (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(value)) {
      return "Invalid email format";
    }
    return null;
  },

  password: (value) => {
    if (value.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(value)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(value)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(value)) {
      return "Password must contain at least one number";
    }
    return null;
  },

  mongoId: (value) => {
    const objectIdRegex = /^[0-9a-f]{24}$/i;
    if (!objectIdRegex.test(value)) {
      return "Invalid MongoDB ID format";
    }
    return null;
  },

  url: (value) => {
    try {
      new URL(value);
      return null;
    } catch {
      return "Invalid URL format";
    }
  },

  mimeType: (value, allowedTypes) => {
    if (!allowedTypes.includes(value)) {
      return `File type must be one of: ${allowedTypes.join(", ")}`;
    }
    return null;
  },

  fileSize: (bytes, maxBytes) => {
    if (bytes > maxBytes) {
      const maxMb = (maxBytes / (1024 * 1024)).toFixed(2);
      return `File size must be less than ${maxMb}MB`;
    }
    return null;
  },
};

/**
 * Simple inline validation helpers
 */
export function validateEmail(email) {
  const error = validators.email(email);
  if (error) {
    throw ApiError.badRequest("INVALID_EMAIL", error);
  }
}

export function validatePassword(password) {
  const error = validators.password(password);
  if (error) {
    throw ApiError.badRequest("INVALID_PASSWORD", error);
  }
}

export function validateMongoId(id) {
  const error = validators.mongoId(id);
  if (error) {
    throw ApiError.badRequest("INVALID_ID", error);
  }
}
