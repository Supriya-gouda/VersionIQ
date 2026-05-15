import { ApiError } from "./error-handler.js";
import { env } from "../config/env.js";

/**
 * Allowed file types and their MIME types
 */
export const ALLOWED_FILE_TYPES = {
  // Documents
  "application/pdf": { ext: "pdf", category: "document" },
  "application/msword": { ext: "doc", category: "document" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    ext: "docx",
    category: "document",
  },
  "application/vnd.ms-excel": { ext: "xls", category: "document" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    ext: "xlsx",
    category: "document",
  },

  // Text
  "text/plain": { ext: "txt", category: "text" },
  "text/html": { ext: "html", category: "text" },
  "text/css": { ext: "css", category: "text" },
  "application/json": { ext: "json", category: "text" },
  "application/xml": { ext: "xml", category: "text" },
  "text/yaml": { ext: "yaml", category: "text" },
  "text/markdown": { ext: "md", category: "text" },

  // Code
  "text/javascript": { ext: "js", category: "code" },
  "text/typescript": { ext: "ts", category: "code" },
  "text/x-python": { ext: "py", category: "code" },
  "text/x-java": { ext: "java", category: "code" },
  "text/x-csharp": { ext: "cs", category: "code" },
  "text/x-cpp": { ext: "cpp", category: "code" },

  // Images
  "image/jpeg": { ext: "jpg", category: "image" },
  "image/png": { ext: "png", category: "image" },
  "image/gif": { ext: "gif", category: "image" },
  "image/webp": { ext: "webp", category: "image" },
  "image/svg+xml": { ext: "svg", category: "image" },

  // Archives
  "application/zip": { ext: "zip", category: "archive" },
  "application/x-rar-compressed": { ext: "rar", category: "archive" },
  "application/gzip": { ext: "gz", category: "archive" },
  "application/x-7z-compressed": { ext: "7z", category: "archive" },
};

/**
 * Validate file upload
 */
export function validateFileUpload(file, options = {}) {
  const {
    maxSize = env.maxUploadSizeBytes,
    allowedTypes = Object.keys(ALLOWED_FILE_TYPES),
    allowedExtensions = null,
  } = options;

  if (!file) {
    throw ApiError.badRequest("NO_FILE", "No file provided");
  }

  const { originalname, size, mimetype } = file;

  // Check file size
  if (size > maxSize) {
    const maxMb = (maxSize / (1024 * 1024)).toFixed(2);
    throw ApiError.badRequest("FILE_TOO_LARGE", `File size must be less than ${maxMb}MB`);
  }

  // Check MIME type
  if (!allowedTypes.includes(mimetype)) {
    throw ApiError.badRequest("INVALID_FILE_TYPE", `File type ${mimetype} is not allowed`);
  }

  // Check extension if specified
  if (allowedExtensions) {
    const ext = originalname.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw ApiError.badRequest("INVALID_FILE_EXTENSION", `File extension .${ext} is not allowed`);
    }
  }

  return {
    originalName: originalname,
    size,
    mimeType: mimetype,
    fileInfo: ALLOWED_FILE_TYPES[mimetype],
    isImage: mimetype.startsWith("image/"),
    isDocument: mimetype.includes("document") || mimetype.includes("pdf"),
    isText:
      mimetype.startsWith("text/") ||
      ["application/json", "application/xml", "application/yaml"].includes(mimetype),
  };
}

/**
 * Middleware to validate uploaded file
 */
export function fileUploadValidator(options = {}) {
  return (req, res, next) => {
    try {
      if (!req.file) {
        throw ApiError.badRequest("NO_FILE", "No file provided");
      }

      const validation = validateFileUpload(req.file, options);
      req.fileValidation = validation;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename) {
  // Remove path separators and dangerous characters
  return filename
    .replace(/\.\./g, "") // Remove ..
    .replace(/[\/\\]/g, "") // Remove slashes
    .replace(/[<>:"|?*]/g, "") // Remove Windows forbidden chars
    .substring(0, 255); // Limit length
}

/**
 * Generate safe storage filename
 */
export function generateStorageFilename(originalFilename, fileId) {
  const ext = originalFilename.split(".").pop();
  const sanitized = sanitizeFilename(originalFilename.replace(/\.[^.]+$/, ""));
  const timestamp = Date.now();
  // Format: fileId_timestamp_sanitized.ext
  return `${fileId}_${timestamp}_${sanitized}.${ext}`;
}
