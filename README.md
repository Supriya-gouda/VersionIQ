# Version Vault Pro

> **Production-Ready AI-Assisted Versioned File Storage System**

A comprehensive full-stack application for managing versioned files with secure authentication, immutable version history, smart rollback recommendations, and Jenkins-integrated CI/CD pipeline visibility.

## ✨ Features

- **Secure Authentication** - JWT-based auth with bcrypt password hashing and session persistence.
- **File Versioning** - Immutable version history with automated snapshots on every update.
- **AI-Powered Summaries** - Automated change summaries using LCS-based diff analysis and OpenAI.
- **Smart Rollback** - Stability-scored recommendations based on deployment and version history.
- **Jenkins Integration** - Real-time pipeline status visibility and automated build syncing.
- **Activity Logging** - Full audit trail of all file operations (upload, restore, share, delete).
- **Storage Quota Tracking** - Real-time calculation of user disk usage and storage limits.
- **Secure File Sharing** - Public/Private file toggling with unique share tokens and links.
- **Profile Management** - Granular user settings, roles, and notification preferences.

## 📚 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TanStack Router + Vite + TypeScript |
| **Backend** | Node.js + Express 4 + MongoDB + Mongoose |
| **Authentication** | JWT (jsonwebtoken) + bcrypt |
| **File Storage** | Multer + Structured disk storage |
| **DevOps** | Docker + docker-compose + Jenkins |
| **Security** | helmet + CORS + rate limiting |
| **AI Features** | OpenAI integration + local LCS diff fallback |

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Docker & Docker Compose (optional)
- Jenkins (optional, for CI/CD)

### Local Development

#### 1. Environment Configuration

Copy and configure environment files:

```bash
# Frontend environment
cp .env.example .env

# Backend environment
cp backend/.env.example backend/.env
```

#### 2. Install Dependencies

```bash
# Install root & frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install
```

#### 3. Start Development Servers

```bash
# Start both frontend and backend concurrently
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000

## 📡 API Reference (Summary)

For full documentation, see [API_REFERENCE.md](./API_REFERENCE.md).

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register a new user |
| `/auth/login` | POST | Authenticate and get token |
| `/auth/me` | GET/PUT| Get or update user profile |
| `/files/upload` | POST | Upload file or new version |
| `/files/quota` | GET | Get real storage usage |
| `/files/activities`| GET | Get recent activity logs |
| `/files/:id/share` | POST | Toggle file sharing status |
| `/files/:id/summary`| GET | Get AI-generated version summary |
| `/files/:id/recommendation`| GET | Get smart rollback advice |
| `/pipelines/status` | GET | View CI/CD build history |

## 🏗️ Architecture

Detailed architecture can be found in [ARCHITECTURE.md](./ARCHITECTURE.md).

```
User → React Frontend → Express API → MongoDB
                          │      ├→ Local Storage (/uploads)
                          │      ├→ OpenAI API
                          └──────→ Jenkins API
```

## 🚢 Docker & Deployment

```bash
# Build and start all services
docker compose up --build -d
```

## 📄 License

MIT License - See LICENSE file for details
 files
- **Cache**: Add Redis for session/rate-limit storage
- **CDN**: Serve static frontend files via CDN

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check MongoDB connection
cd backend && node --check src/server.js

# Verify environment variables
cat backend/.env

# Check port conflicts
lsof -i :4000
```

### Frontend Build Errors

```bash
# Clear build cache
rm -rf dist/
npm cache clean --force

# Rebuild
npm run build
```

### MongoDB Connection Issues

```bash
# Local MongoDB not running?
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
docker compose up -d mongodb           # Docker

# Connection string issues?
# Use: mongodb://localhost:27017/version_vault
# Not: mongodb://127.0.0.1/version_vault
```

### Docker Issues

```bash
# Rebuild without cache
docker compose build --no-cache

# Clean up and start fresh
docker compose down -v
docker compose up --build
```

## 📝 Development Workflow

### Adding a New Feature

1. **Plan**: Update requirements and architecture
2. **Implement**: Backend service → Controller → Route
3. **Test**: Add unit/integration tests
4. **Integrate**: Frontend → Hook → Component → Route
5. **Document**: Update API docs and README
6. **Deploy**: Test in Docker, merge to production

### Code Style

- **Backend**: Use async/await, error-first callbacks
- **Frontend**: Use TypeScript, React hooks
- **Validation**: Validate early, normalize late
- **Errors**: Use meaningful error codes and messages

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass: `npm test`
5. Submit a pull request

## 📞 Support

For issues and questions:

- GitHub Issues: Bug reports and feature requests
- Documentation: Check README and inline code comments
- Tests: Review test files for usage examples

---

**Last Updated**: 2026-05-14  
**Version**: 1.0.0-production-ready  
**Status**: ✅ Production Ready
