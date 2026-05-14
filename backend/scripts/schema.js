/**
 * Version Vault Pro - MongoDB Schema & Initialization Script
 * 
 * This script creates all required collections, indexes, and validation schemas
 * Run this in MongoDB Compass, mongosh, or via: mongosh < schema.js
 */

// Use the version_vault database
db = db.getSiblingDB('version_vault');

console.log('🔄 Creating Version Vault Pro collections and indexes...\n');

// ============================================================================
// 1. USERS COLLECTION
// ============================================================================
console.log('📝 Creating Users collection...');

db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'passwordHash'],
      properties: {
        _id: {
          bsonType: 'objectId'
        },
        name: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 80,
          description: 'User full name'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'User email address (unique)'
        },
        passwordHash: {
          bsonType: 'string',
          description: 'Bcrypt hashed password'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Account creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

// Create indexes for users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });
console.log('✓ Users collection created with indexes\n');

// ============================================================================
// 2. FILES COLLECTION
// ============================================================================
console.log('📝 Creating Files collection...');

db.createCollection('files', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['owner', 'originalName', 'mimeType', 'size'],
      properties: {
        _id: {
          bsonType: 'objectId'
        },
        owner: {
          bsonType: 'objectId',
          description: 'Reference to User who owns this file'
        },
        originalName: {
          bsonType: 'string',
          description: 'Original filename uploaded by user'
        },
        mimeType: {
          bsonType: 'string',
          description: 'File MIME type (e.g., application/pdf)'
        },
        size: {
          bsonType: 'int',
          description: 'File size in bytes'
        },
        currentVersionNumber: {
          bsonType: 'int',
          minimum: 1,
          description: 'Latest version number'
        },
        currentVersionId: {
          bsonType: ['objectId', 'null'],
          description: 'Reference to current Version'
        },
        isDeleted: {
          bsonType: 'bool',
          description: 'Soft delete flag'
        },
        createdAt: {
          bsonType: 'date',
          description: 'File upload timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

// Create indexes for files
db.files.createIndex({ owner: 1 });
db.files.createIndex({ isDeleted: 1 });
db.files.createIndex({ owner: 1, createdAt: -1 });
db.files.createIndex({ owner: 1, isDeleted: 1 });
console.log('✓ Files collection created with indexes\n');

// ============================================================================
// 3. VERSIONS COLLECTION
// ============================================================================
console.log('📝 Creating Versions collection...');

db.createCollection('versions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['file', 'owner', 'versionNumber', 'storagePath', 'mimeType', 'size'],
      properties: {
        _id: {
          bsonType: 'objectId'
        },
        file: {
          bsonType: 'objectId',
          description: 'Reference to File document'
        },
        owner: {
          bsonType: 'objectId',
          description: 'Reference to User (denormalized for faster queries)'
        },
        versionNumber: {
          bsonType: 'int',
          minimum: 1,
          description: 'Sequential version number (1, 2, 3, ...)'
        },
        storedFilename: {
          bsonType: 'string',
          description: 'Stored filename on disk (UUID-based)'
        },
        originalName: {
          bsonType: 'string',
          description: 'Original filename'
        },
        mimeType: {
          bsonType: 'string',
          description: 'File MIME type'
        },
        size: {
          bsonType: 'int',
          description: 'File size in bytes'
        },
        storagePath: {
          bsonType: 'string',
          description: 'Full path to stored file on disk'
        },
        status: {
          enum: ['stable', 'risky', 'failed'],
          description: 'Version stability classification'
        },
        summary: {
          bsonType: 'string',
          description: 'AI-generated change summary'
        },
        diffStats: {
          bsonType: 'object',
          properties: {
            added: {
              bsonType: 'int',
              description: 'Lines/bytes added'
            },
            removed: {
              bsonType: 'int',
              description: 'Lines/bytes removed'
            },
            modified: {
              bsonType: 'int',
              description: 'Lines/bytes modified'
            },
            similarity: {
              bsonType: 'int',
              minimum: 0,
              maximum: 100,
              description: 'Percentage similarity to previous version'
            }
          }
        },
        restoredFromVersionId: {
          bsonType: ['objectId', 'null'],
          description: 'If this is a restored version, reference to source version'
        },
        isCurrent: {
          bsonType: 'bool',
          description: 'Whether this is the current active version'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Version creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

// Create indexes for versions
db.versions.createIndex({ file: 1 });
db.versions.createIndex({ owner: 1 });
db.versions.createIndex({ isCurrent: 1 });
db.versions.createIndex({ file: 1, versionNumber: 1 }, { unique: true });
db.versions.createIndex({ file: 1, createdAt: -1 });
db.versions.createIndex({ owner: 1, createdAt: -1 });
console.log('✓ Versions collection created with indexes\n');

// ============================================================================
// 4. PIPELINE LOGS COLLECTION
// ============================================================================
console.log('📝 Creating Pipeline Logs collection...');

db.createCollection('pipelinelogs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['source', 'pipeline', 'status'],
      properties: {
        _id: {
          bsonType: 'objectId'
        },
        source: {
          enum: ['jenkins', 'github-actions', 'gitlab-ci'],
          description: 'CI/CD platform source'
        },
        pipeline: {
          bsonType: 'string',
          description: 'Pipeline name'
        },
        buildNumber: {
          bsonType: 'int',
          description: 'Build number/ID'
        },
        status: {
          enum: ['success', 'failed', 'unstable', 'aborted', 'unknown'],
          description: 'Build execution status'
        },
        branch: {
          bsonType: 'string',
          description: 'Git branch name'
        },
        commit: {
          bsonType: 'string',
          description: 'Git commit hash'
        },
        author: {
          bsonType: 'string',
          description: 'Commit author name'
        },
        durationMs: {
          bsonType: 'int',
          description: 'Build duration in milliseconds'
        },
        startedAt: {
          bsonType: 'date',
          description: 'Build start timestamp'
        },
        finishedAt: {
          bsonType: 'date',
          description: 'Build finish timestamp'
        },
        url: {
          bsonType: 'string',
          description: 'Link to build in Jenkins/GitHub'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Log creation timestamp'
        }
      }
    }
  }
});

// Create indexes for pipeline logs
db.pipelinelogs.createIndex({ pipeline: 1 });
db.pipelinelogs.createIndex({ status: 1 });
db.pipelinelogs.createIndex({ createdAt: -1 });
db.pipelinelogs.createIndex({ buildNumber: 1 });
// TTL index - automatically delete logs older than 30 days
db.pipelinelogs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
console.log('✓ Pipeline Logs collection created with indexes\n');

// ============================================================================
// CREATE VIEWS (Optional but useful for analytics)
// ============================================================================
console.log('📝 Creating database views...\n');

// View for file statistics per user
db.createView(
  'user_file_stats',
  'files',
  [
    {
      $match: { isDeleted: false }
    },
    {
      $group: {
        _id: '$owner',
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$size' },
        avgFileSize: { $avg: '$size' },
        lastUpload: { $max: '$createdAt' }
      }
    }
  ]
);

// View for version statistics per file
db.createView(
  'file_version_stats',
  'versions',
  [
    {
      $group: {
        _id: '$file',
        totalVersions: { $sum: 1 },
        latestVersion: { $max: '$versionNumber' },
        stableCount: {
          $sum: { $cond: [{ $eq: ['$status', 'stable'] }, 1, 0] }
        },
        riskyCount: {
          $sum: { $cond: [{ $eq: ['$status', 'risky'] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]
);

// View for recent pipeline builds
db.createView(
  'recent_builds',
  'pipelinelogs',
  [
    { $sort: { createdAt: -1 } },
    { $limit: 100 },
    {
      $project: {
        pipeline: 1,
        status: 1,
        buildNumber: 1,
        durationMs: 1,
        startedAt: 1,
        branch: 1
      }
    }
  ]
);

console.log('✓ Views created\n');

// ============================================================================
// INSERT SAMPLE DATA (Optional - for testing)
// ============================================================================
console.log('📝 Inserting sample data...\n');

// Sample user
const sampleUser = db.users.insertOne({
  name: 'John Doe',
  email: 'john@example.com',
  passwordHash: '$2b$12$...', // Bcrypt hash (placeholder)
  createdAt: new Date(),
  updatedAt: new Date()
});

console.log(`✓ Sample user created: ${sampleUser.insertedId}`);

// ============================================================================
// CREATE STORED PROCEDURES (Optional - useful for complex operations)
// ============================================================================
console.log('📝 Creating stored procedures...\n');

// Function to get user file count
db.createFunction({
  _id: 'getUserFileCount',
  code: function(userId) {
    return db.files.countDocuments({ owner: ObjectId(userId), isDeleted: false });
  }
});

// Function to get file total size
db.createFunction({
  _id: 'getUserTotalSize',
  code: function(userId) {
    const result = db.files.aggregate([
      { $match: { owner: ObjectId(userId), isDeleted: false } },
      { $group: { _id: null, totalSize: { $sum: '$size' } } }
    ]);
    return result.hasNext() ? result.next().totalSize : 0;
  }
});

console.log('✓ Stored procedures created\n');

// ============================================================================
// PRINT SUMMARY
// ============================================================================
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║           MongoDB Schema Setup Complete! ✓                    ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log('📊 Collections created:');
console.log('  • users              - User accounts and profiles');
console.log('  • files              - File metadata and current version');
console.log('  • versions           - File version history');
console.log('  • pipelinelogs       - CI/CD build history\n');

console.log('📈 Views created:');
console.log('  • user_file_stats    - File statistics per user');
console.log('  • file_version_stats - Version statistics per file');
console.log('  • recent_builds      - Latest pipeline builds\n');

console.log('📑 Indexes created:');
console.log('  ✓ Unique constraint on users.email');
console.log('  ✓ Composite index on files (owner, createdAt)');
console.log('  ✓ Composite index on versions (file, versionNumber)');
console.log('  ✓ TTL index on pipelinelogs (30 days)\n');

console.log('🔗 Database connections:');
console.log('  Local:     mongodb://localhost:27017/version_vault');
console.log('  Atlas:     mongodb+srv://user:pass@cluster/version_vault\n');

// ============================================================================
// VERIFICATION
// ============================================================================
console.log('✅ Verification:\n');
const collections = db.getCollectionNames();
console.log(`Collections: ${collections.join(', ')}\n`);

collections.forEach(col => {
  const count = db[col].countDocuments();
  const indexes = db[col].getIndexes().length;
  console.log(`  ${col}: ${count} documents, ${indexes} indexes`);
});

console.log('\n✓ All done! You can now start the application.\n');
