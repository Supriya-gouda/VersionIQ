import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load backend .env
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const secret = process.env.JWT_SECRET || "dev-secret-change-me";
const expiresIn = process.env.JWT_EXPIRES_IN || "1d";

const payload = {
  id: "seed-user-id",
  email: "seed@example.com",
  role: "admin",
};

const token = jwt.sign(payload, secret, { expiresIn });
console.log(token);
