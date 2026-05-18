import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongodbUri = "mongodb://admin:changeme@localhost:27018/version_vault?authSource=admin";

const fileSchema = new mongoose.Schema({
  originalName: String,
  mimeType: String,
  size: Number,
  currentVersionNumber: Number,
}, { timestamps: true });

const versionSchema = new mongoose.Schema({
  file: mongoose.Schema.Types.ObjectId,
  versionNumber: Number,
  storedFilename: String,
  originalName: String,
  mimeType: String,
  summary: String,
  summarySource: String,
  summaryModel: String,
  diffStats: { added: Number, removed: Number, modified: Number },
  aiDetails: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const FileRecord = mongoose.models.File || mongoose.model("File", fileSchema);
const Version = mongoose.models.Version || mongoose.model("Version", versionSchema);

async function list() {
  try {
    await mongoose.connect(mongodbUri);
    console.log("Connected to MongoDB.\n");

    const files = await FileRecord.find({});
    console.log(`=== Total Files: ${files.length} ===`);
    
    for (const f of files) {
      console.log(`\nFile ID: ${f._id}`);
      console.log(`Name: ${f.originalName}`);
      console.log(`Current Version: v${f.currentVersionNumber}`);
      
      const versions = await Version.find({ file: f._id }).sort({ versionNumber: 1 });
      console.log(`--- Versions (${versions.length}): ---`);
      for (const v of versions) {
        console.log(`  v${v.versionNumber}: ${v.originalName}`);
        console.log(`    Summary Source: ${v.summarySource} (${v.summaryModel || "none"})`);
        console.log(`    Diff Stats: +${v.diffStats.added} -${v.diffStats.removed} ~${v.diffStats.modified}`);
        console.log(`    Summary: "${v.summary}"`);
        if (v.aiDetails && v.aiDetails.topicSummary) {
          console.log(`    Topic: "${v.aiDetails.topicSummary}"`);
        }
      }
      console.log("=========================================");
    }
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

list();
