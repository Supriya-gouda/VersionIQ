import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "Platform Engineer",
    },
    avatar: {
      type: String,
      default: "",
    },
    notifications: {
      uploads: { type: Boolean, default: true },
      builds: { type: Boolean, default: true },
      rollbacks: { type: Boolean, default: true },
      weekly: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema);
