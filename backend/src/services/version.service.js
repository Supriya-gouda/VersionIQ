import fs from "node:fs/promises";
import path from "node:path";

import { env } from "../config/env.js";
import { FileRecord } from "../models/file.model.js";
import { Version } from "../models/version.model.js";
import { AppError } from "../utils/app-error.js";
import { calculateLineDiff, generateTextDiff } from "../utils/diff.js";
import { generateSummary } from "./ai.service.js";

const TEXT_TYPES = [
  "text/",
  "application/json",
  "application/xml",
  "application/javascript",
  "application/typescript",
  "application/x-yaml",
  "application/x-sh",
];

function isTextLikeMime(mimeType, originalName = "") {
  const isTextMime = TEXT_TYPES.some((type) => mimeType.startsWith(type) || mimeType === type);
  if (isTextMime) return true;

  // Fallback to extension check
  const textExtensions = [
    ".txt",
    ".md",
    ".json",
    ".yaml",
    ".yml",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".html",
    ".css",
    ".py",
    ".sh",
    ".env",
    ".c",
    ".cpp",
    ".h",
    ".go",
    ".rb",
    ".php",
    ".java",
    ".sql",
    ".ini",
    ".conf",
    ".xml",
    ".csv",
  ];
  return textExtensions.some((ext) => originalName.toLowerCase().endsWith(ext));
}

async function readTextIfPossible(filePath, mimeType, originalName = "") {
  if (!isTextLikeMime(mimeType, originalName)) {
    return "";
  }

  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

async function ensureOwnerFolder(ownerId, fileId) {
  const folder = path.resolve(process.cwd(), env.uploadRoot, String(ownerId), String(fileId));
  await fs.mkdir(folder, { recursive: true });
  return folder;
}

async function moveUploadedFile(tempPath, targetPath) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.rename(tempPath, targetPath);
}

export async function createOrUpdateFileVersion({
  userId,
  upload,
  fileId = null,
  status = "stable",
}) {
  if (!upload) {
    throw new AppError(400, "File is required");
  }

  let fileRecord = null;
  if (fileId && fileId !== "null" && fileId !== "undefined") {
    try {
      fileRecord = await FileRecord.findOne({ _id: fileId, owner: userId, isDeleted: false });
      if (!fileRecord) {
        throw new AppError(404, "File not found");
      }
    } catch (error) {
      if (error.name === "CastError") {
        throw new AppError(400, "Invalid file ID format");
      }
      throw error;
    }
  }

  if (!fileRecord) {
    fileRecord = await FileRecord.create({
      owner: userId,
      originalName: upload.originalname,
      mimeType: upload.mimetype,
      size: upload.size,
      currentVersionNumber: 0,
    });
  }

  const lastVersion = await Version.findOne({ file: fileRecord._id }).sort({ versionNumber: -1 });
  const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

  const ownerFolder = await ensureOwnerFolder(userId, fileRecord._id);
  const storedFilename = `v${nextVersionNumber}_${upload.filename}`;
  const finalPath = path.join(ownerFolder, storedFilename);

  await moveUploadedFile(upload.path, finalPath);

  const previousText = lastVersion
    ? await readTextIfPossible(
        lastVersion.storagePath,
        lastVersion.mimeType,
        lastVersion.originalName,
      )
    : "";
  const nextText = await readTextIfPossible(finalPath, upload.mimetype, upload.originalname);

  let diffStats = { added: 0, removed: 0, modified: 0 };
  let summary = { summary: `Version ${nextVersionNumber} uploaded.` };

  try {
    diffStats = calculateLineDiff(previousText, nextText);
    const summaryResult = await generateSummary({
      diffStats,
      versionNumber: nextVersionNumber,
      previousContent: previousText,
      currentContent: nextText,
    });
    summary = summaryResult;
  } catch (error) {
    console.error(`[ERROR] Failed to generate diff/summary: ${error.message}`);
  }

  await Version.updateMany(
    { file: fileRecord._id, isCurrent: true },
    { $set: { isCurrent: false } },
  );

  const version = await Version.create({
    file: fileRecord._id,
    owner: userId,
    versionNumber: nextVersionNumber,
    storedFilename,
    originalName: upload.originalname,
    mimeType: upload.mimetype,
    size: upload.size,
    storagePath: finalPath,
    status,
    summary: summary.summary,
    summarySource: summary.source || "local",
    summaryModel: summary.model || "",
    diffStats,
    aiDetails: summary.aiDetails || {},
    isCurrent: true,
  });

  fileRecord.currentVersionNumber = nextVersionNumber;
  fileRecord.currentVersionId = version._id;
  fileRecord.originalName = upload.originalname;
  fileRecord.mimeType = upload.mimetype;
  fileRecord.size = upload.size;
  await fileRecord.save();

  return {
    file: fileRecord,
    version,
  };
}

export async function restoreVersion({ userId, fileId, versionId }) {
  const fileRecord = await FileRecord.findOne({ _id: fileId, owner: userId, isDeleted: false });
  if (!fileRecord) {
    throw new AppError(404, "File not found");
  }

  const selectedVersion = await Version.findOne({
    _id: versionId,
    file: fileRecord._id,
    owner: userId,
  });
  if (!selectedVersion) {
    throw new AppError(404, "Version not found");
  }

  const lastVersion = await Version.findOne({ file: fileRecord._id }).sort({ versionNumber: -1 });
  const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

  const ownerFolder = await ensureOwnerFolder(userId, fileRecord._id);
  const copiedFilename = `v${nextVersionNumber}_restore_${selectedVersion.storedFilename}`;
  const copiedPath = path.join(ownerFolder, copiedFilename);

  await fs.copyFile(selectedVersion.storagePath, copiedPath);

  await Version.updateMany(
    { file: fileRecord._id, isCurrent: true },
    { $set: { isCurrent: false } },
  );

  const restoredVersion = await Version.create({
    file: fileRecord._id,
    owner: userId,
    versionNumber: nextVersionNumber,
    storedFilename: copiedFilename,
    originalName: selectedVersion.originalName,
    mimeType: selectedVersion.mimeType,
    size: selectedVersion.size,
    storagePath: copiedPath,
    status: "stable",
    summary: `Restored from version ${selectedVersion.versionNumber}.`,
    diffStats: { added: 0, removed: 0, modified: 0 },
    restoredFromVersionId: selectedVersion._id,
    isCurrent: true,
  });

  fileRecord.currentVersionNumber = nextVersionNumber;
  fileRecord.currentVersionId = restoredVersion._id;
  fileRecord.originalName = restoredVersion.originalName;
  fileRecord.mimeType = restoredVersion.mimeType;
  fileRecord.size = restoredVersion.size;
  await fileRecord.save();

  return {
    file: fileRecord,
    version: restoredVersion,
    restoredFrom: selectedVersion.versionNumber,
  };
}

export async function getCurrentVersionForFile(fileId, userId) {
  const version = await Version.findOne({
    file: fileId,
    owner: userId,
    isCurrent: true,
  }).lean();

  if (!version) {
    throw new AppError(404, "Current version not found");
  }

  return version;
}

export async function getVersionDiff({ userId, fileId, v1Id, v2Id }) {
  const file = await FileRecord.findOne({ _id: fileId, owner: userId, isDeleted: false });
  if (!file) throw new AppError(404, "File not found");

  const [v1, v2] = await Promise.all([
    Version.findOne({ _id: v1Id, file: fileId }),
    Version.findOne({ _id: v2Id, file: fileId }),
  ]);

  if (!v1 || !v2) throw new AppError(404, "One or both versions not found");

  const [text1, text2] = await Promise.all([
    readTextIfPossible(v1.storagePath, v1.mimeType, v1.originalName),
    readTextIfPossible(v2.storagePath, v2.mimeType, v2.originalName),
  ]);

  const diffStats = calculateLineDiff(text1, text2);
  const textDiff = generateTextDiff(text1, text2);

  return {
    v1: { id: v1._id, number: v1.versionNumber, summary: v1.summary },
    v2: { id: v2._id, number: v2.versionNumber, summary: v2.summary },
    diffStats,
    textDiff,
    v1Content: text1,
    v2Content: text2,
  };
}
