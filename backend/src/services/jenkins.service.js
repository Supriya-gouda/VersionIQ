import axios from "axios";

import { env } from "../config/env.js";
import { PipelineLog } from "../models/pipeline-log.model.js";
import { ApiError } from "../middleware/error-handler.js";

/**
 * Map Jenkins build result to standard status
 */
function mapJenkinsResult(result) {
  if (!result) return "running";
  const normalized = String(result).toUpperCase();
  switch (normalized) {
    case "SUCCESS":
      return "success";
    case "FAILURE":
      return "failed";
    case "UNSTABLE":
      return "unstable";
    case "ABORTED":
      return "aborted";
    case "NOT_BUILT":
      return "not_built";
    default:
      return "unknown";
  }
}

/**
 * Build Basic Auth header for Jenkins
 */
function buildAuthHeader() {
  if (!env.jenkinsUser || !env.jenkinsToken) {
    return {};
  }

  const basic = Buffer.from(`${env.jenkinsUser}:${env.jenkinsToken}`).toString("base64");
  return { Authorization: `Basic ${basic}` };
}

/**
 * Validate Jenkins configuration
 */
function validateJenkinsConfig() {
  if (!env.jenkinsBaseUrl) {
    throw ApiError.badRequest(
      "JENKINS_NOT_CONFIGURED",
      "Jenkins base URL not configured (JENKINS_BASE_URL)",
    );
  }
  if (!env.jenkinsJobName) {
    throw ApiError.badRequest(
      "JENKINS_JOB_NOT_CONFIGURED",
      "Jenkins job name not configured (JENKINS_JOB_NAME)",
    );
  }
}

/**
 * Get Jenkins job API URL
 */
function getJenkinsJobUrl() {
  const baseUrl = env.jenkinsBaseUrl.replace(/\/$/, "");
  const jobName = encodeURIComponent(env.jenkinsJobName);
  return `${baseUrl}/job/${jobName}/api/json`;
}

/**
 * Fetch builds from Jenkins
 */
async function fetchJenkinsBuilds(limit = 30) {
  try {
    const url = `${getJenkinsJobUrl()}?tree=builds[number,result,duration,timestamp,url,actions[lastBuiltRevision[SHA1],causes[userName,shortDescription]]]&depth=1`;

    const response = await axios.get(url, {
      headers: {
        ...buildAuthHeader(),
      },
      timeout: 10000,
    });

    if (!response.data?.builds) {
      throw new Error("Invalid Jenkins response format");
    }

    return response.data.builds.slice(0, limit);
  } catch (error) {
    console.error(`Failed to fetch Jenkins builds: ${error.message}`);
    throw ApiError.internal(
      "JENKINS_API_ERROR",
      `Failed to fetch Jenkins builds: ${error.message}`,
    );
  }
}

/**
 * Extract build metadata from Jenkins build
 */
function extractBuildMetadata(build) {
  const commit =
    build.actions?.find((item) => item?.lastBuiltRevision?.SHA1)?.lastBuiltRevision?.SHA1 ?? "";

  const causesArray = build.actions?.flatMap((item) => item?.causes ?? []) ?? [];
  const userCause = causesArray.find((cause) => cause?.userName);
  const author = userCause?.userName ?? causesArray[0]?.shortDescription ?? "Jenkins";

  const startedAt = build.timestamp ? new Date(build.timestamp) : null;
  const finishedAt =
    build.timestamp && build.duration ? new Date(build.timestamp + build.duration) : null;

  return {
    commit: commit.substring(0, 40), // Limit to 40 chars
    author: author.substring(0, 100),
    startedAt,
    finishedAt,
    durationMs: Math.max(0, build.duration ?? 0),
  };
}

/**
 * Sync Jenkins pipeline logs to database
 */
export async function syncJenkinsPipelineLogs() {
  try {
    validateJenkinsConfig();
  } catch (error) {
    console.warn(`Jenkins not configured: ${error.message}`);
    return { synced: 0, skipped: true, message: error.message };
  }

  try {
    const builds = await fetchJenkinsBuilds(30);

    let synced = 0;
    let errors = 0;

    for (const build of builds) {
      try {
        const metadata = extractBuildMetadata(build);
        const status = mapJenkinsResult(build.result);

        await PipelineLog.updateOne(
          {
            pipeline: env.jenkinsJobName,
            buildNumber: build.number,
          },
          {
            $set: {
              source: "jenkins",
              pipeline: env.jenkinsJobName,
              buildNumber: build.number,
              status,
              commit: metadata.commit,
              author: metadata.author,
              durationMs: metadata.durationMs,
              startedAt: metadata.startedAt,
              finishedAt: metadata.finishedAt,
              url: build.url ?? "",
              syncedAt: new Date(),
            },
          },
          { upsert: true },
        );

        synced++;
      } catch (error) {
        console.warn(`Failed to sync build ${build.number}: ${error.message}`);
        errors++;
      }
    }

    const result = {
      synced,
      errors,
      skipped: false,
      timestamp: new Date().toISOString(),
    };

    console.log(`Pipeline sync: ${synced} synced, ${errors} errors`);
    return result;
  } catch (error) {
    console.error(`Pipeline sync failed: ${error.message}`);
    throw error;
  }
}

/**
 * Get recent pipeline logs
 */
export async function getPipelineLogs(limit = 20, filter = {}) {
  try {
    const query = {
      ...filter,
    };

    const logs = await PipelineLog.find(query)
      .sort({ startedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return {
      items: logs,
      count: logs.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to fetch pipeline logs: ${error.message}`);
    throw error;
  }
}

/**
 * Get pipeline statistics
 */
export async function getPipelineStats(days = 7) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await PipelineLog.find({
      startedAt: { $gte: since },
    }).lean();

    const stats = {
      total: logs.length,
      success: logs.filter((l) => l.status === "success").length,
      failed: logs.filter((l) => l.status === "failed").length,
      unstable: logs.filter((l) => l.status === "unstable").length,
      aborted: logs.filter((l) => l.status === "aborted").length,
      successRate:
        logs.length > 0
          ? ((logs.filter((l) => l.status === "success").length / logs.length) * 100).toFixed(2)
          : 0,
      averageDurationMs:
        logs.length > 0
          ? Math.round(logs.reduce((sum, l) => sum + (l.durationMs || 0), 0) / logs.length)
          : 0,
    };

    return stats;
  } catch (error) {
    console.error(`Failed to calculate pipeline stats: ${error.message}`);
    throw error;
  }
}

/**
 * Clean up old pipeline logs
 */
export async function cleanupOldPipelineLogs(olderThanDays = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await PipelineLog.deleteMany({
      startedAt: { $lt: cutoffDate },
    });

    console.log(`Cleaned up ${result.deletedCount} old pipeline logs`);
    return { deletedCount: result.deletedCount };
  } catch (error) {
    console.error(`Failed to cleanup pipeline logs: ${error.message}`);
    throw error;
  }
}
