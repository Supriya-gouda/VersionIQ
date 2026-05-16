/**
 * Convert content to lines
 */
function toLines(value) {
  return String(value ?? "").split(/\r?\n/);
}

/**
 * Calculate Longest Common Subsequence for better diff accuracy
 */
function lcs(arr1, arr2) {
  // Limit LCS to prevent memory issues with very large files
  const MAX_LINES = 1000;
  const lines1 = arr1.slice(0, MAX_LINES);
  const lines2 = arr2.slice(0, MAX_LINES);

  const m = lines1.length;
  const n = lines2.length;

  if (m === 0 || n === 0) return 0;

  // Use a more memory-efficient 1D array approach for LCS length
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (lines1[i - 1] === lines2[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    [prev, curr] = [curr, prev];
    curr.fill(0);
  }

  return prev[n];
}

/**
 * Calculate line-based diff with better accuracy
 */
export function calculateLineDiff(previousContent = "", nextContent = "") {
  const previousLines = toLines(previousContent).filter((l) => l.trim());
  const nextLines = toLines(nextContent).filter((l) => l.trim());

  const previousSet = new Set(previousLines);
  const nextSet = new Set(nextLines);

  let added = 0;
  let removed = 0;

  // Count added lines
  for (const line of nextSet) {
    if (!previousSet.has(line)) {
      added++;
    }
  }

  // Count removed lines
  for (const line of previousSet) {
    if (!nextSet.has(line)) {
      removed++;
    }
  }

  // Calculate similarity using LCS
  const commonSubseqLength = lcs(previousLines, nextLines);
  const totalLines = Math.max(previousLines.length, nextLines.length);
  const similarity = totalLines > 0 ? (commonSubseqLength / totalLines) * 100 : 0;

  return {
    added,
    removed,
    modified: Math.min(added, removed),
    totalAdded: added,
    totalRemoved: removed,
    similarity: Math.round(similarity),
    previousLineCount: previousLines.length,
    nextLineCount: nextLines.length,
  };
}

/**
 * Generate a textual diff (unified-like format) for AI context
 */
/**
 * Generate a full textual diff for the entire file
 */
export function generateTextDiff(previousContent = "", nextContent = "") {
  const s1 = toLines(previousContent);
  const s2 = toLines(nextContent);
  
  const m = s1.length;
  const n = s2.length;
  
  // Basic dynamic programming for LCS path
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const result = [];
  let i = m, j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && s1[i - 1] === s2[j - 1]) {
      result.push(`  ${s1[i - 1]}`);
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push(`+ ${s2[j - 1]}`);
      j--;
    } else {
      result.push(`- ${s1[i - 1]}`);
      i--;
    }
  }

  return result.reverse().join("\n");
}

/**
 * Parse JSON safely for better diff
 */
function tryParseJson(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Parse YAML-like content (simple key-value)
 */
function tryParseYaml(content) {
  const lines = content.split("\n");
  const result = {};

  for (const line of lines) {
    const match = line.match(/^[\s]*([^:]+):\s*(.+)$/);
    if (match) {
      result[match[1].trim()] = match[2].trim();
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Detect file type from MIME type or content
 */
export function detectFileType(mimeType, filename = "") {
  if (mimeType.includes("json")) return "json";
  if (mimeType.includes("yaml") || mimeType.includes("yml")) return "yaml";
  if (mimeType.includes("markdown") || filename.endsWith(".md")) return "markdown";
  if (mimeType.includes("xml")) return "xml";
  if (mimeType.includes("html")) return "html";
  if (mimeType.includes("css")) return "css";
  if (mimeType.includes("javascript") || mimeType.includes("typescript")) return "javascript";
  if (mimeType.includes("python")) return "python";
  if (mimeType.startsWith("text/")) return "text";
  return "binary";
}

/**
 * Generate structured summary with Added/Removed/Modified sections
 */
export function buildLocalSummary(diffStats, versionNumber) {
  const parts = [];

  if (diffStats.added > 0) {
    parts.push(`**${diffStats.added}** lines added`);
  }
  if (diffStats.removed > 0) {
    parts.push(`**${diffStats.removed}** lines removed`);
  }
  if (diffStats.modified > 0) {
    parts.push(`**${diffStats.modified}** lines modified`);
  }

  if (parts.length === 0) {
    return `Version ${versionNumber} has no changes.`;
  }

  const similarity = diffStats.similarity ? ` (${diffStats.similarity}% similar)` : "";
  return `Version ${versionNumber}: ${parts.join(", ")}${similarity}`;
}

/**
 * Build detailed summary with sections
 */
export function buildDetailedSummary(diffStats, versionNumber) {
  const sections = [];

  sections.push(`# Version ${versionNumber} Summary\n`);

  if (diffStats.added > 0) {
    sections.push(`## Added\n- ${diffStats.added} lines added\n`);
  }

  if (diffStats.removed > 0) {
    sections.push(`## Removed\n- ${diffStats.removed} lines removed\n`);
  }

  if (diffStats.modified > 0) {
    sections.push(`## Modified\n- ${diffStats.modified} lines modified\n`);
  }

  if (diffStats.similarity !== undefined) {
    sections.push(`## Similarity\n${diffStats.similarity}% similar to previous version\n`);
  }

  sections.push(`## Statistics\n`);
  sections.push(`- Lines in previous: ${diffStats.previousLineCount || 0}\n`);
  sections.push(`- Lines in current: ${diffStats.nextLineCount || 0}\n`);

  return sections.join("\n");
}
