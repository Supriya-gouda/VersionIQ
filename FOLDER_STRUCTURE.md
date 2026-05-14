# Version Vault Pro - Folder Structure Guide

## Complete Project Structure

```
version-vault-pro/                    # Root project directory
│
├── 📄 Configuration Files
│   ├── package.json                  # Root npm dependencies and scripts
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── eslint.config.js              # ESLint linter config
│   ├── vite.config.ts                # Vite bundler config
│   ├── components.json               # shadcn/ui configuration
│   ├── .env.example                  # Frontend env template
│   ├── .env                          # Frontend env (git-ignored)
│   ├── .gitignore                    # Git ignore patterns
│   ├── .prettierrc                   # Code formatter config
│   ├── .prettierignore               # Prettier ignore patterns
│   └── wrangler.jsonc                # Cloudflare Workers config
│
├── 📁 Frontend - React Application (src/)
│   ├── start.ts                      # Hydration entry point
│   ├── server.ts                     # Server-side rendering
│   ├── router.tsx                    # Router configuration
│   ├── routeTree.gen.ts              # Auto-generated route tree
│   ├── styles.css                    # Global CSS styles
│   │
│   ├── 🎨 Components (components/)
│   │   ├── AuthShell.tsx             # Auth page wrapper
│   │   ├── DashboardLayout.tsx       # Dashboard wrapper
│   │   ├── Badge.tsx                 # Badge component
│   │   ├── FileIcon.tsx              # File type icon
│   │   │
│   │   └── 🎭 UI Components (ui/)   # shadcn/ui components
│   │       ├── accordion.tsx
│   │       ├── alert.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── pagination.tsx
│   │       ├── progress.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toggle.tsx
│   │       ├── tooltip.tsx
│   │       └── ... (more UI components)
│   │
│   ├── 🎯 Routes (routes/)           # Page components
│   │   ├── __root.tsx                # Root layout
│   │   ├── index.tsx                 # Landing page
│   │   ├── login.tsx                 # Login page
│   │   ├── register.tsx              # Registration page
│   │   ├── forgot-password.tsx       # Password reset
│   │   │
│   │   ├── dashboard.tsx             # Dashboard layout
│   │   ├── dashboard.index.tsx       # Dashboard home
│   │   ├── dashboard.files.tsx       # File listing & management
│   │   ├── dashboard.versions.tsx    # Version history
│   │   ├── dashboard.ai-summary.tsx  # AI summaries viewer
│   │   ├── dashboard.rollback.tsx    # Rollback recommendations
│   │   ├── dashboard.devops.tsx      # DevOps/Jenkins monitoring
│   │   └── dashboard.settings.tsx    # User settings
│   │
│   ├── 🪝 Hooks (hooks/)             # Custom React hooks
│   │   ├── use-mobile.tsx            # Mobile detection hook
│   │   └── use-api.tsx               # API operation hooks
│   │
│   └── 📚 Library (lib/)             # Utilities and helpers
│       ├── api.ts                    # Original API client
│       ├── api-enhanced.ts           # Enhanced client (retry/timeout)
│       ├── utils.ts                  # Utility functions
│       ├── error-page.ts             # Error page renderer
│       ├── error-capture.ts          # Error capture utility
│       └── mock-data.ts              # Mock data for testing
│
├── 📁 Backend - Node.js/Express API (backend/)
│   ├── package.json                  # Backend dependencies
│   ├── .env.example                  # Backend env template
│   ├── .env                          # Backend env (git-ignored)
│   ├── Dockerfile                    # Backend container image
│   │
│   ├── 🔧 Source Code (src/)
│   │   ├── server.js                 # Express server bootstrap
│   │   ├── app.js                    # Express app setup
│   │   │
│   │   ├── 📋 Models (models/)       # Mongoose schemas
│   │   │   ├── user.model.js         # User document schema
│   │   │   ├── file.model.js         # File metadata schema
│   │   │   ├── version.model.js      # Version history schema
│   │   │   └── pipeline-log.model.js # CI/CD logs schema
│   │   │
│   │   ├── 🛣️ Routes (routes/)       # API endpoint definitions
│   │   │   ├── auth.routes.js        # Authentication endpoints
│   │   │   ├── file.routes.js        # File management endpoints
│   │   │   └── pipeline.routes.js    # Pipeline monitoring endpoints
│   │   │
│   │   ├── 🎮 Controllers (controllers/)  # Request handlers
│   │   │   ├── auth.controller.js    # Auth handlers
│   │   │   └── files.controller.js   # File handlers
│   │   │
│   │   ├── 🔐 Middleware (middleware/)    # Express middleware
│   │   │   ├── auth.js               # JWT verification
│   │   │   ├── auth.middleware.js    # Auth requirement
│   │   │   ├── error-handler.js      # Global error handling
│   │   │   ├── error.middleware.js   # Error catching
│   │   │   ├── validate.middleware.js # Input validation
│   │   │   ├── validation.js         # Validation schemas
│   │   │   ├── file-upload.js        # File upload validation
│   │   │   ├── rate-limit.js         # Rate limiting
│   │   │   ├── response-formatter.js # Response formatting
│   │   │   └── cors.js (implicit)    # CORS handling
│   │   │
│   │   ├── ⚙️ Services (services/)       # Business logic
│   │   │   ├── auth.service.js       # User auth operations
│   │   │   ├── version.service.js    # Version management
│   │   │   ├── file-storage.service.js # File system operations
│   │   │   ├── ai.service.js         # AI summary generation
│   │   │   ├── recommendation.service.js # Rollback scoring
│   │   │   └── jenkins.service.js    # Jenkins integration
│   │   │
│   │   ├── ⚙️ Config (config/)           # Configuration files
│   │   │   ├── db.js                 # MongoDB connection
│   │   │   ├── env.js                # Environment validation
│   │   │   └── multer.js             # File upload config
│   │   │
│   │   └── 🛠️ Utils (utils/)            # Utility functions
│   │       ├── app-error.js          # Custom error class
│   │       ├── async-handler.js      # Async error wrapper
│   │       └── diff.js               # Diff algorithm
│   │
│   ├── 🧪 Tests (tests/)             # Test suites
│   │   ├── auth.test.js              # Authentication tests
│   │   ├── files.test.js             # File operation tests
│   │   └── run.js                    # Test runner
│   │
│   ├── 📤 Scripts (scripts/)          # Utility scripts
│   │   └── schema.js                 # MongoDB schema setup
│   │
│   └── 📁 Uploads (uploads/)         # File storage
│       ├── tmp/                      # Temporary upload staging
│       └── {userId}/{fileId}/        # Versioned file storage
│
├── 🐳 Docker Configuration
│   ├── Dockerfile.frontend           # Frontend container
│   ├── docker-compose.yml            # Multi-service orchestration
│   └── .dockerignore                 # Docker ignore patterns
│
├── 📚 Documentation Files
│   ├── README.md                     # Main documentation
│   ├── ARCHITECTURE.md               # System design
│   ├── DATABASE_SCHEMA.md            # Database documentation
│   ├── PRODUCTION_DEPLOYMENT.md      # Deployment guide
│   ├── DEPLOYMENT_CHECKLIST.md       # Verification checklist
│   └── COMPLETION_SUMMARY.md         # Project summary
│
├── 🔄 CI/CD Configuration
│   ├── Jenkinsfile                   # Jenkins pipeline
│   └── .github/workflows/            # GitHub Actions (if used)
│
├── 📊 Scripts (scripts/)
│   └── validate-production.js        # Production validation
│
└── 🚀 Other Files
    ├── quickstart.sh                 # Quick deployment script
    ├── bun.lock                      # Bun package lock
    ├── package-lock.json             # NPM lock file
    └── .git/                         # Git repository
```

---

## Directory Responsibilities

### Frontend (`src/`)
**Purpose**: React application UI, routes, and client logic
- **Components**: Reusable React components (buttons, cards, dialogs)
- **Routes**: Page-level components (login, dashboard, files, versions)
- **Hooks**: Custom React hooks (useForm, useAsync, usePagination)
- **Lib**: API client, utilities, helper functions

### Backend (`backend/src/`)
**Purpose**: Express API server, business logic, database operations
- **Models**: Mongoose database schemas (User, File, Version)
- **Routes**: API endpoint definitions
- **Controllers**: Request handlers and response formatting
- **Middleware**: Request/response processing (auth, validation, errors)
- **Services**: Business logic and external integrations
- **Config**: Database and environment configuration
- **Utils**: Helper functions and error classes

### File Storage (`backend/uploads/`)
**Purpose**: Versioned file storage on disk
```
uploads/
├── tmp/                          # Temporary upload staging
└── {userId}/                     # Per-user directory
    └── {fileId}/                 # Per-file directory
        ├── v1_timestamp.bin      # Version 1 binary
        └── v1_timestamp.meta.json # Version 1 metadata
```

### Tests (`backend/tests/`)
**Purpose**: Test suites for backend functionality
- **auth.test.js**: User registration, login, validation
- **files.test.js**: File upload, versioning, restoration
- **run.js**: Test orchestration and database lifecycle

### Documentation
**Purpose**: System design, setup, and deployment guides
- **README.md**: Main documentation and quick start
- **ARCHITECTURE.md**: System design and data flows
- **DATABASE_SCHEMA.md**: Database structure and queries
- **PRODUCTION_DEPLOYMENT.md**: Production deployment guide
- **DEPLOYMENT_CHECKLIST.md**: Pre-deployment verification

---

## Key File Purposes

### Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | Root npm scripts and dependencies |
| `backend/package.json` | Backend npm dependencies |
| `tsconfig.json` | TypeScript compilation config |
| `vite.config.ts` | Frontend build configuration |
| `eslint.config.js` | Code style rules |
| `.env` | Environment variables (git-ignored) |
| `.env.example` | Environment template (git-tracked) |

### Critical Backend Files
| File | Purpose |
|------|---------|
| `server.js` | Application entry point |
| `app.js` | Express app setup and middleware |
| `models/*.js` | Database schemas |
| `routes/*.js` | API endpoint definitions |
| `controllers/*.js` | Request handlers |
| `middleware/*.js` | Request/response processing |
| `services/*.js` | Business logic |
| `config/db.js` | MongoDB connection |
| `config/env.js` | Environment validation |

### Critical Frontend Files
| File | Purpose |
|------|---------|
| `router.tsx` | Route configuration |
| `routes/__root.tsx` | Root layout |
| `routes/login.tsx` | Authentication page |
| `routes/dashboard.tsx` | Dashboard layout |
| `routes/dashboard.files.tsx` | File management |
| `routes/dashboard.versions.tsx` | Version history |
| `routes/dashboard.ai-summary.tsx` | AI summaries |
| `routes/dashboard.rollback.tsx` | Rollback recommendations |
| `lib/api.ts` | API client |
| `hooks/use-api.tsx` | Custom hooks |

---

## Best Practices

### Backend Organization
1. **Models**: Database schemas only (no business logic)
2. **Controllers**: HTTP handling only (request/response)
3. **Services**: All business logic and database operations
4. **Middleware**: Cross-cutting concerns (auth, validation, errors)
5. **Routes**: Endpoint definitions (no handlers)
6. **Utils**: Pure utility functions

### Frontend Organization
1. **Components**: Reusable, single-responsibility
2. **Routes**: Page-level components
3. **Hooks**: Stateful logic (forms, API calls)
4. **Lib**: Pure utilities and API client

### File Naming
- **Controllers**: `entity.controller.js`
- **Services**: `entity.service.js`
- **Routes**: `entity.routes.js`
- **Models**: `entity.model.js`
- **Middleware**: `entity.middleware.js` or `entity.js`

---

## Development Workflow

### Adding a New Feature
1. **Database**: Add/update schema in `backend/src/models/`
2. **API**: Create endpoint in `backend/src/routes/`
3. **Handler**: Implement in `backend/src/controllers/`
4. **Logic**: Implement in `backend/src/services/`
5. **Frontend**: Add page in `src/routes/`
6. **Components**: Create UI in `src/components/`
7. **Tests**: Add tests in `backend/tests/`

### Adding a New API Endpoint
1. Define route in `routes/entity.routes.js`
2. Create controller method in `controllers/entity.controller.js`
3. Implement service in `services/entity.service.js`
4. Add tests in `tests/entity.test.js`
5. Test with: `curl http://localhost:4000/api/endpoint`

### Adding a New UI Page
1. Create component in `src/routes/page.tsx`
2. Add components in `src/components/`
3. Use hooks from `src/hooks/use-api.tsx`
4. Call API from `src/lib/api.ts`
5. Add routing in `src/router.tsx`

---

## Deployment Structure

### Docker
```
Dockerfile.frontend    # Frontend container
backend/Dockerfile     # Backend container
docker-compose.yml     # Orchestration (3 services: frontend, backend, mongodb)
```

### CI/CD
```
Jenkinsfile           # Jenkins pipeline
.github/workflows/    # GitHub Actions (if used)
```

### Production
```
PRODUCTION_DEPLOYMENT.md  # Deployment procedures
DEPLOYMENT_CHECKLIST.md   # Pre-deployment checks
quickstart.sh            # Quick start script
```

---

## Version Control

### Ignored Files (`.gitignore`)
- `node_modules/`
- `.env` (use `.env.example` instead)
- `dist/`, `build/`
- `uploads/` (file storage)
- `*.log`
- `.DS_Store`

### Tracked but Private
- `.env.example` - Template only (no secrets)
- `backend/.env.example` - Template only

---

## Database File Storage

Files are stored on disk in an organized structure:

```
uploads/
└── {userId}/              # User ID folder
    └── {fileId}/          # File ID folder
        ├── v1_timestamp.bin        # Version 1 binary
        ├── v1_timestamp.meta.json  # Version 1 metadata
        ├── v2_timestamp.bin        # Version 2 binary
        └── v2_timestamp.meta.json  # Version 2 metadata
```

**Benefits**:
- Organization by user and file
- Easy cleanup (delete user folder = delete all files)
- Immutable storage (no overwrites)
- Metadata alongside files

---

## Next Steps

1. **Verify Structure**: Ensure all directories match this layout
2. **Check Models**: Confirm all 4 collections are defined
3. **Run Setup**: Execute `backend/scripts/schema.js` to create MongoDB schema
4. **Test**: Run `npm test` in backend directory
5. **Deploy**: Follow `PRODUCTION_DEPLOYMENT.md`

---

**Last Updated**: 2026-05-14  
**Structure Version**: 1.0
