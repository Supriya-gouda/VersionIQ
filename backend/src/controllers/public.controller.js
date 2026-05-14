import { FileRecord } from "../models/file.model.js";
import { Version } from "../models/version.model.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";

export const getSharedFileInfoController = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const file = await FileRecord.findOne({ shareToken: token, isPublic: true, isDeleted: false });
  
  if (!file) {
    throw new AppError(404, "Shared file not found or access revoked");
  }

  const currentVersion = await Version.findById(file.currentVersionId).lean();
  if (!currentVersion) {
    throw new AppError(404, "Current version not found");
  }

  res.status(200).json({
    success: true,
    file: {
      originalName: file.originalName,
      size: file.size,
      updatedAt: file.updatedAt,
      versionNumber: currentVersion.versionNumber,
      summary: currentVersion.summary,
    }
  });
});

export const downloadSharedFileController = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const file = await FileRecord.findOne({ shareToken: token, isPublic: true, isDeleted: false });
  
  if (!file) {
    throw new AppError(404, "Shared file not found or access revoked");
  }

  const currentVersion = await Version.findById(file.currentVersionId).lean();
  if (!currentVersion) {
    throw new AppError(404, "Current version not found");
  }

  res.download(currentVersion.storagePath, currentVersion.originalName);
});
