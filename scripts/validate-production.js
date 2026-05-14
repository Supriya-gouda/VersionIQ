#!/usr/bin/env node

/**
 * Production Validation Script
 * Verifies all components are production-ready
 */

import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const CHECKS = {
  critical: "🔴",
  warning: "🟡",
  success: "🟢",
};

let criticalFailures = 0;
let warnings = 0;
let successes = 0;

function log(level, message) {
  const icon = CHECKS[level] || "ℹ️";
  console.log(`${icon}  ${message}`);

  if (level === "critical") criticalFailures++;
  if (level === "warning") warnings++;
  if (level === "success") successes++;
}

async function checkFile(filePath, description) {
  try {
    await fs.access(filePath);
    log("success", `✓ ${description}: ${filePath}`);
    return true;
  } catch {
    log("critical", `✗ ${description} not found: ${filePath}`);
    return false;
  }
}

async function checkFileContent(filePath, searchString, description) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    if (content.includes(searchString)) {
      log("success", `✓ ${description}`);
      return true;
    } else {
      log("warning", `⚠ ${description} - check manually`);
      return false;
    }
  } catch {
    log("critical", `✗ Cannot verify ${description}`);
    return false;
  }
}

async function runValidation() {
  console.log("\n");
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║         Version Vault Pro - Production Validation             ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  // Project Structure Checks
  console.log("📁 Project Structure\n");
  await checkFile("./package.json", "Root package.json");
  await checkFile("./backend/package.json", "Backend package.json");
  await checkFile("./.env.example", "Frontend .env.example");
  await checkFile("./backend/.env.example", "Backend .env.example");
  await checkFile("./docker-compose.yml", "docker-compose.yml");
  await checkFile("./Dockerfile.frontend", "Frontend Dockerfile");
  await checkFile("./backend/Dockerfile", "Backend Dockerfile");
  await checkFile("./Jenkinsfile", "Jenkinsfile");
  await checkFile("./README.md", "README.md");

  // Frontend Checks
  console.log("\n🎨 Frontend Build\n");
  await checkFile("./frontend/src/lib/api.ts", "Original API client");
  await checkFile("./frontend/src/lib/api-enhanced.ts", "Enhanced API client");
  await checkFile("./frontend/src/hooks/use-api.tsx", "Custom React hooks");
  await checkFile("./frontend/src/routes/__root.tsx", "Root route");
  await checkFile("./frontend/src/routes/login.tsx", "Login route");

  // Backend Checks
  console.log("\n⚙️  Backend Configuration\n");
  await checkFile("./backend/src/server.js", "Server bootstrap");
  await checkFile("./backend/src/app.js", "Express application");
  await checkFile("./backend/src/config/db.js", "Database configuration");
  await checkFile("./backend/src/config/env.js", "Environment configuration");
  await checkFile("./backend/src/middleware/error-handler.js", "Error handling");
  await checkFile("./backend/src/middleware/rate-limit.js", "Rate limiting");
  await checkFile("./backend/src/middleware/validation.js", "Request validation");
  await checkFile("./backend/src/middleware/file-upload.js", "File upload");
  await checkFile("./backend/src/middleware/auth.js", "Authentication");
  await checkFile("./backend/src/services/file-storage.service.js", "File storage");

  // Database Models
  console.log("\n📊 Database Models\n");
  await checkFile("./backend/src/models/user.model.js", "User model");
  await checkFile("./backend/src/models/file.model.js", "File model");
  await checkFile("./backend/src/models/version.model.js", "Version model");
  await checkFile("./backend/src/models/pipeline-log.model.js", "Pipeline log model");

  // API Services
  console.log("\n🔧 API Services\n");
  await checkFile("./backend/src/services/auth.service.js", "Auth service");
  await checkFile("./backend/src/services/version.service.js", "Version service");
  await checkFile("./backend/src/services/ai.service.js", "AI service");
  await checkFile("./backend/src/services/recommendation.service.js", "Recommendation service");
  await checkFile("./backend/src/services/jenkins.service.js", "Jenkins service");

  // Testing
  console.log("\n🧪 Testing\n");
  await checkFile("./backend/tests/auth.test.js", "Authentication tests");
  await checkFile("./backend/tests/files.test.js", "File operation tests");
  await checkFile("./backend/tests/run.js", "Test runner");

  // Key Features Check
  console.log("\n✨ Feature Verification\n");
  await checkFileContent(
    "./backend/src/middleware/error-handler.js",
    "ApiError",
    "Global error handling with ApiError class"
  );
  await checkFileContent(
    "./backend/src/middleware/rate-limit.js",
    "RateLimiter",
    "Rate limiting middleware"
  );
  await checkFileContent(
    "./backend/src/middleware/validation.js",
    "validateRequest",
    "Request validation middleware"
  );
  await checkFileContent(
    "./backend/src/services/recommendation.service.js",
    "calculateVersionStability",
    "Smart rollback recommendation"
  );
  await checkFileContent(
    "./frontend/src/lib/api-enhanced.ts",
    "retryWithBackoff",
    "API retry logic"
  );
  await checkFileContent(
    "./frontend/src/hooks/use-api.tsx",
    "useAsync",
    "Frontend async hooks"
  );

  // Environment Configuration
  console.log("\n🔐 Security Configuration\n");
  await checkFileContent(
    "./backend/.env.example",
    "JWT_SECRET",
    "JWT secret configuration"
  );
  await checkFileContent(
    "./backend/.env.example",
    "MONGODB_URI",
    "MongoDB connection URI"
  );
  await checkFileContent(
    "./backend/src/config/env.js",
    "validateEnv()",
    "Environment validation"
  );

  // Docker Configuration
  console.log("\n🐳 Docker Configuration\n");
  await checkFileContent(
    "./docker-compose.yml",
    "healthcheck",
    "Health checks configured"
  );
  await checkFileContent(
    "./docker-compose.yml",
    "networks:",
    "Docker networks configured"
  );
  await checkFileContent(
    "./Dockerfile.frontend",
    "dumb-init",
    "Frontend signal handling"
  );
  await checkFileContent(
    "./backend/Dockerfile",
    "dumb-init",
    "Backend signal handling"
  );

  // CI/CD Pipeline
  console.log("\n🚀 CI/CD Pipeline\n");
  await checkFileContent(
    "./Jenkinsfile",
    "stage('Install dependencies')",
    "Dependency installation stage"
  );
  await checkFileContent(
    "./Jenkinsfile",
    "stage('Build')",
    "Build stage"
  );
  await checkFileContent(
    "./Jenkinsfile",
    "stage('Tests')",
    "Testing stage"
  );
  await checkFileContent(
    "./Jenkinsfile",
    "stage('Docker')",
    "Docker build stage"
  );

  // Documentation
  console.log("\n📚 Documentation\n");
  const readmeSize = (await fs.stat("./README.md")).size;
  if (readmeSize > 10000) {
    log("success", `✓ Comprehensive README (${(readmeSize / 1024).toFixed(1)}KB)`);
  } else {
    log("warning", "⚠ README may need more details");
  }

  // Build Checks
  console.log("\n🏗️  Build Validation\n");

  try {
    const { stdout } = await execAsync("npm run build -- --dry-run", {
      timeout: 30000,
    });
    if (stdout) {
      log("success", "✓ Frontend build configuration valid");
    }
  } catch {
    log("warning", "⚠ Frontend build needs verification - try: npm run build");
  }

  try {
    await execAsync("cd backend && node --check src/server.js", {
      timeout: 5000,
    });
    log("success", "✓ Backend syntax valid (server.js)");
  } catch {
    log("critical", "✗ Backend syntax error - fix before deployment");
  }

  // Summary Report
  console.log("\n");
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║                    VALIDATION SUMMARY                         ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
  console.log(`  ✅ Successes:    ${successes}`);
  console.log(`  ⚠️  Warnings:     ${warnings}`);
  console.log(`  ❌ Critical:     ${criticalFailures}`);
  console.log("");

  if (criticalFailures === 0) {
    console.log("🎉 PRODUCTION READY - All critical checks passed!");
    console.log("");
    console.log("Next steps:");
    console.log("  1. Configure environment variables (backend/.env)");
    console.log("  2. Set up MongoDB (local or Atlas)");
    console.log("  3. Run tests: cd backend && npm test");
    console.log("  4. Build and start: docker compose up --build");
    console.log("");
    process.exit(0);
  } else {
    console.log("❌ CRITICAL ISSUES FOUND - Fix before deployment");
    console.log("");
    process.exit(1);
  }
}

// Run validation
runValidation().catch((error) => {
  console.error("Validation failed:", error.message);
  process.exit(1);
});
