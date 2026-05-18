import mongoose from "mongoose";
import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Connect to MongoDB
const mongodbUri = process.env.MONGODB_URI || "mongodb://admin:changeme@localhost:27018/version_vault?authSource=admin";
console.log(`Connecting to database: ${mongodbUri.replace(/:([^:@]+)@/, ":****@")}...`);

// Define Schemas inside the script to avoid dependency path/module import issues
const versionSchema = new mongoose.Schema(
  {
    file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    versionNumber: { type: Number, required: true },
    storedFilename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storagePath: { type: String, required: true },
    status: { type: String, default: "stable" },
    summary: { type: String, default: "" },
    summarySource: { type: String, default: "local" },
    summaryModel: { type: String, default: "" },
    diffStats: {
      added: { type: Number, default: 0 },
      removed: { type: Number, default: 0 },
      modified: { type: Number, default: 0 },
    },
    aiDetails: {
      topicSummary: { type: String, default: "" },
      extraNotes: { type: String, default: "" },
      addedLines: [{ type: String }],
      removedLines: [{ type: String }],
      modifiedLines: [{ type: String }],
    },
  },
  { timestamps: true }
);

const Version = mongoose.models.Version || mongoose.model("Version", versionSchema);

// Simplified text reader
async function readFileContent(filePath, mimeType, originalName = "") {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return "";
    
    // Check if it's a text-like file
    const ext = path.extname(originalName || filePath).toLowerCase();
    const textExtensions = [
      ".txt", ".md", ".json", ".yaml", ".yml", ".js", ".ts", ".jsx", ".tsx",
      ".html", ".css", ".py", ".sh", ".env", ".c", ".cpp", ".h", ".go",
      ".rb", ".php", ".java", ".sql", ".ini", ".conf", ".xml", ".csv"
    ];
    
    if (
      mimeType.startsWith("text/") || 
      ["application/json", "application/xml", "application/javascript"].includes(mimeType) ||
      textExtensions.includes(ext)
    ) {
      return await fs.readFile(filePath, "utf-8");
    }
    return "";
  } catch (error) {
    console.warn(`  [Warning] Could not read file ${filePath}: ${error.message}`);
    return "";
  }
}

// Import generation logic from backend src
import { generateSummary } from "../src/services/ai.service.js";
import { calculateLineDiff } from "../src/utils/diff.js";

async function regenerate() {
  try {
    await mongoose.connect(mongodbUri);
    console.log("✅ Database Connected Successfully!");

    // Find all versions with local, missing, or corrupted API error summaries
    const versions = await Version.find({
      $or: [
        { summarySource: "local" },
        { "aiDetails.topicSummary": "AI summary unavailable" },
        { summary: /AI summary unavailable/i },
        { summary: /Gemini API Error/i },
        { summary: /getaddrinfo/i },
        { summary: /Request failed/i }
      ]
    }).sort({ file: 1, versionNumber: 1 });

    console.log(`\nFound ${versions.length} versions requiring AI summary regeneration.\n`);

    if (versions.length === 0) {
      console.log("🎉 All versions already have valid AI summaries!");
      process.exit(0);
    }

    for (let i = 0; i < versions.length; i++) {
      const version = versions[i];
      console.log(`[${i + 1}/${versions.length}] Processing ${version.originalName} (Version ${version.versionNumber})...`);

      // Read current version contents
      const currentContent = await readFileContent(version.storagePath, version.mimeType, version.originalName);

      // Find previous version to calculate diff
      let previousContent = "";
      if (version.versionNumber > 1) {
        const previousVersion = await Version.findOne({
          file: version.file,
          versionNumber: version.versionNumber - 1
        });
        if (previousVersion) {
          previousContent = await readFileContent(previousVersion.storagePath, previousVersion.mimeType, previousVersion.originalName);
        }
      }

      console.log("  Generating new Gemini 2.5 Flash summary...");
      const diffStats = calculateLineDiff(previousContent, currentContent);
      
      try {
        const summaryResult = await generateSummary({
          diffStats,
          versionNumber: version.versionNumber,
          previousContent,
          currentContent,
        });

        if (summaryResult && summaryResult.source !== "local") {
          console.log(`  ✅ Success! Model: ${summaryResult.model || "gemini-2.5-flash"}`);
          console.log(`  Summary: "${summaryResult.summary.substring(0, 100)}..."`);
          
          // Update database
          version.summary = summaryResult.summary;
          version.summarySource = summaryResult.source;
          version.summaryModel = summaryResult.model || "gemini-2.5-flash";
          version.aiDetails = summaryResult.aiDetails || {};
          version.diffStats = diffStats;
          
          await version.save();
          console.log("  💾 Database updated.");
        } else {
          console.warn("  ⚠️ Gemini call returned local fallback. Skipping update.");
        }
      } catch (error) {
        console.error(`  ❌ Failed to generate summary: ${error.message}`);
      }
      console.log("------------------------------------------");
    }

    console.log("\n🎉 AI Summary Regeneration Complete!");
    process.exit(0);

  } catch (error) {
    console.error("Critical error in regeneration script:", error);
    process.exit(1);
  }
}

regenerate();
