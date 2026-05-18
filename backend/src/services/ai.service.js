import axios from "axios";

import { env } from "../config/env.js";
import {
  buildLocalSummary,
  buildDetailedSummary,
  detectFileType,
  calculateLineDiff,
  generateTextDiff,
} from "../utils/diff.js";

/**
 * Read and parse file content based on type
 */
async function readFileContentIfText(filePath, mimeType) {
  const fileType = detectFileType(mimeType, filePath);

  if (
    !mimeType.startsWith("text/") &&
    ![
      "application/json",
      "application/xml",
      "application/x-yaml",
      "application/javascript",
      "application/typescript",
    ].includes(mimeType) &&
    !filePath.match(/\.(txt|md|json|yaml|yml|js|ts|jsx|tsx|html|css|py|rb|go|java|c|cpp|h)$/i)
  ) {
    return null;
  }

  try {
    const fs = await import("fs/promises");
    const content = await fs.readFile(filePath, "utf-8");

    // Limit to 100KB for API calls
    if (content.length > 100 * 1024) {
      return content.substring(0, 100 * 1024) + "\n... (truncated)";
    }

    return content;
  } catch {
    return null;
  }
}

/**
 * Generate summary using local analysis only
 */
export async function generateLocalSummary(diffStats, versionNumber) {
  return buildLocalSummary(diffStats, versionNumber);
}

/**
 * Generate detailed summary with sections
 */
export async function generateDetailedSummary(diffStats, versionNumber) {
  return buildDetailedSummary(diffStats, versionNumber);
}

/**
 * Generate summary using AI providers with fallback
 */
export async function generateSummary({
  diffStats,
  versionNumber,
  previousContent = "",
  currentContent = "",
}) {
  const localSummary = buildLocalSummary(diffStats, versionNumber);
  const detailed = buildDetailedSummary(diffStats, versionNumber);

  // 1. Try Gemini if configured
  if (env.geminiApiKey) {
    try {
      const result = await generateGeminiSummary({
        diffStats,
        versionNumber,
        previousContent,
        currentContent,
      });
      const summary = typeof result === "string" ? result : result.summary;

      // 1.1 Verification Step
      const isGeneric =
        !summary ||
        summary.length < 15 ||
        /no substantial changes/i.test(summary);

      if (summary && !isGeneric) {
        return {
          summary,
          source: "gemini",
          model: env.geminiModel,
          detailed,
          aiDetails: {
            topicSummary: result.topicSummary || "",
            extraNotes: result.extraNotes || "",
            addedLines: result.added || [],
            removedLines: result.removed || [],
            modifiedLines: result.modified || [],
          },
        };
      }
      console.warn("Gemini produced a generic or empty summary, trying fallback...");
      return {
        summary: "Gemini returned a generic response. Try providing more context in your code changes.",
        source: "gemini",
        model: env.geminiModel,
        detailed,
        aiDetails: { topicSummary: "Generic Response", extraNotes: "The AI did not provide a substantial explanation for these changes." }
      };
    } catch (error) {
      console.warn(`Gemini summary failed: ${error.message}`);
      return {
        summary: `Gemini API Error: ${error.message}. Please check your connection, API key limits, or model status.`,
        source: "gemini",
        model: env.geminiModel,
        detailed,
        aiDetails: { topicSummary: "API Error", extraNotes: "Failed to communicate with Google Generative Language API." }
      };
    }
  }

  // 2. Try OpenAI if configured
  if (env.openAiApiKey) {
    try {
      const summary = await generateOpenAiSummary({
        diffStats,
        versionNumber,
        previousContent,
        currentContent,
      });
      if (summary) {
        return { summary, source: "openai", model: env.openAiModel, detailed };
      }
    } catch (error) {
      console.warn(`OpenAI summary failed: ${error.message}`);
    }
  }

  // 3. Fallback to local
  return {
    summary: localSummary,
    source: "local",
    detailed,
    aiDetails: {
      topicSummary: "AI summary unavailable",
      extraNotes: "Fell back to local line diff. Please ensure a valid GEMINI_API_KEY or OPENAI_API_KEY is set in backend/.env."
    }
  };
}

/**
 * Internal: Generate summary using OpenAI
 */
async function generateOpenAiSummary({
  diffStats,
  versionNumber,
  previousContent,
  currentContent,
}) {
  const messages = [
    {
      role: "system",
      content:
        "You are a high-level technical analyst. Summarize file changes in 1-2 friendly, readable sentences. Focus on what changed and why, avoiding technical jargon and raw code. Do not use diff symbols like + or -.",
    },
    {
      role: "user",
      content: buildPrompt({ diffStats, versionNumber, previousContent, currentContent }),
    },
  ];

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: env.openAiModel,
      messages,
      max_tokens: 150,
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${env.openAiApiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 8000,
    },
  );

  return response.data?.choices?.[0]?.message?.content?.trim();
}

/**
 * Internal: Generate summary using Gemini
 */
async function generateGeminiSummary({
  diffStats,
  versionNumber,
  previousContent,
  currentContent,
}) {
  const prompt = buildPrompt({ diffStats, versionNumber, previousContent, currentContent });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;

  const response = await axios.post(
    url,
    {
      contents: [
        {
          parts: [
            {
              text: `You are a high-level technical version control analyst. Your task is to explain file changes in PLAIN, READABLE English for a non-developer or a project manager.
---
CRITICAL INSTRUCTIONS:
1. Return a JSON object with the following structure:
{
  "summary": "A friendly 2-sentence summary. Focus on WHAT changed and WHY, not just line counts. (e.g. 'This update adds a feedback submission form and a view page, allowing students to submit their course experiences.')",
  "topicSummary": "The primary purpose of this file (e.g. 'Feedback Collection System')",
  "extraNotes": "One clear sentence on the business value or impact of this change.",
  "added": ["One-line summary of each major block added and its specific function (e.g. 'Database Connection: Established a link to the MySQL server to store student data')"],
  "removed": ["One-line summary of what was removed and why (e.g. 'Legacy Auth: Removed hardcoded credentials to improve security')"],
  "modified": ["One-line summary of changes to existing logic (e.g. 'Validation Logic: Updated the email check to support international domains')"]
}
2. AVOID technical jargon where possible. 
3. DO NOT include raw code snippets or diff symbols (+/-) in your text.
4. If a list is empty, return an empty array [].
5. Ensure the summary is engaging and easy to understand at a glance.

---
${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7,
        response_mime_type: "application/json",
      },
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    },
  );

  const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  try {
    return JSON.parse(raw);
  } catch (e) {
    // Fallback if JSON parsing fails despite response_mime_type
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Try to salvage at least the summary field if it's partially formed
        const summaryMatch = raw.match(/"summary"\s*:\s*"([^"]+)/);
        if (summaryMatch) {
          return { summary: summaryMatch[1] + "..." };
        }
        return { summary: "File changed but AI explanation was incomplete." };
      }
    }
    return { summary: "File changed but AI explanation was incomplete." };
  }
}

/**
 * Internal: Build standard prompt context
 */
function buildPrompt({ diffStats, versionNumber, previousContent, currentContent }) {
  const textDiff = generateTextDiff(previousContent, currentContent);

  let text = `FILE VERSION COMPARISON: v${versionNumber - 1} -> v${versionNumber}\n\n`;
  text += `STATISTICS:\n`;
  text += `- Added: ${diffStats.added} lines\n`;
  text += `- Removed: ${diffStats.removed} lines\n`;
  text += `- Modified: ${diffStats.modified} lines\n`;
  text += `- Similarity: ${diffStats.similarity || 0}%\n\n`;

  text += `CHANGES PREVIEW:\n${textDiff}\n\n`;

  if (previousContent && currentContent) {
    text += `FULL CONTENT CONTEXT (Partial):\n`;
    text += `--- v${versionNumber - 1} ---\n${previousContent.substring(0, 4000)}\n\n`;
    text += `--- v${versionNumber} ---\n${currentContent.substring(0, 4000)}\n`;
  }

  return text;
}

/**
 * Analyze file changes and generate comprehensive report
 */
export async function analyzeFileChanges({
  previousContent = "",
  currentContent = "",
  mimeType = "text/plain",
  versionNumber = 1,
}) {
  try {
    // Calculate diff stats
    const diffStats = calculateLineDiff(previousContent, currentContent);

    // Generate summary with AI fallback
    const summaryResult = await generateSummary({
      diffStats,
      versionNumber,
      previousContent,
      currentContent,
    });

    return {
      diffStats,
      ...summaryResult,
    };
  } catch (error) {
    console.error(`Error analyzing file changes: ${error.message}`);
    throw error;
  }
}
