import express from "express";
import path from "node:path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler, asyncHandler } from "./middleware/error-handler.js";
import { responseFormatter } from "./middleware/response-formatter.js";
import { rateLimiters } from "./middleware/rate-limit.js";
import { authRouter } from "./routes/auth.routes.js";
import { fileRouter } from "./routes/file.routes.js";
import { pipelineRouter } from "./routes/pipeline.routes.js";
import { publicRouter } from "./routes/public.routes.js";

export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // allow requests with no origin (e.g., curl, server-to-server)
        if (!origin) return callback(null, true);
        if (env.clientOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS policy: origin ${origin} not allowed`));
      },
      credentials: false,
    }),
  );

  // Logging middleware
  app.use(morgan("dev"));

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Response formatter middleware
  app.use(responseFormatter);

  // Serve uploads as static
  app.use("/uploads", express.static(path.resolve(process.cwd(), env.uploadRoot)));

  // Health check endpoints — both /health and /api/health are supported
  // so Jenkins, Docker, and external monitors can all use their preferred path.
  const healthHandler = asyncHandler((_req, res) => {
    res.sendSuccess(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        env: env.nodeEnv,
      },
      "Healthy",
    );
  });

  app.get("/health", healthHandler);
  app.get("/api/health", healthHandler);

  // Root route - provide basic API info
  app.get(
    "/",
    asyncHandler((_req, res) => {
      res.sendSuccess(
        { service: "Version Vault Pro API", status: "ok", uptime: process.uptime() },
        "API root",
      );
    }),
  );

  // API Routes
  app.use("/auth", authRouter);
  app.use("/files", fileRouter);
  app.use("/pipelines", pipelineRouter);
  app.use("/public", publicRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
