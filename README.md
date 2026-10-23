# Tasker OS — The Executive Productivity Suite & Omni-AI Second Brain 🚀

<div align="center">

[![Live Production](https://img.shields.io/badge/Live%20App-p1tasker.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://p1tasker.vercel.app)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS 3](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Google Drive Cloud Vault](https://img.shields.io/badge/Google_Drive-100%25_User_Owned-34A853?style=for-the-badge&logo=googledrive&logoColor=white)](https://www.google.com/drive/)
[![AES-256-GCM](https://img.shields.io/badge/Security-AES--256--GCM-E11D48?style=for-the-badge&logo=shield&logoColor=white)](https://en.wikipedia.org/wiki/Galois/Counter_Mode)

**A unified, multi-platform executive productivity operating system featuring 100% user-owned Google Drive cloud storage, a Word Document Canvas with inline media, perpetual dual-token sessions, multilingual voice dictation with acoustic stutter removal, multi-model AI routing, and a real-time audience telemetry dashboard.**

[🚀 **Launch Live App**](https://p1tasker.vercel.app) • [📘 **User Guide**](./USAGE.md) • [⚡ **Technical Specs**](./FEATURES.md) • [🗺️ **Navigation Guide**](./NAVIGATION.md)

</div>

---

## 🌟 Why Tasker OS?

Most productivity tools lock your data inside proprietary databases or log you out every hour. **Tasker OS** redefines executive workflow with a **zero-lock-in, privacy-first** paradigm:

- **100% User-Owned Google Drive Vault**: Your tasks, reflections, and media live directly in **your** Google Drive. No third-party database silos.
- **Perpetual Dual-Token Rotation**: Concurrent active and standby token architecture ensures your session **never dies** unexpectedly.
- **Word Document Canvas**: Journal naturally with sequential paragraphs, inline media attachments, and small clickable preview cards—zero exposed tags.
- **Multilingual Voice Typing with Stutter Removal**: Speak freely in English, Telugu, Hindi, Spanish, or 10+ languages with automatic microphone stutter deduplication.
- **Omni-AI Brain (BYOK + Zero-Config)**: Switch dynamically between Google Gemini, Groq Llama 3.3, xAI Grok, and OpenAI with automated rate-limit auto-failover.
- **Real-Time Audience Analytics Dashboard**: Built-in executive telemetry tracking visitor counts, geographic distribution with national flags, device breakdown, and feature usage.

---

## 🌐 Live Production Deployment

Experience Tasker OS directly in your browser without installing anything:

👉 **[https://p1tasker.vercel.app](https://p1tasker.vercel.app)** 👈

*Compatible with all modern browsers: Chrome, Edge, Safari, Firefox, iOS Safari, and Android Chrome. PWA-installable with offline support.*

---

## 📚 Complete Guides & Documentation

| Document | Description |
| :--- | :--- |
| 📘 **[Complete User Guide (USAGE.md)](./USAGE.md)** | Step-by-step user manual covering Google authentication, tasks, Eisenhower scheduling, Word canvas journaling, voice typing, AI Polish, and encrypted backups. |
| ⚡ **[Technical Specifications (FEATURES.md)](./FEATURES.md)** | Comprehensive technical architecture detailing dual-tier storage, SHA-256 file deduplication, perpetual dual-token rotation, AES-256-GCM cryptography, and telemetry engine. |
| 🗺️ **[Interactive Navigation Guide (NAVIGATION.md)](./NAVIGATION.md)** | Visual sitemap, walkthrough of all 6 core tabs, global modals, drawers, and global keyboard shortcuts (`Ctrl+K`, `Ctrl+D`). |

---

## ✨ Core Feature Highlights

### 1. 📁 100% User-Owned Google Drive Cloud Vault
- **Organized Root Media Folder**: Automatically provisions a public folder named **`Tasker_Media`** (or `Tasker App Data`) in your Google Drive root.
- **8 Dedicated Subfolders**: Categorizes uploaded files into typed subdirectories:
  - 🎥 `Videos` • 📄 `Documents` • 📊 `Spreadsheets` • 📽️ `Presentations`
  - 💻 `Programs` • 🖼️ `Images` • 🎵 `Audio` • 📦 `Other`
- **Private Text Vault Isolation**: Protects personal diary notes, tasks, and chat history inside Google Drive's restricted `appDataFolder` (`tasker_vault.json`).
- **Resumable Chunked Streaming**: Upload large video files (500MB+) smoothly via 5MB chunk slices.

### 2. 🔑 Perpetual Dual-Token Session Architecture
- **Never Logged Out**: Uses concurrent active and standby tokens with silent background refresh at the 50-minute mark.
- **Zero Double-Auth Prompts**: Single consolidated permission prompt requesting all scopes upfront.
- **Single Logged-in Account**: Settings displays strictly the active account, preventing confused multi-account states.

### 3. 📝 Word Document Canvas Diary & Inline Media
- **Word-Processor Flow**: Write and read formatted paragraphs with comfortable line heights, just like Microsoft Word.
- **Inline Media Attachments**: Embed images, videos, spreadsheets, or documents between any two paragraphs.
- **Small Clickable Preview Cards**: Attachments render as compact preview chips showing filename, size, and category badge. Clicking opens the **Drive Media Viewer Modal**.
- **Smart SHA-256 Deduplication & Versioning**: Re-uses existing Drive assets for identical files and tracks versions (`v1`, `v2`) for updated files with the same name.
- **Zero Raw Tags**: Completely hides raw `{{attachment:...}}` tags from the user interface.

### 4. 🎙️ Multilingual Voice Typing & AI Stutter Deduplication
- **15+ Languages**: Voice dictation supporting Telugu (తెలుగు), Hindi (हिन्दी), English (US/UK/IN), Spanish, French, German, Japanese, and more.
- **Microphone Stutter Removal (`cleanSpeechStutter`)**: Eliminates duplicated words caused by audio reverberation (e.g. cleans *"meeting meeting tomorrow"* into *"meeting tomorrow"*).
- **✨ Fix Errors & Polish (AI Sentence Reconstruction)**: One-click button that cleans voice transcripts, reconstructs fragmented thoughts, and fixes grammar while strictly preserving all inline attachments.
- **🌐 AI Translate & Summarize**: Instant translation into 15+ world languages and bullet-point retrospectives.

### 5. ⚡ Eisenhower Matrix Scheduler & Melodic Audio Alarms
- **4 Strategic Quadrants**: Do First (Urgent & Important), Schedule (Important, Not Urgent), Delegate (Urgent, Not Important), and Don't Do.
- **Browser-Synthesized Harmonic Chimes**: Web Audio API generates ascending melodic chords for 15-minute warnings and pulsing bells for 5-minute alerts. Zero external audio downloads required.

### 6. 📊 Real-Time Audience & Regional Analytics Dashboard
- **Executive KPI Banner**: Live counters for Total Page Visits, Unique Anonymous Visitors, Active Browser Sessions, and Average Engagement Duration.
- **Interactive Geographic Breakdown**: Detected visitor country, state/region, city, and timezone, paired with country flag emojis (🇮🇳, 🇺🇸, 🇬🇧, 🇩🇪, etc.) and animated percentage progress bars.
- **Technology & Device Analytics**: Breakdowns for Desktop vs. Mobile vs. Tablet, operating systems, and browsers.
- **Product Engagement Counters**: Real-time metrics for tasks created, tasks completed, diary entries written, files uploaded, AI queries executed, and voice dictation minutes.
- **Live Activity Feed**: Streaming log of user actions.
- **One-Click Export**: Download regional visitor spreadsheets (`CSV`) and comprehensive telemetry payloads (`JSON`).

### 7. 🔒 Military-Grade Encrypted Backups (AES-256-GCM)
- Export your entire workspace into a portable `.tasker` encrypted archive.
- Protected by **AES-256-GCM** encryption with PBKDF2 key derivation (100,000 iterations) and pre-decryption SHA-256 checksum verification.
- Flexible restore options: **Merge Mode** (combines data safely) or **Replace Mode** (clean restore).

### 8. ☀️/🌙 Deep Space Slate & Crisp Paper White Themes
- One-click navigation toggle between **Deep Space Slate (Dark)** and **Crisp Executive Paper (Light)**.
- High-contrast typography and subtle border lines optimized for both day and night sessions.

---

## 🛠️ Complete Technologies & Architecture

| Category | Technology | Purpose & How It Is Used |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 & TypeScript 5** | High-performance reactive UI with strict type safety across tasks, diary, and AI brokers. |
| **Build & Dev Tooling** | **Vite 5 (Bundler & HMR)** | Sub-second dev server startup and optimized production bundling with Rollup code-splitting. |
| **Styling & Design System** | **Tailwind CSS 3** | Responsive design system with custom light and dark mode themes, fluid breakpoints, and custom scrollbars. |
| **Iconography** | **Lucide React** | Accessible, modern iconography for tasks, calendar, mic, alarms, search, theme toggles, and AI models. |
| **Date & Calendar Engine** | **Date-fns 3** | Robust date arithmetic, monthly calendar grids, and Eisenhower scheduling matrices. |
| **Voice Dictation (STT)** | **Web Speech API + Stutter Cleaner** | Real-time multilingual voice dictation (Telugu, Hindi, English, Spanish, etc.) with automatic stutter deduplication. |
| **AI Audio Transcription** | **Groq Whisper Large v3 / OpenAI** | High-fidelity audio transcription converting unscripted thoughts into structured daily reflections. |
| **AI Text Engine & Proofreader** | **Gemini, Groq, xAI Grok, OpenAI** | Omni-AI multi-provider broker for auto grammar correction, task extraction, semantic analysis, and question comprehension. |
| **Audio Alarm Engine** | **Web Audio API** | Synthesizes melodic ascending 15-minute chimes and pulsing 5-minute urgent alarms in the browser. |
| **Cloud Vault & Storage** | **Google Drive API (v3)** | User-owned cloud vault storing media in a visible root folder (`📁 Tasker_Media`) with 8 typed subfolders and text in `appDataFolder`. |
| **File Deduplication** | **Web Crypto API (SHA-256)** | Client-side cryptographic hashes eliminating duplicate file storage across dates and tracking versions. |
| **Encrypted Backup Vault** | **Web Crypto API (AES-256-GCM)** | Military-grade encrypted file backup with PBKDF2 key derivation (100,000 iterations) and checksum verification. |
| **Authentication** | **Firebase Auth + Google GIS** | Perpetual dual-token rotation architecture with consolidated consent prompt and single-account isolation. |
| **Audience Telemetry** | **IP Geolocation + Intl API** | Privacy-first client telemetry engine tracking unique visitors, geographic distribution, and feature metrics. |
| **Mind Maps & Diagrams** | **Mermaid.js 10** | Dynamically renders interactive SVG mind maps, timelines, and flowcharts inside the chatbot. |

---

## 🚀 Running Locally & Quick Start

You can run Tasker OS locally in two simple ways:

### Option 1: Double-Click the Launcher
Simply double-click the included [`start.bat`](./start.bat) file on your computer.

### Option 2: Using the Terminal
```bash
# 1. Clone the repository
git clone https://github.com/Srinu-ui-cpu/p1tasker.git
cd p1tasker

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```
Open **`http://localhost:5173`** in your browser!

### Running Verification Tests
Tasker OS includes an automated verification test suite verifying all 19 functional dimensions:
```bash
npx tsx scripts/verify-features.ts
```

### Production Build
```bash
npm run build
```

---

## 🗺️ Interactive Navigation Blueprint

```
                                  [ Tasker OS Top Navbar ]
                                             │
      ┌──────────────┬──────────────┬────────┼──────────────┬──────────────┬──────────────┐
      ▼              ▼              ▼        │              ▼              ▼              ▼
 📅 Calendar    📋 Day Tasks   ⚡ Scheduler   │   📖 Diary (Canvas) 🔒 Backup & Sync 📊 Analytics
 (Monthly Grid) (Priorities)  (Eisenhower)   │   (Word Doc Flow)  (Drive & Enc)  (Visitor Geo)
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             🤖 Omni-AI Chat Drawer                     ⚙️ System Settings Modal
             (Mindmaps & Citations)                     (API Keys & Single Google Acc)
```

---

## 🔒 Privacy & Security Commitment

Tasker OS is architected from the ground up to respect user sovereignty:
- **No Third-Party Tracking**: Zero invasive trackers, ads, or analytics pixels.
- **Anonymized Telemetry**: The audience analytics dashboard strictly records aggregate, anonymized metrics (country/region, device type, browser, feature counters). Personal task titles, diary entries, and user names are **never** collected.
- **Your Keys, Your Data**: AI interactions communicate directly with your chosen provider using your own API keys. Keys are stored locally or in your private Google Drive vault.

---

## 🤝 Contributing & License

Contributions, feedback, and feature requests are warmly welcomed! Feel free to open an issue or submit a pull request.

Released under the **MIT License**. Crafted with precision for high-performing individuals, creators, and teams.

👉 **[Try Tasker OS Live Now](https://p1tasker.vercel.app)**
