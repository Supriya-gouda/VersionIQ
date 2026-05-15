import { PipelineLog } from "../models/pipeline-log.model.js";

/**
 * Calculate stability score for a version based on multiple factors
 */
export async function calculateVersionStability(version, allVersions, index) {
  let stabilityScore = 50; // Base score

  // Factor 1: Explicit status
  if (version.status === "stable") stabilityScore += 30;
  else if (version.status === "risky") stabilityScore -= 20;
  else if (version.status === "failed") stabilityScore -= 50;

  // Factor 2: Recency penalty (older versions get lower scores)
  const agePenalty = allVersions.length - index - 1;
  stabilityScore -= Math.min(agePenalty * 2, 20);

  // Factor 3: Upload consistency (detect volatile uploads)
  if (index > 0) {
    const timeDiff = new Date(version.createdAt) - new Date(allVersions[index - 1].createdAt);
    const hoursAgo = timeDiff / (1000 * 60 * 60);

    // Frequent uploads (multiple per day) suggest instability
    if (hoursAgo < 2 && index < allVersions.length - 3) {
      stabilityScore -= 15;
    }
  }

  // Factor 4: File size changes (large changes can indicate problems)
  if (index > 0) {
    const previousSize = allVersions[index - 1].size || 0;
    const currentSize = version.size || 0;
    const sizeChange = Math.abs(currentSize - previousSize) / (previousSize || 1);

    if (sizeChange > 0.5) {
      stabilityScore -= 10; // Large changes are slightly riskier
    }
  }

  // Factor 5: Pipeline success rate
  try {
    const pipelines = await PipelineLog.find({
      tags: { $in: [`version:${version.versionNumber}`] },
    }).limit(10);

    if (pipelines.length > 0) {
      const successCount = pipelines.filter((p) => p.status === "success").length;
      const successRate = successCount / pipelines.length;

      if (successRate === 1) stabilityScore += 20;
      else if (successRate > 0.8) stabilityScore += 10;
      else if (successRate < 0.5) stabilityScore -= 25;
    }
  } catch {
    // Pipeline data not available, skip this factor
  }

  // Normalize to 0-100
  return Math.min(Math.max(stabilityScore, 0), 100);
}

/**
 * Classify version based on stability metrics
 */
export function classifyVersion(stabilityScore) {
  if (stabilityScore >= 70) return "stable";
  if (stabilityScore >= 40) return "risky";
  return "failed";
}

/**
 * Assign detailed status with reasoning
 */
export function assignVersionStatus(version, stabilityScore, shouldRestore = false) {
  const classification = classifyVersion(stabilityScore);

  let reason = "";
  if (stabilityScore >= 80) {
    reason = "Excellent stability metrics";
  } else if (stabilityScore >= 70) {
    reason = "Good stability score";
  } else if (stabilityScore >= 50) {
    reason = "Moderate stability concerns";
  } else if (stabilityScore >= 30) {
    reason = "Multiple stability risks detected";
  } else {
    reason = "Critical stability issues";
  }

  return {
    status: classification,
    reason,
    score: stabilityScore,
    recommended: shouldRestore,
  };
}

/**
 * Generate recommendation explanation
 */
function generateRecommendationRationale(
  recommendedVersion,
  recommendationScore,
  allVersions,
  candidateIndex,
) {
  const reasons = [];
  const confidenceLevel =
    recommendationScore > 80 ? "high" : recommendationScore > 60 ? "medium" : "low";

  // Reason 1: Stability
  if (recommendedVersion.status === "stable") {
    reasons.push(`Version ${recommendedVersion.versionNumber} has a stable status`);
  }

  // Reason 2: Recency
  if (candidateIndex < 3) {
    reasons.push("Recent version with fresh code");
  }

  // Reason 3: Track record
  if (recommendationScore > 75) {
    reasons.push("Strong historical stability");
  }

  return {
    summary: `Version ${recommendedVersion.versionNumber} is recommended for rollback`,
    reasons,
    confidence: confidenceLevel,
    confidenceScore: Math.round(recommendationScore),
  };
}

/**
 * Find optimal rollback candidate
 */
export async function recommendRollback(versions, currentVersionNumber = null) {
  if (!Array.isArray(versions) || versions.length === 0) {
    return {
      status: "error",
      message: "No versions available",
      recommendation: null,
    };
  }

  // Skip current version if specified
  const candidateVersions = currentVersionNumber
    ? versions.filter((v) => v.versionNumber !== currentVersionNumber)
    : versions;

  if (candidateVersions.length === 0) {
    return {
      status: "error",
      message: "No previous versions available",
      recommendation: null,
    };
  }

  // Score all candidates
  const scored = await Promise.all(
    candidateVersions.map(async (version, index) => {
      const stabilityScore = await calculateVersionStability(version, candidateVersions, index);
      return {
        version,
        index,
        stabilityScore,
        classification: classifyVersion(stabilityScore),
      };
    }),
  );

  // Sort by score (descending)
  scored.sort((a, b) => b.stabilityScore - a.stabilityScore);

  const topCandidates = scored.slice(0, 3);
  const recommended = topCandidates[0];

  const rationale = generateRecommendationRationale(
    recommended.version,
    recommended.stabilityScore,
    candidateVersions,
    recommended.index,
  );

  return {
    status: "success",
    recommendation: {
      recommendedVersionId: recommended.version._id,
      versionNumber: recommended.version.versionNumber,
      classification: recommended.classification,
      stabilityScore: Math.round(recommended.stabilityScore),
      rationale: rationale.summary,
      reasons: rationale.reasons,
      confidence: rationale.confidence,
      confidenceScore: rationale.confidenceScore,
      timestamp: new Date().toISOString(),
    },
    alternatives: topCandidates.slice(1).map((candidate) => ({
      recommendedVersionId: candidate.version._id,
      versionNumber: candidate.version.versionNumber,
      stabilityScore: Math.round(candidate.stabilityScore),
      classification: candidate.classification,
    })),
  };
}

/**
 * Get versions ranked by recommendation score
 */
export async function rankVersionsByStability(versions) {
  const scored = await Promise.all(
    versions.map(async (version, index) => {
      const stabilityScore = await calculateVersionStability(version, versions, index);
      return {
        _id: version._id,
        versionNumber: version.versionNumber,
        stabilityScore: Math.round(stabilityScore),
        classification: classifyVersion(stabilityScore),
        createdAt: version.createdAt,
      };
    }),
  );

  scored.sort((a, b) => b.stabilityScore - a.stabilityScore);
  return scored;
}
