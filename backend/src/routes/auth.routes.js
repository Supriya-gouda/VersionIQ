import { Router } from "express";

import {
  loginController,
  meController,
  registerController,
  updateProfileController,
  uploadAvatarController,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateRequiredFields } from "../middleware/validate.middleware.js";
import { uploadMiddleware } from "../config/multer.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validateRequiredFields(["name", "email", "password"]),
  registerController,
);
authRouter.post("/login", validateRequiredFields(["email", "password"]), loginController);
authRouter.get("/me", requireAuth, meController);
authRouter.put("/me", requireAuth, updateProfileController);
authRouter.post("/avatar", requireAuth, uploadMiddleware.single("avatar"), uploadAvatarController);
