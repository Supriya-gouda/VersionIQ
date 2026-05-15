import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcrypt";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/version_vault";

async function run() {
  console.log("Connecting to", uri);
  await mongoose.connect(uri, { dbName: "version_vault" });

  const db = mongoose.connection.db;

  // Ensure collections exist
  const cols = await db.listCollections().toArray();
  const names = cols.map((c) => c.name);

  if (!names.includes("users")) {
    await db.createCollection("users");
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    console.log("Created users collection and index");
  }

  if (!names.includes("files")) {
    await db.createCollection("files");
    await db.collection("files").createIndex({ owner: 1 });
    console.log("Created files collection and index");
  }

  if (!names.includes("versions")) {
    await db.createCollection("versions");
    await db.collection("versions").createIndex({ file: 1 });
    console.log("Created versions collection and index");
  }

  if (!names.includes("pipelinelogs")) {
    await db.createCollection("pipelinelogs");
    await db.collection("pipelinelogs").createIndex({ createdAt: -1 });
    console.log("Created pipelinelogs collection and index");
  }

  // Insert sample user if not exists
  const users = db.collection("users");
  const existing = await users.findOne({ email: "john@example.com" });
  if (!existing) {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    const res = await users.insertOne({
      name: "John Doe",
      email: "john@example.com",
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Inserted sample user", res.insertedId.toString());
  } else {
    console.log("Sample user already exists, skipping insert");
  }

  await mongoose.disconnect();
  console.log("DB seed complete");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
