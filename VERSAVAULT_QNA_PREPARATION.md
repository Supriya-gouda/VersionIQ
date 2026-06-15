# VersaVault - Viva and Interview Preparation Guide

## SECTION 15: VIVA PREPARATION (30 Important Questions)

### React & Frontend
**Q1: What is Vite and why did you use it instead of Create React App?**
*Answer:* Vite is a modern build tool that provides a faster development experience. It uses native ES modules during development (avoiding heavy bundling) and Rollup for production. I used it because Create React App is deprecated and Vite offers significantly faster Hot Module Replacement (HMR).

**Q2: How does routing work in your application?**
*Answer:* I used TanStack Router instead of React Router. It provides fully type-safe routing, which integrates perfectly with TypeScript, ensuring that URL parameters and query strings are validated at compile-time.

**Q3: What is the purpose of React Query in your project?**
*Answer:* React Query handles server-state synchronization. Instead of manually using `useEffect` and `useState` to fetch files or pipelines, React Query automatically caches the data, handles loading/error states, and manages background refetching.

**Q4: How do you protect routes on the frontend?**
*Answer:* We check if the JWT token exists in `localStorage`. If it doesn't, the TanStack router intercepts the navigation and redirects the user to the `/login` route before the protected component even mounts.

**Q5: What CSS framework did you use and why?**
*Answer:* I used TailwindCSS. It provides utility classes that allow for rapid UI development directly in the JSX, keeping styling closely coupled with the components and avoiding large, unmaintainable CSS files.

### Node.js & Backend
**Q6: What is the architectural pattern of the backend?**
*Answer:* A monolithic REST API built with Express.js, structured into Routes, Controllers (handling HTTP logic), and Services (handling business logic like DB operations and AI).

**Q7: How did you handle file uploads?**
*Answer:* Using `multer`, an Express middleware. It parses `multipart/form-data` requests, streams the binary data to the disk in the `/uploads` folder, and makes metadata available in `req.file`.

**Q8: Explain the role of Middleware in your Express app.**
*Answer:* Middleware functions have access to the request and response objects. I used them for Authentication (verifying JWTs), Security (Helmet, CORS), File parsing (Multer), and global Error Handling.

**Q9: How does the global error handler work?**
*Answer:* If any controller throws an error (using `next(err)` or caught by the `asyncHandler`), the request falls through to the global error middleware at the end of the pipeline, which formats it into a consistent JSON response and prevents the server from crashing.

**Q10: What is the event loop in Node.js, and does your app block it?**
*Answer:* The event loop allows Node.js to perform non-blocking I/O operations despite being single-threaded. My app handles file reading and network requests (like to Gemini) asynchronously, yielding control back to the event loop, so it is not blocked.

### MongoDB & Mongoose
**Q11: Why did you choose MongoDB over a SQL database?**
*Answer:* Document management systems deal with flexible, unstructured data (like arbitrary metadata for different file types). MongoDB's document-oriented JSON structure is a perfect fit, and it integrates natively with Node.js.

**Q12: Explain the relationship between the File and Version models.**
*Answer:* It's a One-to-Many relationship. The `File` model represents the logical document. The `Version` model represents the physical iterations. A `Version` document contains a `fileId` reference pointing to the parent `File`.

**Q13: How do you prevent users from accessing files they don't own?**
*Answer:* Every `File` document stores an `owner` field referencing the User's ObjectId. When fetching files, the backend explicitly queries `File.find({ owner: req.user.id })`.

**Q14: What is Mongoose and why use it?**
*Answer:* Mongoose is an ODM (Object Data Modeling) library for MongoDB. It provides schema validation, data casting, and business logic hooks, ensuring that invalid data (like a missing originalName) cannot be saved.

**Q15: How are Jenkins pipeline logs stored?**
*Answer:* In the `PipelineLog` collection. We use an upsert operation based on the `pipeline` name and `buildNumber`. If the build is already running, we update its status; if it's new, we insert it.

### AI Integration & Logic
**Q16: How do you extract text from a PDF?**
*Answer:* I use the `pdf-parse` library. It reads the raw buffer of the uploaded file and parses the PDF structures to return a contiguous string of text.

**Q17: Explain the Diff algorithm.**
*Answer:* The `diff.js` utility takes the text of the previous version and the new version, splits them by newline characters, and iterates through them to identify added lines, removed lines, and unchanged lines.

**Q18: How does the Gemini integration work?**
*Answer:* We construct a prompt containing the text diff. We then use the `@google/generative-ai` SDK to send this prompt to the `gemini-1.5-flash` model, requesting a plain-English summary, and await the response.

**Q19: What happens if the PDF is an image (scanned document)?**
*Answer:* Currently, `pdf-parse` only reads embedded text. A scanned PDF will return empty text. This is a known limitation that requires OCR (Optical Character Recognition) to resolve in the future.

**Q20: Why do you need AI? Why not just show the diff?**
*Answer:* Diffs are great for code, but terrible for human language (like legal contracts or reports). AI bridges the gap by translating mechanical line changes into logical business context.

### Jenkins, Docker, & DevOps
**Q21: What is Docker Compose?**
*Answer:* A tool for defining and running multi-container Docker applications. Our `docker-compose.yml` defines the frontend, backend, database, and Jenkins as services that run together on a shared virtual network.

**Q22: How does Jenkins know when to build?**
*Answer:* We configured GitHub Webhooks. When code is pushed, GitHub sends an HTTP POST request. Our backend catches it, logs the activity, and forwards it to the Jenkins container's webhook listener.

**Q23: How does the VersaVault dashboard get the Jenkins build status?**
*Answer:* The `Jenkinsfile` has a final pipeline stage that executes a `curl` command. This sends the success/failure status as a JSON payload to our backend's `/pipelines/webhook` endpoint, which saves it to MongoDB.

**Q24: What is the benefit of this webhook architecture over polling?**
*Answer:* Polling (asking Jenkins every 5 seconds "Are you done?") wastes network bandwidth and CPU. Webhooks are event-driven, meaning data is only sent when a state actually changes.

**Q25: Why is Jenkins running as root in the Docker container?**
*Answer:* It needs access to `/var/run/docker.sock` to perform Docker-out-of-Docker (DooD) operations, allowing the Jenkins pipeline to build and deploy our actual Docker images.

### Security
**Q26: How do you secure passwords?**
*Answer:* Using `bcrypt` to hash the passwords before saving them. Bcrypt applies a salt and hashes the password multiple times, making it extremely resistant to rainbow table and brute-force attacks.

**Q27: What is Helmet.js?**
*Answer:* An Express middleware that automatically sets various HTTP headers (like Content-Security-Policy and X-Frame-Options) to protect against common web vulnerabilities like XSS and clickjacking.

**Q28: How do you prevent brute-force login attacks?**
*Answer:* I implemented `express-rate-limit` on the authentication routes, which blocks an IP address if it makes too many failed login attempts within a specific time window.

**Q29: Are the uploaded files secure?**
*Answer:* Yes, they are stored securely on the server's filesystem, not directly accessible via a public URL. They can only be downloaded by passing through an authenticated backend route that verifies ownership.

**Q30: Why is the JWT secret kept in an `.env` file?**
*Answer:* To ensure sensitive cryptographic keys are not hardcoded into the source code and accidentally exposed in version control systems like GitHub.

---

## SECTION 16: INTERVIEW PREPARATION (20 Technical Questions)

**Q1: "I see you used both MongoDB and local file storage. Why didn't you store the files directly inside MongoDB using GridFS?"**
* **Expected Answer:** GridFS is for files >16MB. Local storage is faster for normal files.
* **Strong Answer:** Storing files on the filesystem decouples storage from the database. This architecture makes it trivial to migrate to a cloud object storage like AWS S3 later without touching database schemas.

**Q2: "Explain how you handle CORS and why it's necessary."**
* **Expected Answer:** CORS prevents websites from making unauthorized API requests. I used the `cors` middleware in Express to allow my React frontend (port 3000) to talk to the API (port 4000).
* **Strong Answer:** In production, I configure the `origin` array in the CORS configuration to explicitly match the production domain name, preventing arbitrary third-party sites from accessing the API.

**Q3: "If your application scales to thousands of users, how will your AI summary feature handle the load?"**
* **Expected Answer:** The API calls to Gemini are asynchronous, so Node.js won't crash, but the user has to wait for the HTTP response.
* **Strong Answer:** To scale properly, I would implement a Message Queue (like RabbitMQ). The HTTP request would save the file, place an "AI Summary Task" in the queue, and return a 200 OK immediately. A worker process would consume the queue asynchronously.

**Q4: "Can you explain the CI/CD pipeline implementation?"**
* **Expected Answer:** I wrote a `Jenkinsfile` that checks out code, installs dependencies, runs linters, and executes a final webhook notification.
* **Strong Answer:** The pipeline uses Declarative syntax and parallel stages for efficiency (e.g., linting frontend and backend simultaneously). It integrates directly back into the application by securely POSTing the build results to a protected backend endpoint.

**Q5: "How does your JWT authentication workflow operate?"**
* **Expected Answer:** User logs in, gets a token, and sends it in the Authorization header.
* **Strong Answer:** Upon successful validation of bcrypt hashes, a JWT is signed with a secret and an expiration time. The client stores this in memory or localStorage. On every protected request, a custom middleware verifies the signature. If it's valid, the decoded user ID is attached to the `req` object for downstream controllers.

**Q6: "How did you implement the text diffing algorithm?"**
* **Expected Answer:** I split the text by newlines and compared the arrays.
* **Strong Answer:** The utility normalizes line endings and whitespace, then calculates the intersection and differences between two arrays of strings, providing a statistical count of additions and deletions, which forms the basis of the prompt sent to the LLM.

**Q7: "Why did you use TanStack Router over React Router?"**
* **Expected Answer:** It is newer and has better TypeScript support.
* **Strong Answer:** TanStack Router provides 100% type safety. It ensures that search parameters, path parameters, and navigation links are statically typed, catching routing errors at compile-time rather than run-time, which is critical for a robust enterprise UI.

**Q8: "What happens if the Gemini API goes down?"**
* **Expected Answer:** The upload will fail.
* **Strong Answer:** I designed the system with fault tolerance. The AI generation is wrapped in a `try-catch` block. If Gemini fails, the error is caught, and the database record is updated with a fallback message (e.g., "Summary unavailable"), ensuring the core file versioning system remains functional.

**Q9: "Explain the purpose of Docker-out-of-Docker (DooD) in your Jenkins setup."**
* **Expected Answer:** It lets Jenkins run Docker commands.
* **Strong Answer:** Instead of running a nested Docker daemon inside the Jenkins container (Docker-in-Docker), DooD mounts the host's `/var/run/docker.sock`. This allows the Jenkins container to command the host's Docker daemon, efficiently building and spinning up containers alongside itself without nested virtualization overhead.

**Q10: "How would you implement Role-Based Access Control (RBAC) if requested?"**
* **Expected Answer:** I would add a `role` field to the User model (e.g., admin, user).
* **Strong Answer:** I'd implement an `authorizeRoles` middleware. After the `protect` middleware verifies the JWT, the `authorizeRoles('admin')` middleware would check `req.user.role`. This would allow me to cleanly define Admin-only routes for viewing global pipeline statistics versus user-specific file routes.

**Q11: "What are the security risks of allowing users to upload files?"**
* **Expected Answer:** Users could upload viruses or malicious scripts.
* **Strong Answer:** We mitigate this by validating MIME types and file extensions through Multer before saving. Furthermore, files are stored outside the public web root and served via an API endpoint, preventing direct execution of malicious scripts (like `.php` or `.html` files) by the web server.

**Q12: "Why use React Query instead of Redux for state management?"**
* **Expected Answer:** Redux is too complicated for simple data fetching.
* **Strong Answer:** Redux is a global client-state manager, whereas React Query is a server-state manager. Since VersaVault's UI is primarily driven by database state (files, versions, logs), React Query's automated caching, invalidation, and background fetching handle this much more efficiently than writing manual Redux thunks.

**Q13: "How do you handle secrets like Database URIs and API keys?"**
* **Expected Answer:** I put them in a `.env` file.
* **Strong Answer:** Environment variables are loaded using the `dotenv` package. More importantly, I created a `config/env.js` validation file that checks for the presence of mandatory variables at startup, failing fast and preventing the server from running in a broken state if a key is missing.

**Q14: "If you had to migrate the database from MongoDB to PostgreSQL, what changes?"**
* **Expected Answer:** I'd have to rewrite all the queries.
* **Strong Answer:** Because I used a Controller-Service architecture, the business logic is separated from the database layer. I would replace Mongoose schemas with a relational ORM like Prisma or Sequelize, migrate the unstructured data to normalized tables (User, File, Version), and update the Service methods, leaving the Controllers largely untouched.

**Q15: "What is the difference between a PUT and a PATCH request?"**
* **Expected Answer:** PUT replaces everything, PATCH updates partially.
* **Strong Answer:** In RESTful design, a PUT request is idempotent and expects the entire payload representation to replace the resource. A PATCH request applies a partial update (e.g., only changing the file name), which is more network efficient.

**Q16: "How did you ensure the frontend is responsive across devices?"**
* **Expected Answer:** I used Tailwind CSS.
* **Strong Answer:** I utilized Tailwind's mobile-first breakpoint system (e.g., `md:`, `lg:` prefixes) to implement responsive grids and flexbox layouts. For example, the sidebar navigation collapses into a hamburger menu on smaller screens to maximize the workspace area.

**Q17: "What is an index in MongoDB, and did you use any?"**
* **Expected Answer:** An index makes searching faster.
* **Strong Answer:** Indexes improve query performance. By default, MongoDB indexes the `_id` field. For VersaVault, I would place indexes on foreign keys like the `owner` field in the `File` collection and `fileId` in the `Version` collection to optimize read performance when a user opens their dashboard.

**Q18: "Explain the `forwarding` mechanism in your GitHub Webhook controller."**
* **Expected Answer:** The backend receives the webhook and sends it to Jenkins.
* **Strong Answer:** Since Jenkins runs in a local Docker network, GitHub cannot reach it directly. The backend's public `/pipelines/github-webhook` endpoint acts as an API Gateway. It logs the activity to MongoDB first, then uses `axios` to construct an identical HTTP POST request and proxies it to the internal Jenkins container's `8080` port.

**Q19: "How would you implement real-time collaboration like Google Docs?"**
* **Expected Answer:** I would use WebSockets.
* **Strong Answer:** It requires WebSockets (e.g., `Socket.io`) for persistent, bidirectional communication. More complexly, it requires implementing Operational Transformation (OT) or CRDT (Conflict-free Replicated Data Type) algorithms on the backend to resolve conflicts when two users edit the exact same line simultaneously.

**Q20: "If the project is done, how would you maintain and monitor it in production?"**
* **Expected Answer:** I would check the logs if something breaks.
* **Strong Answer:** I would integrate centralized logging (like ELK stack or Datadog) to capture `morgan` access logs and Express errors. I would also set up uptime monitoring on the `/health` endpoint and configure alert thresholds for CPU/Memory utilization of the Docker containers.
