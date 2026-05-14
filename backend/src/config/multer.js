import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import crypto from "crypto";

import { env } from "./env.js";

const uploadRootPath = path.resolve(process.cwd(), env.uploadRoot, "tmp");
fs.mkdirSync(uploadRootPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadRootPath);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename for temporary storage
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${timestamp}_${random}_${safeName}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: env.maxUploadSizeBytes,
  },
  fileFilter: (req, file, cb) => {
    // Basic file type check
    const allowedTypes = [
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // Text
      "text/plain",
      "text/html",
      "text/css",
      "application/json",
      "application/xml",
      "text/yaml",
      "text/markdown",
      // Code
      "text/javascript",
      "text/typescript",
      "text/x-python",
      "text/x-java",
      // Images
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      // Archives
      "application/zip",
      "application/x-rar-compressed",
      "application/gzip",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} is not allowed`));
    }

    cb(null, true);
  },
});
