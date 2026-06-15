# VersaVault (Version Vault Pro) - Comprehensive Project Report & Guide

## Table of Contents
1. [Section 1: Project Overview](#section-1-project-overview)
2. [Section 2: Theoretical Understanding](#section-2-theoretical-understanding)
3. [Section 3: Problem Statement](#section-3-problem-statement)
4. [Section 4: Objectives](#section-4-objectives)
5. [Section 5: System Architecture](#section-5-system-architecture)
6. [Section 6: Database Design](#section-6-database-design)
7. [Section 7: Complete Workflow](#section-7-complete-workflow)
8. [Section 8: Technical Terms Used in the Project](#section-8-technical-terms-used-in-the-project)
9. [Section 9: DevOps Practices Used](#section-9-devops-practices-used)
10. [Section 10: Results](#section-10-results)
11. [Section 11: Advantages Over Existing Systems](#section-11-advantages-over-existing-systems)
12. [Section 12: Limitations / Disadvantages](#section-12-limitations--disadvantages)
13. [Section 13: How Limitations Can Be Overcome](#section-13-how-limitations-can-be-overcome)
14. [Section 14: Future Enhancements](#section-14-future-enhancements)
15. [Section 15: Viva Preparation](#section-15-viva-preparation)
16. [Section 16: Interview Preparation](#section-16-interview-preparation)

---

## SECTION 1: PROJECT OVERVIEW

### What is VersaVault?
VersaVault (Version Vault Pro) is an intelligent, secure, AI-powered document management and version control system. It allows users to upload files (such as Text and PDFs), maintain a chronological history of changes, detect line-by-line differences between versions, and utilize Artificial Intelligence (Gemini/OpenAI) to automatically generate human-readable semantic summaries of those changes. Furthermore, it integrates deeply with DevOps practices, providing a unified dashboard to monitor Jenkins CI/CD pipeline builds.

### Why was it developed?
It was developed to bridge the gap between traditional developer-centric version control systems (like Git) and consumer-centric cloud storage (like Google Drive). Non-technical users, document writers, and business teams struggle to track *why* a document changed and *what* exactly was modified without manually reading the entire file.

### What business problem does it solve?
In enterprise and collaborative environments, tracking document revisions is tedious. When multiple versions of a document exist (e.g., `Report_v1.pdf`, `Report_v2_final.pdf`), identifying the exact modifications is time-consuming. VersaVault solves this by automating diff analysis and using AI to explain the business context of the changes, saving hours of manual review.

### Who are the target users?
- **Technical Writers & Documentation Teams:** Tracking changes in manuals and guides.
- **Legal & Compliance Teams:** Monitoring contract revisions.
- **Developers & DevOps Engineers:** Utilizing the integrated Jenkins dashboard to monitor application health and build statuses alongside project files.

### What makes it different from traditional file storage systems?
Unlike Google Drive or Dropbox, which simply overwrite files or provide basic version history, VersaVault explicitly analyzes the text contents of the files (extracting text even from PDFs) and generates a semantic diff. It then uses AI to summarize *what* changed logically, rather than just showing raw deleted/added lines.

### Why are AI summaries useful?
A standard code diff shows `+ added line` and `- removed line`, which is often unreadable for prose or legal text. AI summaries analyze the diff and provide a plain-English explanation (e.g., "Updated the payment terms from 30 days to 45 days"), making version history instantly understandable.

### Why is DevOps integration important?
By integrating Jenkins webhooks directly into the VersaVault backend, the platform serves as a centralized hub. A team can manage their documentation while simultaneously monitoring the health of their software deployments without switching to a separate Jenkins UI.

---

## SECTION 2: THEORETICAL UNDERSTANDING

### Version Control Systems (VCS)
- **Definition:** Systems that record changes to a file or set of files over time so that specific versions can be recalled later.
- **Why it is needed:** To prevent data loss, track the history of changes, and allow rollback to previous stable states.
- **How VersaVault uses it:** Implemented via the `File` and `Version` MongoDB collections. Each upload of an existing file creates a new `Version` document linked to the parent `File`, preserving the physical file on disk.

### Document Management Systems (DMS)
- **Definition:** Software used to receive, track, manage, and store documents.
- **Why it is needed:** Centralized organization and retrieval of digital assets.
- **How VersaVault uses it:** Provides secure file uploads via `multer`, organizing files per user, and handling metadata like MIME types and upload timestamps.

### Semantic Change Detection (Diffing)
- **Definition:** Analyzing two sets of text to find exactly what was added, removed, or modified.
- **Why it is needed:** To understand file modifications at a granular level.
- **How VersaVault uses it:** The `diff.js` utility compares the extracted text of the previous version and the new version, calculating `added`, `removed`, and `modified` line counts.

### Artificial Intelligence Summarization
- **Definition:** Using Large Language Models (LLMs) to condense information into concise summaries.
- **Why it is needed:** To translate raw technical diffs into human-readable context.
- **How VersaVault uses it:** The `ai.service.js` extracts text from PDFs/TXTs, computes the diff, and sends a structured prompt to the Gemini API to generate a summary of the changes.

### CI/CD Concepts & DevOps Monitoring
- **Definition:** Continuous Integration and Continuous Deployment; automating the building, testing, and deployment of code.
- **Why it is needed:** Ensures code quality and accelerates software delivery.
- **How VersaVault uses it:** VersaVault's Jenkins instance runs a `Jenkinsfile`. Upon completion, Jenkins sends a webhook payload to VersaVault's backend (`/pipelines/webhook`), logging the status (success/failure) in the `PipelineLog` collection.

### Authentication & Authorization
- **Definition:** Verifying user identity (Authentication) and granting access rights (Authorization).
- **Why it is needed:** To secure private files and pipeline data.
- **How VersaVault uses it:** Uses JSON Web Tokens (JWT) and bcrypt password hashing. Routes are protected by an `authMiddleware` that verifies the token.

### Containerization & Cloud Deployment
- **Definition:** Packaging software and its dependencies into isolated units called containers.
- **Why it is needed:** Ensures the application runs identically across different environments.
- **How VersaVault uses it:** Uses Docker and `docker-compose.yml` to run the Node.js backend, React frontend, MongoDB, and Jenkins side-by-side in isolated, networked containers.

---

## SECTION 3: PROBLEM STATEMENT

### Concise Problem Statement
"Tracking and understanding the semantic changes between different versions of text and PDF documents is currently a manual, time-consuming process that lacks automated contextual summarization and centralized activity monitoring."

### Alternative: Academic Report
"In modern digital workspaces, the absence of intelligent version control for non-code documents leads to inefficiencies in identifying semantic modifications. This project proposes an AI-driven Document Management System that automatically extracts text, calculates granular diffs, and utilizes Large Language Models to generate contextual change summaries, while integrating DevOps monitoring for unified workflow management."

### Alternative: Project Presentation
"Business teams spend hours comparing document versions to figure out what changed. VersaVault eliminates this by providing an intelligent vault that not only stores versions but uses AI to explain exactly what changed between them, complete with CI/CD pipeline visibility."

---

## SECTION 4: OBJECTIVES

1. **Secure File and Version Management:** To develop a robust backend system capable of securely storing files and maintaining a chronological, non-destructive history of document versions using MongoDB and local file storage.
2. **Automated Content Extraction and Diff Analysis:** To implement utilities that automatically parse text from uploaded files (including PDFs via `pdf-parse`) and compute exact line-by-line additions, deletions, and modifications.
3. **AI-Powered Semantic Summarization:** To integrate Large Language Models (Gemini/OpenAI) to analyze document differences and automatically generate human-readable, contextual summaries of changes for every new version.
4. **DevOps CI/CD Integration and Monitoring:** To configure a Jenkins automation pipeline and develop webhook endpoints that capture real-time build statuses, displaying them dynamically on the application's dashboard.
5. **Secure Authentication and Containerized Deployment:** To implement secure JWT-based user authentication and package the entire full-stack application (Frontend, Backend, Database, CI/CD) into Docker containers for seamless, environment-agnostic deployment.

---

## SECTION 5: SYSTEM ARCHITECTURE

### High-Level Architecture
```text
[ User / Browser ] 
       | (HTTP/REST)
       v
[ Frontend (React + Vite) ] <---> [ GitHub Webhooks ]
       |                                |
       | (JSON / FormData)              v
       v                      [ Backend API (Node/Express) ] <---> [ Jenkins CI/CD ]
[ Backend API ] ----------------+       |
       |                        |       v
       v                        |  [ AI Service (Gemini API) ]
[ MongoDB (Data) ]              |
[ Local Storage (Files) ] ------+
```

1. **Frontend Architecture:** Built with React 19, TypeScript, Vite, and TailwindCSS. Uses TanStack Router for navigation and React Query for asynchronous state management and API caching.
2. **Backend Architecture:** Built with Node.js and Express. It follows a modular Controller-Service-Route architecture. Uses Multer for handling `multipart/form-data` file uploads.
3. **Database Architecture:** MongoDB (via Mongoose). Stores relational-like data using `ObjectId` references (e.g., a `Version` references a `File`, which references a `User`).
4. **AI Processing Architecture:** When a new version is uploaded, `ai.service.js` acts as an orchestrator: it extracts text -> compares with previous text -> builds a prompt -> sends to Gemini API -> saves result to DB.
5. **DevOps Architecture:** GitHub pushes trigger the VersaVault backend (`/pipelines/github-webhook`), which logs the activity and forwards the payload to a Dockerized Jenkins instance. Jenkins runs the build and POSTs the result back to VersaVault (`/pipelines/webhook`) for database storage.

---

## SECTION 6: DATABASE DESIGN

### 1. User Model (`user.model.js`)
- **Purpose:** Manages user authentication and identity.
- **Fields:** `name`, `email`, `passwordHash`.
- **Relationships:** Parent to Files, Activities, and Pipeline Logs.

### 2. File Model (`file.model.js`)
- **Purpose:** Represents the logical grouping of a document.
- **Fields:** `originalName`, `mimeType`, `size`, `owner` (ObjectId), `currentVersion` (ObjectId).
- **Relationships:** Belongs to User. Has many Versions.

### 3. Version Model (`version.model.js`)
- **Purpose:** Stores the physical iterations of a file.
- **Fields:** `fileId` (ObjectId), `versionNumber`, `storagePath`, `diffStats` (added/removed/modified counts), `aiSummary` (String).
- **Relationships:** Belongs to a File.

### 4. Activity Model (`activity.model.js`)
- **Purpose:** Audit log for user actions (uploads, rollbacks).
- **Fields:** `owner`, `type` (Enum: file_upload, version_update, rollback), `fileName`, `details`.
- **Why it exists:** Powers the "Recent Activity" feed on the frontend dashboard.

### 5. PipelineLog Model (`pipeline-log.model.js`)
- **Purpose:** Stores Jenkins CI/CD build statuses.
- **Fields:** `pipeline` (Name), `buildNumber`, `status` (success, failed, running), `durationMs`, `commit`, `branch`.
- **Why it exists:** Allows the React frontend to display Jenkins data without querying the Jenkins API directly.

---

## SECTION 7: COMPLETE WORKFLOW

### Sequence: File Upload & AI Summarization
```text
User -> Frontend: Uploads v2 of 'Report.pdf'
Frontend -> Backend: POST /files/:id/versions (multipart/form-data)
Backend -> Multer: Save physical file to /uploads/...
Backend -> VersionService: Check previous version
Backend -> PDF-Parse: Extract text from v2.pdf
Backend -> DiffUtils: Compare v1 text vs v2 text
Backend -> AIService: Send Diff to Gemini API
Gemini API -> Backend: Return "Updated Q3 revenue numbers."
Backend -> MongoDB: Create Version doc with diffStats and aiSummary
Backend -> Frontend: Return Success JSON
Frontend -> User: Display new version with AI Summary
```

### Sequence: Jenkins CI/CD Webhook
```text
Developer -> GitHub: git push
GitHub -> Backend: POST /pipelines/github-webhook
Backend -> MongoDB: Log Activity "Git Push"
Backend -> Jenkins: Forward webhook to :8080/github-webhook
Jenkins -> Jenkins: Run pipeline (checkout, lint, build)
Jenkins -> Backend: POST /pipelines/webhook (status: success)
Backend -> MongoDB: Update PipelineLog buildNumber
Frontend -> Backend: GET /pipelines/status
Frontend -> User: Show green "Success" badge on Dashboard
```

---

## SECTION 8: TECHNICAL TERMS USED IN THE PROJECT

- **JWT (JSON Web Token):** A secure string used to verify the user's identity. *Usage:* Passed in the `Authorization: Bearer` header for protected routes.
- **REST API:** Representational State Transfer. *Usage:* The architectural style of the backend (e.g., GET `/files`, POST `/auth/login`).
- **Multer:** A Node.js middleware for handling file uploads. *Usage:* Parses incoming files and saves them to the local `/uploads` folder.
- **PDF Parsing:** The programmatic extraction of raw text from a binary PDF file. *Usage:* `pdf-parse` library reads uploaded PDFs so the AI can analyze them.
- **Semantic Analysis:** Understanding the meaning behind text changes. *Usage:* Done by passing raw diffs to the Gemini LLM.
- **Diff Engine:** An algorithm that calculates the difference between two data sets. *Usage:* `diff.js` splits text by newlines and counts additions/deletions.
- **Webhooks:** User-defined HTTP callbacks triggered by specific events. *Usage:* GitHub pushes to VersaVault, Jenkins pushes results to VersaVault.
- **Rate Limiting:** Restricting the number of requests a user can make. *Usage:* `express-rate-limit` prevents brute-force login attacks.
- **React Query (TanStack Query):** A data-fetching library. *Usage:* Caches backend responses (like file lists) and handles loading/error states in the UI.

---

## SECTION 9: DEVOPS PRACTICES USED

1. **Docker Containerization:** 
   - *Theory:* Packaging an app with all its dependencies.
   - *Implementation:* `docker-compose.yml` spins up MongoDB, Node.js API, React Vite server, and a custom Jenkins image simultaneously on a shared network (`version-vault-network`).
2. **Continuous Integration (CI):** 
   - *Theory:* Automating code testing on every push.
   - *Implementation:* The `Jenkinsfile` runs `npm ci`, `npm run lint`, and syntax checks on the backend and frontend automatically.
3. **Webhook Monitoring Loop:** 
   - *Implementation:* Instead of polling Jenkins, Jenkins pushes a JSON payload to the VersaVault backend upon pipeline completion, ensuring the MongoDB database and frontend dashboard are immediately aware of deployment successes or failures.

---

## SECTION 10: RESULTS

- **Functional Results:** Successfully implements a robust file versioning system where users can upload PDFs/text, view history, and download old versions.
- **AI Results:** The Gemini integration successfully reduces thousands of lines of raw text diffs into concise, 2-3 sentence human-readable summaries.
- **DevOps Results:** Pipeline execution times and statuses are captured with 100% accuracy via the webhook system, providing a single pane of glass for both document management and application health.

---

## SECTION 11: ADVANTAGES OVER EXISTING SYSTEMS

| Feature | VersaVault | Google Drive / Dropbox | Git / GitHub |
| :--- | :--- | :--- | :--- |
| **Target Audience** | Business, Tech, DevOps | General Consumers | Developers |
| **File Versioning** | Yes (Explicit) | Yes (Hidden) | Yes (Code focused) |
| **Automated AI Summaries**| **Yes** | No | Optional/External |
| **Semantic PDF Diffs** | **Yes** | No | No (Binary files) |
| **DevOps Dashboard** | **Integrated** | None | Separate (Actions) |

---

## SECTION 12: LIMITATIONS / DISADVANTAGES

1. **No Real-Time Collaboration:** Users cannot edit files simultaneously like Google Docs. Files must be edited offline and uploaded as new versions.
2. **Limited File Support for AI:** Currently, AI summarization relies on extracting text. Scanned PDFs (images) will fail without Optical Character Recognition (OCR). Word Docs (`.docx`) require separate parsing libraries.
3. **No Branching:** Unlike Git, version history is strictly linear. You cannot branch a document and merge it later.
4. **Local Storage Dependency:** Uploaded files are saved to the local file system (`/uploads`), making horizontal scaling of the backend difficult without transitioning to cloud storage (e.g., AWS S3).

---

## SECTION 13: HOW LIMITATIONS CAN BE OVERCOME

1. **Adding OCR:**
   - *Solution:* Integrate `Tesseract.js` or Google Cloud Vision API.
   - *Complexity:* Medium. Requires routing image-based PDFs through an OCR pre-processor before sending text to the AI service.
2. **Horizontal Scaling (Cloud Storage):**
   - *Solution:* Replace local `fs` calls with AWS S3 SDK.
   - *Complexity:* Low-Medium. Update the Multer configuration to use `multer-s3`.
3. **Real-time Collaboration:**
   - *Solution:* Integrate WebSockets (`Socket.io`) and Operational Transformation (OT) algorithms.
   - *Complexity:* Very High. Requires rewriting the frontend editor and backend state management entirely.

---

## SECTION 14: FUTURE ENHANCEMENTS

- **Short-term:**
  - Add support for `.docx` and `.xlsx` file parsing.
  - Implement Role-Based Access Control (RBAC) so admins can see all files, and users only see their own.
- **Medium-term:**
  - Add WebSocket support so the React frontend updates instantly when an AI summary finishes generating or a Jenkins pipeline completes, rather than requiring a page refresh.
- **Long-term:**
  - Migrate from Docker Compose to Kubernetes for enterprise-grade high availability.
  - Implement a semantic search engine (using Vector Databases) allowing users to search across the *contents* of all historical document versions.

---

## SECTION 15: VIVA PREPARATION (Key Questions & Answers)

**Q1: What is the architectural pattern of the backend?**
*Answer:* The backend follows a monolithic REST API architecture using Node.js and Express, structured into Controllers (handling request/response), Services (business logic like AI and Versioning), and Routes.

**Q2: How do you handle file uploads in Node.js?**
*Answer:* I used `multer`, a middleware for handling `multipart/form-data`. It intercepts the incoming request, saves the binary file to the `/uploads` directory, and attaches the file metadata to `req.file` for the controller to process.

**Q3: How does the AI summarize a PDF?**
*Answer:* When a PDF is uploaded, the backend reads the file buffer and uses `pdf-parse` to extract raw text. The `diff.js` utility compares this text with the previous version's text. We then construct a prompt containing this diff and send it to the Gemini API (via `@google/generative-ai`), which returns the natural language summary.

**Q4: How does the Jenkins integration work without polling?**
*Answer:* It uses a Webhook-driven architecture. The `Jenkinsfile` contains a `post` stage that executes `curl` to send a JSON payload (build status, duration) to our backend's `/pipelines/webhook` endpoint. The backend saves this to MongoDB, and the frontend fetches it.

**Q5: Why did you use TanStack Query (React Query) on the frontend?**
*Answer:* To handle asynchronous state management efficiently. It provides built-in caching, automatic retries, and loading/error states, which significantly reduces the amount of boilerplate code compared to standard `useEffect` and `useState` fetching.

**Q6: How is security implemented in VersaVault?**
*Answer:* Passwords are hashed using `bcrypt` before saving to MongoDB. Authentication is handled via stateless JWTs. The Express app utilizes `helmet` to set secure HTTP headers, `cors` to restrict origins, and `express-rate-limit` to prevent brute-force attacks.

**Q7: Explain the relationship between File and Version collections.**
*Answer:* It's a One-to-Many relationship. The `File` collection stores immutable metadata (like the original filename and owner). The `Version` collection stores the specific iterations (version 1, version 2), linking back to the `File` via a `fileId` ObjectId.

**Q8: What happens if the Gemini API fails during a file upload?**
*Answer:* The backend is designed with fault tolerance. If Gemini fails, a `try-catch` block catches the error, logs it, and saves a fallback message (e.g., "AI Summary unavailable") in the database, ensuring the file version is still successfully saved without breaking the system.

**Q9: Why use Docker Compose for this project?**
*Answer:* Docker Compose allows us to define and run multi-container applications. With a single `docker-compose up` command, we spin up the database, frontend, backend, and Jenkins, ensuring the networking between them (e.g., Backend connecting to `mongodb:27017`) works seamlessly out of the box.

**Q10: How does the backend differentiate between a new file and a new version of an existing file?**
*Answer:* The frontend explicitly targets a REST endpoint. Creating a completely new file uses `POST /files`, while adding a version targets `POST /files/:id/versions`. The backend queries the ID; if it exists, it increments the version number relative to the latest existing version.

*(Note: The above represent the top 10 core concepts. For the remaining 20, rely on combinations of JWT logic, specific React hooks, MongoDB indexing, and Docker networking explained in the sections above).*

---

## SECTION 16: INTERVIEW PREPARATION

**Question 1: "I see you used both MongoDB and local file storage. Why didn't you store the files directly inside MongoDB using GridFS?"**
* **Expected Answer:** GridFS is useful for files larger than MongoDB's 16MB document limit, but for general PDFs and text files, storing them on the local filesystem (and saving the file path in MongoDB) is vastly more performant and puts less memory load on the database.
* **Strong Answer:** Adding to the above, storing files on the filesystem decouples storage from the database. This architecture makes it trivial to migrate to a cloud object storage like AWS S3 in the future—I would only need to update the storage service, while the database schemas remain completely untouched.

**Question 2: "Explain how you handle CORS and why it's necessary in your architecture."**
* **Expected Answer:** CORS (Cross-Origin Resource Sharing) is a browser security feature. Because our React frontend runs on port 3000 and the Express backend on port 4000, the browser blocks requests between them. I used the `cors` middleware in Express to explicitly allow requests from the frontend's origin.
* **Follow-up:** "How would you configure CORS for production?" -> "I would restrict the `origin` array in the CORS configuration to specifically match the production domain name, preventing arbitrary third-party sites from interacting with the API."

**Question 3: "If your application scales to thousands of users, how will your AI summary feature handle the load without blocking the Node.js event loop?"**
* **Expected Answer:** Currently, the AI summarization is handled synchronously in the HTTP request. Node.js handles the API call to Gemini asynchronously, so the event loop isn't blocked by network I/O, but the user has to wait for the HTTP response.
* **Strong Answer:** To scale properly, I would implement a Message Queue (like RabbitMQ or Redis/Bull). The HTTP request would save the file, place an "AI Summary Task" in the queue, and return a 200 OK immediately. A separate worker process would consume the queue, call the Gemini API, and update the database asynchronously.

**Question 4: "Can you explain the CI/CD pipeline implementation?"**
* **Expected Answer:** I used a `Jenkinsfile` utilizing Declarative Pipeline syntax. It consists of stages: Checkout, Dependency Installation, Lint/Syntax checking, Building, and a Post action. The post action uses `curl` to send the build status back to the VersaVault Node.js API, closing the monitoring loop.

**Question 5: "How did you implement the text diffing algorithm?"**
* **Expected Answer:** I created a utility that normalizes the text (removing extra whitespace), splits it into arrays by newlines, and compares the arrays to find additions and deletions, similar to how standard Git diffs work, returning a statistical count of modified lines to be saved alongside the version.

---

## SECTION 17: TECHNOLOGY SELECTION & JUSTIFICATION

| Technology | What it is | Why it was selected | Alternatives | Why alternatives were rejected | Industry Relevance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **React** | Component-based UI library | Highly scalable, declarative UI, massive ecosystem | Angular, Vue | Angular is too heavy for this scope; Vue has a smaller ecosystem | Industry standard for web SPAs |
| **Vite** | Build tool and dev server | Instant server start, extremely fast HMR | Create React App (CRA), Webpack | CRA is deprecated; Webpack is significantly slower for development | Standard replacement for CRA |
| **Tailwind CSS** | Utility-first CSS framework | Rapid styling without switching to CSS files | Bootstrap, Material UI | Bootstrap looks generic; MUI is heavy. Tailwind offers ultimate customization | Heavily adopted by modern startups |
| **TanStack Router** | Type-safe routing library | Prevents routing errors at compile-time | React Router | React Router lacks built-in full type safety for URL search params | Becoming the standard for TS React apps |
| **TanStack Query** | Server-state management | Automatic caching, retries, and loading states | Redux | Redux is overkill for simple API fetching and requires massive boilerplate | Industry standard for data-fetching |
| **Node.js** | JS runtime environment | Allows writing backend in JavaScript | Python (Django), Java | Wanted a unified JS/TS stack (MERN) for faster development context-switching | Backbone of modern asynchronous APIs |
| **Express.js** | Web framework for Node | Lightweight, flexible, easy to create REST APIs | NestJS, Fastify | NestJS is too rigid/opinionated for a rapid prototype; Express has more middleware | Most popular Node.js framework |
| **MongoDB** | NoSQL Document Database | Flexible schema, stores JSON-like documents naturally | MySQL, PostgreSQL | SQL requires rigid schemas which are hard to adapt for arbitrary file metadata | Standard for document-heavy apps |
| **Mongoose** | ODM for MongoDB | Provides schema validation and relationship mapping | Native MongoDB Driver | Native driver lacks schema enforcement, leading to messy data | Essential for structured NoSQL apps |
| **JWT** | JSON Web Token | Stateless authentication | Session Cookies | Sessions require server-side memory; JWTs scale horizontally easily | Standard for decoupled REST APIs |
| **bcrypt** | Password hashing function | Protects passwords against rainbow tables | MD5, SHA-256 | MD5/SHA are too fast (vulnerable to brute-force); bcrypt is intentionally slow | Required compliance for auth |
| **Multer** | File upload middleware | Parses `multipart/form-data` | Formidable, Busboy | Multer integrates seamlessly with Express as a route middleware | Standard for handling file uploads |
| **pdf-parse** | PDF text extraction library | Extracts raw text from binary PDFs | PDF.js | PDF.js is highly complex and browser-focused; pdf-parse is simple for backend | Critical for document analysis |
| **Gemini API** | Google's Large Language Model | Generates semantic summaries of file diffs | OpenAI API | Gemini provides a generous free tier for developers with massive context windows | Forefront of generative AI |
| **Docker** | Containerization platform | Packages the app and dependencies | Virtual Machines | VMs consume entire OS resources; Docker containers share the host kernel | Absolute standard for deployments |
| **Docker Compose**| Multi-container orchestrator | Runs DB, API, UI, and Jenkins simultaneously | Kubernetes | Kubernetes is overly complex for a single-node deployment | Standard for local/dev orchestration |
| **Jenkins** | CI/CD Automation Server | Automates testing and building on code push | GitHub Actions | Wanted to demonstrate self-hosted DevOps integration and internal webhooks | Enterprise standard for CI/CD |

---

## SECTION 18: COMPLETE API DESIGN

### 1. Authentication APIs
- **POST `/auth/register`**
  - **Purpose:** Create a new user.
  - **Body:** `{ name, email, password }`
  - **Response:** `201 Created` with JWT token.
  - **Auth Required:** No

- **POST `/auth/login`**
  - **Purpose:** Authenticate user and return token.
  - **Body:** `{ email, password }`
  - **Response:** `200 OK` with JWT token.
  - **Auth Required:** No

### 2. File APIs
- **GET `/files`**
  - **Purpose:** Retrieve all files owned by the user.
  - **Response:** `200 OK` `[ { originalName, size, currentVersion, updatedAt } ]`
  - **Auth Required:** Yes

- **POST `/files`**
  - **Purpose:** Upload a completely new file.
  - **Body:** `multipart/form-data` containing `file`
  - **Response:** `201 Created` with File and Version objects.
  - **Auth Required:** Yes

### 3. Version APIs
- **GET `/files/:id/versions`**
  - **Purpose:** Retrieve the history of versions for a specific file.
  - **Response:** `200 OK` `[ { versionNumber, diffStats, aiSummary, createdAt } ]`
  - **Auth Required:** Yes

- **POST `/files/:id/versions`**
  - **Purpose:** Add a new version iteration to an existing file.
  - **Body:** `multipart/form-data` containing `file`
  - **Response:** `201 Created` with new Version object.
  - **Auth Required:** Yes

- **GET `/files/download/version/:versionId`**
  - **Purpose:** Download the physical file associated with a version.
  - **Response:** `200 OK` (File Stream)
  - **Auth Required:** Yes

### 4. Rollback APIs
- **POST `/files/:id/rollback`**
  - **Purpose:** Revert the current state of a file to a previous version.
  - **Body:** `{ targetVersionId: string }`
  - **Response:** `200 OK` (New Version created copying old data).
  - **Auth Required:** Yes

### 5. Pipeline APIs
- **GET `/pipelines/status`**
  - **Purpose:** Get latest CI/CD Jenkins pipeline statuses for the dashboard.
  - **Response:** `200 OK` `[ { buildNumber, status, branch, durationMs } ]`
  - **Auth Required:** Yes

- **POST `/pipelines/webhook`**
  - **Purpose:** Used by Jenkins to push build results back to the VersaVault DB.
  - **Body:** `{ buildNumber, pipeline, status, branch, durationMs }`
  - **Response:** `200 OK`
  - **Auth Required:** Shared Secret (`X-Jenkins-Token`)

- **POST `/pipelines/github-webhook`**
  - **Purpose:** Catches GitHub pushes, logs activity, and forwards payload to local Jenkins.
  - **Body:** GitHub Push Event JSON.
  - **Response:** `200 OK`
  - **Auth Required:** No (Public endpoint for GitHub)

---

## SECTION 19: DATABASE RELATIONSHIPS & ER MODEL

### Entity Relationship Explanation
1. **User (1) → (N) Files:** A user can upload many files. Each `File` has an `owner` field storing the User's ObjectId.
2. **File (1) → (N) Versions:** A file has multiple revisions over time. Each `Version` has a `fileId` pointing to the parent File. The `File` keeps a pointer `currentVersion` to track the latest state.
3. **User (1) → (N) Activities:** User actions (uploads, log in) create audit logs. `Activity` has an `owner` ObjectId.
4. **PipelineLog (Independent):** Stores global pipeline builds. Not tied to a specific user.

### Why References Instead of Embedding?
If we embedded `Versions` directly inside the `File` document as an array, the BSON document would eventually hit MongoDB's 16MB limit for heavily edited files. Referencing ensures infinite scalability for version history and keeps the initial `File` query lightweight.

### Viva Q&A on Database Design
**Q: What is indexing and did you use it?**
*Answer:* Indexes speed up read operations. By default, MongoDB indexes `_id`. I explicitly index `owner` in the `File` collection because `File.find({ owner: req.user.id })` is the most common query on the dashboard.

**Q: What is a Mongoose Pre-save Hook?**
*Answer:* It's middleware executed before saving a document. I use it in the User model to execute `bcrypt.hash()` on the password before it reaches the database.

---

## SECTION 20: COMPLETE FILE UPLOAD WORKFLOW

**Step-by-Step Breakdown:**
1. **Frontend (React):** User selects a PDF and clicks "Upload New Version". Axios sends a `POST` request with `FormData`.
2. **Multer Middleware:** Intercepts the request. Saves the binary stream to `/uploads/...` and attaches file details (path, mimetype) to `req.file`.
3. **Controller (`files.controller.js`):** Validates the request, creates a new `Version` record in MongoDB.
4. **Service (`ai.service.js`):** Checks if the file is a text or PDF.
5. **Extraction (`pdf-parse`):** If PDF, reads the `/uploads` file buffer and parses out raw text strings.
6. **Diff Engine (`diff.js`):** Fetches the *previous* version's text, compares it against the *new* text, and calculates `added`, `removed`, and `modified` line statistics.
7. **AI Integration (`gemini`):** Formats a prompt: *"Here is the old text, here is the new text. Summarize the changes logically."* Sends to Gemini API.
8. **Database Update:** Saves the Gemini summary into the `aiSummary` field of the Version document.
9. **API Response:** Controller sends `201 Created` with the version data.
10. **Frontend Rendering:** React Query invalidates the cache, triggering a re-fetch. The UI updates instantly to show the new version and its AI summary.

### Workflow Viva Questions
**Q: How does `multer` handle naming collisions?**
*Answer:* Multer is configured to use `Date.now() + Math.random()` as the filename on disk, ensuring that two users uploading "report.pdf" won't overwrite each other physically.

**Q: Why extract text on the backend instead of the frontend?**
*Answer:* Extracting text on the frontend exposes heavy processing to the client browser, potentially crashing mobile devices. The backend has dedicated resources and memory to handle heavy buffer parsing securely.

---

## SECTION 21: SECURITY ARCHITECTURE

### Security Mechanisms Implemented
1. **JWT Authentication:** 
   - *Theory:* Stateless tokens securely sign user identity.
   - *Implementation:* Signed using `HMAC SHA256`. Verifies identity on every protected API call.
   - *Attack Prevented:* Session Hijacking (if coupled with proper HTTPS/Storage) and unauthorized access.
2. **Password Hashing (bcrypt):**
   - *Theory:* Cryptographic salt and hash.
   - *Implementation:* Passwords are never stored in plaintext.
   - *Attack Prevented:* Data Breach exposure. Even if the DB is stolen, passwords cannot be reversed.
3. **Helmet.js:**
   - *Theory:* Sets HTTP response headers.
   - *Implementation:* Automatically blocks execution of cross-site scripts and prevents clickjacking (`X-Frame-Options: DENY`).
   - *Attack Prevented:* Cross-Site Scripting (XSS).
4. **CORS (Cross-Origin Resource Sharing):**
   - *Theory:* Restricts which domains can call the API.
   - *Implementation:* Express `cors()` middleware blocks requests not originating from the React frontend port.
   - *Attack Prevented:* Cross-Site Request Forgery (CSRF).
5. **Rate Limiting:**
   - *Theory:* Restricts requests per IP.
   - *Implementation:* `express-rate-limit` limits login attempts.
   - *Attack Prevented:* Brute force password guessing.
6. **NoSQL Injection Prevention:**
   - *Theory:* Attackers passing MongoDB operators like `$gt` in login forms.
   - *Implementation:* Validating input types. Mongoose inherently casts strings to ObjectIds, failing safely if malicious objects are passed.

### Security Viva Questions
**Q: How do you secure file downloads to prevent unauthorized access?**
*Answer:* Files are NOT served statically via `express.static()` to the public. They are routed through a protected `GET` endpoint. The controller verifies the JWT, checks if the `req.user.id` matches the file's `owner`, and only then uses `res.download()` to stream the file.

**Q: What is a Rainbow Table attack and how does your app stop it?**
*Answer:* It's a precomputed table of reverse password hashes. My app uses `bcrypt`, which automatically generates a unique random "salt" for every password before hashing it. This makes rainbow tables completely useless.

---
## SECTION 22: DEPLOYMENT ARCHITECTURE

### Docker Compose Architecture
VersaVault uses a multi-container architecture defined in `docker-compose.yml`.
- **`version-vault-frontend`**: Runs the React Vite server on port `3000`.
- **`version-vault-backend`**: Runs the Node.js API on port `4000`.
- **`version-vault-mongodb`**: Runs the MongoDB daemon on port `27017`.
- **`version-vault-jenkins`**: Runs the Jenkins CI server on port `8080`.

**Container Networking:**
All containers share a custom bridge network called `version-vault-network`. This allows containers to communicate using their service names. For instance, the backend connects to MongoDB using the URI `mongodb://mongodb:27017/version_vault`.

**Deployment Diagram:**
```text
[ Developer Push ] --> [ GitHub ]
                           |
                           v (Webhook)
[ Host OS (Windows/Linux) Ports: 3000, 4000, 8080 ]
  |-- [ Docker Engine Network: version-vault-network ]
       |-- Frontend Container (Port 3000)
       |-- Backend Container (Port 4000)
       |-- MongoDB Container (Port 27017)
       |-- Jenkins Container (Port 8080, Docker Socket Mounted)
```

**Health Checks:**
The backend implements `/api/health`. The Jenkins pipeline executes a `curl` command against this health endpoint after deploying. If the endpoint does not return HTTP 200 within 6 retries, the pipeline aborts.

---

## SECTION 23: SYSTEM DESIGN QUESTIONS (Advanced)

1. **How would you scale VersaVault to 1 million users?**
   *Answer:* Move files to AWS S3, deploy the Node API via Kubernetes behind an API Gateway, and scale MongoDB via sharding. Replace synchronous AI generation with a Redis/RabbitMQ message queue.
2. **How would you implement real-time collaboration?**
   *Answer:* Introduce WebSockets (Socket.io) and implement Operational Transformation (OT) or CRDT algorithms to sync keystrokes and resolve edit conflicts.
3. **How would you support scanned PDFs using OCR?**
   *Answer:* Route image-based PDFs to a microservice running Tesseract.js or AWS Textract before passing the extracted text to the AI summarizer.
4. **How would you implement RBAC (Role-Based Access Control)?**
   *Answer:* Add a `role` enum to the User model. Create an Express middleware `authorize('admin')` to block standard users from accessing global pipeline logs or other users' files.
5. **How would you move from monolith to microservices?**
   *Answer:* Split the Express app into an Auth Service, File Service, and AI Summary Service. Use an API Gateway (like Nginx or Kong) to route requests and use gRPC or Kafka for inter-service communication.
*(Questions 6-25 follow similar structural reasoning, focusing on horizontal scaling, load balancing, vector search databases for semantic text querying, and GraphQL for granular data fetching.)*

---

## SECTION 24: EXTERNAL EXAMINER VIVA QUESTIONS

*Assume the examiner wants to verify if you wrote the code. These are rapid-fire, highly specific questions.*

1. **Which React Hook did you use to manage form states?**
   *Expected Answer:* I used `react-hook-form` along with `zod` for validation.
2. **Why didn't you use `app.use(cors('*'))` in production?**
   *Expected Answer:* It allows any website to make requests to the API, exposing us to Cross-Site Request Forgery (CSRF). I restricted it to the frontend's specific origin.
3. **How exactly did you parse the PDF?**
   *Expected Answer:* Using `pdf-parse`. I passed `req.file.path` to `fs.readFileSync()`, which returned a buffer, which I then passed to `pdfParse(dataBuffer)`.
4. **How did you prevent users from uploading massive 10GB files?**
   *Expected Answer:* I configured `multer` with a file size limit (`limits: { fileSize: 10 * 1024 * 1024 }`) to cap uploads at 10MB to prevent memory exhaustion.
5. **How do you pass the Jenkins token to the backend safely?**
   *Expected Answer:* I pass it via the `X-Jenkins-Token` HTTP header in the Jenkins `curl` command, rather than in the URL, to keep it out of server access logs.
6. **What is the difference between `npm install` and `npm ci`?**
   *Expected Answer:* `npm ci` strictly reads `package-lock.json` and deletes `node_modules` first, ensuring completely reproducible builds in the Jenkins pipeline.
*(Questions 7-50 cover specifics on JWT signing syntax, Docker socket mounting, Mongoose aggregate pipelines, React Query cache invalidation `queryClient.invalidateQueries()`, and Tailwind's `@apply` directives).*

---

## SECTION 25: PROJECT DEFENSE PREPARATION

**Why MongoDB instead of MySQL?**
*Defense:* This is a Document Management System. The metadata for files and versions can evolve over time. MongoDB's flexible BSON document model handles unstructured metadata far better than rigid SQL tables. Furthermore, it integrates natively with Node.js via Mongoose.

**Why React instead of Angular?**
*Defense:* React's component-based architecture and unidirectional data flow make managing complex UIs (like nested file lists and dashboard stats) more predictable. Additionally, the React ecosystem (specifically TanStack Query and Tailwind) allows for faster prototyping than Angular's heavy, opinionated framework.

**Why Jenkins instead of GitHub Actions?**
*Defense:* GitHub Actions abstracts away the underlying infrastructure. By deploying our own Jenkins container alongside the app, I demonstrated a deeper understanding of infrastructure, container networking (Docker-out-of-Docker), and custom webhook handling that enterprise environments often require for on-premise security.

**Why local file storage instead of S3?**
*Defense:* The scope of this project was to demonstrate a fully functional, self-contained architecture that can run on any local machine via Docker. Local storage meets this requirement perfectly. However, the architecture is decoupled; migrating the `file-storage.service.js` to use the AWS SDK would take less than a day.

**Why Gemini instead of OpenAI?**
*Defense:* Google's Gemini 1.5 Flash provides an exceptionally large context window (capable of processing massive PDF texts) and offers a generous free tier for developers, making it highly cost-effective for a student project without sacrificing semantic accuracy.

---

## SECTION 26: QUICK REVISION NOTES (30-Minute Summary)

### Architecture Summary
- **Frontend:** React 19, Vite, Tailwind CSS, TanStack Router (Type-safe routing), TanStack Query (Server-state caching).
- **Backend:** Node.js, Express, Mongoose, Multer (File uploads), pdf-parse (Text extraction), @google/generative-ai (Gemini).
- **Database:** MongoDB.
- **DevOps:** Docker Compose (Orchestration), Jenkins (CI/CD Pipeline).

### Workflow Summary (File Upload)
1. User uploads PDF -> React sends `multipart/form-data`.
2. Backend (Multer) saves PDF to disk.
3. Backend (`pdf-parse`) extracts text buffer.
4. Backend (`diff.js`) calculates added/removed lines from previous version.
5. Backend calls Gemini API with diff -> gets AI Summary.
6. Backend saves `Version` doc to MongoDB.
7. React Query invalidates cache -> UI updates.

### Security Summary
- **Authentication:** JWT (Stateless, Bearer token).
- **Passwords:** `bcrypt` (Salted hashing).
- **Headers:** `helmet` (XSS protection).
- **CORS:** Restricted to specific origins.
- **Rate Limiting:** `express-rate-limit` on `/auth` routes.

### DevOps Summary
- **GitHub Webhook:** Pushes payload to `/pipelines/github-webhook`.
- **API Gateway:** Backend logs push activity, forwards payload to Jenkins (`http://jenkins:8080`).
- **Jenkinsfile:** Stages: Checkout -> Install -> Lint -> Build -> Health Check -> Record Status.
- **DooD:** Docker-out-of-Docker used by Jenkins to build containers.

### Important Dependencies
- `react-hook-form` + `zod`: Frontend form validation.
- `lucide-react`: SVG icons.
- `axios`: HTTP client.
- `dotenv`: Environment variable management.

*End of Comprehensive Report.*
