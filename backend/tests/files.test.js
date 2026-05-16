/**
 * Backend API Tests - File operations
 * Run with: npm test tests/files.test.js
 */

// Force refresh for Jenkins
console.log("DEBUG: Running files.test.js from backend/tests/");
import assert from "assert";
import mongoose from "mongoose";
import { FileRecord } from "../src/models/file.model.js";
import { Version } from "../src/models/version.model.js";
import { FileStorageService } from "../src/services/file-storage.service.js";

const fileStorage = new FileStorageService();

// Test data
const testUserId = new mongoose.Types.ObjectId().toString();
let testFileId = null;

/**
 * Test Suite: File Upload and Versioning
 */
export async function testFileOperations() {
  console.log("\n📁 Testing File Operations...");

  try {
    // Test 1: Create a test file record
    const fileRecord = await FileRecord.create({
      owner: testUserId,
      originalName: "test-document.txt",
      mimeType: "text/plain",
      size: 1024,
      currentVersionNumber: 1,
    });
    testFileId = fileRecord._id.toString();
    assert(testFileId, "File should be created");
    console.log("  ✓ File created successfully");

    // Test 2: Create version
    const versionId = fileStorage.generateVersionId();
    const content = Buffer.from("Test file content v1");
    await fileStorage.saveVersion(testUserId, testFileId, versionId, content);
    console.log("  ✓ Version saved to storage");

    // Test 3: Read version
    const readContent = await fileStorage.readVersion(testUserId, testFileId, versionId);
    assert(readContent.toString() === content.toString(), "Content should match");
    console.log("  ✓ Version read from storage");

    // Test 4: List versions
    const versions = await fileStorage.listFileVersions(testUserId, testFileId);
    assert(versions.includes(versionId), "Version should be in list");
    console.log("  ✓ Versions listed successfully");

    // Test 5: Delete version
    await fileStorage.deleteVersion(testUserId, testFileId, versionId);
    const versionsAfter = await fileStorage.listFileVersions(testUserId, testFileId);
    assert(!versionsAfter.includes(versionId), "Version should be deleted");
    console.log("  ✓ Version deleted successfully");

    // Test 6: File deletion
    await FileRecord.deleteOne({ _id: testFileId });
    const deletedFile = await FileRecord.findById(testFileId);
    assert(!deletedFile, "File should be deleted");
    console.log("  ✓ File deleted successfully");
  } catch (error) {
    console.error("  ✗ File operations tests failed:", error.message);
    throw error;
  }
}

/**
 * Test Suite: Storage Cleanup
 */
export async function testStorageCleanup() {
  console.log("\n🧹 Cleaning up storage...");

  try {
    if (testUserId) {
      await fileStorage.deleteAllUserFiles(testUserId);
      console.log("  ✓ User files cleaned up");
    }

    // Clean up database
    await FileRecord.deleteMany({ owner: testUserId });
    await Version.deleteMany({ owner: testUserId });
    console.log("  ✓ Database records cleaned up");
  } catch (error) {
    console.error("  ✗ Cleanup failed:", error.message);
  }
}

// Export test runner
export async function runFileTests() {
  console.log("═══════════════════════════════════════");
  console.log("         File Operations Test Suite");
  console.log("═══════════════════════════════════════");

  try {
    await testFileOperations();
  } catch (error) {
    console.error("\n❌ Tests failed:", error.message);
    process.exit(1);
  } finally {
    await testStorageCleanup();
  }

  console.log("\n✅ All file operation tests passed!\n");
}
