# Architecture Documentation

## System Overview

**Version Vault Pro** is a full-stack file versioning system with AI-powered insights and Jenkins integration. The architecture follows a modern three-tier design with separation of concerns.

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Client Layer (Browser)                   │
│  React 19 + TypeScript | TanStack Router | Vite              │
│                                                              │
│  - Authentication (Login/Register)                           │
│  - File Management (Upload/Download/Delete)                  │
│  - Version History (List/Compare/Restore)                    │
│  - AI Insights (Summaries/Recommendations)                   │
│  - DevOps Dashboard (Pipeline Status)                        │
└───────────────────────────┬──────────────────────────────────┘
                            │
                    HTTPS/WS │ (RESTful API)
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    Application Layer                         │
│  Node.js v24 + Express 4 | TypeScript/JavaScript             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Security Layer                                         │ │
│  │ - Helmet (HTTP Headers)                               │ │
│  │ - CORS (Cross-Origin)                                 │ │
│  │ - Rate Limiting (In-Memory)                           │ │
│  │ - JWT Authentication                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Route Layer (REST Endpoints)                           │ │
│  │ - /auth (register, login, me [GET/PUT])                │ │
│  │ - /files (upload, list, get, delete, quota, activities)│ │
│  │ - /files/:id/versions (list, restore)                │ │
│  │ - /files/:id/summary (AI summary)                    │ │
│  │ - /files/:id/recommendation (rollback)               │ │
│  │ - /files/:id/share (public/private toggle)           │ │
│  │ - /pipelines (status, sync)                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Business Logic Layer (Services)                        │ │
│  │ - AuthService (registration, JWT)                    │ │
│  │ - VersionService (CRUD operations)                   │ │
│  │ - FileStorageService (disk I/O)                      │ │
│  │ - AIService (summaries, OpenAI)                      │ │
│  │ - RecommendationService (stability scoring)          │ │
│  │ - JenkinsService (CI/CD integration)                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Data Access Layer (Models)                            │ │
│  │ - User (auth, profile, settings)                     │ │
│  │ - File (metadata, sharing)                            │ │
│  │ - Version (history, AI insights)                     │ │
│  │ - PipelineLog (Jenkins integration)                  │ │
│  │ - Activity (audit logging)                           │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────┬──────────────────┬──────────────────┬────────┘
                │                  │                  │
    ┌───────────▼─────┐  ┌─────────▼────────┐  ┌─────▼──────────┐
    │  MongoDB Atlas  │  │ File Storage     │  │ Jenkins API    │
    │ (Document DB)   │  │  (/uploads/)     │  │ (CI/CD)        │
    │                 │  │                  │  │                │
    │ - Users         │  │ /uploads/        │  │ Build Metadata │
    │ - Files         │  │  {userId}/       │  │ Pipeline Logs  │
    │ - Versions      │  │   {fileId}/      │  │                │
    │ - PipelineLogs  │  │    {versionId}   │  │ Optional       │
    │ - Activities    │  └──────────────────┘  └────────────────┘
    └─────────────────┘  └──────────────────┘  └────────────────┘
```

## Component Interaction Diagram

```
User Browser
    │
    ├─ [LOGIN PAGE] ────────────────────┐
    │                                   │
    ├─ [DASHBOARD]                      │
    │  ├─ File List                     │
    │  ├─ Upload UI                     │
    │  ├─ Version History               │
    │  └─ AI Insights                   │
    │                                   │
    └─ [SETTINGS]                       │
                                        │
        ┌───────────────────────────────┘
        │
        │ HTTP Request (with JWT)
        │
        ▼
    ┌─────────────────────────────────────────┐
    │ API Gateway (Reverse Proxy/Nginx)      │
    │ - Rate Limiting                        │
    │ - SSL Termination                      │
    │ - Load Balancing                       │
    └──────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
    ┌─────────────┐     ┌─────────────┐
    │ Backend #1  │     │ Backend #2  │  (Horizontally Scalable)
    │ :4000       │     │ :4000       │
    └──────┬──────┘     └──────┬──────┘
           │                   │
           │    Connection     │
           │     Pool          │
           └────────┬──────────┘
                    │
                    ▼
            ┌──────────────────┐
            │ MongoDB Atlas    │
            │                  │
            │ Connection Pool  │
            │ (Min: 2, Max: 10)│
            │                  │
            ├─ Replica Set    │
            ├─ Backups        │
            └──────────────────┘

    ┌──────────────────────────────────────┐
    │ Async Jobs (Optional)                │
    │                                      │
    │ - File cleanup (old versions)       │
    │ - Jenkins sync (fetch builds)       │
    │ - Archive operations (S3 optional) │
    │                                      │
    │ Run via: Node.js worker processes   │
    └──────────────────────────────────────┘
```

## Data Flow Diagrams

### File Upload Flow

```
1. User selects file in browser
   │
   ▼
2. Frontend validates file
   ├─ Check MIME type
   ├─ Check file size
   └─ Show upload progress
   │
   ▼
3. POST /files/upload
   ├─ Multer receives file
   ├─ Stores to /uploads/tmp/
   └─ Returns temp path
   │
   ▼
4. Backend validates upload
   ├─ Check MIME type again
   ├─ Check size limits
   └─ Validate filename
   │
   ▼
5. Create File & Version records in MongoDB
   ├─ File._id = new ObjectId
   ├─ Version.versionNumber = 1
   └─ Version.storagePath = set to final location
   │
   ▼
6. Move file from /tmp/ to versioned directory
   ├─ /uploads/{userId}/{fileId}/{versionId}.bin
   └─ /uploads/{userId}/{fileId}/{versionId}.meta.json
   │
   ▼
7. Calculate diff with previous version
   ├─ Read previous version file (if exists)
   ├─ Run LCS algorithm
   ├─ Calculate statistics
   └─ Store in Version.diffStats
   │
   ▼
8. Generate AI summary
   ├─ Local summary from diff stats
   ├─ Optional: Call OpenAI API
   └─ Fallback to local if API fails
   │
   ▼
9. Calculate stability score
   ├─ Check pipeline status
   ├─ Factor in file changes
   └─ Assign version status
   │
   ▼
10. Return response to client
    ├─ File metadata
    ├─ Version details
    ├─ Summary
    └─ Recommendation
```

### File Restore Flow

```
1. User selects version to restore
   │
   ▼
2. GET /files/:fileId/recommendation
   ├─ Rank versions by stability
   ├─ Suggest best candidates
   └─ Show confidence levels
   │
   ▼
3. User confirms restore
   │
   ▼
4. POST /files/:fileId/restore/:versionId
   ├─ Validate source version exists
   ├─ Validate user owns file
   └─ Check version is not current
   │
   ▼
5. Create NEW version from source
   ├─ Copy source file to new version
   ├─ Create new Version record
   ├─ Set versionNumber = max+1
   └─ Set restoredFromVersionId = source
   │
   ▼
6. Calculate diff with previous version
   │
   ▼
7. Update File.currentVersionId
   │
   ▼
8. Return success response
   ├─ New version details
   ├─ Confirmation message
   └─ Archive of old versions (unchanged)
```

### Authentication Flow

```
1. User accesses /login
   │
   ▼
2. Submit login form
   ├─ POST /auth/login
   ├─ Email + Password
   └─ No token required
   │
   ▼
3. Backend validates credentials
   ├─ Find user by email
   ├─ Compare password hash
   ├─ Validate password complexity
   └─ Check account not locked
   │
   ▼
4. Generate JWT token
   ├─ Header: { alg: "HS256", typ: "JWT" }
   ├─ Payload: { userId, email, iat, exp }
   └─ Sign with JWT_SECRET
   │
   ▼
5. Return token to client
   │
   ▼
6. Frontend stores token in localStorage
   │
   ▼
7. Include token in all subsequent requests
   ├─ Header: Authorization: Bearer <token>
   └─ Sent with all API requests
   │
   ▼
8. Backend verifies token
   ├─ Extract from Authorization header
   ├─ Verify signature with JWT_SECRET
   ├─ Check expiration
   └─ Extract userId
   │
   ▼
9. Attach user context to request
   ├─ req.user = { userId, email }
   └─ Continue to handler
   │
   ▼
10. On logout
    ├─ Clear localStorage on client
    └─ Token invalidated (no server-side blacklist)
```

## Database Schema Relationships

```
┌─────────────────────────────────────────────┐
│ Users                                       │
├─────────────────────────────────────────────┤
│ _id: ObjectId (Primary Key)                │
│ name: String                                │
│ email: String (Unique Index)               │
│ passwordHash: String                        │
│ createdAt: Date (Index)                    │
│ updatedAt: Date                            │
└──────────────────┬──────────────────────────┘
                   │ 1
                   │ owns many
                   │
                   │ references: _id
                   │
                   ▼ N
┌─────────────────────────────────────────────┐
│ Files                                       │
├─────────────────────────────────────────────┤
│ _id: ObjectId (Primary Key)                │
│ owner: ObjectId (Foreign Key → Users._id)  │
│ originalName: String (Index with owner)    │
│ mimeType: String                           │
│ size: Number                                │
│ currentVersionNumber: Number                │
│ currentVersionId: ObjectId (Foreign Key)   │
│ isDeleted: Boolean (Index)                 │
│ createdAt: Date                            │
│ updatedAt: Date                            │
└──────────────────┬──────────────────────────┘
                   │ 1
                   │ has many
                   │
                   │ references: _id
                   │
                   ▼ N
┌─────────────────────────────────────────────┐
│ Versions                                    │
├─────────────────────────────────────────────┤
│ _id: ObjectId (Primary Key)                │
│ file: ObjectId (Foreign Key → Files._id)   │
│ owner: ObjectId (Foreign Key → Users._id)  │
│ versionNumber: Number (Index with file)    │
│ storagePath: String                        │
│ mimeType: String                           │
│ size: Number                                │
│ status: String (stable|risky|failed)       │
│ summary: String                            │
│ diffStats: {                               │
│   added: Number                            │
│   removed: Number                          │
│   modified: Number                         │
│   similarity: Number (0-100)               │
│ }                                           │
│ restoredFromVersionId: ObjectId (optional) │
│ isCurrent: Boolean (Denormalized)          │
│ createdAt: Date (Index, TTL)              │
│ updatedAt: Date                            │
└──────────────────┬──────────────────────────┘
                   │
                   │ optional reference
                   │
                   ├─→ restoredFromVersionId
                   └─→ points to previous Version

┌─────────────────────────────────────────────┐
│ PipelineLogs                                │
├─────────────────────────────────────────────┤
│ _id: ObjectId (Primary Key)                │
│ source: String ("jenkins")                 │
│ pipeline: String (Index)                   │
│ buildNumber: Number                        │
│ status: String (Index)                     │
│ branch: String                             │
│ commit: String                             │
│ author: String                             │
│ durationMs: Number                         │
│ startedAt: Date                            │
│ finishedAt: Date                           │
│ url: String                                │
│ createdAt: Date (Index, TTL: 30 days)    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Activities                                  │
├─────────────────────────────────────────────┤
│ _id: ObjectId (Primary Key)                │
│ owner: ObjectId (Foreign Key → Users._id)  │
│ type: String (upload|restore|delete|share) │
│ fileId: ObjectId (Optional)                │
│ fileName: String                           │
│ details: String                            │
│ createdAt: Date (Index)                    │
└─────────────────────────────────────────────┘
```

## Storage Structure

```
/uploads/
├── tmp/                              # Temporary upload staging
│   └── {timestamp}_{random}.{ext}    # Removed after processing
│
└── {userId}/                         # Per-user directory
    └── {fileId}/                     # Per-file directory
        ├── v1_20260501T143022.bin         # Version 1 binary
        ├── v1_20260501T143022.meta.json  # Version 1 metadata
        │   {
        │     "version": 1,
        │     "originalName": "document.pdf",
        │     "mimeType": "application/pdf",
        │     "size": 524288,
        │     "uploadedAt": "2026-05-01T14:30:22.000Z"
        │   }
        │
        ├── v2_20260502T091545.bin         # Version 2 binary
        ├── v2_20260502T091545.meta.json  # Version 2 metadata
        │
        ├── v3_20260503T164203.bin         # Version 3 binary (restored from v1)
        └── v3_20260503T164203.meta.json
            {
              "version": 3,
              "originalName": "document.pdf",
              "mimeType": "application/pdf",
              "size": 524288,
              "uploadedAt": "2026-05-03T16:42:03.000Z",
              "restoredFromVersion": 1
            }

Directory Permissions:
- Owner: appuser (uid 1001)
- Group: nodejs (gid 1001)
- Permissions: 755 (rwxr-xr-x)
- File size typical: 1KB - 100MB
- Total capacity: Depends on storage device
```

## Middleware Stack Order

```
Request → ┌─────────────────────────────────────┐
          │ Helmet Security Headers             │
          │ (X-Frame-Options, CSP, etc)        │
          └────────────────┬────────────────────┘
                           │
                           ▼
                     ┌─────────────────────────────────────┐
                     │ CORS (Cross-Origin)                │
                     │ (Allow CLIENT_ORIGIN)              │
                     └────────────────┬────────────────────┘
                                      │
                                      ▼
                           ┌─────────────────────────────────────┐
                           │ Morgan (HTTP Logging)              │
                           │ (Dev mode: combined format)        │
                           └────────────────┬────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────┐
                     │ Body Parser (JSON/URLEncoded)        │
                     │ (Limit: 10MB default)               │
                     └────────────────┬─────────────────────┘
                                      │
                                      ▼
                           ┌─────────────────────────────────────┐
                           │ Response Formatter Middleware       │
                           │ (Add res.success(), res.error())   │
                           └────────────────┬────────────────────┘
                                            │
                                            ▼
                           ┌─────────────────────────────────────┐
                           │ Rate Limit (Per-Endpoint)          │
                           │ (Auth: 5/15min, API: 100/15min)   │
                           └────────────────┬────────────────────┘
                                            │
                                            ▼
                           ┌─────────────────────────────────────┐
                           │ Routes (API Endpoints)             │
                           │ /auth, /files, /pipelines          │
                           └────────────────┬────────────────────┘
                                            │
                                 ┌──────────┴──────────┐
                                 │                     │
                    ┌────────────────────┐  ┌─────────────────┐
                    │ Protected Routes   │  │ Public Routes   │
                    │ (JWT Required)     │  │ (No Auth)       │
                    │                    │  │                 │
                    │ /files/*           │  │ /auth/register  │
                    │ /pipelines/*       │  │ /auth/login     │
                    │ /auth/me           │  │ /health         │
                    └────────────────────┘  └─────────────────┘
                                            │
                                            ▼
                           ┌─────────────────────────────────────┐
                           │ 404 Handler (Not Found)            │
                           │ (If no route matches)              │
                           └────────────────┬────────────────────┘
                                            │
                                            ▼
                           ┌─────────────────────────────────────┐
                           │ Global Error Handler               │
                           │ (Catch all errors)                 │
                           │ Return structured response         │
                           └────────────────┬────────────────────┘
                                            │
                                            ▼
Response ← ──────────────────────────────────────────────────
```

## Error Handling Architecture

```
Exception Occurs
        │
        ▼
┌─────────────────────────────────┐
│ Is it an ApiError?              │
│ (Custom error class)            │
└────────┬───────────────────┬────┘
         │ Yes              │ No
         │                  │
         ▼                  ▼
    ┌─────────┐      ┌──────────────────┐
    │ Log     │      │ Wrap in          │
    │ Error   │      │ ApiError.internal│
    │         │      │ (500 error)      │
    └────┬────┘      └─────┬────────────┘
         │                 │
         └────────┬────────┘
                  │
                  ▼
    ┌─────────────────────────────────┐
    │ Extract:                        │
    │ - status (200-500)              │
    │ - code (ERR_* constant)         │
    │ - message (user-friendly)       │
    │ - details (dev only)            │
    └────────┬───────────────────┬────┘
             │                   │
      Prod? │                   │ Dev?
             │                   │
             ▼                   ▼
    ┌─────────────────┐  ┌─────────────────┐
    │ Safe response   │  │ Full error info │
    │ (hide details)  │  │ (for debugging) │
    │                 │  │                 │
    │ 500: "Server    │  │ 500: "Database  │
    │ error, try      │  │ connection     │
    │ again"          │  │ failed: 127.0.0.1:27017" │
    │                 │  │                 │
    │ 409: "Email     │  │ 409: "User with│
    │ already in use" │  │ email exists"   │
    └─────────────────┘  └─────────────────┘
```

## Scaling Considerations

### Vertical Scaling (Single Server)
- Increase container memory limits
- Increase MongoDB pool size
- Increase Node.js thread count

### Horizontal Scaling (Multiple Servers)
```
Load Balancer (Nginx/HAProxy)
    │
    ├─→ Backend Instance #1 ──┐
    ├─→ Backend Instance #2   ├─→ MongoDB Replica Set
    ├─→ Backend Instance #N ──┘
    │
    └─→ Frontend CDN (Static Assets)
```

For production deployment:
- Use Redis for rate limiting (not in-memory)
- Use session store (not localStorage-only)
- Use shared storage (S3/EBS for uploads)
- Configure sticky sessions for WebSockets (if needed)

## Performance Characteristics

| Operation | Typical Time | Scaling |
|-----------|--------------|---------|
| User registration | 100-200ms | Linear O(1) |
| File upload (10MB) | 500-1500ms | Linear O(n) |
| Version list (100 versions) | 50-100ms | Log O(log n) |
| AI summary generation | 1-3s | Linear O(n) |
| Recommendation ranking | 500-1000ms | Linear O(n) |
| File restore | 300-500ms | O(1) |

## Deployment Topology

```
Development:
  └─ Single docker-compose stack
     - All services on localhost
     - In-memory rate limiting
     - Single MongoDB instance

Staging:
  └─ Docker Compose or Kubernetes
     - Services on separate machines (optional)
     - Rate limiting via Redis (optional)
     - MongoDB replica set

Production:
  ├─ Kubernetes Cluster (Recommended)
  │  ├─ Frontend pods (replicas: 2-4)
  │  ├─ Backend pods (replicas: 2-4)
  │  └─ Ingress controller
  │
  ├─ Or Docker Swarm
  │  ├─ Frontend service (replicas: 2)
  │  ├─ Backend service (replicas: 2)
  │  └─ Reverse proxy service
  │
  ├─ Data Layer
  │  ├─ MongoDB Atlas (recommended)
  │  ├─ S3/Cloud storage (files)
  │  └─ Redis (sessions/rate limit)
  │
  └─ CI/CD Integration
     ├─ GitHub Actions / Jenkins
     ├─ Automated testing
     ├─ Container registry
     └─ Deployment automation
```

---

**Version**: 1.0  
**Last Updated**: 2026-05-14
