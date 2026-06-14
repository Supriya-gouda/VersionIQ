import mongoose from "mongoose";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import User model
import("../src/models/user.model.js").then(async ({ User }) => {
  try {
    await mongoose.connect("mongodb://localhost:27017/version_vault");
    console.log("✓ Connected to MongoDB");

    // Check existing users
    const users = await User.find().lean();
    console.log("\nExisting users:");
    if (users.length === 0) {
      console.log("  (no users found)");
    } else {
      users.forEach((user) => {
        console.log(`  - ${user.email} (id: ${user._id})`);
      });
    }

    // Check if we can create a test user
    console.log("\nCreating test user for verification...");
    const testUser = new User({
      email: "test@example.com",
      password: "Password123!",
      name: "Test User",
    });

    await testUser.save();
    console.log("✓ Test user created:", testUser.email);
    console.log("  ID:", testUser._id);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
});
