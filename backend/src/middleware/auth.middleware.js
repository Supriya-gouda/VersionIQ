import { User } from "../models/user.model.js";
import { AppError } from "../utils/app-error.js";
import { verifyAccessToken } from "../utils/jwt.js";

export async function requireAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization ?? "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError(401, "Missing or invalid authorization header");
    }

    const payload = verifyAccessToken(token);
    const userId = payload.sub;
    if (!userId) {
      throw new AppError(401, "Invalid token payload");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(401, "User not found for token");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
