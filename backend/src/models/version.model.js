import mongoose from "mongoose";

const versionSchema = new mongoose.Schema(
  {
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    storedFilename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["stable", "risky", "failed"],
      default: "stable",
    },
    summary: {
      type: String,
      default: "",
    },
    summarySource: {
      type: String,
      enum: ["gemini", "openai", "local"],
      default: "local",
    },
    summaryModel: {
      type: String,
      default: "",
    },
    diffStats: {
      added: { type: Number, default: 0 },
      removed: { type: Number, default: 0 },
      modified: { type: Number, default: 0 },
    },
    restoredFromVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Version",
      default: null,
    },
    isCurrent: {
      type: Boolean,
      default: false,
      index: true,
    },
    aiDetails: {
      topicSummary: { type: String, default: "" },
      extraNotes: { type: String, default: "" },
      addedLines: [{ type: String }],
      removedLines: [{ type: String }],
      modifiedLines: [{ type: String }],
    },
  },
  {
    timestamps: true,
  },
);

versionSchema.index({ file: 1, versionNumber: 1 }, { unique: true });

export const Version = mongoose.model("Version", versionSchema);
