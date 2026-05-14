/**
 * Pipeline Controller
 *
 * Handles CI/CD pipeline status, sync, stats, and the Jenkins webhook.
 * The webhook lets Jenkins push build results directly into MongoDB so the
 * DevOps dashboard always has fresh data — even when Jenkins is offline.
 */

import { env } from "../config/env.js";
import { PipelineLog } from "../models/pipeline-log.model.js";
import {
  getPipelineLogs,
  getPipelineStats,
  syncJenkinsPipelineLogs,
} from "../services/jenkins.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /pipelines/status
// Returns the most recent pipeline runs stored in MongoDB.
// ─────────────────────────────────────────────────────────────────────────────
export const listPipelineStatusController = asyncHandler(async (_req, res) => {
  const logs = await getPipelineLogs(20);

  res.status(200).json({
    success: true,
    pipelines: logs.items,
    count: logs.count,
    timestamp: logs.timestamp,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /pipelines/sync
// Pulls the latest builds from the Jenkins REST API and upserts them into
// MongoDB.  Falls back gracefully when Jenkins is not configured.
// ─────────────────────────────────────────────────────────────────────────────
export const syncPipelineStatusController = asyncHandler(async (_req, res) => {
  const result = await syncJenkinsPipelineLogs();
  const logs = await getPipelineLogs(20);

  res.status(200).json({
    success: true,
    sync: result,
    pipelines: logs.items,
    count: logs.count,
    timestamp: logs.timestamp,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /pipelines/stats
// Aggregated success/failure counts and average duration for the last N days.
// ─────────────────────────────────────────────────────────────────────────────
export const getPipelineStatsController = asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days ?? 7), 90);
  const stats = await getPipelineStats(days);

  res.status(200).json({
    success: true,
    stats,
    days,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /pipelines/webhook
// Jenkins calls this at the end of every build to record the result directly
// in MongoDB.  Protected by a shared secret in the X-Jenkins-Token header.
// If JENKINS_WEBHOOK_SECRET is not set the check is skipped (dev mode).
// ─────────────────────────────────────────────────────────────────────────────
export const pipelineWebhookController = asyncHandler(async (req, res) => {
  // Optional shared-secret guard
  const webhookSecret = env.jenkinsWebhookSecret;
  if (webhookSecret) {
    const incoming = req.headers["x-jenkins-token"] ?? "";
    if (incoming !== webhookSecret) {
      throw new AppError(401, "Invalid or missing X-Jenkins-Token header");
    }
  }

  const {
    buildNumber,
    pipeline,
    branch = "",
    commit = "",
    author = "Jenkins",
    status,
    durationMs = 0,
    startedAt,
    finishedAt,
    url = "",
    source = "jenkins",
    stages = [],
  } = req.body;

  // Validate required fields
  if (!buildNumber || !pipeline || !status) {
    throw new AppError(400, "buildNumber, pipeline, and status are required");
  }

  const validStatuses = ["success", "failed", "running", "queued", "aborted", "unknown"];
  const normalizedStatus = validStatuses.includes(status) ? status : "unknown";

  await PipelineLog.updateOne(
    { pipeline, buildNumber: Number(buildNumber) },
    {
      $set: {
        source,
        pipeline,
        buildNumber: Number(buildNumber),
        status: normalizedStatus,
        branch: String(branch).substring(0, 200),
        commit: String(commit).substring(0, 40),
        author: String(author).substring(0, 100),
        durationMs: Math.max(0, Number(durationMs)),
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        finishedAt: finishedAt ? new Date(finishedAt) : null,
        url: String(url).substring(0, 500),
        stages: Array.isArray(stages) ? stages.slice(0, 20) : [],
        syncedAt: new Date(),
      },
    },
    { upsert: true }
  );

  res.status(200).json({
    success: true,
    message: `Pipeline run #${buildNumber} recorded`,
    buildNumber: Number(buildNumber),
    pipeline,
    status: normalizedStatus,
  });
});
