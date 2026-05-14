import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), ".env");
const examplePath = path.resolve(process.cwd(), ".env.example");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

if (fs.existsSync(examplePath)) {
  dotenv.config({ path: examplePath, override: false });
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongodbUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  uploadRoot: process.env.UPLOAD_ROOT ?? "uploads",
  maxUploadSizeBytes: Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 100 * 1024 * 1024), // 100MB
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
  jenkinsBaseUrl: process.env.JENKINS_BASE_URL ?? "",
  jenkinsUser: process.env.JENKINS_USER ?? "",
  jenkinsToken: process.env.JENKINS_TOKEN ?? "",
  jenkinsJobName: process.env.JENKINS_JOB_NAME ?? "",
  jenkinsWebhookSecret: process.env.JENKINS_WEBHOOK_SECRET ?? "",
  enableRateLimit: process.env.ENABLE_RATE_LIMIT !== "false",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000), // 15 min
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),
  logLevel: process.env.LOG_LEVEL ?? "info",
};

// Parse client origins into an array for CORS checks
env.clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function validateEnv() {
  const required = [
    ["MONGODB_URI", env.mongodbUri, "MongoDB connection URI (local or Atlas)"],
    ["JWT_SECRET", env.jwtSecret, "Secret key for JWT signing"],
  ];

  const missing = required
    .filter(([, value]) => !value)
    .map(([key, , description]) => `${key} (${description})`);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((m) => `  - ${m}`).join("\n")}`
    );
  }

  // Validate MongoDB URI format
  if (!env.mongodbUri.startsWith("mongodb://") && !env.mongodbUri.startsWith("mongodb+srv://")) {
    throw new Error(
      "MONGODB_URI must be a valid MongoDB connection string (mongodb:// or mongodb+srv://)"
    );
  }

  // Warn about insecure configurations in production
  if (env.nodeEnv === "production") {
    if (env.jwtSecret.length < 32) {
      console.warn("⚠️ WARNING: JWT_SECRET is less than 32 characters (recommended for production)");
    }
    if (env.clientOrigin === "http://localhost:3000") {
      console.warn("⚠️ WARNING: CLIENT_ORIGIN is localhost (should be production domain in production)");
    }
  }
}

// Validate on import
validateEnv();
