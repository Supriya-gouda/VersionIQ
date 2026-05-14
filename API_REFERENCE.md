# VersionIQ API Reference

This document provides detailed information about the REST API endpoints available in VersionIQ.

## Base URL
Default: `http://localhost:4000`

## Authentication
All protected routes require a Bearer token in the `Authorization` header:
`Authorization: Bearer <your_jwt_token>`

### 1. Register User
`POST /auth/register`
- **Body**: `{ "name": "...", "email": "...", "password": "..." }`
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "token": "...",
    "user": { "id": "...", "name": "...", "email": "...", "role": "...", "notifications": {...} }
  }
  ```

### 2. Login
`POST /auth/login`
- **Body**: `{ "email": "...", "password": "..." }`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "token": "...",
    "user": { ... }
  }
  ```

### 3. Get Current User (Me)
`GET /auth/me`
- **Auth**: Required
- **Response**: `200 OK`
  ```json
  { "success": true, "user": { ... } }
  ```

### 4. Update Profile
`PUT /auth/me`
- **Auth**: Required
- **Body**: `{ "name": "...", "role": "...", "notifications": { "uploads": true, ... } }`
- **Response**: `200 OK`
  ```json
  { "success": true, "user": { ... } }
  ```

## File Management

### 5. Upload File
`POST /files/upload`
- **Auth**: Required
- **Body**: `multipart/form-data`
  - `file`: Binary data
  - `fileId`: (Optional) Existing file ID to create a new version
  - `status`: (Optional) "stable" | "risky" | "failed" (default: "stable")
- **Response**: `201 Created`
  ```json
  { "success": true, "file": { ... }, "version": { ... } }
  ```

### 6. List Files
`GET /files`
- **Auth**: Required
- **Response**: `200 OK`
  ```json
  { "success": true, "files": [ ... ] }
  ```

### 7. Get File Details
`GET /files/:id`
- **Auth**: Required
- **Response**: `200 OK`
  ```json
  { "success": true, "file": { ... }, "currentVersion": { ... } }
  ```

### 8. Download File
`GET /files/:id/download`
- **Auth**: Required
- **Response**: Binary file data

### 9. Delete File (Soft Delete)
`DELETE /files/:id`
- **Auth**: Required
- **Response**: `200 OK`

## Versioning & AI

### 10. List Versions
`GET /files/:id/versions`
- **Auth**: Required
- **Response**: `200 OK`
  ```json
  { "success": true, "versions": [ ... ] }
  ```

### 11. Restore Version
`POST /files/:id/restore/:versionId`
- **Auth**: Required
- **Response**: `200 OK`
  ```json
  { "success": true, "message": "Restored version ...", "file": { ... }, "version": { ... } }
  ```

### 12. Get AI Summary
`GET /files/:id/summary`
- **Auth**: Required
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "summary": { "versionNumber": 2, "text": "...", "diffStats": { ... } }
  }
  ```

### 13. Get Rollback Recommendation
`GET /files/:id/recommendation`
- **Auth**: Required
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "recommendation": { "recommendedVersionId": "...", "score": 95, "rationale": "..." }
  }
  ```

## DevOps & Activity

### 14. List Pipelines
`GET /pipelines/status`
- **Auth**: Required
- **Response**: `200 OK`
  ```json
  { "success": true, "pipelines": [ ... ] }
  ```

### 15. Sync Pipelines
`POST /pipelines/sync`
- **Auth**: Required
- **Response**: `200 OK`

### 16. Get Storage Quota
`GET /files/quota`
- **Auth**: Required
- **Response**: `200 OK`
  ```json
  { "success": true, "quota": { "used": 5242880, "limit": 10737418240, "percent": 1 } }
  ```

### 17. Share File
`POST /files/:id/share`
- **Auth**: Required
- **Body**: `{ "isPublic": true }`
- **Response**: `200 OK`
  ```json
  { "success": true, "file": { ..., "shareToken": "...", "isPublic": true } }
  ```

### 18. List Activities
`GET /files/activities`
- **Auth**: Required
- **Response**: `200 OK`
  ```json
  { "success": true, "activities": [ ... ] }
  ```

## System
- `GET /health`: System health check
- `GET /`: API root information
