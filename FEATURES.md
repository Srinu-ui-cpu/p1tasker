# Tasker OS — Technical Architecture & Features Specification ⚡

This document provides a deep technical architectural overview of **Tasker OS**, highlighting its data resilience, multi-model AI routing, cryptographic security, speech engineering, and responsive user experience design.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |         Tasker OS Client UI           |
                      |   React 18 + Vite + Tailwind CSS       |
                      +---------------------------------------+
                                          |
            +-----------------------------+-----------------------------+
            |                             |                             |
            v                             v                             v
+-----------------------+     +-----------------------+     +-----------------------+
|    StorageService     |     |   AIBrokerService     |     |    SpeechService      |
|  - Dual-tier Engine   |     |  - Multi-Model Router |     |  - Continuous Dictate |
|  - SHA-256 Dedup      |     |  - Groq Llama 3.3 70B |     |  - Stutter Dedup      |
|  - Indexed Registry   |     |  - Gemini 2.5 Flash   |     |  - AI Whisper Large   |
|  - AES-256-GCM Vault  |     |  - xAI Grok / OpenAI  |     |  - Multilingual TTS   |
+-----------------------+     +-----------------------+     +-----------------------+
            |                             |
            v                             v
+-----------------------+     +-----------------------+
|  Local Storage Cache  |     | External AI Gateways  |
|  - Zero Network Delay |     |  - BYOK Direct HTTP   |
+-----------------------+     +-----------------------+
            |
            v (Auto-Sync)
+-----------------------+
|   Google Drive API    |
| - Tasker App Data     |
| - Visible User Folder |
+-----------------------+
```

---

## 1. Dual-Tier Storage & Google Drive Cloud Vault

### 1.1 Resilient Storage Hierarchy
- **Tier 1 (Fast Local Storage)**: Instant sub-millisecond read/write access to tasks, calendar markers, and diary entries stored client-side in browser storage.
- **Tier 2 (Google Drive Cloud Vault)**: Seamless synchronization with the user's personal Google Drive account.
  - Automatically creates and manages a visible root folder named **`Tasker App Data`** (`parents: ['root']`).
  - Stores journal entries as structured JSON and file attachments in their native MIME formats.
  - Generates direct Google Drive URLs for instant cloud inspection.
  - **Graceful Offline Degrade**: When network access is unavailable or when the user authenticates via email only, all state is safely cached locally with automated retry triggers upon reconnection.

### 1.2 Cryptographic File Deduplication (SHA-256)
- Every file attachment (image, document, PDF, audio) passes through a Web Cryptography SHA-256 hash pipeline before storage.
- If an identical file is uploaded across multiple dates or tasks, Tasker OS references the existing hash and metadata without duplicating storage bytes.
- When an attachment is deleted from a date, Tasker OS verifies whether other entries reference the same hash before safely purging orphaned files.

---

## 2. Omni-AI Broker Service & Multi-Model Engine

Tasker OS implements a flexible, zero-config AI broker architecture supporting multiple world-class frontier models:

### 2.1 Multi-Provider Routing Matrix
| Provider | Default Model | Capabilities | Use Case |
|---|---|---|---|
| **Groq Cloud** | `llama-3.3-70b-versatile` | Ultra-fast inference (~250 tokens/sec), zero-latency chat | Live chat, sentence rewriting, instant task extraction |
| **Google Gemini** | `gemini-2.5-flash` | Multimodal comprehension, long context analysis | Complex document review, deep sentiment reflection |
| **xAI Grok** | `grok-beta` | Direct, uncensored analytical reasoning | Architectural planning, critical inquiry |
| **OpenAI** | `gpt-4o` | Frontier reasoning and structured output | Complex multi-turn workflow logic |

### 2.2 Intelligent Model Auto-Failover
- If a provider encounters a rate limit (HTTP 429) or temporary API outage, `AIBrokerService` automatically fails over to the next configured model in its discovered candidate pool.
- If all cloud API keys are absent, the broker invokes the **Built-in Local Smart Engine** for offline grammar correction, typo repair, and cognitive inquiry simulation without throwing errors.

---

## 3. Speech Engineering & Voice Intelligence

### 3.1 Continuous Speech Dictation (`SpeechService.startDictation`)
- Uses browser-native Web Speech Recognition API with `continuous: true` and `interimResults: true`.
- **Speech Stutter Deduplication Engine**: Employs real-time regex tokenizers supporting Latin (`[a-zA-Z]`), Telugu (`[\u0C00-\u0C7F]`), and Devanagari (`[\u0900-\u097F]`) Unicode ranges to detect and eliminate microphone stutter or duplicate adjacent words (e.g., "hello hello hello" -> "hello").
- Prevents continuous-result re-appending by anchoring against session-start base text.

### 3.2 AI Whisper Multilingual Audio Recording
- Records high-fidelity voice notes using browser `MediaRecorder` (`audio/webm`).
- Sends audio stream to **Groq Whisper Large v3** or OpenAI Whisper for precise, timestamped multilingual transcription.
- Automatically executes `SpeechService.formatVoiceIntoDiary` to translate unstructured spoken stream-of-consciousness into an organized, reflective daily journal entry with bullet takeaways and sentiment mood classification.

---

## 4. Word Document Canvas & Block Parser

### 4.1 Hybrid Document-Block Engine (`WordDocumentCanvas.tsx`)
- Renders journals as clean, sequential paragraphs separated by inline attachment cards.
- Supports inline insertion of media blocks between any two paragraphs via `insertAfterIndex`.
- Uses a deterministic regular expression parser (`parseDocumentContent`):
  - Matches `{{attachment:<id>}}`, `{{file:<id>}}`, and standard Markdown image syntax `![alt](attachment:<id>)`.
  - Converts mixed markdown text into a sequence of typed blocks (`{ type: 'text' }` and `{ type: 'attachment' }`).
  - Serializes edits back into standard Markdown, guaranteeing that user documents can be exported, backed up, and read in any external markdown editor.

### 4.2 In-Place Block Editing & Media Viewer
- Each paragraph block features in-place inline editing with instant keyboard shortcuts (`Enter` / `Escape`).
- Attached images and documents open in a modal viewer with Google Drive integration, full-screen zoom, and direct download links.

---

## 5. Security & Cryptographic Vault Architecture

### 5.1 AES-256-GCM Backup Encryption
- User backups are protected using **AES-GCM (Galois/Counter Mode)** with 256-bit cryptographic keys.
- Key derivation utilizes **PBKDF2** with 100,000 iterations of SHA-256 and a random 16-byte salt per export.
- Generates a unique 12-byte initialization vector (IV) for every ciphertext payload.
- Computes a cryptographic SHA-256 checksum across the raw data to guarantee data integrity and detect corruption or tampering before decryption.
- Restores support **Merge Mode** (retaining existing data and adding non-conflicting items) or **Replace Mode** (clean restore).

### 5.2 Zero Secrets Leakage Principle
- All client-side components adhere to strict security hygiene:
  - Zero hardcoded Firebase API keys or sensitive authorization tokens in UI views.
  - Google OAuth client ID configured with least-privilege scopes (`https://www.googleapis.com/auth/drive.file`).
  - Redundant backup cards removed from general settings to avoid accidental key exposure.

---

## 6. Theme Engine & Responsive Design System

### 6.1 ThemeService
- Fast, synchronous theme initialization preventing UI flash (FOUC).
- Persists user preference (`'dark'` vs `'light'`) in local storage.
- Implements observer subscription pattern notifying all navigation elements upon theme change.
- CSS layers provide high-contrast styling:
  - **Dark Mode**: Neutral slate backgrounds (`#020617`, `#0f172a`), muted border lines (`#1e293b`), and neon-accented badges.
  - **Light Mode**: Crisp, executive paper-white backgrounds (`#f8fafc`, `#ffffff`), subtle borders (`#e2e8f0`), and high-contrast charcoal text (`#0f172a`).

### 6.2 Responsive Multi-Device Breakpoints
| Viewport | Target Device | Layout Behavior |
|---|---|---|
| **< 640px** | Mobile Phones (iPhone, Pixel, Galaxy) | Horizontal scrolling tabs, single-column task lists, full-width modal sheets |
| **640px - 1024px** | Tablets & Foldables (iPad, Galaxy Tab) | Dual-column dashboards, responsive calendar cells, adaptive grid thumbnails |
| **1024px - 1440px** | Laptops & Desktops | Multi-column Eisenhower matrix, full Word canvas, persistent toolbars |
| **> 1440px** | Ultrawide & 4K Displays | Max-width content constraint (`max-w-7xl`), centered sheet canvas, generous reading margins |
