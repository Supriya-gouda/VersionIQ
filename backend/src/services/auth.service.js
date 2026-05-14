import fs from "node:fs/promises";
import path from "node:path";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/app-error.js";
import { signAccessToken } from "../utils/jwt.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { env } from "../config/env.js";

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    notifications: user.notifications,
    createdAt: user.createdAt,
  };
}

export async function registerUser({ name, email, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError(409, "Email is already registered");
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
  });

  const token = signAccessToken({ sub: String(user._id), email: user.email });
  return { token, user: sanitizeUser(user) };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AppError(401, "Invalid credentials");
  }

  const validPassword = await comparePassword(password, user.passwordHash);
  if (!validPassword) {
    throw new AppError(401, "Invalid credentials");
  }

  const token = signAccessToken({ sub: String(user._id), email: user.email });
  return { token, user: sanitizeUser(user) };
}

export function getProfile(user) {
  return sanitizeUser(user);
}

export async function updateProfile(userId, updates) {
  const allowed = ["name", "role", "avatar", "notifications"];
  const filtered = Object.keys(updates)
    .filter((key) => allowed.includes(key))
    .reduce((obj, key) => {
      obj[key] = updates[key];
      return obj;
    }, {});

  const user = await User.findByIdAndUpdate(userId, { $set: filtered }, { new: true });
  if (!user) {
    throw new AppError(404, "User not found");
  }

  return sanitizeUser(user);
}

export async function updateAvatar(userId, file) {
  if (!file) throw new AppError(400, "No file uploaded");

  const userDir = path.resolve(process.cwd(), env.uploadRoot, String(userId), "avatars");
  await fs.mkdir(userDir, { recursive: true });

  const ext = path.extname(file.originalname);
  const fileName = `avatar_${Date.now()}${ext}`;
  const finalPath = path.join(userDir, fileName);

  await fs.rename(file.path, finalPath);

  const avatarUrl = `${env.apiUrl}/uploads/${userId}/avatars/${fileName}`;
  const user = await User.findByIdAndUpdate(userId, { $set: { avatar: avatarUrl } }, { new: true });
  
  if (!user) throw new AppError(404, "User not found");
  return sanitizeUser(user);
}
