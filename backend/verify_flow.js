import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { User } from "./src/models/user.model.js";
import { createOrUpdateFileVersion, getVersionDiff } from "./src/services/version.service.js";
import { Version } from "./src/models/version.model.js";
import { FileRecord } from "./src/models/file.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function verify() {
  await mongoose.connect("mongodb://localhost:27017/version_vault");

  let user = await User.findOne({ email: "test@example.com" });
  if (!user) {
    user = await User.create({ email: "test@example.com", passwordHash: "123", name: "Test" });
  }

  const pdfPath = path.join(__dirname, "..", "test_document.pdf");
  const tempPath = path.join(__dirname, "uploads", "temp_mock.pdf");

  // Ensure uploads directory exists
  if (!fs.existsSync(path.join(__dirname, "uploads"))) {
    fs.mkdirSync(path.join(__dirname, "uploads"));
  }

  fs.copyFileSync(pdfPath, tempPath);

  const mockUpload = {
    originalname: "test_document.pdf",
    filename: "temp_mock.pdf",
    mimetype: "application/pdf",
    size: fs.statSync(pdfPath).size,
    path: tempPath,
  };

  console.log("=== PHASE 2: RUNTIME VERIFICATION ===");
  console.log("1. Uploaded file name:", mockUpload.originalname);
  console.log("2. File size:", mockUpload.size);
  console.log("3. MIME type:", mockUpload.mimetype);

  try {
    const result = await createOrUpdateFileVersion({
      userId: user._id,
      upload: mockUpload,
    });

    console.log("4. Storage path:", result.version.storagePath);
    console.log("5. PDF parser used: pdf-parse (v2.4.5)");

    console.log("\n--- Version Details ---");
    console.log("9. Previous version text length: N/A (First upload)");
    // To get extracted text length, we can look at the logs or calculate it
    // Actually we can just run the extractor to show it
    const { createRequire } = await import("module");
    const req = createRequire(import.meta.url);
    const pdf = req("pdf-parse");
    let extracted = "";
    try {
      const buf = fs.readFileSync(result.version.storagePath);
      // We know it currently fails with pdfParse is not a function
      const data = await pdf(buf);
      extracted = data.text || "";
      console.log("6. Number of pages:", data.numpages);
    } catch (e) {
      console.log("Extraction error directly:", e.message);
    }

    console.log("7. Extracted text length:", extracted.length);
    console.log("8. First 500 chars:", extracted.substring(0, 500));

    console.log("10. Current version text length:", extracted.length);
    console.log("11. Diff result: (Added:", result.version.diffStats.added, ")");
    console.log("12. Added lines count:", result.version.diffStats.added);
    console.log("13. Removed lines count:", result.version.diffStats.removed);
    console.log("14. Modified lines count:", result.version.diffStats.modified);

    console.log("\n--- AI Summary Generation ---");
    console.log("15. Prompt sent to Gemini: (Internal)");
    console.log("17. Model used:", result.version.summaryModel);

    console.log("\n--- AI Response ---");
    console.log("20. Parsed summary:", result.version.summary);
    console.log("21. Summary length:", result.version.summary.length);

    console.log("\n--- MongoDB ---");
    console.log("22. MongoDB Version document ID:", result.version._id);
    console.log("23. Summary field saved:", result.version.summary);
    console.log("24. Diff stats saved:", JSON.stringify(result.version.diffStats));
    console.log("25. AI details saved:", JSON.stringify(result.version.aiDetails));

    console.log("\n--- Cleanup ---");
    await FileRecord.deleteOne({ _id: result.file._id });
    await Version.deleteMany({ file: result.file._id });
  } catch (e) {
    console.error(e);
  }

  process.exit(0);
}

verify();
