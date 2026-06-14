import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import mammoth from "mammoth";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

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

function isPdf(mimeType, originalName = "") {
  return mimeType === "application/pdf" || originalName.toLowerCase().endsWith(".pdf");
}

function isWord(mimeType, originalName = "") {
  const lower = originalName.toLowerCase();
  return (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx")
  );
}

/**
 * Validate extracted text and detect issues (e.g., scanned PDFs)
 */
function validateExtractedText(text, filePath, mimeType) {
  const fileName = path.basename(filePath);
  const MIN_CONTENT_LENGTH = 10; // Minimum characters for valid content

  // Check 1: Not empty
  if (!text || text.length === 0) {
    const suggestOcr = isPdf(mimeType, fileName);
    console.warn(
      `[WARNING] No text extracted from "${fileName}"${suggestOcr ? " (possibly scanned PDF - OCR not supported)" : ""}`,
    );
    return {
      valid: false,
      text: "",
      reason: "empty",
      suggestOcr,
      characterCount: 0,
    };
  }

  // Check 2: Contains actual content (not just whitespace)
  const trimmedLength = text.trim().length;
  if (trimmedLength === 0) {
    console.warn(`[WARNING] Extracted text is only whitespace from "${fileName}"`);
    return {
      valid: false,
      text: "",
      reason: "whitespace_only",
      suggestOcr: isPdf(mimeType, fileName),
      characterCount: 0,
    };
  }

  // Check 3: Minimum length threshold
  if (trimmedLength < MIN_CONTENT_LENGTH) {
    console.warn(
      `[WARNING] Extracted text very short (${trimmedLength} chars) from "${fileName}" - may be mostly empty`,
    );
    return {
      valid: false,
      text: text,
      reason: "too_short",
      suggestOcr: false,
      characterCount: trimmedLength,
    };
  }

  // Passed all validations
  console.log(
    `[INFO] ✓ Successfully extracted ${trimmedLength} characters from "${fileName}" (file type: ${mimeType})`,
  );
  return {
    valid: true,
    text: text,
    reason: "success",
    suggestOcr: false,
    characterCount: trimmedLength,
  };
}

async function readTextIfPossible(filePath, mimeType, originalName = "") {
  const fileName = path.basename(filePath);

  if (isPdf(mimeType, originalName)) {
    try {
      console.log(`[INFO] Attempting to extract text from PDF: "${fileName}"`);
      const dataBuffer = await fs.readFile(filePath);
      console.log(`[INFO] PDF buffer loaded: ${dataBuffer.length} bytes`);

      let extractedText = "";
      let numpages = "?";

      if (typeof pdfParse === "function") {
        // Fallback for pdf-parse v1
        const data = await pdfParse(dataBuffer);
        extractedText = data.text || "";
        numpages = data.numpages || "?";
      } else if (pdfParse.PDFParse) {
        // Support for pdf-parse v2.4.5+
        const uint8Array = new Uint8Array(dataBuffer);
        const parser = new pdfParse.PDFParse(uint8Array);
        const data = await parser.getText();
        extractedText = data.text || "";
        numpages = data.total || "?";
      }

      console.log(
        `[INFO] PDF extraction complete: ${extractedText.length} characters, ${numpages} pages`,
      );
      return extractedText;
    } catch (error) {
      console.error(
        `[ERROR] Failed to parse PDF "${fileName}": ${error.message || error.toString()}`,
      );
      return "";
    }
  }

  if (isWord(mimeType, originalName)) {
    try {
      console.log(`[INFO] Attempting to extract text from Word document: "${fileName}"`);
      const result = await mammoth.extractRawText({ path: filePath });
      const extractedText = (result && result.value) || "";
      console.log(`[INFO] Word extraction complete: ${extractedText.length} characters`);
      return extractedText;
    } catch (error) {
      console.error(
        `[ERROR] Failed to parse Word document "${fileName}": ${error.message || error.toString()}`,
      );
      return "";
    }
  }

  if (!isTextLikeMime(mimeType, originalName)) {
    console.log(
      `[INFO] File "${fileName}" is not text-like (mime: ${mimeType}) - skipping extraction`,
    );
    return "";
  }

  try {
    console.log(`[INFO] Attempting to read text file: "${fileName}"`);
    const text = await fs.readFile(filePath, "utf-8");
    console.log(`[INFO] Text file read: ${text.length} characters`);
    return text;
  } catch (error) {
    console.error(`[ERROR] Failed to read text file "${fileName}": ${error.message}`);
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

  console.log(
    `[INFO] ========== FILE UPLOAD START ==========\n[INFO] File: ${upload.originalname} | Size: ${upload.size} bytes | MIME: ${upload.mimetype}`,
  );

  let fileRecord = null;
  if (fileId && fileId !== "null" && fileId !== "undefined") {
    try {
      fileRecord = await FileRecord.findOne({ _id: fileId, owner: userId, isDeleted: false });
      if (!fileRecord) {
        throw new AppError(404, "File not found");
      }
      console.log(`[INFO] Found existing file record - creating new version`);
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
    console.log(`[INFO] Created new file record: ${fileRecord._id}`);
  }

  const lastVersion = await Version.findOne({ file: fileRecord._id }).sort({ versionNumber: -1 });
  const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;
  console.log(`[INFO] Next version number: ${nextVersionNumber}`);

  const ownerFolder = await ensureOwnerFolder(userId, fileRecord._id);
  const storedFilename = `v${nextVersionNumber}_${upload.filename}`;
  const finalPath = path.join(ownerFolder, storedFilename);

  await moveUploadedFile(upload.path, finalPath);
  console.log(`[INFO] File moved to permanent storage: ${finalPath}`);

  // Extract text from previous version
  console.log(`\n[INFO] ========== TEXT EXTRACTION PHASE ==========`);
  let previousText = "";
  let previousTextValidation = { valid: false, characterCount: 0, reason: "no_previous_version" };

  if (lastVersion) {
    console.log(`[INFO] Extracting text from previous version (v${lastVersion.versionNumber})`);
    const tempText = await readTextIfPossible(
      lastVersion.storagePath,
      lastVersion.mimeType,
      lastVersion.originalName,
    );
    previousTextValidation = validateExtractedText(
      tempText,
      lastVersion.storagePath,
      lastVersion.mimeType,
    );
    previousText = previousTextValidation.text;
  } else {
    console.log(`[INFO] No previous version - this is the first upload`);
  }

  // Extract text from current version
  console.log(`[INFO] Extracting text from current version (v${nextVersionNumber})`);
  const tempText = await readTextIfPossible(finalPath, upload.mimetype, upload.originalname);
  const currentTextValidation = validateExtractedText(tempText, finalPath, upload.mimetype);
  const nextText = currentTextValidation.text;

  // Diff and Summary phase
  console.log(`\n[INFO] ========== DIFF & SUMMARY PHASE ==========`);

  let diffStats = { added: 0, removed: 0, modified: 0 };
  let summary = { summary: `Version ${nextVersionNumber} uploaded.` };
  let pipelineError = null;

  try {
    // Calculate diff
    console.log(`[INFO] Calculating line-based diff...`);
    diffStats = calculateLineDiff(previousText, nextText);
    console.log(
      `[INFO] Diff complete: +${diffStats.added} -${diffStats.removed} ~${diffStats.modified} lines, ${diffStats.similarity}% similar`,
    );

    // Generate summary
    console.log(
      `[INFO] Starting AI summary generation (currentText: ${nextText.length} chars, previousText: ${previousText.length} chars)`,
    );
    const summaryResult = await generateSummary({
      diffStats,
      versionNumber: nextVersionNumber,
      previousContent: previousText,
      currentContent: nextText,
    });
    summary = summaryResult;
    console.log(
      `[INFO] Summary generated from source: ${summary.source} | Length: ${summary.summary.length} chars`,
    );
  } catch (error) {
    pipelineError = error;
    console.error(
      `[ERROR] Diff/Summary pipeline failed: ${error.message || error.toString()}\n[ERROR] Stack: ${error.stack}`,
    );
    console.warn(`[WARNING] Using fallback summary for version ${nextVersionNumber}`);
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
    content: nextText,
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

  console.log(`[INFO] ========== FILE UPLOAD COMPLETE ==========`);
  console.log(
    `[INFO] Version ${nextVersionNumber} saved | Summary: ${summary.source} | Text extracted: ${currentTextValidation.characterCount} chars`,
  );
  if (pipelineError) {
    console.log(`[INFO] Note: Pipeline encountered error but continued with fallback\n`);
  } else {
    console.log(`[INFO] Pipeline completed successfully\n`);
  }

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
    content: selectedVersion.content,
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

  let semanticSummary = null;
  try {
    const summaryResult = await generateSummary({
      diffStats,
      versionNumber: v2.versionNumber,
      previousContent: text1,
      currentContent: text2,
    });
    semanticSummary = summaryResult;
  } catch (error) {
    console.error(`[ERROR] Failed to generate semantic summary for diff: ${error.message}`);
  }

  return {
    v1: { id: v1._id, number: v1.versionNumber, summary: v1.summary },
    v2: { id: v2._id, number: v2.versionNumber, summary: v2.summary },
    diffStats,
    textDiff,
    semanticSummary,
    v1Content: text1,
    v2Content: text2,
  };
}
