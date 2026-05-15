import { Router } from "express";

import {
  deleteFileController,
  downloadFileController,
  fileSummaryController,
  getFileController,
  listFilesController,
  listVersionsController,
  recommendationController,
  restoreVersionController,
  uploadFileController,
  getQuotaController,
  shareFileController,
  listActivitiesController,
  compareVersionsController,
} from "../controllers/files.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { uploadMiddleware } from "../config/multer.js";
import { rateLimiters } from "../middleware/rate-limit.js";

export const fileRouter = Router();

fileRouter.use(requireAuth);

fileRouter.post(
  "/upload",
  rateLimiters.upload,
  uploadMiddleware.single("file"),
  uploadFileController,
);
fileRouter.get("/", listFilesController);
fileRouter.get("/quota", getQuotaController);
fileRouter.get("/activities", listActivitiesController);
fileRouter.get("/:id", getFileController);
fileRouter.get("/:id/download", downloadFileController);
fileRouter.delete("/:id", deleteFileController);
fileRouter.get("/:id/versions", listVersionsController);
fileRouter.post("/:id/restore/:versionId", restoreVersionController);
fileRouter.get("/:id/summary", fileSummaryController);
fileRouter.get("/:id/recommendation", recommendationController);
fileRouter.post("/:id/share", shareFileController);
fileRouter.get("/:id/compare/:v1/:v2", compareVersionsController);
