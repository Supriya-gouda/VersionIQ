/**
 * Pipeline Controller
 *
 * Handles CI/CD pipeline status, sync, stats, and the Jenkins webhook.
 * The webhook lets Jenkins push build results directly into MongoDB so the
 * DevOps dashboard always has fresh data — even when Jenkins is offline.
 */

import { env } from "../config/env.js";
import { PipelineLog } from "../models/pipeline-log.model.js";
import { Activity } from "../models/activity.model.js";
import { User } from "../models/user.model.js";
import {
  getPipelineLogs,
  getPipelineStats,
  syncJenkinsPipelineLogs,
} from "../services/jenkins.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import axios from "axios";

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
    { upsert: true },
  );

  res.status(200).json({
    success: true,
    message: `Pipeline run #${buildNumber} recorded`,
    buildNumber: Number(buildNumber),
    pipeline,
    status: normalizedStatus,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /pipelines/github-webhook
// Receives push events from GitHub.
// 1. Logs the activity in MongoDB (for the dashboard).
// 2. Forwards the request to Jenkins (to trigger the CI/CD pipeline).
// ─────────────────────────────────────────────────────────────────────────────
export const githubWebhookController = asyncHandler(async (req, res) => {
  const event = req.headers["x-github-event"];
  const payload = req.body;

  console.log(`[Webhook] Received GitHub event: ${event}`);

  if (event === "push") {
    const branch = payload.ref?.split("/").pop() || "unknown";
    const commitMsg = payload.head_commit?.message || "No message";
    const authorName = payload.head_commit?.author?.name || "Unknown";
    const authorEmail = payload.head_commit?.author?.email;

    // 1. Log Activity
    try {
      // Find a user to associate this with (optional but good for UI)
      let user = null;
      if (authorEmail) {
        user = await User.findOne({ email: authorEmail.toLowerCase() });
      }
      if (!user) {
        user = await User.findOne().sort({ createdAt: 1 }); // Fallback to first user
      }

      if (user) {
        await Activity.create({
          owner: user._id,
          type: "git_push",
          fileName: branch,
          details: `pushed: "${commitMsg.split("\n")[0]}" by ${authorName}`,
        });
      }
    } catch (err) {
      console.error("[Webhook] Failed to log activity:", err.message);
    }

    // 2. Proxy to Jenkins
    // We use the internal Docker service name 'jenkins' to reach it.
    const jenkinsUrl = "http://jenkins:8080/github-webhook/";
    try {
      const jRes = await axios.post(jenkinsUrl, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-GitHub-Event": "push",
          "X-GitHub-Delivery": req.headers["x-github-delivery"] || "",
          "X-Hub-Signature": req.headers["x-hub-signature"] || "",
          "X-Hub-Signature-256": req.headers["x-hub-signature-256"] || "",
        },
        timeout: 5000,
      });
      console.log(`[Webhook] Successfully forwarded to Jenkins: ${jRes.status} ${jRes.statusText}`);
    } catch (err) {
      console.warn("[Webhook] Could not forward to Jenkins:", err.response?.status || err.message);
    }
  }

  // Always return 200 to GitHub
  res.status(200).json({ success: true, event });
});
