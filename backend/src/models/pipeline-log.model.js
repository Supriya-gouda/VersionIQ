import mongoose from "mongoose";

const pipelineLogSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      default: "jenkins",
    },
    pipeline: {
      type: String,
      required: true,
    },
    buildNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "running", "queued", "aborted", "unknown"],
      default: "unknown",
    },
    branch: {
      type: String,
      default: "",
    },
    commit: {
      type: String,
      default: "",
    },
    author: {
      type: String,
      default: "",
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
    url: {
      type: String,
      default: "",
    },
    // Stage-level breakdown pushed by the Jenkins webhook
    stages: {
      type: [
        {
          name: { type: String, default: "" },
          status: { type: String, default: "unknown" },
          durationMs: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    // Timestamp of the last sync from Jenkins or webhook
    syncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

pipelineLogSchema.index({ pipeline: 1, buildNumber: 1 }, { unique: true });

export const PipelineLog = mongoose.model("PipelineLog", pipelineLogSchema);
