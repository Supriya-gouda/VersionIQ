# MongoDB Setup - Quick Reference Guide

## 🚀 Quick Start

### Option 1: Automatic Setup (Recommended)
The application automatically creates collections and indexes on first run:

```bash
# 1. Start MongoDB
docker run -d -p 27017:27017 mongo:7.0

# 2. Start the application
npm run dev

# Done! Collections created automatically by Mongoose
```

### Option 2: Manual Schema Setup

#### Using MongoDB Compass (GUI - Easiest)
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Create database: **version_vault**
4. Open terminal in Compass
5. Copy-paste the schema commands from `backend/scripts/schema.js`
6. Execute

#### Using MongoDB Shell (mongosh)
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017

# Load schema script
load('backend/scripts/schema.js')

# Done! All collections created with proper indexes
```

#### Using Docker
```bash
# Start MongoDB container
docker run -d --name mongodb -p 27017:27017 mongo:7.0

# Copy schema script into container
docker cp backend/scripts/schema.js mongodb:/home/

# Execute in container
docker exec -it mongodb mongosh /home/schema.js
```

---

## 📋 Collections Created

Run this in mongosh to verify collections:

```bash
# Show all collections
show collections

# Expected output:
# files
# pipelinelogs
# users
# versions
```

---

## ✅ Verification Checklist

After running schema setup:

```bash
# 1. Connect to database
mongosh mongodb://localhost:27017/version_vault

# 2. Verify collections exist
show collections

# 3. Check user collection indexes
db.users.getIndexes()

# 4. Check file collection indexes
db.files.getIndexes()

# 5. Check version collection indexes
db.versions.getIndexes()

# 6. Check pipeline logs indexes
db.pipelinelogs.getIndexes()

# 7. View collection stats
db.files.stats()
```

---

## 🔧 Common Database Operations

### Check Database Size
```javascript
db.stats()
```

### View User Count
```javascript
db.users.countDocuments()
```

### View File Count
```javascript
db.files.countDocuments({ isDeleted: false })
```

### View Total Storage Used
```javascript
db.files.aggregate([
  { $match: { isDeleted: false } },
  { $group: { _id: null, totalSize: { $sum: '$size' } } }
])
```

### Check Index Usage
```javascript
db.files.aggregate([{ $indexStats: {} }])
```

### Find Slow Queries
```javascript
db.system.profile.find().pretty()
```

---

## 🗑️ Clean Database

### Drop All Collections (Reset Database)
```javascript
db.users.deleteMany({})
db.files.deleteMany({})
db.versions.deleteMany({})
db.pipelinelogs.deleteMany({})
```

### Drop Entire Database
```javascript
db.dropDatabase()
```

### Delete Old Pipeline Logs (> 30 days)
```javascript
db.pipelinelogs.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
})
```

---

## 📊 Database Views

### Check Views
```javascript
show collections  // Lists all collections and views

// Should show:
// file_version_stats
// recent_builds
// user_file_stats
```

### Query User File Stats View
```javascript
db.user_file_stats.findOne()

// Returns:
// {
//   _id: ObjectId(...),
//   totalFiles: 5,
//   totalSize: 1024000,
//   avgFileSize: 204800,
//   lastUpload: ISODate(...)
// }
```

### Query Recent Builds
```javascript
db.recent_builds.find().limit(10)
```

---

## 🔒 Security Setup (Production)

### Create Application User (Limited Permissions)
```javascript
use admin

db.createUser({
  user: "app_user",
  pwd: "strong_password_here",
  roles: [
    {
      role: "readWrite",
      db: "version_vault"
    }
  ]
})
```

### Connect with Application User
```bash
# Update connection string in .env
MONGODB_URI=mongodb://app_user:strong_password_here@localhost:27017/version_vault
```

### Create Backup User
```javascript
use admin

db.createUser({
  user: "backup_user",
  pwd: "backup_password",
  roles: [
    {
      role: "backup",
      db: "version_vault"
    }
  ]
})
```

---

## 📦 MongoDB Atlas Setup (Production Recommended)

### Step 1: Create Cluster
1. Visit https://cloud.mongodb.com
2. Sign up or login
3. Create new cluster (M10+ tier for production)
4. Wait for cluster to initialize (5-10 minutes)

### Step 2: Create Database User
1. Go to Database Access
2. Create new database user
3. Username: `version_vault_user`
4. Password: Generate strong password
5. Save credentials securely

### Step 3: Configure Network Access
1. Go to Network Access
2. Add IP address of your server
3. Or "Allow from anywhere" (less secure)

### Step 4: Get Connection String
1. Click "Connect" on cluster
2. Choose "Connect your application"
3. Select Driver: Node.js
4. Copy connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/version_vault?retryWrites=true&w=majority
   ```

### Step 5: Configure Application
```bash
# Update backend/.env
MONGODB_URI=mongodb+srv://version_vault_user:password@cluster.mongodb.net/version_vault?retryWrites=true&w=majority
```

### Step 6: Enable Backups
1. Go to Backup in cluster settings
2. Enable "Backup Clusters"
3. Set retention policy (30 days recommended)
4. Snapshots automatically created daily

---

## 🔄 Backup & Restore

### Backup with Docker
```bash
# Create backup
docker exec mongodb mongodump --out /backup

# Copy backup to local
docker cp mongodb:/backup ./mongodb_backup

# Verify backup
ls -la ./mongodb_backup/version_vault/
```

### Restore with Docker
```bash
# Copy backup into container
docker cp ./mongodb_backup mongodb:/restore

# Restore database
docker exec mongodb mongorestore /restore
```

### Backup with mongosh
```bash
# Using mongodump
mongodump --uri="mongodb://localhost:27017/version_vault" \
          --out=./backup

# Using mongoexport (collections as JSON)
mongoexport --uri="mongodb://localhost:27017/version_vault" \
           --collection=files \
           --out=files_backup.json
```

---

## 🐳 Docker MongoDB

### Start MongoDB Container
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongo_data:/data/db \
  mongo:7.0
```

### Connect to MongoDB in Docker
```bash
# Using mongosh
docker exec -it mongodb mongosh

# Using docker-compose
docker compose up -d
docker exec -it version-vault-pro-mongodb-1 mongosh
```

### View MongoDB Logs
```bash
docker logs mongodb

# Follow logs in real-time
docker logs -f mongodb
```

### Stop/Remove MongoDB
```bash
# Stop
docker stop mongodb

# Remove
docker rm mongodb

# Remove with data
docker rm -v mongodb
```

---

## 📈 Performance Tuning

### Create Text Index (for full-text search)
```javascript
db.files.createIndex({ originalName: "text" })

// Query:
db.files.find({ $text: { $search: "document" } })
```

### Create Compound Index (optimization)
```javascript
db.versions.createIndex({ file: 1, createdAt: -1 })
```

### Analyze Query Performance
```javascript
db.files.find({ owner: ObjectId(...) }).explain("executionStats")
```

### Monitor Long-Running Queries
```javascript
// Check current operations
db.currentOp()

// Kill slow query
db.killOp(opid)
```

---

## 🚨 Troubleshooting

### Connection Refused
```bash
# Check MongoDB is running
docker ps | grep mongodb

# Start MongoDB if not running
docker start mongodb

# Verify connection string
mongosh "mongodb://localhost:27017"
```

### Authentication Failed
```javascript
// Check users in admin database
use admin
db.getUsers()

// Verify user has access to database
db.grantRolesToUser("app_user", [
  { role: "readWrite", db: "version_vault" }
])
```

### Indexes Not Used
```javascript
// Rebuild indexes
db.collection.reIndex()

// Analyze query performance
db.collection.find({...}).explain("executionStats")
```

### Database Full
```javascript
// Check size
db.stats()

// Remove old documents
db.pipelinelogs.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
})
```

---

## 📚 Environment Variables

Add to `backend/.env`:

```ini
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/version_vault

# Or MongoDB Atlas
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/version_vault?retryWrites=true&w=majority

# Connection options (optional)
MONGODB_POOL_SIZE=10
MONGODB_CONNECTION_TIMEOUT=5000
```

---

## ✅ Verification Steps

After setup, verify everything works:

```bash
# 1. Start application
npm run dev

# 2. Check backend logs
# Should show: "Connected to MongoDB"

# 3. Run tests
cd backend && npm test

# 4. Try registration
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123"
  }'

# 5. Check database
mongosh mongodb://localhost:27017/version_vault
db.users.findOne()
```

---

## 🎓 Learning Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB University](https://university.mongodb.com/)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/monitoring/)

---

**Last Updated**: 2026-05-14  
**MongoDB Version**: 7.0+  
**Status**: ✅ READY TO USE
