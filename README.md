# Tasker OS — Daily Tasks, Diary & Omni-AI Second Brain 🚀

> A unified multi-platform executive productivity suite featuring 100% user-owned Google Drive cloud vault storage, multi-model BYOK AI broker (Google Gemini, Groq Llama 3.3, xAI Grok, OpenAI), Word Document Canvas with inline media, multilingual voice dictation with automatic stutter deduplication, AI error correction, and instant Dark/Light theme switching.

---

## 📚 Documentation & Guides

- 📘 **[Complete User Guide (USAGE.md)](./USAGE.md)**: Step-by-step instructions for getting started, authentication, daily tasks, alarms, Word Document Canvas, voice typing in 15+ languages, AI error correction, and encrypted backups.
- ⚡ **[Technical Architecture & Features (FEATURES.md)](./FEATURES.md)**: Deep technical specifications detailing dual-tier storage resilience, SHA-256 deduplication, multi-model AI routing, AES-256-GCM encryption, speech engineering, and responsive design breakpoints.

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
| **Read Aloud (TTS)** | **Web Speech Synthesis API** | Native text-to-speech audio playback for journal entries. |
| **Audio Alarm Engine** | **Web Audio API** | Synthesizes melodic ascending 15-minute chimes and pulsing 5-minute urgent alarms in the browser. |
| **Cloud Vault & Storage** | **Google Drive API (appData)** | User-owned cloud vault storing tasks, diary, and media in a visible root folder (`📁 Tasker App Data`). |
| **File Deduplication** | **Web Crypto API (SHA-256)** | Client-side cryptographic hashes eliminating duplicate file storage across dates. |
| **Encrypted Backup Vault** | **Web Crypto API (AES-256-GCM)** | Military-grade encrypted file backup with PBKDF2 key derivation (100,000 iterations) and checksum verification. |
| **Authentication** | **Firebase Auth + Google GIS** | Dual-tier authentication supporting Google OAuth with Drive scopes and fallback email accounts. |
| **Mind Maps & Diagrams** | **Mermaid.js 10** | Dynamically renders interactive SVG mind maps, timelines, and flowcharts inside the chatbot. |

---

## 🚀 How to Run the Application

You can launch the application in **two ways**:

### Option 1: Double-Click the Launcher
Simply double-click the included [`start.bat`](file:///c:/Users/mouli/Desktop/Anti%20gravity/p1tasker/start.bat) file on your computer.

### Option 2: Using the Terminal
Run the following commands inside PowerShell:
```powershell
$env:Path = "$env:LOCALAPPDATA\Programs\nodejs;C:\Users\mouli\AppData\Local\Programs\Git\cmd;$env:Path"
npm run dev
```
Open **`http://localhost:5173`** in your browser!

---

## 🌟 Core Highlights

1. **Word Document Flow Diary**:
   - Write sequential paragraphs, embed inline images or PDF documents between paragraphs, and read attachments in a popup Google Drive viewer.
2. **Multilingual Voice Typing with Stutter Deduplication**:
   - Speak in Telugu, Hindi, English, Spanish, or 10+ languages. Repeated words caused by microphone stutter (e.g. "hello hello hello") are automatically cleaned.
3. **AI Error Correction & Sentence Reconstruction (`✨ Fix Errors & Polish`)**:
   - One-click tool that cleans voice glitches, corrects grammar and typos, and writes meaningful, coherent sentences while keeping inline attachments safe.
4. **Dark & Light Mode Switcher**:
   - One-click header toggle (`☀️` / `🌙`) switching between Deep Slate Dark Mode and Crisp Executive Light Mode.
5. **Universal Screen Responsiveness**:
   - Fluid responsive layouts optimized for mobile (375px+), tablet, laptop, desktop, and 4K screens.
6. **Encrypted Cross-Account Backups**:
   - Export and import AES-256-GCM encrypted `.tasker` backup vaults with Merge and Replace modes.
