# Tasker OS — Technical Architecture & Features Specification ⚡

> The comprehensive architectural and technical specification for **Tasker OS**: an executive-grade productivity platform engineered with client-side cryptographic security, multi-model AI routing, real Google Drive cloud vault sync, perpetual session dual-token rotation, and an audience analytics telemetry engine.

🚀 **Live Production Deployment**: **[https://p1tasker.vercel.app](https://p1tasker.vercel.app)**  
📘 **User Guide**: **[USAGE.md](./USAGE.md)** | 🗺️ **Navigation Guide**: **[NAVIGATION.md](./NAVIGATION.md)**

---

## 🏛️ End-to-End System Architecture

```
                                +---------------------------------------------+
                                |            Tasker OS Client UI              |
                                |       React 18 + Vite 5 + Tailwind CSS       |
                                +---------------------------------------------+
                                                       |
        ┌───────────────────┬──────────────────────────┼──────────────────────────┬───────────────────┐
        ▼                   ▼                          ▼                          ▼                   ▼
+---------------+   +---------------+          +---------------+          +---------------+   +---------------+
| StorageService|   |AIBrokerService|          | SpeechService |          |GoogleAuthServ |   |AnalyticsServ  |
| - Dual Tier   |   | - Multi-Router|          | - Dictation   |          | - Dual-Token  |   | - Visitor ID  |
| - SHA-256 Dedup|  | - Groq / Llama|          | - Stutter Fix |          | - Root Folder |   | - IP Geotarget|
| - Versioning  |   | - Gemini Flash|          | - Whisper L3  |          | - 8 Subfolders|   | - Tech Stack  |
| - AES-256 Vault|  | - xAI / OpenAI|          | - 15+ Lang TTS|          | - Hidden Vault|   | - Live Stream |
+---------------+   +---------------+          +---------------+          +---------------+   +---------------+
        │                   │                          │                          │                   │
        ▼                   ▼                          ▼                          ▼                   ▼
+---------------+   +---------------+          +---------------+          +---------------+   +---------------+
| LocalStorage  |   | Cloud AI APIs |          | Web Speech &  |          | Google Drive  |   | Telemetry     |
| & IndexedDB   |   | Direct HTTP   |          | MediaRecorder |          | REST API v3   |   | Export CSV/JSON
+---------------+   +---------------+          +---------------+          +---------------+   +---------------+
```

---

## 1. 🗄️ Dual-Tier Storage & Google Drive Cloud Vault

### 1.1 Resilient Storage Hierarchy
- **Tier 1 (Instant Local Storage)**: Sub-millisecond synchronous read/write access to tasks, calendar markers, and diary entries stored client-side in browser storage.
- **Tier 2 (Google Drive Cloud Vault)**: Seamless synchronization with the user's personal Google Drive account.
  - Automatically creates and manages a visible root folder named **`Tasker App Data`** or **`Tasker_Media`** (`parents: ['root']`).
  - **Graceful Offline Degrade**: When network access is unavailable or when the user authenticates via email only, all state is safely cached locally with automated retry triggers upon reconnection.

### 1.2 Public Media Folder with 8 Typed Subfolders
To ensure users can effortlessly locate their uploaded files directly in Google Drive, `GoogleAuthService` provisions an organized 8-folder hierarchy:
```
📁 Tasker_Media (or Tasker App Data) [Public / Visible in Drive Root]
  ├── 📁 Videos         (MP4, MKV, WebM, MOV, AVI)
  ├── 📁 Documents      (PDF, DOCX, TXT, RTF, MD)
  ├── 📁 Presentations  (PPT, PPTX, Keynote)
  ├── 📁 Spreadsheets   (XLS, XLSX, CSV, ODS)
  ├── 📁 Programs       (EXE, MSI, APK, DMG, ZIP, TAR)
  ├── 📁 Images         (JPG, PNG, GIF, WebP, SVG)
  ├── 📁 Audio          (MP3, WAV, OGG, M4A, FLAC)
  └── 📁 Other          (Unclassified binary assets)
```
- **Automatic File Routing**: Every file uploaded via the Word Document Canvas or Day Tasks is routed to its exact subfolder using MIME type and extension inspection.
- **Zero Faking Verification**: The UI never manufactures mock file IDs (`file-...`). Every uploaded asset reflects authentic Google Drive IDs (`15+` alphanumeric characters) verified via Drive REST API v3.
- **Resumable Chunked Uploads**: Large media files (e.g. 500MB videos or 2GB archives) are streamed via `uploadMediaFileResumable` in 5MB chunk slices, preventing memory pressure and network timeouts.

### 1.3 Private Text Vault Isolation
To protect personal thoughts, reflections, and sensitive agendas:
- All private text data (tasks, diary notes, AI chat sessions, and configuration keys) is stored inside Google Drive's restricted **`appDataFolder`** (`tasker_vault.json`).
- `Tasker_Media` strictly contains media files only—private JSON text files are never exposed in the visible root folder.

### 1.4 Cryptographic File Deduplication (SHA-256) & Versioning
- **Exact Duplicate Detection**: Every file passes through a Web Cryptography SHA-256 hash pipeline (`crypto.subtle.digest`). If an identical file is uploaded across multiple dates or tasks, Tasker OS references the existing hash and Drive ID without duplicating storage.
- **File Version Tracking**: If a file with the same filename is uploaded with updated content, Tasker OS increments its version (`v2`, `v3`), links `updatedFromId` and `updatedFromName`, marks the older file as `supersededBy`, and preserves **both** files in the registry so revision history is never lost.
- **Safe Orphan Purging**: When an attachment is deleted from a date, Tasker OS checks whether any other entries reference the same hash before purging orphaned assets.

---

## 2. 🔑 Perpetual Dual-Token Rotation Architecture

### 2.1 The Problem It Solves
Standard Google OAuth 2.0 access tokens expire after exactly 3,600 seconds (1 hour). Traditional web applications force the user to re-authenticate, causing disruptive popups, aborted file uploads, and lost session state.

### 2.2 Dual-Token Architecture Implementation
Tasker OS implements a perpetual session mechanism using concurrent active and standby tokens:
```
[ User Logs In ] ──> Acquire Active Token (Expires in 60m)
                  ──> Acquire Standby Token (Pre-fetched)
                           │
  [ T = 50 Minutes ] ──────┴──> 10-Minute Expiry Safety Window
                                  │
                                  ├─ Swap: Active Token <── Standby Token
                                  └─ Silent Background Refresh: Fetch New Standby
                                  │
                          [ Session Never Dies ]
```
- **Silent Background Rotation**: At the 50-minute mark, Tasker OS automatically rotates to the standby token and requests a fresh standby token in the background.
- **Zero Double-Auth Prompts**: The initial login flow requests all required scopes (`drive.file`, `userinfo.email`, `userinfo.profile`) in a single consolidated consent prompt, eliminating multiple re-prompts.
- **Single Authenticated Account Policy**: System Settings displays strictly the single currently logged-in account, preventing confused multi-account states.

---

## 3. 🤖 Omni-AI Broker Service & Multi-Model Engine

Tasker OS implements a flexible, zero-config AI broker architecture supporting multiple world-class frontier models:

### 3.1 Multi-Provider Routing Matrix
| Provider | Default Model | Speed | Strengths |
| :--- | :--- | :--- | :--- |
| **Groq Cloud** | `llama-3.3-70b-versatile` | ~280 tok/s | Instant reasoning, real-time grammar repair, task parsing |
| **Google Gemini** | `gemini-1.5-flash` / `pro` | ~120 tok/s | Multimodal image understanding, deep diary reflection, long context |
| **xAI Grok** | `grok-2-latest` | ~100 tok/s | Sharp, unfiltered analytical reasoning and brainstorming |
| **OpenAI** | `gpt-4o` / `gpt-4o-mini` | ~90 tok/s | Structured multi-turn workflows, JSON schema extraction |

### 3.2 Intelligent Auto-Failover & Rate Limit Protection
- **429 Rate-Limit Recovery**: If a provider returns HTTP 429 (quota exceeded), `AIBrokerService` automatically falls back to alternative available providers.
- **Built-in Local Semantic Engine**: If all external API keys are absent, the broker runs an offline cognitive engine for grammar correction, math calculation, task structuring, and semantic analysis without network dependency.

### 3.3 Dynamic Model Discovery
- Fetches live model listings directly from providers (`/models` endpoints) without hardcoding model names. Users can freely choose among newly released frontier models.

---

## 4. 🎙️ Speech Engineering & Voice Intelligence

### 4.1 Continuous Voice Dictation with Stutter Deduplication
- Employs browser-native `SpeechRecognition` configured for continuous streaming.
- **Unicode-Aware Stutter Removal (`cleanSpeechStutter`)**:
  - Eliminates repeated words caused by microphone stutter or acoustic echoes across Latin, Telugu (`\u0C00-\u0C7F`), and Devanagari (`\u0900-\u097F`) scripts.
  - Cleans phrases like *"today today I went"* into *"today I went"*.
- **Session-Start Anchoring**: Anchors live interim transcripts against session baseline text, preventing runaway duplication during long dictation sessions.

### 4.2 AI Whisper Multilingual Voice-to-Diary
- Captures uncompressed audio streams via browser `MediaRecorder` (`audio/webm`).
- Sends audio payloads to **Groq Whisper Large v3** for precision transcription across 90+ languages (including mixed Telugu-English and Hindi-English code-switching).
- Formats unstructured voice streams into structured daily entries with action items, emotional sentiment ratings, and key takeaways.

---

## 5. 📝 Word Document Canvas & Inline Media Block Flow

### 5.1 Professional Document Flow (`WordDocumentCanvas.tsx`)
- Renders journal entries as clean, flowing paragraphs with comfortable line heights, mimicking Microsoft Word and Google Docs.
- **In-Place Paragraph Editing**: Click any paragraph to enter inline edit mode with keyboard support (`Enter` to save, `Escape` to cancel).

### 5.2 Small Clickable Preview Cards (Zero Raw Tags)
- Raw attachment tags (`{{attachment:...}}`, `{{file:...}}`) are completely hidden from the user.
- Attachments render as elegant, compact preview chips showing:
  - File category badge (Images, Videos, Documents, Spreadsheets, Programs)
  - Filename and formatted size (KB/MB)
  - Quick-action buttons: **Preview (`👁️`)**, **Drive Link (`🔗`)**, **Delete (`✕`)**
- Clicking any preview chip launches the **Drive Media Viewer Modal** with in-app video playback, document reading, and image zoom.

### 5.3 Automated Task Text Sanitizer
- Cleanses task titles and descriptions against raw JSON strings, markdown fences, or attachment tags before saving to storage or rendering in the UI.

---

## 6. 📊 Audience & Regional Analytics Telemetry Engine

Tasker OS includes a built-in privacy-first telemetry engine (`AnalyticsService`) and an executive reporting dashboard (`AnalyticsDashboard.tsx`):

### 6.1 Privacy-First Principles
- **Strictly Anonymized**: No user task titles, diary entries, personal names, or cloud credentials are ever recorded or transmitted.
- **Persistent Anonymous Visitor ID**: Generates a random UUID stored in local storage to track unique visitors over time.
- **Session Tracking**: Tracks session durations, active browser heartbeats, and page views.

### 6.2 IP Geolocation & Zero-Latency Fallback
- Resolves visitor geographic country, region/state, and city via a fast CORS-compliant IP geolocation service.
- **Zero-Latency Fallback**: Immediately resolves location from `Intl.DateTimeFormat().resolvedOptions().timeZone` and `navigator.language` if offline or if network lookup is delayed.
- Automatically assigns country flag emojis (e.g. 🇮🇳, 🇺🇸, 🇬🇧, 🇩🇪, 🇯🇵, 🇦🇺).

### 6.3 Metric Aggregations & Live Activity Stream
- **Regional Breakdown**: Calculates visitor counts and percentage shares per country/region.
- **Device & Platform Analytics**: Aggregates Desktop vs. Mobile vs. Tablet, plus Operating Systems (Windows, macOS, Linux, iOS, Android) and Browsers (Chrome, Firefox, Safari, Edge).
- **Feature Engagement Counters**: Tracks tasks created, tasks completed, diary entries, media uploads, AI queries, and voice dictation minutes.
- **Live Activity Feed**: Real-time streaming log of user actions.
- **Data Export**: Generates one-click **CSV** and **JSON** reports for external analytics tools.

---

## 7. 🛡️ Cryptographic Vault & Backup Security

### 7.1 AES-256-GCM Backup Encryption
- Exports `.tasker` encrypted backup archives protected by **AES-GCM (256-bit)**.
- **PBKDF2 Key Derivation**: 100,000 iterations of SHA-256 with a unique 16-byte cryptographic salt.
- Unique 12-byte initialization vector (IV) per export.
- Pre-decryption SHA-256 checksum verification guards against corrupted or modified backup files.
- Restores support **Merge Mode** (safely combines incoming data with existing entries) or **Replace Mode** (clean restore).

---

## 8. 🎨 Theme System & Viewport Responsiveness

### 8.1 Theme Engine
- **Dark Mode**: Neutral slate backgrounds (`#020617`, `#0f172a`), muted border lines (`#1e293b`), and neon-accented badges.
- **Light Mode**: Crisp, executive paper-white backgrounds (`#f8fafc`, `#ffffff`), subtle borders (`#e2e8f0`), and high-contrast charcoal text (`#0f172a`).
- Instant switching via the top navigation bar with zero page reload and localStorage persistence.

### 8.2 Responsive Viewports & Multi-Device Breakpoints
- **Mobile (375px - 640px)**: Horizontal scrollable navigation tabs, touch-friendly action targets, full-width modal drawers.
- **Tablet (768px - 1024px)**: Responsive 2-column dashboards and adaptive calendar grids.
- **Desktop & 4K (1280px+)**: Multi-column Eisenhower matrix, full Word canvas, and maximum-width constraints (`max-w-7xl`).
