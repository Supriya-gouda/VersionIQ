/**
 * Version Vault Pro - MongoDB Schema Setup Guide
 * 
 * This file provides instructions for setting up the MongoDB database
 * It includes both Mongoose auto-indexing and manual setup options
 */

# MongoDB Schema Setup for Version Vault Pro

## Quick Start

### Option 1: Automatic Setup (Recommended)
The application will automatically create collections and indexes when it starts:

```bash
# 1. Start MongoDB
docker run -d -p 27017:27017 mongo:7.0

# 2. Start the application
npm run dev

# Mongoose will auto-create collections and indexes
```

### Option 2: Manual Setup with Script

#### Using MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to your MongoDB instance
3. Create database: `version_vault`
4. Run the schema script: `backend/scripts/schema.js`

#### Using mongosh (CLI)
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017

# Load and execute schema
load('/path/to/backend/scripts/schema.js')
```

#### Using Docker
```bash
docker exec -it mongodb mongosh /home/schema.js
```

## Database Architecture

### Collections Overview

| Collection | Purpose | Documents |
|-----------|---------|-----------|
| **users** | User accounts, authentication | 1 per user |
| **files** | File metadata, current version ref | 1 per file |
| **versions** | File version history | N per file |
| **pipelinelogs** | CI/CD build history | 1 per build |

### Data Relationships

```
User (1) ──┬─→ (N) Files
           │
           └─→ (N) Versions
           
File (1) ──→ (N) Versions
Version → File (parent)
Version → User (owner)
```

## Collection Schemas

### 1. Users Collection

```javascript
{
  _id: ObjectId,
  name: String,              // Full name (2-80 chars)
  email: String,             // Unique email
  passwordHash: String,      // Bcrypt hashed (12 rounds)
  createdAt: Date,          // Account creation
  updatedAt: Date           // Last modified
}
```

**Indexes:**
- `email: 1` (unique)
- `createdAt: -1`

**Example:**
```javascript
db.users.insertOne({
  name: "John Doe",
  email: "john@example.com",
  passwordHash: "$2b$12$...",
  createdAt: ISODate("2026-05-14T10:00:00Z"),
  updatedAt: ISODate("2026-05-14T10:00:00Z")
})
```

---

### 2. Files Collection

```javascript
{
  _id: ObjectId,
  owner: ObjectId,           // User._id
  originalName: String,      // "document.pdf"
  mimeType: String,         // "application/pdf"
  size: Number,             // Bytes (100000)
  currentVersionNumber: Number,  // Latest version (2)
  currentVersionId: ObjectId,    // Version._id
  isDeleted: Boolean,       // Soft delete flag
  createdAt: Date,          // Upload date
  updatedAt: Date           // Last update
}
```

**Indexes:**
- `owner: 1`
- `isDeleted: 1`
- `owner: 1, createdAt: -1` (compound)
- `owner: 1, isDeleted: 1` (compound)

**Example:**
```javascript
db.files.insertOne({
  owner: ObjectId("..."),
  originalName: "budget.xlsx",
  mimeType: "application/vnd.ms-excel",
  size: 524288,
  currentVersionNumber: 2,
  currentVersionId: ObjectId("..."),
  isDeleted: false,
  createdAt: ISODate("2026-05-14T10:00:00Z"),
  updatedAt: ISODate("2026-05-14T11:00:00Z")
})
```

---

### 3. Versions Collection

```javascript
{
  _id: ObjectId,
  file: ObjectId,               // File._id
  owner: ObjectId,              // User._id (denormalized)
  versionNumber: Number,        // 1, 2, 3... (sequential)
  storedFilename: String,       // UUID-based stored name
  originalName: String,         // Original filename
  mimeType: String,            // MIME type
  size: Number,                // File size in bytes
  storagePath: String,         // Full disk path
  status: String,              // "stable" | "risky" | "failed"
  summary: String,             // AI-generated summary
  diffStats: {
    added: Number,             // Lines/bytes added
    removed: Number,           // Lines/bytes removed
    modified: Number,          // Lines/bytes modified
    similarity: Number         // 0-100 similarity %
  },
  restoredFromVersionId: ObjectId,  // If restored, source version
  isCurrent: Boolean,          // Is this the active version?
  createdAt: Date,             // Version creation time
  updatedAt: Date              // Last update
}
```

**Indexes:**
- `file: 1`
- `owner: 1`
- `isCurrent: 1`
- `file: 1, versionNumber: 1` (unique compound)
- `file: 1, createdAt: -1` (compound)
- `owner: 1, createdAt: -1` (compound)

**Example:**
```javascript
db.versions.insertOne({
  file: ObjectId("..."),
  owner: ObjectId("..."),
  versionNumber: 2,
  storedFilename: "8a3b4c5d-e6f7-11ec-8ea0-0242ac120002.bin",
  originalName: "budget.xlsx",
  mimeType: "application/vnd.ms-excel",
  size: 524288,
  storagePath: "/uploads/user_id/file_id/v2_timestamp.bin",
  status: "stable",
  summary: "Added Q3 budget data, updated totals",
  diffStats: {
    added: 150,
    removed: 50,
    modified: 25,
    similarity: 85
  },
  restoredFromVersionId: null,
  isCurrent: true,
  createdAt: ISODate("2026-05-14T11:00:00Z"),
  updatedAt: ISODate("2026-05-14T11:00:00Z")
})
```

---

### 4. Pipeline Logs Collection

```javascript
{
  _id: ObjectId,
  source: String,        // "jenkins" | "github-actions" | "gitlab-ci"
  pipeline: String,      // Pipeline name
  buildNumber: Number,   // Build ID
  status: String,        // "success" | "failed" | "unstable" | "aborted"
  branch: String,        // Git branch
  commit: String,        // Git commit hash
  author: String,        // Commit author
  durationMs: Number,    // Build duration in ms
  startedAt: Date,       // Build start time
  finishedAt: Date,      // Build finish time
  url: String,           // Link to build page
  createdAt: Date        // Log creation time (TTL: 30 days)
}
```

**Indexes:**
- `pipeline: 1`
- `status: 1`
- `createdAt: -1`
- `buildNumber: 1`
- `createdAt: 1` (TTL - auto-delete after 30 days)

**Example:**
```javascript
db.pipelinelogs.insertOne({
  source: "jenkins",
  pipeline: "version-vault-pipeline",
  buildNumber: 42,
  status: "success",
  branch: "main",
  commit: "abc123def456",
  author: "John Doe",
  durationMs: 45000,
  startedAt: ISODate("2026-05-14T10:00:00Z"),
  finishedAt: ISODate("2026-05-14T10:45:00Z"),
  url: "http://jenkins/job/version-vault/42",
  createdAt: ISODate("2026-05-14T10:45:00Z")
})
```

---

## Database Views

### View 1: user_file_stats
Aggregated file statistics per user

```javascript
db.createView(
  'user_file_stats',
  'files',
  [
    { $match: { isDeleted: false } },
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
```

**Usage:**
```bash
db.user_file_stats.findOne({ _id: ObjectId("...") })

// Response:
{
  _id: ObjectId("..."),
  totalFiles: 15,
  totalSize: 10485760,
  avgFileSize: 699050,
  lastUpload: ISODate("2026-05-14T11:00:00Z")
}
```

### View 2: file_version_stats
Version statistics per file

```javascript
db.createView(
  'file_version_stats',
  'versions',
  [
    {
      $group: {
        _id: '$file',
        totalVersions: { $sum: 1 },
        latestVersion: { $max: '$versionNumber' },
        stableCount: { $sum: { $cond: [{ $eq: ['$status', 'stable'] }, 1, 0] } },
        riskyCount: { $sum: { $cond: [{ $eq: ['$status', 'risky'] }, 1, 0] } },
        failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
      }
    }
  ]
);
```

### View 3: recent_builds
Latest 100 pipeline builds

```javascript
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
```

---

## Useful Queries

### Get all files for a user
```javascript
db.files.find({ owner: ObjectId("user_id"), isDeleted: false })
```

### Get version history for a file
```javascript
db.versions.find({ file: ObjectId("file_id") }).sort({ versionNumber: -1 })
```

### Get successful builds in last 7 days
```javascript
db.pipelinelogs.find({
  status: "success",
  createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
}).sort({ createdAt: -1 })
```

### Get unstable versions
```javascript
db.versions.find({ status: { $in: ["risky", "failed"] } })
```

### Calculate total storage used
```javascript
db.files.aggregate([
  { $match: { isDeleted: false } },
  { $group: { _id: null, totalSize: { $sum: '$size' } } }
])
```

---

## Index Management

### View all indexes
```javascript
db.users.getIndexes()
db.files.getIndexes()
db.versions.getIndexes()
db.pipelinelogs.getIndexes()
```

### View index usage statistics
```javascript
db.files.aggregate([
  { $indexStats: {} }
])
```

### Drop an index
```javascript
db.files.dropIndex('owner_1_createdAt_-1')
```

---

## Backup & Recovery

### Backup MongoDB database
```bash
# Docker backup
docker exec mongodb mongodump --out /backup

# Local backup
mongodump --uri "mongodb://localhost:27017/version_vault" --out backup/
```

### Restore MongoDB database
```bash
# Docker restore
docker exec mongodb mongorestore /backup

# Local restore
mongorestore --uri "mongodb://localhost:27017/version_vault" backup/version_vault/
```

### Export to JSON
```bash
mongoexport --collection=files --uri="mongodb://localhost:27017/version_vault" --out files.json
```

### Import from JSON
```bash
mongoimport --collection=files --uri="mongodb://localhost:27017/version_vault" files.json
```

---

## Maintenance & Optimization

### Calculate database size
```javascript
db.stats()
```

### Get collection sizes
```javascript
db.files.stats()
db.versions.stats()
```

### Remove soft-deleted files older than 30 days
```javascript
db.files.deleteMany({
  isDeleted: true,
  updatedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
})
```

### Rebuild indexes
```javascript
db.files.reIndex()
db.versions.reIndex()
```

---

## MongoDB Atlas Configuration

If using MongoDB Atlas (recommended for production):

1. **Create Atlas Account**
   - Visit cloud.mongodb.com
   - Sign up or sign in

2. **Create Cluster**
   - Choose M10+ tier (minimum for production)
   - Enable automatic backups
   - Configure backup retention (30 days recommended)

3. **Create Database User**
   - Username: `version_vault_user`
   - Password: Generate strong password
   - Assign admin role for setup

4. **Configure Network Access**
   - Add IP whitelist (your server IP)
   - Or allow all IPs (less secure)

5. **Get Connection String**
   - Format: `mongodb+srv://user:pass@cluster.mongodb.net/version_vault?retryWrites=true&w=majority`
   - Add to `.env` as `MONGODB_URI`

6. **Create Application User** (with read/write only)
   - Limited permissions for production
   - Different password from setup user

---

## Performance Tips

1. **Enable Compression**
   - Use WiredTiger (default)
   - Enable compression on collections

2. **Connection Pooling**
   - `minPoolSize: 2`
   - `maxPoolSize: 10`
   - Adjust based on load

3. **Index Strategy**
   - Create indexes for frequently queried fields
   - Monitor index usage
   - Remove unused indexes

4. **Query Optimization**
   - Use `.explain()` to analyze queries
   - Ensure queries use indexes
   - Use `lean()` in Mongoose for read-only queries

5. **Data Archival**
   - Archive old pipeline logs (TTL index)
   - Clean up soft-deleted files
   - Consider S3 for old file versions

---

## Environment Variables

Add to `backend/.env`:

```ini
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/version_vault

# Optional: for Atlas
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/version_vault
```

---

## Troubleshooting

**Issue: Connection refused**
- Check MongoDB is running
- Verify connection string
- Check firewall/network access

**Issue: Authentication failed**
- Verify username and password
- Check `authSource=admin` in connection string
- Ensure user has database access

**Issue: Slow queries**
- Check query with `.explain()`
- Create missing indexes
- Update statistics: `db.files.stats()`

**Issue: Storage full**
- Check `db.stats()`
- Remove old pipeline logs
- Archive old file versions

---

**Last Updated**: 2026-05-14  
**MongoDB Version**: 5.0+  
**Connection**: Local or Atlas
