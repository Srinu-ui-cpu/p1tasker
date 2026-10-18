# Tasker OS — Complete User Guide & Manual 📘

Welcome to **Tasker OS**, an executive-tier, privacy-first productivity suite integrating **Daily Tasks**, **Eisenhower Scheduling**, **Rich Word Document Journaling**, **Multilingual Voice Dictation**, and a multi-model **Omni-AI Brain** (Gemini, Groq Llama 3.3, xAI Grok, OpenAI).

---

## 1. Quick Start & Authentication

Tasker OS offers a seamless, resilient dual-tier authentication architecture:

### Option A: Google Authentication with Cloud Drive Vault (Recommended)
1. Launch Tasker OS and click **Get Started** or **Sign In**.
2. Select **Sign in with Google**.
3. **What happens behind the scenes:**
   - Your account is authenticated securely via Firebase Auth & Google Identity Services.
   - An isolated, visible folder named **`Tasker App Data`** is automatically linked in your Google Drive root directory.
   - All tasks, diary entries, inline images, and documents are automatically synchronized between your browser and your private Google Drive vault.
   - You can access your files directly in Google Drive at any time.

### Option B: Email Sign-In (Local Storage Fallback)
1. If you sign in via email/password, Tasker OS automatically initializes **browser local storage**.
2. A gentle, dismissible status banner will alert you:  
   *⚠️ Temporary Browser Storage: Data is stored locally in your browser. Attach a Google Account to enable automatic Google Drive cloud backup.*
3. You can click **Connect Drive** in the top navigation bar at any time to link your Google account with zero data loss.

---

## 2. Navigating the Workspace

The sticky navigation bar at the top provides instant access to all core modules:

- **Calendar (Default View)**: Monthly visual overview showing daily task completion dots, active moods, and scheduled items. Click any date cell to jump into that day's workspace.
- **Day Tasks**: Focused daily task manager with priorities (High, Medium, Low), subtask checklists, and custom alarms.
- **Scheduler**: Eisenhower Matrix (Urgent vs. Important) and visual time-block scheduler for deep work planning.
- **Diary**: Executive Word Document Canvas and full Markdown journal with multilingual voice recording and inline media.
- **Backup & Sync**: Cryptographic AES-256-GCM vault export, cross-account restore, and Google Drive status.
- **Search (Ctrl + K)**: Universal search engine scanning tasks, diary text, and attached documents across your entire history.
- **Theme Switcher (☀️ / 🌙)**: Instant toggle between Deep Slate Dark Mode and Crisp Executive Light Mode.
- **Omni-AI Brain**: Slide-out intelligent assistant with multi-model routing, document analysis, and mind-map generation.

---

## 3. Daily Tasks & Alarms

### Creating & Managing Tasks
1. Select the **Day Tasks** tab or click any date on the **Calendar**.
2. Type your task title in the input box and select priority:
   - **🔴 High**: Critical deadlines or high-impact actions.
   - **🟡 Medium**: Standard operational tasks.
   - **🟢 Low**: Casual to-dos or low-urgency follow-ups.
3. Click **Add Task** (or press Enter).
4. **Subtasks**: Click on a task to expand its checklist. Add granular sub-items and track progress with real-time percentage indicators.
5. **Alarms**: Click the bell icon (`🔔`) to set a scheduled notification. Tasker OS features an active background scheduler that alerts you when your alarm window arrives.

---

## 4. Word Document Canvas Diary & Media Embedding

Tasker OS provides a fluid **Word Document Flow** experience:

### Writing & Structuring
- **Standard Sheet Mode**: Write sequential paragraphs with natural typography.
- **Edit Existing Paragraphs**: Hover over any paragraph and click **Edit** (`✏️`) to modify text directly in place, or click **Save Paragraph** (`✓`).

### Inserting Photos & Documents Inline
You can insert media at the cursor, between paragraphs, or at the end of the sheet:
1. Click **+ Insert Image** (`🖼️`) or **+ Attach File** (`📄`) in the toolbar.
2. Select your image (PNG, JPEG, WebP) or document (PDF, TXT, DOCX, ZIP).
3. The file is uploaded, hashed via SHA-256 for instant deduplication, and placed cleanly as an inline card between your paragraphs.
4. **Ordering**: Media blocks respect your document flow. You can write Paragraph A, insert an architecture diagram, write Paragraph B, insert a spreadsheet report, and conclude with Paragraph C.

### Viewing & Deleting Files
- Click **View** or the card itself to open the **Drive Media Viewer Popup**. You can preview images, read documents, download them locally, or open the direct link in Google Drive.
- Click the **Delete** button (`✕`) on any card to remove it from your document and cloud vault.

---

## 5. Voice Dictation & Multilingual Voice-to-Diary

Tasker OS includes advanced speech intelligence supporting over 15 languages, including **Telugu (తెలుగు IN)**, **Hindi (हिन्दी IN)**, **English (US/UK/IN)**, **Spanish**, **French**, **German**, **Japanese**, and more.

### Real-Time Voice Dictation (`🎙️ Dictate`)
1. Select your spoken language in the dropdown selector (e.g. `Telugu (తెలుగు IN)` or `English (US)`).
2. Click **Dictate**.
3. Speak naturally into your microphone. Words are transcribed live into your journal.
4. Our speech engine automatically deduplicates microphone stutter, so repeated words (e.g. "hello hello") are eliminated in real time.
5. Click **Listening...** to pause or finish dictation.

### AI Multilingual Voice-to-Diary (`✨ AI Voice-to-Diary`)
1. Click **AI Voice-to-Diary**.
2. Speak your unscripted thoughts, feelings, meeting summaries, or reflections in any language or mixed languages (e.g., Telugu mixed with English).
3. Click **Stop & Write Diary**.
4. Our AI Whisper & Biographer engine transcribes the audio, analyzes your sentiment, determines your daily mood, and writes a structured daily reflection complete with takeaways!

---

## 6. AI Error Correction & Sentence Reconstruction (`✨ Fix Errors & Polish`)

If you have voice transcripts with microphone stutters, grammar slips, typos, or fragmented run-on thoughts:

1. Click the **✨ Fix Errors & Polish** button in the top toolbar or bottom bar.
2. The AI Error Correction engine:
   - **Removes Voice Duplicates**: Detects and eliminates repeated words or stuttering caused by microphone pauses (e.g., "hello hello hello" -> "hello", "today today I" -> "Today I").
   - **Reconstructs Coherent Sentences**: Rephrases fragmented spoken thoughts into eloquent, meaningful, and well-punctuated sentences.
   - **Fixes Typos & Grammar**: Corrects punctuation, capitalization, subject-verb agreement, and spelling.
   - **Guarantees Attachment Safety**: Strictly preserves all inline media tags (`{{attachment:...}}` and `![...](attachment:...)`) without altering their IDs or positions.
3. If working offline without an AI key, Tasker's **Built-in Local Proofreader Engine** instantly executes rule-based deduplication, typo repair, and capitalization.

---

## 7. Dark and Light Mode Theme Switcher

Customize your workspace environment for day or night:

- Locate the **Theme Toggle** button (`☀️` / `🌙`) in the top right navigation bar next to Settings.
- **Dark Mode (`🌙`)**: Deep space slate aesthetic with high-contrast pastel accents, ideal for late-night reflection and eye comfort.
- **Light Mode (`☀️`)**: Crisp, executive paper-white aesthetic with clean borders and contrast-optimized typography, ideal for daytime productivity.
- Your theme selection is automatically persisted in local storage and applied across all views, modals, and canvas documents.

---

## 8. Omni-AI Brain & Multi-Model Routing

Click the **AI Brain** button (`✨`) in the top navigation bar to summon the AI Drawer:

### Supported AI Providers (Zero-Config + BYOK)
- **Google Gemini**: Gemini 2.5 Flash / Pro for rapid reasoning and multimodal insights.
- **Groq (Whisper + Llama 3.3 70B)**: Ultra-low latency voice transcription and versatile conversational speed.
- **xAI Grok**: Sharp, direct intelligence via OpenAI-compatible endpoints.
- **OpenAI**: GPT-4o and GPT-4o-mini for comprehensive text synthesis.

### AI Superpowers
- **Semantic Text Analysis**: Analyze long-form diary entries for underlying cognitive sentiment and key takeaways.
- **Question Comprehension**: Understands whether your inquiry is comparative, procedural, or informational and formats answers accordingly.
- **Auto-Extract Tasks**: Click **Extract Tasks** in the diary toolbar to automatically parse action items from your journal and add them to your daily checklist.
- **Interactive Mind Maps**: Request brainstorming or architectural planning to generate visual Mermaid diagrams and flowcharts directly in chat.

---

## 9. Encrypted Backups & Cross-Account Vault Sync

Under the **Backup & Sync** tab:

1. **Export Encrypted Backup**:
   - Enter your personal security passphrase.
   - Tasker OS encrypts all tasks, diary entries, and file registries using **military-grade AES-256-GCM** with PBKDF2 key derivation and a SHA-256 checksum.
   - Downloads a `.tasker` backup file.
2. **Restore Encrypted Backup**:
   - Upload any valid `.tasker` backup file and enter the decryption password.
   - Choose **Merge** (combines backup items with current data) or **Replace** (clean slate restore).
3. **Multi-Account Switching**:
   - Link multiple Google accounts (e.g. Personal and Work).
   - Easily switch active storage destination or sign out with a single click.

---

## 10. Multi-Device & Mobile Tips

Tasker OS is engineered with a fully responsive fluid design system:
- **Mobile (375px - 640px)**: The navigation bar supports smooth horizontal swiping across tabs. Modals adapt to 95% viewport width with touch-friendly buttons.
- **Tablet (768px - 1024px)**: Calendar and Scheduler automatically shift to responsive 2-column and multi-grid layouts.
- **Desktop & Ultrawide (1280px - 4K)**: Full Word Document Canvas and multi-panel dashboards render with optimal reading width and typography.
- **PWA Installation**: Open Tasker OS in Chrome, Safari, or Edge and select **Add to Home Screen** or **Install App** for a native app experience on iOS, Android, macOS, and Windows.
