import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * File storage service
 * Manages organized directory structure for uploaded files
 */
export class FileStorageService {
  constructor(uploadRoot = "uploads") {
    this.uploadRoot = path.resolve(uploadRoot);
  }

  /**
   * Get user-specific upload directory
   */
  getUserUploadDir(userId) {
    return path.join(this.uploadRoot, userId);
  }

  /**
   * Get file-specific version directory
   */
  getFileVersionDir(userId, fileId) {
    return path.join(this.getUserUploadDir(userId), fileId);
  }

  /**
   * Get version file path
   */
  getVersionFilePath(userId, fileId, versionId) {
    return path.join(this.getFileVersionDir(userId, fileId), `${versionId}.bin`);
  }

  /**
   * Generate unique version ID
   */
  generateVersionId() {
    return crypto.randomBytes(16).toString("hex");
  }

  /**
   * Initialize storage directories
   */
  async initializeStorage() {
    try {
      await fs.mkdir(this.uploadRoot, { recursive: true });
      console.log(`✓ Upload root initialized: ${this.uploadRoot}`);
    } catch (error) {
      console.error(`Failed to initialize upload directory: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save file version to disk
   */
  async saveVersion(userId, fileId, versionId, fileBuffer) {
    try {
      const versionDir = this.getFileVersionDir(userId, fileId);
      const filePath = path.join(versionDir, `${versionId}.bin`);

      // Create directory structure
      await fs.mkdir(versionDir, { recursive: true });

      // Write file atomically (write to temp, then rename)
      const tempPath = `${filePath}.tmp`;
      await fs.writeFile(tempPath, fileBuffer, { mode: 0o644 });
      await fs.rename(tempPath, filePath);

      // Store metadata alongside the file
      const metadataPath = path.join(versionDir, `${versionId}.meta.json`);
      await fs.writeFile(
        metadataPath,
        JSON.stringify(
          {
            versionId,
            size: fileBuffer.length,
            savedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      );

      return filePath;
    } catch (error) {
      console.error(`Failed to save version ${versionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Read file version from disk
   */
  async readVersion(userId, fileId, versionId) {
    try {
      const filePath = this.getVersionFilePath(userId, fileId, versionId);

      // Check if file exists
      await fs.access(filePath);

      // Read and return file
      const buffer = await fs.readFile(filePath);
      return buffer;
    } catch (error) {
      console.error(`Failed to read version ${versionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a single version file
   */
  async deleteVersion(userId, fileId, versionId) {
    try {
      const versionDir = this.getFileVersionDir(userId, fileId);
      const filePath = path.join(versionDir, `${versionId}.bin`);
      const metadataPath = path.join(versionDir, `${versionId}.meta.json`);

      // Delete both file and metadata
      await Promise.all([
        fs.unlink(filePath).catch(() => {}), // Ignore if not exists
        fs.unlink(metadataPath).catch(() => {}), // Ignore if not exists
      ]);

      return true;
    } catch (error) {
      console.error(`Failed to delete version ${versionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete all versions of a file
   */
  async deleteAllVersions(userId, fileId) {
    try {
      const fileVersionDir = this.getFileVersionDir(userId, fileId);

      // Recursively delete directory
      await fs.rm(fileVersionDir, { recursive: true, force: true });
      return true;
    } catch (error) {
      console.error(`Failed to delete all versions of file ${fileId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete all files for a user
   */
  async deleteAllUserFiles(userId) {
    try {
      const userDir = this.getUserUploadDir(userId);
      await fs.rm(userDir, { recursive: true, force: true });
      return true;
    } catch (error) {
      console.error(`Failed to delete all user files for ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all versions of a file
   */
  async listFileVersions(userId, fileId) {
    try {
      const versionDir = this.getFileVersionDir(userId, fileId);

      // Check if directory exists
      try {
        await fs.access(versionDir);
      } catch {
        return [];
      }

      // Read all files in directory
      const files = await fs.readdir(versionDir);

      // Filter for .bin files and extract version IDs
      const versions = files.filter((f) => f.endsWith(".bin")).map((f) => f.replace(".bin", ""));

      return versions;
    } catch (error) {
      console.error(`Failed to list versions for file ${fileId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get directory size (for cleanup and quota management)
   */
  async getDirectorySize(dirPath) {
    try {
      let size = 0;

      const getSize = async (dir) => {
        const files = await fs.readdir(dir, { withFileTypes: true });
        for (const file of files) {
          const fullPath = path.join(dir, file.name);
          if (file.isDirectory()) {
            size += await getSize(fullPath);
          } else {
            const stat = await fs.stat(fullPath);
            size += stat.size;
          }
        }
      };

      await getSize(dirPath);
      return size;
    } catch (error) {
      console.warn(`Could not calculate directory size: ${error.message}`);
      return 0;
    }
  }

  /**
   * Cleanup old/orphaned files
   */
  async cleanup(olderThanDays = 30) {
    try {
      const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      const cleanupDir = async (dir) => {
        try {
          const files = await fs.readdir(dir, { withFileTypes: true });

          for (const file of files) {
            const fullPath = path.join(dir, file.name);
            const stat = await fs.stat(fullPath);

            if (file.isDirectory()) {
              await cleanupDir(fullPath);
              // Delete empty directories
              try {
                await fs.rmdir(fullPath);
              } catch {
                // Directory not empty, that's ok
              }
            } else if (stat.mtimeMs < cutoffTime) {
              // Delete old files
              await fs.unlink(fullPath);
              deletedCount++;
            }
          }
        } catch (error) {
          console.warn(`Error during cleanup: ${error.message}`);
        }
      };

      await cleanupDir(this.uploadRoot);
      console.log(`Cleanup completed: ${deletedCount} old files removed`);
      return { deletedCount };
    } catch (error) {
      console.error(`Cleanup failed: ${error.message}`);
      throw error;
    }
  }
}

// Export singleton instance
export const fileStorage = new FileStorageService();
