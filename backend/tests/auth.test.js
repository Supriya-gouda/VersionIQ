/**
 * Backend API Tests - Authentication endpoints
 * Run with: npm test tests/auth.test.js
 */

import assert from "assert";
import { User } from "../../models/user.model.js";
import { registerUser, loginUser } from "../../services/auth.service.js";

// Test data
const testUser = {
  name: "Test User",
  email: `test${Date.now()}@example.com`,
  password: "SecurePassword123!",
};

let registeredUserId = null;

/**
 * Test Suite: User Registration
 */
export async function testRegistration() {
  console.log("\n📝 Testing User Registration...");

  try {
    // Test 1: Successful registration
    const result = await registerUser(testUser);
    assert(result.user, "User should be returned");
    assert(result.user.email === testUser.email, "Email should match");
    assert(result.token, "Token should be generated");
    registeredUserId = result.user.id;
    console.log("  ✓ Successful registration");

    // Test 2: Duplicate email
    try {
      await registerUser(testUser);
      assert.fail("Should reject duplicate email");
    } catch (error) {
      assert(error.message.includes("already registered"), "Should reject duplicate email");
      console.log("  ✓ Duplicate email rejected");
    }

    // Test 3: Invalid email
    try {
      await registerUser({ ...testUser, email: "invalid-email" });
      assert.fail("Should reject invalid email");
    } catch (error) {
      assert(error.message.includes("Invalid email") || error.message.includes("invalid"), "Should reject invalid email");
      console.log("  ✓ Invalid email rejected");
    }

    // Test 4: Weak password
    try {
      await registerUser({ ...testUser, password: "weak" });
      assert.fail("Should reject weak password");
    } catch (error) {
      assert(error.message.includes("password"), "Should reject weak password");
      console.log("  ✓ Weak password rejected");
    }
  } catch (error) {
    console.error("  ✗ Registration tests failed:", error.message);
    throw error;
  }
}

/**
 * Test Suite: User Login
 */
export async function testLogin() {
  console.log("\n🔐 Testing User Login...");

  try {
    // Test 1: Successful login
    const result = await loginUser({
      email: testUser.email,
      password: testUser.password,
    });
    assert(result.token, "Token should be generated");
    assert(result.user.email === testUser.email, "Email should match");
    console.log("  ✓ Successful login");

    // Test 2: Invalid password
    try {
      await loginUser({
        email: testUser.email,
        password: "WrongPassword123!",
      });
      assert.fail("Should reject invalid password");
    } catch (error) {
      assert(error.message.includes("credentials") || error.message.includes("Invalid"), "Should reject invalid password");
      console.log("  ✓ Invalid password rejected");
    }

    // Test 3: Non-existent user
    try {
      await loginUser({
        email: "nonexistent@example.com",
        password: "AnyPassword123!",
      });
      assert.fail("Should reject non-existent user");
    } catch (error) {
      assert(error.message.includes("credentials") || error.message.includes("Invalid"), "Should reject non-existent user");
      console.log("  ✓ Non-existent user rejected");
    }
  } catch (error) {
    console.error("  ✗ Login tests failed:", error.message);
    throw error;
  }
}

/**
 * Test Suite: Database Cleanup
 */
export async function testCleanup() {
  console.log("\n🧹 Cleaning up test data...");

  try {
    if (registeredUserId) {
      await User.deleteOne({ _id: registeredUserId });
      console.log("  ✓ Test user cleaned up");
    }
  } catch (error) {
    console.error("  ✗ Cleanup failed:", error.message);
  }
}

// Export test runner
export async function runAuthTests() {
  console.log("═══════════════════════════════════════");
  console.log("      Authentication Test Suite");
  console.log("═══════════════════════════════════════");

  try {
    await testRegistration();
    await testLogin();
  } catch (error) {
    console.error("\n❌ Tests failed:", error.message);
    process.exit(1);
  } finally {
    await testCleanup();
  }

  console.log("\n✅ All authentication tests passed!\n");
}
