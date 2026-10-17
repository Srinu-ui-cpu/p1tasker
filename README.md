# Tasker OS — Daily Tasks, Diary & Omni-AI Second Brain

> A unified multi-platform productivity suite built in 2 phases: Responsive Web Application (Phase 1) and Android APK (Phase 2), featuring 100% user-owned Google Drive storage, dynamic multi-provider BYOK AI with zero hardcoded models, and in-browser local WebGPU AI.

---

## 🛠️ Complete Technologies Used

| Category | Technology | Purpose & How It Is Used |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 & TypeScript 5** | High-performance reactive UI with strict type safety across tasks, diary, and AI brokers. |
| **Build & Dev Tooling** | **Vite 5 (Bundler & HMR)** | Sub-second dev server startup and optimized production bundling (under 300KB gzipped). |
| **Styling & Design System** | **Tailwind CSS 3** | Modern executive dark-mode aesthetic with custom indigo/purple accents and sleek scrollbars. |
| **Iconography** | **Lucide React** | Clean, accessible icons for tasks, calendar, mic, alarms, search, and AI indicators. |
| **Date & Calendar Engine** | **Date-fns 3** | Bulletproof date arithmetic, month grid rendering, and Teams-style schedule slot calculation. |
| **Voice Dictation (STT)** | **Web Speech Recognition API** | Real-time speech-to-text voice typing directly into the diary editor (zero server cost/delay). |
| **Read Aloud (TTS)** | **Web Speech Synthesis API** | Native text-to-speech audio playback for diary entries and reflection reading. |
| **Audio Alarm Engine** | **Web Audio API** | Synthesizes melodic ascending 15-minute chimes and pulsing 5-minute urgent alarms in the browser. |
| **OS Push Notifications** | **Web Notification API** | Delivers native Windows/macOS desktop notification center banners for scheduled tasks. |
| **Mind Maps & Diagrams** | **Mermaid.js 10** | Dynamically renders interactive SVG mind maps, timelines, and flowcharts inside the chatbot. |
| **Gamified Celebrations** | **Canvas-Confetti** | Rewarding confetti animations upon completing all daily tasks or checklists. |
| **Cloud Vault & Storage** | **Google Drive API (appData)** | User-owned cloud sync storing tasks, diary, and media in a dedicated app folder (`📁 Tasker App Data`). |
| **File Deduplication** | **Web Crypto API (SHA-256)** | Computes client-side cryptographic hashes to eliminate duplicate uploads and update latest files across dates. |
| **AI Multi-Provider BYOK** | **Dynamic REST Models Engine** | Live query to `/v1/models` on Groq, Gemini, and OpenAI (no hardcoded models) + auto rate-limit (429) fallback. |
| **Universal Custom AI** | **OpenAI-Compatible Standard** | Flexible custom model text box supporting xAI Grok, DeepSeek, Claude, OpenRouter, or local proxies. |
| **Local On-Device AI** | **WebGPU & IndexedDB (WebLLM)** | Pre-flight storage & RAM check with an animated non-blocking background installer for 100% offline AI. |
| **Generative Visuals** | **Pollinations AI API** | Instant zero-key AI image generation embedded directly into diary entries and chat responses. |

---

## 🚀 How to Run the Application

You can launch the application in **two ways**:

### Option 1: Double-Click the Launcher
Simply double-click the included [`start.bat`](file:///c:/Users/mouli/Desktop/Anti%20gravity/p1tasker/start.bat) file on your computer.

### Option 2: Using the Terminal
Run the following commands inside PowerShell:
```powershell
$env:Path = "$env:LOCALAPPDATA\Programs\nodejs;$env:Path"
npm run dev
```
Open **`http://localhost:5173`** in your browser!

---

## 🌟 Core Features Guide

### 1. 📅 Calendar & Day Workspace (`/day/YYYY-MM-DD`)
* Click any date in the **Calendar** tab to immediately enter that date's workspace.
* Dates feature visual indicators:
  - 📔 **Purple Bookmark**: Indicates a written diary entry exists.
  - 🔴 **Red Dot**: Indicates urgent/high priority tasks.
  - **Task Count Badge**: Shows completed vs pending tasks.

### 2. 📔 Daily Journal with Real-Time Voice Dictation
* Inside the Day Workspace or top navigation, click **"📔 Write Day Diary"**.
* Click **"🎙️ Voice Dictate"** and speak into your microphone; your spoken words will paste into the editor in real time!
* Click **"Attach File"**: upload receipts, whiteboard pictures, or documents. The engine calculates a **SHA-256 checksum**; duplicate files are instantly deduplicated to save cloud storage.
* Use the **AI Toolbar** to:
  - **Summarize**: Generate 3-bullet takeaway summary.
  - **Extract Tasks**: Convert rambling thoughts into scheduled to-dos.
  - **Translate**: Translate diary entries into multiple languages.

### 3. ⏱️ Teams-Style Schedule Grid with 15m & 5m Alarms
* Switch to the **Scheduler** tab to see a visual day timeline (08:00 to 20:00).
* Schedule meetings or focus blocks with custom start and end times.
* When alarms are active:
  - **15 Minutes Prior**: Gentle 3-tone chime + OS desktop notification banner.
  - **5 Minutes Prior**: Urgent 4-tone alarm + screen takeover modal with **[Snooze 5 Min]** and **[Dismiss]**.

### 4. 🔍 Universal Global Search (`Ctrl + K`)
* Press `Ctrl + K` (or `Cmd + K`) anywhere in the app to open the live search modal.
* Searches across tasks, diary entries, uploaded files (by name and SHA hash), dates, and tags.
* Clicking any result deep-links directly to that date!

### 5. 🤖 Omni-AI Knowledge Chatbot & Generative Tools
* Click the **AI Brain** button in the top navbar.
* Has full cross-date context:
  - Ask: *"When did I work on the transaction tables in my project?"*
  - The chatbot inspects your historical data and replies with **clickable date pills `[YYYY-MM-DD]`**!
* Type: *"Create a mind map for my project"* &rarr; renders an interactive **Mermaid mind map**.
* Type: *"Generate an image of a cozy study desk"* &rarr; generates and embeds a concept visual!

### 6. ⚙️ Dynamic BYOK AI & Universal Custom Provider (Grok / DeepSeek)
* Open **Settings** (`⚙️` icon in navbar):
  - **Groq, Gemini, OpenAI**: Paste your API key and click **"Scan Live Models"**. The app queries the provider's live `/v1/models` endpoint dynamically—never hardcoded!
  - **Custom Provider**: Enter any provider (e.g. `xAI Grok`), Base URL (`https://api.x.ai/v1`), Model Name (`grok-2-latest`), and Key, then click **"⚡ Test Connection"**.
  - **Local AI**: Run pre-flight checks (Storage, RAM, WebGPU) and watch the animated background installer download offline model weights.

---

## 📱 Phase 2: Android APK Compilation

In Phase 2, this exact frontend can be compiled directly into a native Android `.apk` using Capacitor:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init Tasker com.tasker.app --web-dir dist
npx cap add android
npx cap open android
```
This produces an installable `Tasker.apk` with native Android alarms and background push notifications!
