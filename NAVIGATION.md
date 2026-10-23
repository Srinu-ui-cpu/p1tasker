# 🗺️ Tasker OS — Interactive Navigation & Visual UI Guide

> A comprehensive navigational blueprint and visual walkthrough of **Tasker OS**. Explore all application views, navigation controls, modal workflows, quick actions, and keyboard shortcuts designed for maximum executive efficiency.

🚀 **Explore the Live Web App**: **[https://p1tasker.vercel.app](https://p1tasker.vercel.app)**

---

## 🧭 Visual Sitemap Overview

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

## 🖥️ Top Navigation Bar (Navbar)

The top navigation bar is persistent across all views, providing rapid switching, state indicators, and global actions:

| Component | Location | Description |
| :--- | :--- | :--- |
| **Brand Logo & Title** | Left | Click anytime to quickly jump back to the **Calendar View** or default to today's date. |
| **Date Navigator** | Center-Left | Displays currently selected date (`YYYY-MM-DD`), with `◀ Prev` and `Next ▶` day buttons, plus a quick **"Today"** shortcut badge. |
| **View Tabs (6 Modes)** | Center | Switch effortlessly between: `Calendar`, `Tasks`, `Scheduler`, `Diary`, `Backup`, and `Analytics`. |
| **Theme Toggle (☀️ / 🌙)** | Right | Instant switch between **Deep Slate Dark Mode** and **Crisp Executive Light Mode** with zero page reload. |
| **Global Search (`Ctrl+K`)** | Right | Opens universal search across all tasks, diary notes, and file attachments with instant fuzzy matching. |
| **Omni-AI Chatbot (`✨`)** | Right | Launches the slide-out AI assistant with full cross-date context, Mermaid mind maps, and clickable date pills. |
| **Google Profile / Settings (`⚙️`)** | Right | Shows your authenticated Google account avatar or login prompt, plus settings for custom AI keys and Drive sync. |

---

## 📱 Detailed View-by-View Walkthrough

---

### 1. 📅 Calendar View (`activeTab === 'calendar'`)
*The high-level command center for your month and schedule.*

- **Monthly Grid**: Clean, high-contrast calendar grid showing all days of the current month.
- **Task Density Badges**: Visual indicator dots on each day representing scheduled tasks:
  - 🔴 High Priority / Urgent
  - 🟡 Medium Priority
  - 🟢 Low Priority
  - ⚪ Completed
- **Mood Indicators**: Displays daily reflections and mood emojis logged from your daily diary.
- **One-Click Day Selection**: Click any date cell to select that date and inspect all daily agendas or jump straight to writing.
- **Month Navigation**: Jump across months with `◀` and `▶` chevron buttons or click the header to jump back to current day.

---

### 2. 📋 Day Tasks Workspace (`activeTab === 'tasks'`)
*Granular priority execution, project organization, and file management.*

- **Task Entry Drawer**:
  - Clean title input with automatic JSON/fence sanitization (no raw `{...}` or tags displayed).
  - Optional detailed description, estimated duration, and due time.
  - Priority selector: **High**, **Medium**, **Low**.
  - Project Assignment: Assign tasks to *Work*, *Personal*, *Finance*, or *Health*.
- **Task List & Interactive Checkboxes**:
  - One-click task completion checkbox with strikethrough animation.
  - Color-coded priority badges and time badges.
- **Inline Media Attachment Chips**:
  - Attached documents, images, and videos appear as compact, stylish preview chips under tasks.
  - Clicking any attachment chip opens the **Drive Media Viewer Modal** instantly with inline popup playback.
- **Task Filtering & Sorting**: Filter tasks by status (All, Active, Completed) or sort by priority and time.

---

### 3. ⚡ Eisenhower Scheduler Matrix (`activeTab === 'scheduler'`)
*Strategic time-management engine based on urgency and importance.*

- **Four Dynamic Quadrants**:
  1. **Do First (Urgent & Important)**: High-stakes immediate priorities.
  2. **Schedule (Important, Not Urgent)**: Strategic long-term goals and planning.
  3. **Delegate (Urgent, Not Important)**: Quick operational actions.
  4. **Don't Do (Neither Urgent nor Important)**: Low-value distractions.
- **Melodic Audio Alarm Integration**:
  - Automatically rings ascending Web Audio harmonic chimes at 15-minute and 5-minute pre-event windows.
  - Interactive alarm preview buttons directly inside each quadrant.

---

### 4. 📖 Word Document Canvas Diary (`activeTab === 'diary'`)
*A flowing, word-processor journaling and reflection environment.*

- **Document Formatting Toolbar**:
  - Clean toolbar with **Bold (`B`)**, **Italic (`I`)**, **Heading (`H`)**, and **Bullet List (`•`)** controls.
  - **Mood Rating Selector**: Log daily emotional state (Great, Good, Neutral, Challenging).
- **Interactive Paragraph Block Flow**:
  - Reads like a professional Word document: cleanly formatted paragraphs with comfortable line heights.
  - **Inline Media Placement**: Attach images, videos, spreadsheets, or documents directly beneath any paragraph.
  - **Small Clickable Preview Cards**: Attachments appear as elegant preview thumbnails with filename, size, and category badge. Clicking opens the popup media viewer.
- **🎙️ Multilingual Voice Typing & AI Stutter Deduplication**:
  - Speak in English, Telugu, Hindi, Spanish, or 10+ global languages.
  - Built-in real-time stutter deduplicator removes repeated words caused by audio feedback (e.g. cleans *"meeting meeting meeting tomorrow"* into *"meeting tomorrow"*).
- **✨ Fix Errors & Polish (AI Sentence Reconstruction)**:
  - One-click button that fixes typos, grammar glitches, punctuation, and voice formatting without altering your inline attachments.
- **🌐 AI Translate & Summarize**:
  - Instantly translate your daily reflection into 15+ world languages.
  - Generate executive bullet summaries for rapid end-of-day reviews.
- **💬 Diary AI Companion**:
  - Dedicated interactive conversation panel to chat specifically about today's thoughts, questions, or ideas.

---

### 5. 🔒 Cloud Vault, Backup & Sync (`activeTab === 'backup'`)
*Military-grade data protection, zero-lock-in export, and Google Drive synchronizer.*

- **Google Drive Real-Time Cloud Vault**:
  - Direct connection to your personal Google Drive storage.
  - **Visible Root Folder (`📁 Tasker App Data`)**: Dedicated public folder housing all your uploaded media, documents, and videos organized into 8 typed subfolders.
  - **Hidden AppData Vault**: Protects your private diary texts and task history inside Google's restricted `appDataFolder` vault.
  - **Perpetual Dual-Token Rotation**: Seamless background standby token refresh prevents unexpected session disconnects.
- **Military-Grade Encrypted Backup (AES-256-GCM)**:
  - Set a custom passphrase to encrypt your entire database with PBKDF2 (100,000 iterations).
  - Exports a portable `.tasker` backup file.
- **Safe Import & Restore**:
  - Choose between **Merge Mode** (safely combines incoming data with existing entries) or **Replace Mode** (clean restore).
  - SHA-256 checksum verification guards against corrupted or tampered files.

---

### 6. 📊 Audience & Regional Analytics Dashboard (`activeTab === 'analytics'`)
*Real-time executive telemetry for website visitors, geography, and feature metrics.*

- **KPI Metric Banner**:
  - **Total Visits**: All page sessions recorded.
  - **Unique Visitors**: Distinct anonymous user IDs.
  - **Active Now**: Live active browser sessions.
  - **Avg Duration**: Mean engagement time in minutes and seconds.
- **Interactive Geographic Distribution Table**:
  - Detected visitor country, state/region, city, and timezone.
  - Country flag emoji (e.g. 🇮🇳 India, 🇺🇸 United States, 🇬🇧 United Kingdom, 🇩🇪 Germany).
  - Visual animated percentage progress bars showing geographic traffic share.
- **Current Live Session Inspector**:
  - Inspects your live IP geolocation, device type (Desktop, Mobile, Tablet), browser, operating system, and referrer source.
- **Technology & Platform Breakdown**:
  - Real-time distribution graphs for Operating Systems (Windows, macOS, Linux, Android, iOS) and Browsers (Chrome, Firefox, Edge, Safari).
- **Feature Engagement Metrics**:
  - Live counters for Tasks Created, Tasks Completed, Diary Notes Written, Files Uploaded, AI Queries Executed, and Voice Dictation Minutes.
- **Live Activity Stream**:
  - Real-time streaming log of user actions across the app (task creations, diary updates, cloud syncs).
- **One-Click Export**:
  - **Export CSV**: Download regional visitor spreadsheets for external marketing reports.
  - **Export JSON**: Download comprehensive telemetry payloads for analytics pipelines.

---

## 🪟 Global Modals & Specialized Drawers

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GLOBAL MODALS & DRAWERS                         │
├──────────────────────┬──────────────────────┬──────────────────────────┤
│ 🤖 Omni-AI Chat      │ 🔍 Global Search     │ 🎬 Drive Media Viewer    │
│ Slide-out drawer     │ Full-text search     │ In-app popup playback    │
│ with interactive     │ across tasks, diary, │ for videos, PDFs, images │
│ mindmap rendering    │ and file registries  │ and spreadsheets         │
├──────────────────────┼──────────────────────┼──────────────────────────┤
│ ⚙️ System Settings   │ 🔔 Melodic Alarm     │ 🔑 Google Auth Modal     │
│ BYOK API keys,       │ Ascending Web Audio  │ Single-account Google    │
│ accounts, themes     │ chime with snooze    │ GIS & Drive connection   │
└──────────────────────┴──────────────────────┴──────────────────────────┘
```

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Open **Global Search Modal** | Anywhere in App |
| `Ctrl + D` / `Cmd + D` | Quick jump to **Today's Diary** | Anywhere in App |
| `Ctrl + Enter` | Save Task or Submit AI Chat Message | Task Form / AI Chat |
| `Esc` | Close any active modal, viewer, or drawer | Anywhere in App |
| `◀` / `▶` (Left / Right) | Step back or forward one day | Calendar & Day Views |
| `T` | Jump to **Today's Date** | Calendar & Day Views |

---

## 🌐 Get Started Today

Ready to experience Tasker OS?

👉 **[Launch Tasker OS Live](https://p1tasker.vercel.app)**  
👉 **[Read the User Guide (USAGE.md)](./USAGE.md)**  
👉 **[Read the Technical Architecture (FEATURES.md)](./FEATURES.md)**
