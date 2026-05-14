import { Activity } from "../models/activity.model.js";

export async function logActivity({ owner, type, fileId, fileName, details }) {
  try {
    await Activity.create({
      owner,
      type,
      fileId,
      fileName,
      details,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
