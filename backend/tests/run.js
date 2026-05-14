/**
 * Test Runner - Execute all backend tests
 * Usage: npm test
 */

import { connectDatabase, stopDatabase } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { runAuthTests } from "./auth.test.js";
import { runFileTests } from "./files.test.js";

async function runAllTests() {
  console.log("\n");
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║           Version Vault Backend Test Suite                    ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
  console.log(`Environment: ${env.nodeEnv}`);
  console.log(`MongoDB: ${env.mongodbUri.substring(0, 50)}...`);
  console.log("");

  try {
    // Connect to database
    console.log("📡 Connecting to database...");
    await connectDatabase(env.mongodbUri);
    console.log("✓ Database connected\n");

    // Run test suites
    await runAuthTests();
    await runFileTests();

    // Summary
    console.log("\n╔═══════════════════════════════════════════════════════════════╗");
    console.log("║                      TEST SUMMARY                             ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝");
    console.log("✅ All tests passed successfully!");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("\n╔═══════════════════════════════════════════════════════════════╗");
    console.error("║                     TEST FAILURE                              ║");
    console.error("╚═══════════════════════════════════════════════════════════════╝");
    console.error("❌ Test suite failed");
    console.error(`Error: ${error.message}\n`);

    process.exit(1);
  } finally {
    // Cleanup
    try {
      await stopDatabase();
      console.log("📡 Database disconnected");
    } catch {
      // Ignore cleanup errors
    }
  }
}

// Run tests
runAllTests();
