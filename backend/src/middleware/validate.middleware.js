import { AppError } from "../utils/app-error.js";

export function validateRequiredFields(fields) {
  return (req, _res, next) => {
    const missing = fields.filter((field) => {
      const value = req.body?.[field];
      return value == null || value === "";
    });

    if (missing.length > 0) {
      next(new AppError(400, `Missing required fields: ${missing.join(", ")}`));
      return;
    }

    next();
  };
}
