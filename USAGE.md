# Tasker OS — Complete User Guide & Manual 📘

> The ultimate everyday guide to mastering **Tasker OS**: an executive-tier, privacy-first productivity suite integrating **Daily Tasks**, **Eisenhower Scheduling**, **Rich Word Document Journaling**, **Multilingual Voice Dictation**, and a multi-model **Omni-AI Brain**.

🚀 **Live Production Deployment**: **[https://p1tasker.vercel.app](https://p1tasker.vercel.app)**  
⚡ **Technical Specifications**: **[FEATURES.md](./FEATURES.md)** | 🗺️ **Interactive Navigation Guide**: **[NAVIGATION.md](./NAVIGATION.md)**

---

## 1. 🚀 Quick Start & Google Authentication

Tasker OS provides a seamless, secure authentication flow connecting your personal Google Drive storage:

### 1.1 One-Click Google Sign-In (Recommended)
1. Navigate to **[https://p1tasker.vercel.app](https://p1tasker.vercel.app)**.
2. Click **Get Started** or **Sign In with Google**.
3. **What happens automatically:**
   - Your account is authenticated via Firebase Auth & Google Identity Services (GIS).
   - A visible root folder named **`Tasker_Media`** (or `Tasker App Data`) is automatically created in your Google Drive root.
   - Inside this folder, 8 specialized subfolders are organized (`Videos`, `Documents`, `Presentations`, `Spreadsheets`, `Programs`, `Images`, `Audio`, `Other`).
   - Your private text notes, tasks, and AI chats are encrypted and stored in Google Drive's restricted `appDataFolder`, keeping your visible Drive clean and focused on media.

### 1.2 Perpetual Session & Never-Expiring Dual-Token Rotation
- Never worry about token expiry! Tasker OS maintains a concurrent **active and standby token** mechanism.
- At the 50-minute mark, your session silently rotates to the standby token and fetches a fresh one in the background.
- You will stay logged in indefinitely until you explicitly click **Sign Out**.

### 1.3 Single Authenticated Account
- System Settings displays strictly the single currently authenticated account, ensuring zero confusion and total data isolation.

---

## 2. 🧭 Navigating the Workspace

The top navigation bar provides instant one-click switching across all 6 core modules:

- **📅 Calendar**: Monthly command center displaying daily task completion badges, mood markers, and scheduled items.
- **📋 Day Tasks**: Daily priority execution with subtasks, inline media chips, and alarm chimes.
- **⚡ Scheduler**: Eisenhower Matrix (Urgent vs. Important) with melodic Web Audio reminders.
- **📖 Diary**: Word Document Canvas with sequential paragraphs, inline attachments, multilingual voice typing, and AI polishing.
- **🔒 Backup & Sync**: One-click Google Drive sync, AES-256-GCM encrypted backup export/import (Merge vs Replace modes).
- **📊 Analytics**: Real-time Audience & Regional Telemetry Dashboard tracking unique visitors, country/state breakdown, devices, and feature stats.
- **☀️ / 🌙 Theme Toggle**: Instant switch between Deep Space Slate (Dark) and Crisp Executive Paper (Light).
- **✨ Omni-AI Brain**: Slide-out multi-model assistant (Gemini, Groq, xAI Grok, OpenAI) with Mermaid mind maps and clickable `[YYYY-MM-DD]` date pills.
- **🔍 Global Search (`Ctrl+K`)**: Universal full-text search across all your tasks, diary entries, and file attachments.

---

## 3. 📋 Daily Tasks & Priority Execution

### Creating and Organizing Tasks
1. Click the **Day Tasks** tab or select any date on the **Calendar**.
2. Type your task title in the input box. Tasker OS automatically cleanses raw JSON, tags, and formatting fences so your tasks remain pristine.
3. Select priority:
   - **🔴 High**: Critical deadlines and high-leverage outcomes.
   - **🟡 Medium**: Standard daily responsibilities.
   - **🟢 Low**: Casual follow-ups or non-urgent to-dos.
4. Assign to a project: **Work**, **Personal**, **Finance**, or **Health**.
5. **Subtask Checklists**: Expand any task to add step-by-step subtasks with interactive progress bars.
6. **Task Media Attachments**: Attach documents, invoices, or screenshots directly to a task. They appear as compact preview chips. Click any chip to open the **Drive Media Viewer Modal**.

---

## 4. ⚡ Eisenhower Scheduler & Melodic Audio Alarms

### The 4 Strategic Quadrants
- **Do First (Urgent & Important)**: Immediate crises and today's top deliverables.
- **Schedule (Important, Not Urgent)**: Strategic initiatives, fitness, learning, and planning.
- **Delegate (Urgent, Not Important)**: Quick administrative errands and operational requests.
- **Don't Do (Neither Urgent nor Important)**: Distractions to eliminate.

### Melodic Ascending Alarms
- Tasker OS features browser-synthesized **Web Audio harmonic chimes** (ascending chords for 15-minute warnings and pulsing bells for 5-minute alerts).
- No external MP3 files needed—alarms ring reliably in your browser!

---

## 5. 📖 Word Document Canvas Diary

Experience journaling like a real word processor:

### Sequential Paragraph Flow
- Read and write like Microsoft Word: natural paragraph typography with clean margins and line spacing.
- **In-Place Paragraph Editing**: Hover over any paragraph and click **Edit (`✏️`)** or press `Enter` to modify text directly in place.

### Inline Media Embedding & Small Clickable Previews
1. Click **+ Insert Image** or **+ Attach File** in the toolbar.
2. Select any image, video, PDF, spreadsheet, presentation, or code asset.
3. The attachment is uploaded into its designated Google Drive subfolder (`Videos`, `Documents`, etc.) and rendered as a sleek preview card between your paragraphs.
4. **Zero Raw Tags**: You will never see raw tags like `{{attachment:...}}`. Everything is presented cleanly with filename, size, and category badge.
5. **Interactive Popup Viewer**: Click any attachment card to open the **Drive Media Viewer Modal** with in-app video streaming, PDF viewing, and high-res image zoom.

### Smart File Deduplication & Versioning
- **Upload the same file twice?** Tasker OS detects its SHA-256 hash, re-uses the existing Drive file, and links it without wasting cloud storage!
- **Upload an updated file with the same name?** Tasker OS automatically marks it as `v2` (or `v3`), links to the previous revision, and keeps **both** files in your registry!

---

## 6. 🎙️ Multilingual Voice Typing & AI Polish

### Continuous Voice Dictation with Stutter Deduplication
1. In the Diary toolbar, select your spoken language (supports **Telugu (తెలుగు IN)**, **Hindi (हिन्दी IN)**, **English (US/UK/IN)**, **Spanish**, **French**, **German**, **Japanese**, and more).
2. Click **🎙️ Dictate**.
3. Speak naturally. Microphone stutter (e.g. repeated words like *"project project update"*) is automatically cleaned in real time to *"project update"*.
4. Click **Listening...** to pause or complete dictation.

### ✨ Fix Errors & Polish (AI Sentence Reconstruction)
- Have messy voice notes, run-on sentences, or quick spoken thoughts?
- Click the **✨ Fix Errors & Polish** button in the toolbar.
- The AI Engine:
  - Eliminates acoustic stutters and repeated syllables.
  - Reconstructs fragmented spoken phrases into eloquent, professional prose.
  - Corrects spelling, capitalization, and punctuation.
  - **Attachment Protection Guarantee**: Strictly preserves all inline media blocks and attachments without altering their positions.

### AI Translate & Summarize
- **AI Translate**: Translate today's entry into 15+ world languages with a single click.
- **AI Summarize**: Generate an executive bullet-point summary and emotional mood reflection for rapid end-of-day retrospectives.

---

## 7. 📊 Audience & Regional Analytics Dashboard

Under the **📊 Analytics** tab in the top navigation bar:

### Real-Time Executive Telemetry
- **Visitor KPIs**: View total page visits, unique anonymous visitors, active browser sessions, and average engagement duration.
- **Interactive Geographic Breakdown**:
  - Live visitor country, state/region, city, and timezone.
  - National flags (e.g. 🇮🇳 India, 🇺🇸 United States, 🇬🇧 United Kingdom, 🇩🇪 Germany).
  - Visual animated percentage progress bars showing traffic distribution.
- **Technology & Platform Insights**: Real-time graphs for Desktop vs. Mobile vs. Tablet, operating systems (Windows, macOS, Linux, iOS, Android), and browsers (Chrome, Firefox, Edge, Safari).
- **Product Engagement Counters**: Track total tasks created, tasks completed, diary entries written, files uploaded, AI queries run, and voice dictation minutes.
- **Live Activity Feed**: Streaming ticker of recent user actions.
- **One-Click Export**:
  - Click **Export CSV** to download a spreadsheet of regional audience metrics.
  - Click **Export JSON** to export complete telemetry payloads.

---

## 8. 🔒 Encrypted Backups & Google Drive Cloud Vault

Under the **Backup & Sync** tab:

### Real-Time Google Drive Cloud Vault
- Inspect your sync status and connected Google Account email.
- Click **Sync Now** to immediately vault all latest tasks, diary entries, and media files to Google Drive.
- Click **Open in Drive** to inspect your visible `Tasker_Media` folder directly in Google Drive.

### Military-Grade Encrypted Backup (AES-256-GCM)
1. **Export Encrypted Backup**:
   - Enter your personal security passphrase.
   - Tasker OS encrypts your complete data vault using **AES-256-GCM** with PBKDF2 (100,000 iterations) and SHA-256 checksum verification.
   - Downloads a `.tasker` backup file.
2. **Restore Encrypted Backup**:
   - Choose a `.tasker` file and enter your password.
   - Select **Merge Mode** (safely integrates incoming entries) or **Replace Mode** (clean restore).

---

## 9. 🎨 Dark and Light Mode Theme Switcher

- Toggle the **Theme Switcher (`☀️` / `🌙`)** in the top navigation bar at any time.
- **Deep Space Slate (Dark)**: Optimized for night-time focus and OLED eye comfort.
- **Crisp Executive Paper (Light)**: High-contrast typography optimized for bright office environments.
- Theme preference persists across browser restarts.

---

## 10. 📱 Multi-Device & Mobile Tips

- **Mobile Phones (375px+)**: The navigation bar supports smooth horizontal swiping across tabs. Modals and drawers adapt with touch-friendly controls.
- **Tablets & Laptops**: Multi-column dashboards and adaptive Eisenhower grids.
- **Desktop & 4K**: Fluid Word Document Canvas constrained to a comfortable reading width (`max-w-7xl`).
- **Install as PWA**: Open Tasker OS in Chrome, Safari, or Edge and select **Install App** or **Add to Home Screen** for an offline-ready, app-like experience.

👉 **[Start Using Tasker OS Live](https://p1tasker.vercel.app)**
