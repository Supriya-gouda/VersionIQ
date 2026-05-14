import crypto from "node:crypto";
import path from "node:path";
import { Activity } from "../models/activity.model.js";
import { FileRecord } from "../models/file.model.js";
import { Version } from "../models/version.model.js";
import { fileStorage } from "../services/file-storage.service.js";
import { getPipelineLogs, syncJenkinsPipelineLogs } from "../services/jenkins.service.js";
import { recommendRollback } from "../services/recommendation.service.js";
import {
  createOrUpdateFileVersion,
  getCurrentVersionForFile,
  restoreVersion,
  getVersionDiff,
} from "../services/version.service.js";
import { logActivity } from "../utils/activity-logger.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";

async function findOwnedFile(fileId, ownerId) {
  const file = await FileRecord.findOne({
    _id: fileId,
    owner: ownerId,
    isDeleted: false,
  });

  if (!file) {
    throw new AppError(404, "File not found");
  }

  return file;
}

export const uploadFileController = asyncHandler(async (req, res) => {
  const result = await createOrUpdateFileVersion({
    userId: req.user._id,
    upload: req.file,
    fileId: req.body.fileId,
    status: req.body.status ?? "stable",
  });

  await logActivity({
    owner: req.user._id,
    type: req.body.fileId ? "new_version" : "upload",
    fileId: result.file._id,
    fileName: result.file.originalName,
    details: `v${result.version.versionNumber} ${req.body.fileId ? "version created" : "initial upload"}`,
  });

  res.status(201).json({
    success: true,
    file: result.file,
    version: result.version,
  });
});

export const listFilesController = asyncHandler(async (req, res) => {
  const files = await FileRecord.find({ owner: req.user._id, isDeleted: false })
    .populate({
      path: "currentVersionId",
      select: "versionNumber status summary diffStats createdAt",
    })
    .sort({ updatedAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    files,
  });
});

export const getFileController = asyncHandler(async (req, res) => {
  const file = await findOwnedFile(req.params.id, req.user._id);
  const currentVersion = await Version.findById(file.currentVersionId).lean();

  res.status(200).json({
    success: true,
    file,
    currentVersion,
  });
});

export const downloadFileController = asyncHandler(async (req, res) => {
  const file = await findOwnedFile(req.params.id, req.user._id);
  const currentVersion = await Version.findById(file.currentVersionId).lean();

  if (!currentVersion) {
    throw new AppError(404, "Current version not found");
  }

  res.download(currentVersion.storagePath, currentVersion.originalName);
});

export const deleteFileController = asyncHandler(async (req, res) => {
  const file = await findOwnedFile(req.params.id, req.user._id);
  file.isDeleted = true;
  await file.save();

  await logActivity({
    owner: req.user._id,
    type: "delete",
    fileId: file._id,
    fileName: file.originalName,
  });

  res.status(200).json({
    success: true,
    message: "File deleted successfully",
  });
});

export const listVersionsController = asyncHandler(async (req, res) => {
  await findOwnedFile(req.params.id, req.user._id);
  const versions = await Version.find({ file: req.params.id, owner: req.user._id })
    .sort({ versionNumber: -1 })
    .lean();

  res.status(200).json({
    success: true,
    versions,
  });
});

export const restoreVersionController = asyncHandler(async (req, res) => {
  const result = await restoreVersion({
    userId: req.user._id,
    fileId: req.params.id,
    versionId: req.params.versionId,
  });

  await logActivity({
    owner: req.user._id,
    type: "restore",
    fileId: result.file._id,
    fileName: result.file.originalName,
    details: `Restored to v${result.restoredFrom}`,
  });

  res.status(200).json({
    success: true,
    message: `Restored version ${result.restoredFrom}`,
    file: result.file,
    version: result.version,
  });
});

export const fileSummaryController = asyncHandler(async (req, res) => {
  const { versionId } = req.query;
  let version;

  if (versionId) {
    version = await Version.findOne({ _id: versionId, file: req.params.id, owner: req.user._id }).lean();
  } else {
    version = await getCurrentVersionForFile(req.params.id, req.user._id);
  }

  if (!version) {
    throw new AppError(404, "Version not found");
  }

  res.status(200).json({
    success: true,
    summary: {
      fileId: req.params.id,
      versionId: version._id,
      versionNumber: version.versionNumber,
      status: version.status,
      diffStats: version.diffStats,
      text: version.summary,
      source: version.summarySource,
      model: version.summaryModel,
      aiDetails: version.aiDetails || {},
    },
  });
});

export const recommendationController = asyncHandler(async (req, res) => {
  await findOwnedFile(req.params.id, req.user._id);
  const versions = await Version.find({ file: req.params.id, owner: req.user._id })
    .sort({ versionNumber: -1 })
    .lean();

  const recommendation = await recommendRollback(versions);
  if (!recommendation) {
    throw new AppError(404, "No versions available for recommendation");
  }

  res.status(200).json({
    success: true,
    recommendation,
  });
});

export const listPipelineStatusController = asyncHandler(async (_req, res) => {
  const logs = await getPipelineLogs(20);

  res.status(200).json({
    success: true,
    pipelines: logs.items,
  });
});

export const syncPipelineStatusController = asyncHandler(async (_req, res) => {
  const result = await syncJenkinsPipelineLogs();
  const logs = await getPipelineLogs(20);

  res.status(200).json({
    success: true,
    sync: result,
    pipelines: logs.items,
  });
});

export const getQuotaController = asyncHandler(async (req, res) => {
  const userDir = fileStorage.getUserUploadDir(String(req.user._id));
  const used = await fileStorage.getDirectorySize(userDir);
  const limit = 10 * 1024 * 1024 * 1024; // 10GB

  res.status(200).json({
    success: true,
    quota: {
      used,
      limit,
      percent: Math.round((used / limit) * 100),
    },
  });
});

export const shareFileController = asyncHandler(async (req, res) => {
  const file = await findOwnedFile(req.params.id, req.user._id);

  if (req.body.isPublic && !file.shareToken) {
    file.shareToken = crypto.randomBytes(16).toString("hex");
  }

  file.isPublic = !!req.body.isPublic;
  await file.save();

  await logActivity({
    owner: req.user._id,
    type: "share_toggle",
    fileId: file._id,
    fileName: file.originalName,
    details: file.isPublic ? "Public access enabled" : "Private access enabled",
  });

  res.status(200).json({
    success: true,
    file,
  });
});

export const listActivitiesController = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ owner: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.status(200).json({
    success: true,
    activities,
  });
});

export const compareVersionsController = asyncHandler(async (req, res) => {
  const { id, v1, v2 } = req.params;
  const diff = await getVersionDiff({
    userId: req.user._id,
    fileId: id,
    v1Id: v1,
    v2Id: v2,
  });

  res.status(200).json({
    success: true,
    diff,
  });
});
