# Production Deployment Guide

## Overview

This guide covers deploying **Version Vault Pro** to a production environment. The system is designed for Kubernetes, traditional VMs, or Docker environments.

## Pre-Deployment Verification

### 1. Run Validation Script

```bash
npm run validate:prod
```

This script verifies:
- All required files are in place
- Configuration templates exist
- Build syntax is valid
- Critical features are implemented

Expected output:
```
🟢 ✓ Successes:    45
🟡 ⚠️  Warnings:     2
🔴 ❌ Critical:     0

🎉 PRODUCTION READY - All critical checks passed!
```

### 2. Run Backend Tests

```bash
cd backend
npm test
```

Tests validate:
- User registration and authentication
- File upload and versioning
- Version restoration
- Storage operations
- Database connectivity

### 3. Build Frontend

```bash
npm run build
```

Creates optimized production build in `dist/` directory.

## Environment Configuration

### Required Variables

Create `backend/.env` with all required variables:

```ini
# Environment
NODE_ENV=production
PORT=4000
LOG_LEVEL=info

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/version_vault
# Alternative for local: mongodb://user:password@localhost:27017/version_vault

# Authentication
JWT_SECRET=your-cryptographically-secure-secret-32-chars-minimum
JWT_EXPIRES_IN=24h

# API Configuration
CLIENT_ORIGIN=https://yourdomain.com
UPLOAD_ROOT=/data/uploads

# File Upload
MAX_UPLOAD_SIZE_BYTES=104857600  # 100MB

# Rate Limiting
ENABLE_RATE_LIMIT=true
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # per 15 minutes

# OpenAI (Optional)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Jenkins Integration (Optional)
JENKINS_BASE_URL=http://jenkins:8080
JENKINS_USER=ci_user
JENKINS_TOKEN=jenkins_token...
JENKINS_JOB_NAME=version-vault-pipeline
```

### Frontend Configuration

Create `.env` in root:

```ini
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Database Setup

### MongoDB Atlas (Recommended for Production)

1. **Create Atlas Cluster**
   - Go to https://cloud.mongodb.com
   - Create a new cluster (M10 tier minimum)
   - Enable automatic backups
   - Configure IP whitelist

2. **Create Database User**
   ```
   Username: version_vault_user
   Password: (use strong random password)
   Database: version_vault
   ```

3. **Get Connection String**
   ```
   mongodb+srv://user:password@cluster.mongodb.net/version_vault?retryWrites=true&w=majority
   ```

4. **Configure Connection Pool**
   - Min pool size: 2
   - Max pool size: 10
   - Max connection idle time: 30s

### Local MongoDB (Development/Testing Only)

```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 -v mongo_data:/data/db mongo:7.0
```

## Docker Deployment

### Single Host Deployment

```bash
# 1. Build images
docker compose build

# 2. Start services
docker compose up -d

# 3. Verify health
docker compose ps
docker compose logs backend

# Services available at:
# Frontend:  http://localhost:3000
# Backend:   http://localhost:4000
# MongoDB:   localhost:27017
```

### Customizing for Production

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    # Increase memory for production
    mem_limit: "2g"
    memswap_limit: "2g"
    
    # Set resource reservations
    mem_reservation: "1g"
    
    # Enable restarts
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
  
  frontend:
    mem_limit: "1g"
    mem_reservation: "512m"
  
  mongodb:
    # Use volume for persistence
    volumes:
      - mongo_prod_data:/data/db
    # Higher memory for database
    mem_limit: "4g"
    mem_reservation: "2g"

volumes:
  mongo_prod_data:
    driver: local
```

## Kubernetes Deployment

### Create Namespace

```bash
kubectl create namespace version-vault
```

### Create Secrets

```bash
kubectl -n version-vault create secret generic mongodb-uri \
  --from-literal=MONGODB_URI=mongodb+srv://...

kubectl -n version-vault create secret generic jwt-secret \
  --from-literal=JWT_SECRET=your-secret-here
```

### Deploy with Manifests

See `k8s/` directory for example manifests:

```bash
kubectl apply -f k8s/mongodb-configmap.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

## CI/CD Integration

### Jenkins Configuration

1. **Create New Pipeline Job**
   - Name: `version-vault`
   - Pipeline script from SCM: Git
   - Repository: Your git URL
   - Script path: `Jenkinsfile`

2. **Configure Build Parameters**
   - ENVIRONMENT: choice [dev, staging, production]
   - SKIP_TESTS: boolean (default: false)
   - SKIP_DOCKER: boolean (default: false)

3. **Set Environment Variables**
   ```
   DOCKER_REGISTRY=your-registry.com
   DOCKER_CREDENTIALS=jenkins-docker-secret
   GIT_CREDENTIALS=jenkins-git-secret
   ```

### GitHub Actions Alternative

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run validation
        run: npm run validate:prod
      
      - name: Run tests
        run: cd backend && npm test
      
      - name: Build Docker images
        run: docker compose build
      
      - name: Push to registry
        run: docker compose push
      
      - name: Deploy to production
        run: |
          docker compose -H ssh://prod pull
          docker compose -H ssh://prod up -d
```

## SSL/TLS Configuration

### Using Let's Encrypt with Nginx

```nginx
upstream backend {
    server localhost:4000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
    }
    
    # Frontend
    location / {
        proxy_pass http://frontend;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Monitoring & Logging

### Docker Logging

```bash
# View backend logs
docker compose logs backend -f

# View all logs with timestamps
docker compose logs -f --timestamps

# Tail specific number of lines
docker compose logs backend --tail=100
```

### Centralized Logging (Optional)

Configure ELK stack or similar:

```yaml
# Example: Fluentd collection
backend:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
      labels: "service=backend,env=production"
```

### Health Checks

Backend health check:

```bash
curl http://localhost:4000/health
```

Response:
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 3600
}
```

Frontend health check:

```bash
curl http://localhost:3000
```

## Security Hardening

### 1. Database Security

- Enable encryption at rest (Atlas default)
- Enable encryption in transit (TLS)
- Use IP whitelist instead of allowing all IPs
- Regular automated backups (daily)
- Test restore procedure monthly

### 2. API Security

- All endpoints require authentication
- Rate limiting enabled (100 req/15 min)
- CORS restricted to production domain
- Helmet security headers enabled
- Input validation on all endpoints

### 3. File Security

- File uploads sandboxed in `/uploads/` directory
- MIME type validation on upload
- File size limits enforced
- Directory traversal prevention
- Unique filenames with UUIDs

### 4. Container Security

- Non-root user (`appuser`) runs services
- Read-only filesystem where possible
- No secrets in Dockerfile
- Image scanning with Trivy:
  ```bash
  trivy image my-registry.com/version-vault:latest
  ```

### 5. Network Security

- Services on internal Docker network only
- Backend not directly exposed
- Reverse proxy/load balancer in front
- Firewall rules restrict access
- Regular security updates

## Backup & Disaster Recovery

### Database Backups

**MongoDB Atlas**:
- Automated daily backups (enabled by default)
- Restore from any point in last 7 days
- Backup storage included in plan

**Local MongoDB**:
```bash
# Manual backup
mongodump --uri="mongodb://user:pass@localhost/version_vault" \
  --archive=/backup/version_vault.archive

# Restore
mongorestore --archive=/backup/version_vault.archive
```

### File Storage Backups

```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Backup to S3 (optional)
aws s3 sync uploads/ s3://backup-bucket/uploads/ --delete
```

### Restore Procedure

1. **Restore Database**
   ```bash
   mongorestore --archive=/backup/version_vault.archive
   ```

2. **Restore Files**
   ```bash
   tar -xzf uploads_backup_20260514.tar.gz
   ```

3. **Restart Services**
   ```bash
   docker compose restart
   ```

4. **Verify Health**
   ```bash
   docker compose ps
   curl http://localhost:4000/health
   ```

## Performance Tuning

### Database

```javascript
// Create indexes on frequently queried fields
db.users.createIndex({ email: 1 }, { unique: true })
db.files.createIndex({ owner: 1, createdAt: -1 })
db.versions.createIndex({ file: 1, versionNumber: -1 })
db.pipelinelogs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 })
```

### Backend

```javascript
// Max pool size in env
MONGODB_URI=mongodb://user:pass@localhost/?maxPoolSize=10&minPoolSize=2

// Compression enabled in app.js
app.use(compression());

// Cache static assets
const MAX_AGE = 24 * 60 * 60 * 1000;  // 24 hours
```

### Frontend

```bash
# Build with production optimizations
npm run build

# Analyze bundle size
npm run build -- --analyze

# Check build size
ls -lh dist/
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose logs

# Verify MongoDB connection
docker compose logs mongodb

# Check environment variables
docker exec version-vault-backend env | grep MONGODB
```

### High Memory Usage

```bash
# Check memory by service
docker stats

# Increase limits in docker-compose.yml
mem_limit: "4g"

# Check for memory leaks in backend
node --inspect backend/src/server.js
```

### Database Connection Timeout

```bash
# Verify connection string
echo $MONGODB_URI

# Test connection
docker exec version-vault-backend \
  node -e "require('mongoose').connect(process.env.MONGODB_URI).then(console.log)"

# Check MongoDB service
docker compose ps mongodb
```

### API Rate Limiting Too Strict

Edit rate limit config in `backend/src/middleware/rate-limit.js`:

```javascript
const RATE_LIMITERS = {
  api: { window: 15 * 60 * 1000, max: 200 }  // Increase from 100
};
```

## Rollback Procedure

```bash
# If deployment fails, revert to previous version:

# 1. Stop current services
docker compose down

# 2. Checkout previous git commit
git checkout <previous-commit>

# 3. Rebuild and restart
docker compose build
docker compose up -d

# 4. Verify health
curl http://localhost:4000/health
```

## Support & Maintenance

### Weekly Tasks
- Monitor error logs
- Check disk usage
- Verify backups completed
- Review performance metrics

### Monthly Tasks
- Test backup restoration
- Review security logs
- Update dependencies
- Performance baseline comparison

### Quarterly Tasks
- Capacity planning review
- Security audit
- Disaster recovery drill
- Documentation updates

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Express.js Production Guide](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [OWASP Security Checklist](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-14  
**Maintainer**: DevOps Team
