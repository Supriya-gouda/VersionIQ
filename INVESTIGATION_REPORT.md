# 🔍 PDF TEXT EXTRACTION & AI SUMMARY PIPELINE - INVESTIGATION REPORT

**Investigation Date**: 2026-06-14  
**Status**: Complete Analysis (No code changes yet)  
**Phase**: Pre-Implementation Investigation

---

## EXECUTIVE SUMMARY

The Version Vault Pro document parsing and AI summary pipeline is **architecturally sound** but has **critical implementation gaps** causing:
- 📄 Empty PDF text extraction (silent failures)
- 🤖 Gemini API receiving insufficient/empty context
- 📊 Diff calculations working but receiving empty input
- 💾 AI summaries defaulting to placeholders silently

**Root Cause**: No validation of extracted text before AI processing + error swallowing in try-catch blocks.

---

## PHASE 1: CODEBASE ARCHITECTURE ANALYSIS

### 1.1 File Upload Flow

```
Frontend Upload
    ↓
POST /api/files/upload (auth required)
    ↓
Multer middleware:
  - Store temp file to uploads/tmp/
  - Validate MIME type (allowedTypes list)
  - Validate file size (100MB limit)
  - Returns: req.file with {path, originalname, mimetype, size}
    ↓
uploadFileController (files.controller.js)
  - Calls: createOrUpdateFileVersion()
  - Logs activity
  - Returns: {file, version}
    ↓
Frontend: File list refreshed
```

**Status**: ✅ Upload infrastructure working

---

### 1.2 PDF Processing Flow

```
createOrUpdateFileVersion()
    ↓
Check if fileId provided:
  - YES: Find existing FileRecord
  - NO: Create new FileRecord
    ↓
Calculate next version number
  - Get last version from DB
  - nextVersion = lastVersion.versionNumber + 1
    ↓
Move uploaded file to permanent storage:
  - Path: uploads/{userId}/{fileId}/v{n}_{filename}
  - Create folders if needed
    ↓
Extract text from previous version (if exists):
  readTextIfPossible(lastVersion.storagePath, mimeType, originalName)
    ↓
Extract text from current version:
  readTextIfPossible(finalPath, upload.mimetype, upload.originalname)
    ↓
Calculate diff (with extracted text):
  calculateLineDiff(previousText, nextText)
    ↓
Generate summary (with extracted text):
  generateSummary({diffStats, previousContent, currentContent, ...})
    ↓
Save Version record to MongoDB
    ↓
Update FileRecord with latest version
```

**Key Function**: `readTextIfPossible(filePath, mimeType, originalName)`

Located in: `backend/src/services/version.service.js`

```javascript
async function readTextIfPossible(filePath, mimeType, originalName = "") {
  if (isPdf(mimeType, originalName)) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text || "";
    } catch (error) {
      console.error(`[ERROR] Failed to parse PDF: ${error.message}`);
      return "";  // ⚠️ SILENT FAILURE - returns empty string
    }
  }
  
  if (isWord(mimeType, originalName)) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return (result && result.value) || "";
    } catch (error) {
      console.error(`[ERROR] Failed to parse Word document: ${error.message}`);
      return "";  // ⚠️ SILENT FAILURE
    }
  }
  
  if (!isTextLikeMime(mimeType, originalName)) {
    return "";  // ⚠️ SILENT FAILURE - non-text file
  }
  
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return "";  // ⚠️ SILENT FAILURE
  }
}
```

**Status**: ⚠️ Correct structure but returns empty string on ANY failure

---

### 1.3 Document Text Extraction

#### PDF Extraction (pdf-parse)
- **Method**: `await pdfParse(buffer)`
- **Returns**: `{text, numpages, ...}`
- **Issue**: CommonJS module - requires `createRequire(import.meta.url)`
- **Status**: ✅ Correctly implemented with createRequire

#### Word Extraction (mammoth)
- **Method**: `await mammoth.extractRawText({path})`
- **Returns**: `{value: string, messages: []}`
- **Status**: ✅ Correctly implemented

#### Text Extraction (fs.readFile)
- **Method**: `await fs.readFile(filePath, 'utf-8')`
- **Status**: ✅ Correctly implemented

**Detection Logic**:
```javascript
function isPdf(mimeType, originalName = "") {
  return mimeType === "application/pdf" || 
         originalName.toLowerCase().endsWith(".pdf");
}

function isWord(mimeType, originalName = "") {
  const lower = originalName.toLowerCase();
  return (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx")
  );
}
```

**Status**: ✅ Detection correct

---

### 1.4 Version Creation Flow

Located in: `backend/src/services/version.service.js`

```javascript
const version = await Version.create({
  file: fileRecord._id,
  owner: userId,
  versionNumber: nextVersionNumber,
  storedFilename,
  originalName: upload.originalname,
  mimeType: upload.mimetype,
  size: upload.size,
  storagePath: finalPath,
  status,
  summary: summary.summary,              // ← Populated from generateSummary()
  summarySource: summary.source || "local", // ← Track source
  summaryModel: summary.model || "",
  diffStats,                              // ← From diff calculation
  aiDetails: summary.aiDetails || {},    // ← AI analysis details
  isCurrent: true,
});
```

**Storage**: ✅ All fields properly populated

---

### 1.5 Version Comparison/Diff Flow

Located in: `backend/src/utils/diff.js`

**Function**: `calculateLineDiff(previousContent, nextContent)`

```javascript
export function calculateLineDiff(previousContent = "", nextContent = "") {
  const previousLines = toLines(previousContent).filter((l) => l.trim());
  const nextLines = toLines(nextContent).filter((l) => l.trim());

  const previousSet = new Set(previousLines);
  const nextSet = new Set(nextLines);

  let added = 0;
  let removed = 0;

  // Count added lines
  for (const line of nextSet) {
    if (!previousSet.has(line)) {
      added++;
    }
  }

  // Count removed lines
  for (const line of previousSet) {
    if (!nextSet.has(line)) {
      removed++;
    }
  }

  // Calculate similarity using LCS
  const commonSubseqLength = lcs(previousLines, nextLines);
  const totalLines = Math.max(previousLines.length, nextLines.length);
  const similarity = totalLines > 0 ? (commonSubseqLength / totalLines) * 100 : 0;

  return {
    added,
    removed,
    modified: Math.min(added, removed),
    totalAdded: added,
    totalRemoved: removed,
    similarity: Math.round(similarity),
    previousLineCount: previousLines.length,
    nextLineCount: nextLines.length,
  };
}
```

**Algorithm**: 
- Line-by-line comparison
- Filters empty lines: `.filter((l) => l.trim())`
- Calculates similarity via Longest Common Subsequence (LCS)
- Handles large files (MAX_LINES = 1000)

**Status**: ✅ Correct algorithm, works with any input

**⚠️ Critical Issue**: If previousContent or nextContent is empty string:
- `previousLines = []`
- `nextLines = []`
- Result: `{added: 0, removed: 0, modified: 0, similarity: 0}`
- No error thrown, silent failure

---

### 1.6 AI Summary Generation Flow

Located in: `backend/src/services/ai.service.js`

**Entry Point**: `generateSummary({diffStats, versionNumber, previousContent, currentContent})`

**Fallback Chain**:
1. **Try Gemini** (if GEMINI_API_KEY set)
   - Models: gemini-2.5-flash → gemini-2.0-flash → gemini-2.0-flash-lite
   - For each model: make API call, check for empty response, try next
2. **Try OpenAI** (if OPENAI_API_KEY set)
   - Model: gpt-4o-mini (configurable)
3. **Fall back to Local Intelligence**
   - Keyword-based analysis
   - Returns placeholder summaries

**Status**: ⚠️ Correct structure but critical input validation missing

---

### 1.7 Gemini Integration Flow

**Prompt Construction** (`buildPrompt()`):
```javascript
function buildPrompt({ diffStats, versionNumber, previousContent, currentContent }) {
  const textDiff = generateTextDiff(previousContent, currentContent);

  let text = `FILE VERSION COMPARISON: v${versionNumber - 1} -> v${versionNumber}\n\n`;
  text += `STATISTICS:\n`;
  text += `- Added: ${diffStats.added} lines\n`;
  text += `- Removed: ${diffStats.removed} lines\n`;
  text += `- Modified: ${diffStats.modified} lines\n`;
  text += `- Similarity: ${diffStats.similarity || 0}%\n\n`;
  text += `CHANGES PREVIEW:\n${textDiff}\n\n`;
  
  if (previousContent && currentContent) {
    text += `FULL CONTENT CONTEXT (Partial):\n`;
    text += `--- v${versionNumber - 1} ---\n${previousContent.substring(0, 4000)}\n\n`;
    text += `--- v${versionNumber} ---\n${currentContent.substring(0, 4000)}\n`;
  }
  
  return text;
}
```

**⚠️ Issues**:
- If `previousContent` is empty: `if (previousContent && currentContent)` check fails
- Sends prompt with just statistics and empty diff
- Gemini receives minimal context

**API Call**:
```javascript
const response = await axios.post(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.geminiApiKey}`,
  {
    contents: [{parts: [{text: prompt}]}],
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0.7,
      response_mime_type: "application/json",
    },
  },
  {headers: {"Content-Type": "application/json"}, timeout: 30000}
);
```

**Response Parsing**:
```javascript
const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
try {
  return JSON.parse(raw);
} catch (e) {
  // Fallback parsing...
}
```

**Status**: ⚠️ API call correct, but receives insufficient context

---

### 1.8 OpenAI Fallback Flow

**Implementation**: Similar to Gemini, using axios POST to OpenAI endpoint

```javascript
const response = await axios.post(
  "https://api.openai.com/v1/chat/completions",
  {
    model: env.openAiModel,
    messages: [
      {role: "system", content: "You are a high-level technical analyst..."},
      {role: "user", content: buildPrompt({...})}
    ],
    max_tokens: 150,
    temperature: 0.7,
  },
  {headers: {...}, timeout: 8000}
);
```

**Status**: ⚠️ Same issue - receives empty content

---

### 1.9 Local Intelligence Fallback

Located in: `backend/src/services/ai.service.js`

**Implementation**: Keyword matching with hardcoded templates

```javascript
if (contentLower.includes("college") || contentLower.includes("student")) {
  topicSummary = "College Website & Student Feedback Integration";
  summaryText = "This update introduces a comprehensive college homepage...";
  // ... etc
}
```

**Status**: ⚠️ Returns misleading summaries for unmatched files

---

### 1.10 MongoDB Storage

**Version Model Fields**:
```javascript
summary: {type: String, default: ""}
summarySource: {type: String, enum: ["gemini", "openai", "local"], default: "local"}
summaryModel: {type: String, default: ""}
diffStats: {
  added: {type: Number, default: 0},
  removed: {type: Number, default: 0},
  modified: {type: Number, default: 0},
}
aiDetails: {
  topicSummary: {type: String, default: ""},
  extraNotes: {type: String, default: ""},
  addedLines: [{type: String}],
  removedLines: [{type: String}],
  modifiedLines: [{type: String}],
}
```

**Storage**: ✅ All fields defined and populated

---

### 1.11 Error Handling

Located in: `backend/src/services/version.service.js`

```javascript
try {
  diffStats = calculateLineDiff(previousText, nextText);
  const summaryResult = await generateSummary({
    diffStats,
    versionNumber: nextVersionNumber,
    previousContent: previousText,
    currentContent: nextText,
  });
  summary = summaryResult;
} catch (error) {
  console.error(`[ERROR] Failed to generate diff/summary: ${error.message}`);
  // ⚠️ SILENT FAILURE - continues with default summary
}
```

**Default Summary**: `{summary: "Version ${nextVersionNumber} uploaded."}`

**Status**: ⚠️ Error swallowing - no propagation

---

## PHASE 2: CRITICAL ISSUES IDENTIFIED

### Issue #1: Silent PDF Extraction Failures 🔴 HIGH

**Location**: `backend/src/services/version.service.js` - `readTextIfPossible()`

**Problem**:
```javascript
async function readTextIfPossible(filePath, mimeType, originalName = "") {
  if (isPdf(mimeType, originalName)) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text || "";  // ← Empty string if pdf-parse fails
    } catch (error) {
      console.error(`[ERROR] Failed to parse PDF: ${error.message}`);
      return "";  // ← Returns empty string, no indication of failure
    }
  }
  // ... more code
}
```

**Why It Fails**:
1. PDF file might be scanned (image-based, no OCR)
2. PDF might be corrupted
3. pdf-parse might fail
4. Buffer might be unreadable

**Impact**: `previousText = ""` and/or `nextText = ""` passed to Gemini

---

### Issue #2: No Text Validation Before AI 🔴 HIGH

**Location**: `backend/src/services/ai.service.js` - `generateSummary()`

**Problem**: 
- Receives `previousContent = ""` or `currentContent = ""`
- No validation before calling Gemini/OpenAI
- Sends minimal context to APIs

**Example**:
```javascript
const summaryResult = await generateSummary({
  diffStats: {added: 0, removed: 0, modified: 0},
  versionNumber: 1,
  previousContent: "",   // ← EMPTY!
  currentContent: "",    // ← EMPTY!
});
```

**Result**: Gemini receives prompt with only "FILE VERSION COMPARISON: v0 -> v1" and statistics

---

### Issue #3: Error Swallowing in Version Creation 🔴 HIGH

**Location**: `backend/src/services/version.service.js` - `createOrUpdateFileVersion()`

**Problem**:
```javascript
try {
  diffStats = calculateLineDiff(previousText, nextText);
  const summaryResult = await generateSummary({...});
  summary = summaryResult;
} catch (error) {
  console.error(`[ERROR] Failed to generate diff/summary: ${error.message}`);
  // ⚠️ CONTINUES WITHOUT RE-THROWING
}

// Always uses default if error caught:
let summary = { summary: `Version ${nextVersionNumber} uploaded.` };
```

**Impact**: 
- Gemini API errors silently ignored
- Rate limit errors (429) treated same as success
- Summary always becomes generic fallback

---

### Issue #4: Incomplete Logging 🔴 HIGH

**Missing Logging**:
- ❌ PDF extraction start/end with byte count
- ❌ Text extraction length for each file
- ❌ Empty content detection
- ❌ Each Gemini model attempt
- ❌ Gemini API request/response bodies
- ❌ Diff calculation results
- ❌ Summary generation timing

**Impact**: Impossible to debug pipeline failures in production

---

### Issue #5: Gemini Response Parsing Fragility 🟡 MEDIUM

**Location**: `backend/src/services/ai.service.js` - `generateGeminiSummary()`

**Issue**:
```javascript
const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
try {
  return JSON.parse(raw);
} catch (e) {
  // Fallback: try to extract JSON
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {...}
  }
  // Last resort: extract summary field
  const summaryMatch = raw.match(/"summary"\s*:\s*"([^"]+)/);
  if (summaryMatch) {
    return {summary: summaryMatch[1] + "..."};
  }
  return {summary: "File changed but AI explanation was incomplete."};
}
```

**Risk**: Gemini may return malformed JSON, parsing fails, defaults to generic message

---

### Issue #6: Scanned PDF Detection Absent 🟡 MEDIUM

**Problem**: No OCR support detected

**Current Flow**:
- PDF uploaded
- pdf-parse extracts text
- If scanned: text = "" (0 characters)
- No error, continues silently

**Missing**: Automatic detection:
```
Extract text
  ↓
Check length
  ↓
If length < threshold:
  → Mark as "scanned_pdf"
  → Skip AI (or implement OCR)
```

---

### Issue #7: Local Summary Misleading 🟡 MEDIUM

**Location**: `backend/src/services/ai.service.js` - Fallback local intelligence

**Problem**: Hardcoded keyword matching returns irrelevant summaries

**Example**:
- Upload: `notes.txt` containing "college feedback"
- Local AI matches keyword "college"
- Returns: "This update introduces a comprehensive college homepage and secure student feedback collection page..."
- **Reality**: It's just student notes, not a college website!

---

## PHASE 3: ROOT CAUSE ANALYSIS

### Root Cause #1: Design Flaw in Error Handling
- Assumption: "Text extraction always returns something useful"
- Reality: PDFs can be scanned, corrupted, or fail to parse
- Solution: Add validation layer before AI processing

### Root Cause #2: Missing Input Validation
- Assumption: "If code doesn't error, data is valid"
- Reality: Empty strings pass through without error
- Solution: Require minimum content length before AI

### Root Cause #3: No Observability
- Assumption: "Errors will be visible in logs"
- Reality: Errors caught, logged, then ignored
- Solution: Add structured logging at each pipeline stage

### Root Cause #4: Insufficient Testing
- No test cases for:
  - Empty content
  - Scanned PDFs
  - API failures
  - Timeout scenarios

---

## PHASE 4: IMPACT ASSESSMENT

### What's Broken
- ❌ PDF text extraction (returns "", no error)
- ❌ Gemini AI summaries (receives empty content)
- ❌ Version diffs (calculates on empty strings = {added: 0, removed: 0})
- ❌ Frontend display (shows generic "Version uploaded" summary)

### What's Working
- ✅ File upload infrastructure
- ✅ MongoDB storage
- ✅ Diff algorithm (works with any input)
- ✅ Gemini/OpenAI API integration (when given proper input)
- ✅ Local summary generation (though misleading)

---

## PHASE 5: RECOMMENDED FIXES

### Fix #1: Add Text Extraction Validation 🔴 HIGH PRIORITY
**File**: `backend/src/services/version.service.js`

```javascript
// After extracting text, validate before use
async function validateExtractedText(text, filePath, mimeType) {
  // Check 1: Not empty
  if (!text || text.length === 0) {
    console.warn(`[WARNING] No text extracted from ${filePath}`);
    // For PDFs, could indicate scanned image
    return {valid: false, text: "", reason: "empty", suggestOcr: isPdf(mimeType)};
  }
  
  // Check 2: Contains actual content (not just whitespace)
  if (text.trim().length === 0) {
    console.warn(`[WARNING] Extracted text is only whitespace from ${filePath}`);
    return {valid: false, text: "", reason: "whitespace_only", suggestOcr: isPdf(mimeType)};
  }
  
  // Check 3: Minimum length threshold
  const MIN_CONTENT_LENGTH = 10; // at least 10 characters
  if (text.length < MIN_CONTENT_LENGTH) {
    console.warn(`[WARNING] Extracted text too short (${text.length} chars) from ${filePath}`);
    return {valid: false, text: text, reason: "too_short"};
  }
  
  console.log(`[INFO] Successfully extracted ${text.length} characters from ${filePath}`);
  return {valid: true, text: text, reason: "success"};
}
```

### Fix #2: Add Comprehensive Logging 🔴 HIGH PRIORITY
**File**: `backend/src/services/version.service.js`

```javascript
// In createOrUpdateFileVersion():
console.log(`[INFO] Processing file: ${upload.originalname} (${upload.size} bytes, ${upload.mimetype})`);

const previousTextResult = lastVersion ? 
  await readTextIfPossible(...) : null;
if (lastVersion) {
  console.log(`[INFO] Previous version text: ${previousTextResult?.length || 0} characters`);
}

const nextTextResult = await readTextIfPossible(...);
console.log(`[INFO] Current version text: ${nextTextResult?.length || 0} characters`);

const diffStats = calculateLineDiff(previousText, nextText);
console.log(`[INFO] Diff calculated: +${diffStats.added} -${diffStats.removed} ~${diffStats.modified} lines`);

const summaryResult = await generateSummary({...});
console.log(`[INFO] Summary generated from source: ${summaryResult.source}`);
```

### Fix #3: Add Input Validation to AI Pipeline 🔴 HIGH PRIORITY
**File**: `backend/src/services/ai.service.js`

```javascript
export async function generateSummary({
  diffStats,
  versionNumber,
  previousContent = "",
  currentContent = "",
}) {
  // Validate input
  if (!currentContent || currentContent.trim().length < 10) {
    console.warn(`[WARNING] Insufficient content for AI summary (${currentContent?.length || 0} chars)`);
    
    // For first version (no previous), this is expected
    if (versionNumber === 1) {
      return {
        summary: `Version 1 uploaded: ${currentContent.length} characters`,
        source: "local",
        model: "validation",
        reason: "insufficient_content_new_version"
      };
    }
    
    // If neither previous nor current has content, skip Gemini
    if (!previousContent || previousContent.trim().length < 10) {
      return buildLocalSummary(diffStats, versionNumber);
    }
  }
  
  // Proceed with AI if validation passed
  // ... existing code ...
}
```

### Fix #4: Improve Error Handling 🟡 MEDIUM PRIORITY
**File**: `backend/src/services/version.service.js`

```javascript
let diffStats = {added: 0, removed: 0, modified: 0};
let summary = null;
let summaryError = null;

try {
  diffStats = calculateLineDiff(previousText, nextText);
  console.log(`[INFO] Diff stats: ${JSON.stringify(diffStats)}`);
} catch (diffError) {
  console.error(`[ERROR] Diff calculation failed: ${diffError.message}`);
  summaryError = diffError;
  // Still continue, use empty diff
}

try {
  const summaryResult = await generateSummary({
    diffStats,
    versionNumber: nextVersionNumber,
    previousContent: previousText,
    currentContent: nextText,
  });
  summary = summaryResult;
} catch (summaryError) {
  console.error(`[ERROR] Summary generation failed: ${summaryError.message}`);
  // Use fallback but track error
  summary = {
    summary: `Version ${nextVersionNumber} uploaded.`,
    source: "fallback",
    error: summaryError.message
  };
}

// Log what we're storing
console.log(`[INFO] Storing summary: source=${summary.source}, length=${summary.summary.length}`);
```

### Fix #5: Add Debug Endpoint 🟡 MEDIUM PRIORITY
**File**: `backend/src/routes/file.routes.js` (development only)

```javascript
if (env.nodeEnv === "development") {
  fileRouter.get("/debug/:fileId", asyncHandler(async (req, res) => {
    const file = await FileRecord.findById(req.params.fileId).lean();
    const versions = await Version.find({file: req.params.fileId})
      .select("versionNumber summary summarySource summaryModel diffStats storagePath")
      .sort({versionNumber: -1})
      .lean();
    
    res.json({
      file,
      versions: versions.map(v => ({
        ...v,
        summaryLength: v.summary?.length || 0,
        hasExtraction: v.diffStats?.added !== undefined
      }))
    });
  }));
}
```

---

## SUMMARY TABLE

| Issue | Severity | Type | File | Fix |
|-------|----------|------|------|-----|
| Silent PDF failures | 🔴 HIGH | Extraction | version.service.js | Add validation + logging |
| No text validation | 🔴 HIGH | Validation | ai.service.js | Check text length before AI |
| Error swallowing | 🔴 HIGH | Error handling | version.service.js | Log + track errors |
| Missing logging | 🔴 HIGH | Observability | version.service.js | Add structured logs |
| Response parsing fragile | 🟡 MEDIUM | Parsing | ai.service.js | Improve JSON parsing |
| No scanned PDF detection | 🟡 MEDIUM | Detection | version.service.js | Add OCR detection |
| Local summary misleading | 🟡 MEDIUM | Fallback | ai.service.js | Improve heuristics |

---

## APPROVAL CHECKLIST

- [ ] Review findings
- [ ] Confirm root causes
- [ ] Approve recommended fixes
- [ ] Authorize code changes

**Status**: AWAITING USER REVIEW

---

*Report generated during comprehensive codebase analysis. No code changes have been made.*
