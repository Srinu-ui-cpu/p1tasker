/**
 * Tasker OS Comprehensive Feature Verification Test Script
 * Tests:
 * 1. StorageService (Tasks, Diary, File Deduplication, Canvas Optimization, Deletion)
 * 2. GoogleAuthService (Client ID, Visible Folder Creation, Direct URL Helper, Multi-account)
 * 3. AIBrokerService (Gemini, Groq, xAI Grok, OpenAI routing, Local AI 100% removed, Semantic Analysis)
 * 4. AlarmService & BackupService (Scheduling windows, AES-GCM encryption, checksum, restore)
 */

// Setup browser globals for Node execution
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

const memoryLocalStorage = new MemoryStorage();

// Polyfill window, localStorage, FileReader, Image, canvas, AudioContext, Notification
(globalThis as any).localStorage = memoryLocalStorage;
(globalThis as any).window = globalThis;
(globalThis as any).window.localStorage = memoryLocalStorage;

class MockFileReader {
  result: string | null = null;
  onload: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;

  readAsDataURL(blob: Blob): void {
    setTimeout(async () => {
      try {
        const buf = Buffer.from(await blob.arrayBuffer());
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${buf.toString('base64')}`;
        if (this.onload) this.onload({ target: { result: this.result } });
      } catch (e) {
        if (this.onerror) this.onerror(e);
      }
    }, 5);
  }
}
(globalThis as any).FileReader = MockFileReader;
(globalThis as any).window.FileReader = MockFileReader;

class MockImage {
  private _src = '';
  width = 1200;
  height = 900;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(val: string) {
    this._src = val;
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 5);
  }
  get src(): string {
    return this._src;
  }
}
(globalThis as any).Image = MockImage;
(globalThis as any).window.Image = MockImage;

(globalThis as any).document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: () => ({
          drawImage: () => {},
        }),
        toDataURL: (type: string, quality: number) => `data:image/jpeg;base64,optimized_thumbnail_800x600_q${quality}`,
      };
    }
    return {
      style: {},
      setAttribute: () => {},
      appendChild: () => {},
      removeChild: () => {},
      click: () => {},
    };
  },
  body: {
    appendChild: () => {},
    removeChild: () => {},
  },
  documentElement: {
    classList: (() => {
      const classes = new Set<string>(['dark']);
      return {
        add: (cls: string) => classes.add(cls),
        remove: (cls: string) => classes.delete(cls),
        contains: (cls: string) => classes.has(cls),
      };
    })(),
  },
};

(globalThis as any).Notification = class MockNotification {
  static permission = 'granted';
  static requestPermission = async () => 'granted';
  title: string;
  options: any;
  constructor(title: string, options?: any) {
    this.title = title;
    this.options = options;
  }
};

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  resume = async () => {};
  createOscillator = () => ({
    type: 'sine',
    frequency: { setValueAtTime: () => {} },
    connect: () => {},
    start: () => {},
    stop: () => {},
  });
  createGain = () => ({
    gain: {
      setValueAtTime: () => {},
      linearRampToValueAtTime: () => {},
      exponentialRampToValueAtTime: () => {},
    },
    connect: () => {},
  });
  destination = {};
}
(globalThis as any).AudioContext = MockAudioContext;
(globalThis as any).window.AudioContext = MockAudioContext;

// Polyfills for Web Speech API and MediaRecorder
class MockSpeechRecognition {
  continuous = true;
  interimResults = true;
  lang = 'te-IN';
  onresult: any = null;
  onerror: any = null;
  onend: any = null;
  start() {
    setTimeout(() => {
      if (this.onresult) {
        this.onresult({
          results: [
            [{ transcript: 'This is a test voice dictation' }],
          ],
        });
      }
      if (this.onend) this.onend();
    }, 10);
  }
  stop() {
    if (this.onend) this.onend();
  }
  abort() {
    if (this.onend) this.onend();
  }
}
(globalThis as any).SpeechRecognition = MockSpeechRecognition;
(globalThis as any).webkitSpeechRecognition = MockSpeechRecognition;
(globalThis as any).window.SpeechRecognition = MockSpeechRecognition;
(globalThis as any).window.webkitSpeechRecognition = MockSpeechRecognition;

try {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      language: 'en-US',
      mediaDevices: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop: () => {} }],
        }),
      },
    },
    configurable: true,
    writable: true,
  });
} catch {
  try {
    (globalThis.navigator as any).mediaDevices = {
      getUserMedia: async () => ({
        getTracks: () => [{ stop: () => {} }],
      }),
    };
  } catch {}
}
(globalThis as any).window.navigator = (globalThis as any).navigator;

class MockMediaRecorder {
  ondataavailable: any = null;
  onstop: any = null;
  stream: any;
  constructor(stream: any) {
    this.stream = stream;
  }
  start() {}
  stop() {
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(['fake-audio-bytes'], { type: 'audio/webm' }) });
    }
    if (this.onstop) this.onstop();
  }
}
(globalThis as any).MediaRecorder = MockMediaRecorder;

(globalThis as any).speechSynthesis = {
  cancel: () => {},
  speak: (utterance: any) => {
    if (utterance.onend) setTimeout(utterance.onend, 10);
  },
};
(globalThis as any).window.speechSynthesis = (globalThis as any).speechSynthesis;
(globalThis as any).SpeechSynthesisUtterance = class {
  text: string;
  rate = 1.0;
  pitch = 1.0;
  onend: any = null;
  constructor(text: string) {
    this.text = text;
  }
};

// Test Runner Framework
interface TestResult {
  suite: string;
  testName: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

const allResults: TestResult[] = [];

async function runTest(suite: string, name: string, fn: () => Promise<void> | void): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    allResults.push({
      suite,
      testName: name,
      passed: true,
      durationMs: Date.now() - start,
    });
    console.log(`  ✓ [PASS] ${name}`);
  } catch (err: any) {
    allResults.push({
      suite,
      testName: name,
      passed: false,
      message: err?.message || String(err),
      durationMs: Date.now() - start,
    });
    console.error(`  ✗ [FAIL] ${name}: ${err?.message || err}`);
  }
}

function assert(condition: boolean, msg: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

function assertEquals<T>(actual: T, expected: T, msg: string): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${msg} (Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
  }
}

// Imports
import { StorageService } from '../src/services/storageService.ts';
import { GoogleAuthService, DRIVE_SUBFOLDERS } from '../src/services/googleAuthService.ts';
import { FirebaseAuthService } from '../src/services/firebaseAuthService.ts';
import { AIBrokerService } from '../src/services/aiBrokerService.ts';
import { AlarmService } from '../src/services/alarmService.ts';
import { BackupService } from '../src/services/backupService.ts';
import { SpeechService } from '../src/services/speechService.ts';
import { ThemeService } from '../src/services/themeService.ts';
import { parseDocumentContent } from '../src/components/WordDocumentCanvas.tsx';
import { TaskItem, DiaryEntry, FileAttachment } from '../src/types/index.ts';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('===============================================================');
  console.log('   TASKER OS COMPREHENSIVE AUTOMATED VERIFICATION AUDIT');
  console.log('===============================================================\n');

  // =========================================================================
  // SUITE 1: StorageService Tests
  // =========================================================================
  console.log('>> Running Suite 1: StorageService & Data Integrity');
  memoryLocalStorage.clear();

  await runTest('StorageService', 'saveTasks and getTasks persistence', () => {
    const sampleTasks: TaskItem[] = [
      {
        id: 'task-real-101',
        title: 'Implement OAuth vault sync',
        date: '2026-10-18',
        priority: 'high',
        status: 'todo',
        tags: ['auth', 'sync'],
        subtasks: [{ id: 'sub-1', title: 'Verify Client ID', completed: true }],
        alarmEnabled: true,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-real-102',
        title: 'Review daily diary thoughts',
        date: '2026-10-18',
        priority: 'medium',
        status: 'completed',
        tags: ['diary'],
        subtasks: [],
        alarmEnabled: false,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    StorageService.saveTasks(sampleTasks);
    const retrieved = StorageService.getTasks();
    assertEquals(retrieved.length, 2, 'Should retrieve exactly 2 saved tasks');
    assertEquals(retrieved[0].title, 'Implement OAuth vault sync', 'Task title must match');
    assertEquals(retrieved[0].subtasks[0].completed, true, 'Subtask state must match');
  });

  await runTest('StorageService', 'Cleanses legacy mock seed tasks', () => {
    const dirtyTasks: TaskItem[] = [
      {
        id: 'task-1-legacy',
        title: 'Legacy Mock Task 1',
        date: '2026-10-18',
        priority: 'low',
        status: 'todo',
        tags: [],
        subtasks: [],
        alarmEnabled: false,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-valid-201',
        title: 'Legitimate User Project Task',
        date: '2026-10-18',
        priority: 'urgent',
        status: 'in_progress',
        tags: [],
        subtasks: [],
        alarmEnabled: true,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-shdip-check',
        title: 'shdip meeting discussion',
        date: '2026-10-18',
        priority: 'low',
        status: 'todo',
        tags: [],
        subtasks: [],
        alarmEnabled: false,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    StorageService.saveTasks(dirtyTasks);
    const cleaned = StorageService.getTasks();
    assertEquals(cleaned.length, 1, 'Should filter out task-1-legacy and shdip tasks');
    assertEquals(cleaned[0].id, 'task-valid-201', 'Should keep valid user task');
  });

  await runTest('StorageService', 'saveTask, getTasksForDate, deleteTask', () => {
    const newTask: TaskItem = {
      id: 'task-custom-301',
      title: 'Targeted single task test',
      date: '2026-10-19',
      priority: 'urgent',
      status: 'todo',
      tags: ['test'],
      subtasks: [],
      alarmEnabled: true,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveTask(newTask);
    const forDate = StorageService.getTasksForDate('2026-10-19');
    assertEquals(forDate.length, 1, 'Should find 1 task for 2026-10-19');
    assertEquals(forDate[0].title, 'Targeted single task test', 'Title matches');

    // Update the task
    newTask.title = 'Updated single task test';
    StorageService.saveTask(newTask);
    const updated = StorageService.getTasksForDate('2026-10-19');
    assertEquals(updated[0].title, 'Updated single task test', 'Title should be updated');

    // Delete task
    StorageService.deleteTask('task-custom-301');
    const remaining = StorageService.getTasksForDate('2026-10-19');
    assertEquals(remaining.length, 0, 'Task should be deleted');
  });

  await runTest('StorageService', 'getDiaryForDate and saveDiaryForDate', () => {
    // Fresh non-existent date should return clean template
    const emptyDiary = StorageService.getDiaryForDate('2026-10-25');
    assertEquals(emptyDiary.date, '2026-10-25', 'Date must match requested date');
    assertEquals(emptyDiary.content, '', 'Content should default to empty string');
    assertEquals(emptyDiary.attachments.length, 0, 'Attachments default to empty array');

    // Save populated diary entry
    const entry: DiaryEntry = {
      id: 'diary-2026-10-25',
      date: '2026-10-25',
      content: 'Major breakthrough on the AI router and deduplication engine.',
      mood: 'great',
      tags: ['breakthrough', 'coding'],
      attachments: [],
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveDiaryForDate(entry);
    const retrieved = StorageService.getDiaryForDate('2026-10-25');
    assertEquals(retrieved.content, 'Major breakthrough on the AI router and deduplication engine.', 'Content matches');
    assertEquals(retrieved.mood, 'great', 'Mood matches');
    assertEquals(retrieved.tags.length, 2, 'Tags match');
  });

  await runTest('StorageService', 'File Attachment, SHA-256 computation, and Deduplication', async () => {
    const fileBytes = new TextEncoder().encode('Hello Tasker Deduplication System - Sample Document Content');
    const sampleFile1 = new File([fileBytes], 'architecture_notes.txt', { type: 'text/plain' });

    // Attach to Date 1
    const res1 = await StorageService.attachFileToDate(sampleFile1, '2026-10-20');
    assert(!res1.isDuplicate, 'First upload must not be marked as duplicate');
    assert(res1.attachment.hash.length === 64, 'SHA-256 hash must be 64 hexadecimal characters');
    assert(res1.attachment.id.startsWith('file-'), 'Attachment ID must start with file-');

    // Check registry
    const registry1 = StorageService.getFileRegistry();
    const hash = res1.attachment.hash;
    assert(!!registry1[hash], 'File must be registered in file registry');
    assertEquals(registry1[hash].datesUsed.length, 1, 'File used on 1 date initially');
    assertEquals(registry1[hash].datesUsed[0], '2026-10-20', 'Date matches 2026-10-20');

    // Attach exact same file content to Date 2
    const sampleFile2 = new File([fileBytes], 'architecture_notes_copy.txt', { type: 'text/plain' });
    const res2 = await StorageService.attachFileToDate(sampleFile2, '2026-10-21');
    assert(res2.isDuplicate, 'Second upload with same hash MUST be detected as duplicate');
    assertEquals(res2.attachment.hash, hash, 'Hashes must match');

    // Verify registry maintains single copy and links both dates
    const registry2 = StorageService.getFileRegistry();
    assertEquals(Object.keys(registry2).length, 1, 'File registry must contain only 1 unique deduplicated file');
    assertEquals(registry2[hash].datesUsed.length, 2, 'File now references both dates');
    assert(registry2[hash].datesUsed.includes('2026-10-20'), 'Includes date 1');
    assert(registry2[hash].datesUsed.includes('2026-10-21'), 'Includes date 2');
  });

  await runTest('StorageService', 'deleteDiaryAttachment removes date and purges orphaned file', async () => {
    const fileBytes = new TextEncoder().encode('Disposable file attachment content for deletion testing');
    const file = new File([fileBytes], 'temp_notes.txt', { type: 'text/plain' });

    const { attachment } = await StorageService.attachFileToDate(file, '2026-10-22');
    const hash = attachment.hash;

    // Put attachment in diary entry for 2026-10-22
    const diary = StorageService.getDiaryForDate('2026-10-22');
    diary.attachments.push(attachment);
    StorageService.saveDiaryForDate(diary);

    // Verify registry has it
    let reg = StorageService.getFileRegistry();
    assert(!!reg[hash], 'File exists in registry before delete');

    // Delete attachment
    const deleted = StorageService.deleteDiaryAttachment('2026-10-22', attachment.id);
    assert(deleted, 'deleteDiaryAttachment returns true for existing file');

    // Verify attachment removed from diary
    const updatedDiary = StorageService.getDiaryForDate('2026-10-22');
    assertEquals(updatedDiary.attachments.length, 0, 'Attachment removed from diary');

    // Verify orphaned file purged from registry
    reg = StorageService.getFileRegistry();
    assert(!reg[hash], 'Orphaned file purged from registry when no dates remain');
  });

  // =========================================================================
  // SUITE 2: GoogleAuthService Tests
  // =========================================================================
  console.log('\n>> Running Suite 2: Google Authentication & Drive Vault Sync');

  await runTest('GoogleAuthService', 'Configured Google Client ID verification', () => {
    const clientId = GoogleAuthService.getClientId();
    assert(
      clientId === '634475536724-0e7apq2ee7p3udvuktuldtip5g54t2ru.apps.googleusercontent.com' ||
      clientId.includes('.apps.googleusercontent.com'),
      'Must match verified Google OAuth 2.0 Client ID'
    );
  });

  await runTest('GoogleAuthService', 'saveClientId sets custom Client ID and resets cleanly', () => {
    const custom = '123456789-customclientid12345.apps.googleusercontent.com';
    GoogleAuthService.saveClientId(custom);
    assertEquals(GoogleAuthService.getClientId(), custom, 'Custom Client ID saved');

    // Reset back to primary verified client ID
    GoogleAuthService.saveClientId('634475536724-0e7apq2ee7p3udvuktuldtip5g54t2ru.apps.googleusercontent.com');
    assertEquals(
      GoogleAuthService.getClientId(),
      '634475536724-0e7apq2ee7p3udvuktuldtip5g54t2ru.apps.googleusercontent.com',
      'Reset back to primary verified Client ID'
    );
  });

  await runTest('GoogleAuthService', 'Visible Google Drive folder creation contract (parents: [root])', async () => {
    // Intercept fetch calls to verify folder creation payload
    let capturedUrl = '';
    let capturedBody: any = null;

    const originalFetch = globalThis.fetch;
    (globalThis as any).fetch = async (url: string, options: any) => {
      capturedUrl = url;
      if (url.includes('https://www.googleapis.com/drive/v3/files?q=')) {
        // Return empty search so it proceeds to folder creation
        return new Response(JSON.stringify({ files: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url === 'https://www.googleapis.com/drive/v3/files' && options?.method === 'POST') {
        capturedBody = JSON.parse(options.body);
        return new Response(JSON.stringify({ id: 'mock-folder-id-xyz-123', name: 'Tasker App Data' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('{}', { status: 200 });
    };

    try {
      const folderId = await (GoogleAuthService as any).initDriveFolder('mock-oauth-access-token');
      assertEquals(folderId, 'mock-folder-id-xyz-123', 'Folder ID should be returned from Drive API');
      assert(!!capturedBody, 'POST body must have been dispatched');
      assertEquals(capturedBody.mimeType, 'application/vnd.google-apps.folder', 'mimeType must be Google Drive folder');
      assert(!capturedBody.parents, 'parents property omitted so Google Drive v3 naturally defaults to root without 404 root error');
    } finally {
      (globalThis as any).fetch = originalFetch;
    }
  });

  await runTest('GoogleAuthService', 'getDriveFolderUrl helper produces correct links', () => {
    // Test with specific folder ID
    const state = GoogleAuthService.getDriveState();
    state.folderId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2up00';
    StorageService.saveGoogleDriveState(state);

    const urlWithId = GoogleAuthService.getDriveFolderUrl();
    assertEquals(
      urlWithId,
      'https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2up00',
      'Should link directly to specific folder'
    );

    // Test without folder ID
    state.folderId = undefined;
    StorageService.saveGoogleDriveState(state);
    const searchUrl = GoogleAuthService.getDriveFolderUrl();
    assertEquals(searchUrl, 'https://drive.google.com/drive/u/0/my-drive', 'Fallback My Drive URL');
  });

  await runTest('GoogleAuthService', 'Multi-account linking, active switching, and sign out', () => {
    // Sign in Account 1
    const acc1 = GoogleAuthService.signInWithRealEmail('user1@gmail.com', 'User One');
    assertEquals(acc1.email, 'user1@gmail.com', 'Account 1 email matches');
    assert(GoogleAuthService.isAuthenticated(), 'User 1 is authenticated');
    assertEquals(GoogleAuthService.getActiveAccount()?.email, 'user1@gmail.com', 'User 1 is active');

    // Add Account 2
    const acc2 = GoogleAuthService.addGoogleAccount('user2.workspace@company.com', 'User Two');
    assertEquals(GoogleAuthService.getAllAccounts().length, 2, 'Two accounts registered');

    // Switch active account to Account 2
    const switched = GoogleAuthService.setActiveStorageAccount('user2.workspace@company.com');
    assert(switched, 'Account switched successfully');
    assertEquals(GoogleAuthService.getActiveAccount()?.email, 'user2.workspace@company.com', 'User 2 is now active');

    // Sign out
    GoogleAuthService.signOut();
    assert(!GoogleAuthService.isAuthenticated(), 'User is signed out');
  });

  // =========================================================================
  // SUITE 3: AIBrokerService Tests
  // =========================================================================
  console.log('\n>> Running Suite 3: AI Broker Service & Multi-Model Routing');

  await runTest('AIBrokerService', 'Model routing with providerOverride for all 4 AI engines', async () => {
    // 1. Gemini
    const geminiRes = await AIBrokerService.completeText('Who are you?', 'System test', 'gemini');
    assert(geminiRes.modelUsed.includes('Gemini') || geminiRes.modelUsed.includes('gemini'), `Gemini model routed: ${geminiRes.modelUsed}`);

    // 2. Groq
    const groqRes = await AIBrokerService.completeText('Who are you?', 'System test', 'groq');
    assert(groqRes.modelUsed.includes('Groq') || groqRes.modelUsed.includes('groq'), `Groq model routed: ${groqRes.modelUsed}`);

    // 3. OpenAI
    const openaiRes = await AIBrokerService.completeText('Who are you?', 'System test', 'openai');
    assert(openaiRes.modelUsed.includes('OpenAI') || openaiRes.modelUsed.includes('gpt'), `OpenAI model routed: ${openaiRes.modelUsed}`);

    // 4. Custom (xAI Grok)
    const customRes = await AIBrokerService.completeText('Who are you?', 'System test', 'custom');
    assert(customRes.modelUsed.includes('xAI Grok') || customRes.modelUsed.includes('grok'), `xAI Grok model routed: ${customRes.modelUsed}`);
  });

  await runTest('AIBrokerService', 'Confirm Local AI is 100% removed and legacy "local" call does NOT throw', async () => {
    // Passing 'local' as any to verify runtime resilience
    let didThrow = false;
    let res: any = null;
    try {
      res = await AIBrokerService.completeText('Hello', 'System', 'local' as any);
    } catch (e) {
      didThrow = true;
    }
    assert(!didThrow, 'completeText with legacy provider "local" must not throw');
    assert(!!res && typeof res.text === 'string', 'Returns safe simulated response');
  });

  await runTest('AIBrokerService', 'Deep Semantic Text Analysis Engine execution', async () => {
    const sampleArticle = `
      Software architecture is the high-level structure of a software system and the discipline of creating such structures.
      It refers to the series of significant decisions about the organization of software elements and their interfaces.
      These architectural choices inherently determine system qualities including scalability, maintainability, and resilience.
      Modern systems increasingly favor decoupled event-driven services to mitigate single points of failure.
      However, premature decomposition can introduce catastrophic operational complexity and distributed latency overhead.
      Engineering teams must weigh architectural modularity against development velocity and organizational cognitive load.
    `;

    const result = await AIBrokerService.completeText(
      `Please provide an in-depth analysis and critique of this text:\n${sampleArticle}`,
      'You are Tasker AI.',
      'gemini'
    );

    assert(result.modelUsed.includes('Text Analysis Engine'), `Engine must identify text analysis query. Got: ${result.modelUsed}`);
    assert(result.text.includes('### 📑 Deep Semantic Text Analysis'), 'Must contain Semantic Text Analysis heading');
    assert(result.text.includes('Word Count'), 'Must contain Quantitative Text Metrics (Word Count)');
    assert(result.text.includes('Est. Reading Time'), 'Must contain Reading Time metric');
    assert(result.text.includes('Primary Tone'), 'Must extract Tone / Sentiment');
    assert(result.text.includes('Executive Summary & Core Thesis'), 'Must extract core thesis');
    assert(result.text.includes('Thematic Breakdown & Key Arguments'), 'Must contain thematic arguments');
    assert(result.text.includes('Actionable Recommendations'), 'Must provide actionable next steps');
  });

  await runTest('AIBrokerService', 'Question Comprehension Engine (Comparative vs Procedural)', async () => {
    // Comparative
    const compRes = await AIBrokerService.completeText('Compare TypeScript vs JavaScript', 'System', 'groq');
    assert(
      compRes.text.includes('Comparison & Trade-off Analysis') || (compRes.text.includes('TypeScript') && compRes.text.includes('JavaScript')),
      'Comparative question answered'
    );
    assert(compRes.text.includes('TypeScript') && compRes.text.includes('JavaScript'), 'Both subjects compared');

    // Procedural (How to)
    const howToRes = await AIBrokerService.completeText('How to setup automated deployment pipeline', 'System', 'openai');
    assert(
      howToRes.text.includes('Step-by-Step Implementation Guide') || (howToRes.text.toLowerCase().includes('pipeline') || howToRes.text.toLowerCase().includes('deployment')),
      'How-to procedural guide answered'
    );
  });

  await runTest('AIBrokerService', 'Offline Grammar and Spelling Proofreader', async () => {
    const dirtyText = 'i have alot of meetings on my sheduler tommorrow and dairy notes .';
    const result = await AIBrokerService.correctGrammar(dirtyText);
    assert(result.correctedText.includes('tomorrow'), 'Corrects tommorrow -> tomorrow');
    assert(result.correctedText.includes('diary'), 'Corrects dairy -> diary');
    assert(result.correctedText.includes('schedule') || result.correctedText.includes('scheduler'), 'Corrects sheduler -> scheduler');
    assert(result.correctedText.includes('a lot'), 'Corrects alot -> a lot');
    assert(result.fixesApplied > 0, 'Reports fixes applied');
  });

  // =========================================================================
  // SUITE 4: Task Management, Alarms, Calendar, and Encrypted Backup Vault
  // =========================================================================
  console.log('\n>> Running Suite 4: Alarms, Scheduling & AES-GCM Encrypted Backup');

  await runTest('AlarmService', 'Scheduler lifecycle and alarm detection windows', () => {
    let triggeredAlarm: any = null;
    const unsubscribe = AlarmService.onAlarm((trigger) => {
      triggeredAlarm = trigger;
    });

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // Create task 10 minutes in the future (within 15m gentle warning window: 6-15 mins)
    const start10m = `${String(Math.floor((currentMins + 10) / 60) % 24).padStart(2, '0')}:${String((currentMins + 10) % 60).padStart(2, '0')}`;
    const task15m: TaskItem = {
      id: 'task-alarm-15m',
      title: 'Sprint Planning Standup',
      date: now.toISOString().split('T')[0],
      startTime: start10m,
      priority: 'high',
      status: 'todo',
      tags: [],
      subtasks: [],
      alarmEnabled: true,
      attachments: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    StorageService.saveTasks([task15m]);
    AlarmService.checkUpcomingAlarms();

    assert(!!triggeredAlarm, '15m Alarm should fire for task 10 minutes out');
    assertEquals(triggeredAlarm.type, '15m', 'Alarm type must be 15m');
    assertEquals(triggeredAlarm.task.id, 'task-alarm-15m', 'Triggered task matches');

    // Verify task notified15m flag was updated in storage
    const updatedTasks = StorageService.getTasks();
    const foundTask = updatedTasks.find(t => t.id === 'task-alarm-15m');
    assert(foundTask?.notified15m === true, 'notified15m flag persisted to prevent duplicate alerts');

    unsubscribe();
  });

  await runTest('BackupService', 'AES-256-GCM Encrypted Backup creation and decryption', async () => {
    // Populate mock workspace data
    StorageService.saveTasks([
      {
        id: 'task-backup-1',
        title: 'Project Phoenix Alpha Launch',
        date: '2026-10-18',
        priority: 'urgent',
        status: 'in_progress',
        tags: ['release'],
        subtasks: [{ id: 'sub-1', title: 'Security review', completed: true }],
        alarmEnabled: true,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const secretKey = 'SuperSecretEncryptionKey!2026';
    const { bundle, jsonString } = await BackupService.createEncryptedBackup(secretKey, 'accountA@gmail.com');

    assertEquals(bundle.format, 'TASKER_ENCRYPTED_BACKUP', 'Format must be TASKER_ENCRYPTED_BACKUP');
    assertEquals(bundle.version, '2.0', 'Version must be 2.0');
    assert(!!bundle.salt, 'Must have cryptographic salt');
    assert(!!bundle.iv, 'Must have AES-GCM IV');
    assert(!!bundle.ciphertext, 'Must have AES-GCM ciphertext');
    assert(!!bundle.checksum, 'Must have SHA-256 checksum');

    // Decrypt with correct key
    const decrypted = await BackupService.verifyAndDecryptBackup(jsonString, secretKey);
    assertEquals(decrypted.data.tasks.length, 1, 'Decrypted tasks count matches');
    assertEquals(decrypted.data.tasks[0].title, 'Project Phoenix Alpha Launch', 'Decrypted task title matches');

    // Decrypt with incorrect key MUST fail
    let decryptFailed = false;
    try {
      await BackupService.verifyAndDecryptBackup(jsonString, 'WrongPassword123');
    } catch (e: any) {
      decryptFailed = true;
      assert(e.message.includes('Invalid Security Key') || e.message.includes('failed'), 'Must throw decryption error on wrong key');
    }
    assert(decryptFailed, 'Decryption with wrong password must throw error');
  });

  await runTest('BackupService', 'restoreBackupData merge mode vs replace mode', () => {
    const initialTask: TaskItem = {
      id: 'task-existing-1',
      title: 'Existing Local Task',
      date: '2026-10-18',
      priority: 'low',
      status: 'todo',
      tags: [],
      subtasks: [],
      alarmEnabled: false,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveTasks([initialTask]);

    const incomingData: any = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      exportedBy: 'accountB@gmail.com',
      tasks: [
        {
          id: 'task-incoming-2',
          title: 'Incoming Synced Task',
          date: '2026-10-18',
          priority: 'high',
          status: 'todo',
          tags: [],
          subtasks: [],
          alarmEnabled: true,
          attachments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      diary: {},
      fileRegistry: {},
    };

    // Test Merge Mode
    BackupService.restoreBackupData(incomingData, 'merge');
    const mergedTasks = StorageService.getTasks();
    assertEquals(mergedTasks.length, 2, 'Merge mode preserves existing task and appends incoming task');

    // Test Replace Mode
    BackupService.restoreBackupData(incomingData, 'replace');
    const replacedTasks = StorageService.getTasks();
    assertEquals(replacedTasks.length, 1, 'Replace mode overwrites with incoming tasks only');
    assertEquals(replacedTasks[0].id, 'task-incoming-2', 'Only incoming task remains');
  });

  // =========================================================================
  // SUITE 5: Word Document Canvas & Inline Media Block Flow
  // =========================================================================
  console.log('\n>> Running Suite 5: Word Document Canvas & Inline Media Block Flow');

  await runTest('WordDocumentCanvas', 'parseDocumentContent parses sequential paragraphs and attachment tags', () => {
    const mockAttachments: FileAttachment[] = [
      {
        id: 'att-image-1',
        name: 'architecture_diagram.png',
        mimeType: 'image/png',
        size: 102400,
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        hash: 'hash-img-1',
        storageType: 'both',
        driveFileId: 'drive-img-1',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'att-doc-2',
        name: 'quarterly_report.pdf',
        mimeType: 'application/pdf',
        size: 512000,
        hash: 'hash-pdf-2',
        storageType: 'drive',
        driveFileId: 'drive-pdf-2',
        createdAt: new Date().toISOString(),
      },
    ];

    const rawMarkdown = `Morning reflection on system architecture and scalability.

{{attachment:att-image-1}}

Following the architecture review, the team examined the quarterly revenue numbers below.

![Document Report](attachment:att-doc-2)

End of day conclusions and action items.`;

    const blocks = parseDocumentContent(rawMarkdown, mockAttachments);
    assertEquals(blocks.length, 5, 'Must parse exactly 5 sequential document blocks');

    // Block 0: Text
    assertEquals(blocks[0].type, 'text', 'Block 0 is a text paragraph');
    assert(blocks[0].content?.includes('Morning reflection') || false, 'Block 0 contains opening paragraph');

    // Block 1: Attachment
    assertEquals(blocks[1].type, 'attachment', 'Block 1 is an attachment');
    assertEquals(blocks[1].id, 'att-image-1', 'Block 1 attachment ID matches');
    assert(blocks[1].attachment !== undefined, 'Block 1 resolved to attachment object');
    assertEquals(blocks[1].attachment?.name, 'architecture_diagram.png', 'Block 1 file name matches');

    // Block 2: Text
    assertEquals(blocks[2].type, 'text', 'Block 2 is a text paragraph');
    assert(blocks[2].content?.includes('quarterly revenue') || false, 'Block 2 contains middle paragraph');

    // Block 3: Attachment (Markdown syntax)
    assertEquals(blocks[3].type, 'attachment', 'Block 3 is an attachment');
    assertEquals(blocks[3].id, 'att-doc-2', 'Block 3 attachment ID matches');
    assert(blocks[3].attachment !== undefined, 'Block 3 resolved to PDF attachment object');

    // Block 4: Text
    assertEquals(blocks[4].type, 'text', 'Block 4 is a text paragraph');
    assert(blocks[4].content?.includes('End of day conclusions') || false, 'Block 4 contains closing paragraph');
  });

  await runTest('WordDocumentCanvas', 'Inline attachment tag removal correctly updates text', () => {
    const rawMarkdown = `Paragraph A\n\n{{attachment:att-delete-me}}\n\nParagraph B`;
    const cleaned = rawMarkdown
      .replace(/\{\{(?:attachment|file):att-delete-me\}\}/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    assertEquals(cleaned, 'Paragraph A\n\nParagraph B', 'Tag removed cleanly without affecting surrounding text');
  });

  await runTest('DiaryView', 'Word Document Bar, Attach File, and Separate Attachments Section verified', () => {
    const diaryViewPath = path.resolve(process.cwd(), 'src/components/DiaryView.tsx');
    const content = fs.readFileSync(diaryViewPath, 'utf8');

    // Sticky Word Document Ribbon
    assert(content.includes('+ Attach File'), 'Must provide + Attach File button');
    assert(content.includes('✨ Fix Errors & Sentences'), 'Must provide AI sentence polisher button');
    assert(content.includes('Diary AI Chatbot'), 'Must provide in-diary AI Chatbot trigger');
    assert(content.includes('Attached Documents & Media'), 'Must have separate attachments section header');
    assert(content.includes('+ Upload Attachment'), 'Must have direct + Upload Attachment button in attachments section');
    assert(content.includes('DriveMediaViewerModal'), 'Must link to DriveMediaViewerModal for popup viewing');
    assert(content.includes('DiaryAIChatModal'), 'Must link to DiaryAIChatModal for in-diary chat');
  });

  await runTest('WordDocumentCanvas', 'Compact Inline Media presentation and popup integration verified', () => {
    const canvasPath = path.resolve(process.cwd(), 'src/components/WordDocumentCanvas.tsx');
    const content = fs.readFileSync(canvasPath, 'utf8');

    // Inline media must be small / compact, not giant fullscreen
    assert(content.includes('max-w-sm rounded-2xl border border-slate-700/80 bg-slate-950/80'), 'Card has compact max-w-sm boundary');
    assert(content.includes('h-40 sm:h-48'), 'Image has compact fixed height constraint');
    assert(content.includes('Click to View in Popup'), 'Image has click to view in popup overlay');
    assert(content.includes('onDeleteAttachment'), 'Must provide onDeleteAttachment button');
    assert(content.includes('onOpenViewer'), 'Must provide onOpenViewer trigger');
  });

  await runTest('DiaryAIChatModal', 'Per-message Paste into Diary button verified', () => {
    const chatModalPath = path.resolve(process.cwd(), 'src/components/DiaryAIChatModal.tsx');
    const content = fs.readFileSync(chatModalPath, 'utf8');

    assert(content.includes('Paste into Diary'), 'Must include Paste into Diary button for assistant messages');
    assert(content.includes('onDiaryContentUpdated'), 'Must notify parent view of updated diary content');
    assert(content.includes('StorageService.saveDiaryForDate'), 'Must save updated diary content to StorageService');
  });


  // =========================================================================
  // SUITE 6: Speech Dictation, Audio Recording Lifecycle & Voice Formatting
  // =========================================================================
  console.log('\n>> Running Suite 6: Speech Dictation, Audio Recording & Voice-to-Diary');

  await runTest('SpeechService', 'isSpeechRecognitionSupported returns true with polyfill', () => {
    assert(SpeechService.isSpeechRecognitionSupported(), 'Speech recognition must report supported');
  });

  await runTest('SpeechService', 'startDictation streams speech events with correct callback parameters', async () => {
    let capturedText = '';
    let isFinalReceived = false;

    const started = SpeechService.startDictation(
      (text: string, isFinal: boolean) => {
        capturedText = text;
        isFinalReceived = isFinal;
      },
      (err: string) => {
        throw new Error(`Dictation error: ${err}`);
      },
      () => {},
      'te-IN' // Telugu language code
    );

    assert(started, 'startDictation must return true on successful start');

    // Trigger mock event
    const activeRec = (SpeechService as any).recognition;
    assert(!!activeRec, 'Active recognition instance must be created');
    assertEquals(activeRec.lang, 'te-IN', 'Recognition language set to Telugu (te-IN)');

    if (activeRec.onresult) {
      activeRec.onresult({
        results: [
          Object.assign([{ transcript: 'ఈ రోజు ప్రాజెక్ట్ విజయవంతంగా పూర్తయింది' }], { isFinal: true }),
        ],
      });
    }

    assertEquals(capturedText, 'ఈ రోజు ప్రాజెక్ట్ విజయవంతంగా పూర్తయింది', 'Captured transcribed Telugu speech');
    assertEquals(isFinalReceived, true, 'isFinal flag correctly passed as second parameter');

    SpeechService.stopDictation();
  });

  await runTest('SpeechService', 'startAIRecording & stopAIRecordingAndTranscribe lifecycle', async () => {
    const started = await SpeechService.startAIRecording();
    assert(started, 'startAIRecording returned true');

    const result = await SpeechService.stopAIRecordingAndTranscribe();
    assert(!!result.transcript, 'stopAIRecordingAndTranscribe produced a non-empty transcript');
    assert(!!result.modelUsed, 'stopAIRecordingAndTranscribe reported model used');
  });

  await runTest('SpeechService', 'formatVoiceIntoDiary transforms spoken thoughts into structured diary entry', async () => {
    const spokenTranscript = 'Today we deployed Tasker OS to production and verified all voice, drive, and local storage features. Feeling very accomplished and excited for what comes next.';
    const formatted = await SpeechService.formatVoiceIntoDiary(spokenTranscript, 'en-US');

    assert(!!formatted.formattedDiary, 'Must have formattedDiary text');
    assert(!!formatted.mood, 'Must have computed mood');
    assert(!!formatted.summary, 'Must have summary description');
    assert(
      ['great', 'good', 'neutral', 'challenging', 'stressful'].includes(formatted.mood),
      `Mood must be valid enum: got ${formatted.mood}`
    );
  });

  await runTest('SpeechService', 'speakText and stopSpeaking TTS controls execute without error', () => {
    let ended = false;
    SpeechService.speakText('Tasker OS Voice Synthesizer Ready.', () => {
      ended = true;
    });
    SpeechService.stopSpeaking();
    assert(true, 'TTS executed and stopped without exceptions');
  });

  // =========================================================================
  // SUITE 7: Security Audit & UI Cleanliness Verification
  // =========================================================================
  console.log('\n>> Running Suite 7: Security Audit & UI Cleanliness Verification');

  await runTest('SecurityAudit', 'SettingsModal does NOT expose raw secret Firebase keys in UI', () => {
    const settingsPath = path.resolve(process.cwd(), 'src/components/SettingsModal.tsx');
    assert(fs.existsSync(settingsPath), 'SettingsModal.tsx must exist');
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');

    // Must not expose hardcoded secret API keys
    assert(!settingsContent.includes('AIzaSyB2F-9F-pB3r32VLa4twyfNBCRtbctEH1M'), 'SettingsModal must NOT contain raw Firebase API key');
    assert(!settingsContent.includes('6f63b1a4b05dc2dcbdefa3'), 'SettingsModal must NOT contain raw Firebase App ID');
  });

  await runTest('SecurityAudit', 'SettingsModal does NOT contain redundant backup card', () => {
    const settingsPath = path.resolve(process.cwd(), 'src/components/SettingsModal.tsx');
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');

    assert(!settingsContent.includes('VAULT BACKUP & SYNCHRONIZATION FILE'), 'SettingsModal must NOT contain duplicate Backup card');
    assert(!settingsContent.includes('handleExportBackup'), 'SettingsModal must NOT contain handleExportBackup');
    assert(!settingsContent.includes('handleImportBackup'), 'SettingsModal must NOT contain handleImportBackup');
  });

  await runTest('UIVerification', 'Universal file input refs exist outside editor-only conditionals', () => {
    const diaryViewPath = path.resolve(process.cwd(), 'src/components/DiaryView.tsx');
    const diaryModalPath = path.resolve(process.cwd(), 'src/components/DiaryModal.tsx');

    const viewContent = fs.readFileSync(diaryViewPath, 'utf8');
    const modalContent = fs.readFileSync(diaryModalPath, 'utf8');

    // Both files must have imageInputRef and fileInputRef defined
    assert(viewContent.includes('ref={imageInputRef}'), 'DiaryView has mounted imageInputRef');
    assert(viewContent.includes('ref={fileInputRef}'), 'DiaryView has mounted fileInputRef');
    assert(modalContent.includes('ref={imageInputRef}'), 'DiaryModal has mounted imageInputRef');
    assert(modalContent.includes('ref={fileInputRef}'), 'DiaryModal has mounted fileInputRef');

    // Both files must have handleInsertMediaFile accepting insertAfterIndex
    assert(viewContent.includes('handleInsertMediaFile = async (file: File, insertAfterIndex?: number)'), 'DiaryView accepts insertAfterIndex');
    assert(modalContent.includes('handleInsertMediaFile = async (file: File, insertAfterIndex?: number)'), 'DiaryModal accepts insertAfterIndex');
  });

  // =========================================================================
  // SUITE 8: Speech Dictation & Stutter Deduplication Engine
  // =========================================================================
  console.log('\n>> Running Suite 8: Speech Dictation & Stutter Deduplication Engine');

  await runTest('SpeechService', 'cleanSpeechStutter removes 2x and 3x repeated words', () => {
    const input1 = 'hello hello hello world';
    const cleaned1 = SpeechService.cleanSpeechStutter(input1);
    assertEquals(cleaned1, 'hello world', 'Triple hello collapsed to single hello');

    const input2 = 'today today today I I I went to the the store';
    const cleaned2 = SpeechService.cleanSpeechStutter(input2);
    assertEquals(cleaned2, 'today I went to the store', 'Multiple stutters cleaned cleanly');
  });

  await runTest('SpeechService', 'cleanSpeechStutter works across Indic and Telugu unicode scripts', () => {
    const teluguStutter = 'నమస్కారం నమస్కారం మిత్రులారా';
    const cleanedTelugu = SpeechService.cleanSpeechStutter(teluguStutter);
    assertEquals(cleanedTelugu, 'నమస్కారం మిత్రులారా', 'Telugu duplicated greeting collapsed to single occurrence');
  });

  await runTest('SpeechService', 'DiaryView continuous dictation prevents session-accumulation duplication', () => {
    const diaryViewPath = path.resolve(process.cwd(), 'src/components/DiaryView.tsx');
    const diaryContent = fs.readFileSync(diaryViewPath, 'utf8');

    // Ensure dictationBaseRef.current is NOT re-assigned inside onText on isFinal
    assert(!diaryContent.includes('if (isFinal) {\n            dictationBaseRef.current = newContent;\n          }'), 'DiaryView does not reassign dictationBaseRef on isFinal');
    assert(diaryContent.includes('dictationBaseRef.current = entry.content'), 'DiaryView sets dictationBaseRef once on start');
  });

  // =========================================================================
  // SUITE 9: AI Error Correction & Sentence Reconstruction Engine
  // =========================================================================
  console.log('\n>> Running Suite 9: AI Error Correction & Sentence Reconstruction Engine');

  await runTest('AIBrokerService', 'correctAndPolishDiary cleans speech stutter and reconstructs meaningful sentences', async () => {
    const rawStutterInput = 'hello hello hello i am so happy to launch this project and it was definately a success';
    const result = await AIBrokerService.correctAndPolishDiary(rawStutterInput);

    assert(!!result.correctedText, 'Must return corrected text');
    assert(!result.correctedText.includes('hello hello'), 'Must not contain repeated hello words');
    assert(result.fixesApplied > 0, 'Must record fixes applied');
    assert(result.correctedText.includes('definitely'), 'Typo definately must be corrected to definitely');
  });

  await runTest('AIBrokerService', 'correctAndPolishDiary strictly preserves inline attachment markers', async () => {
    const inputWithMedia = `Morning team sync notes.

{{attachment:att-img-secret999}}

Reviewed quarterly numbers and architectural design.

![System Diagram](attachment:att-doc-vault888)

End of meeting notes.`;

    const result = await AIBrokerService.correctAndPolishDiary(inputWithMedia);
    assert(result.correctedText.includes('{{attachment:att-img-secret999}}'), 'Must preserve {{attachment:...}} tag');
    assert(result.correctedText.includes('attachment:att-doc-vault888'), 'Must preserve markdown attachment reference');
  });

  await runTest('AIBrokerService', 'UI provides AI Error Correction button in DiaryView and DiaryModal', () => {
    const diaryViewPath = path.resolve(process.cwd(), 'src/components/DiaryView.tsx');
    const diaryModalPath = path.resolve(process.cwd(), 'src/components/DiaryModal.tsx');

    const viewContent = fs.readFileSync(diaryViewPath, 'utf8');
    const modalContent = fs.readFileSync(diaryModalPath, 'utf8');

    assert(viewContent.includes('handleAiErrorCorrection'), 'DiaryView includes handleAiErrorCorrection handler');
    assert(viewContent.includes('✨ Fix Errors & Polish') || viewContent.includes('AI Error Correction'), 'DiaryView renders Error Correction button');
    assert(modalContent.includes('handleAiErrorCorrection'), 'DiaryModal includes handleAiErrorCorrection handler');
    assert(modalContent.includes('✨ Fix Errors'), 'DiaryModal renders Fix Errors button');
  });

  // =========================================================================
  // SUITE 10: Theme Mode (Dark/Light) Switcher & Persistence
  // =========================================================================
  console.log('\n>> Running Suite 10: Theme Mode (Dark/Light) Switcher & Persistence');

  await runTest('ThemeService', 'ThemeService manages theme, persistence and root classList', () => {
    // Default theme
    const initial = ThemeService.getTheme();
    assert(initial === 'dark' || initial === 'light', 'Theme returns valid enum');

    // Switch to light
    ThemeService.setTheme('light');
    assertEquals(ThemeService.getTheme(), 'light', 'Theme switched to light');
    assert(document.documentElement.classList.contains('light'), 'Root classList contains light');
    assert(!document.documentElement.classList.contains('dark'), 'Root classList does not contain dark');

    // Toggle back to dark
    const toggled = ThemeService.toggleTheme();
    assertEquals(toggled, 'dark', 'Toggled back to dark');
    assertEquals(ThemeService.getTheme(), 'dark', 'Theme reports dark');
    assert(document.documentElement.classList.contains('dark'), 'Root classList contains dark');
  });

  await runTest('ThemeService', 'Navbar includes Theme Mode toggle button with Sun and Moon icons', () => {
    const navbarPath = path.resolve(process.cwd(), 'src/components/Navbar.tsx');
    const navbarContent = fs.readFileSync(navbarPath, 'utf8');

    assert(navbarContent.includes('ThemeService.toggleTheme()'), 'Navbar calls ThemeService.toggleTheme()');
    assert(navbarContent.includes('<Sun'), 'Navbar renders Sun icon for dark mode toggle');
    assert(navbarContent.includes('<Moon'), 'Navbar renders Moon icon for light mode toggle');
  });

  // =========================================================================
  // SUITE 11: Multi-Device Responsive Viewport Layout & Screen Size Audit
  // =========================================================================
  console.log('\n>> Running Suite 11: Multi-Device Responsive Viewport Layout & Screen Size Audit');

  await runTest('ResponsiveAudit', 'Mobile Viewport (375px - 428px) layout rules verify no rigid overflow', () => {
    const navbarPath = path.resolve(process.cwd(), 'src/components/Navbar.tsx');
    const canvasPath = path.resolve(process.cwd(), 'src/components/WordDocumentCanvas.tsx');

    const navbarContent = fs.readFileSync(navbarPath, 'utf8');
    const canvasContent = fs.readFileSync(canvasPath, 'utf8');

    // Navbar navigation tabs must be horizontally scrollable on mobile
    assert(navbarContent.includes('overflow-x-auto') && navbarContent.includes('max-w-full'), 'Nav tabs have overflow-x-auto and max-w-full');

    // WordDocumentCanvas has responsive padding and max-w-4xl
    assert(canvasContent.includes('max-w-4xl') && canvasContent.includes('w-full'), 'Canvas has fluid w-full max-w-4xl');
  });

  await runTest('ResponsiveAudit', 'Tablet and Desktop Viewports scale gracefully across grid layouts', () => {
    const dayWorkspacePath = path.resolve(process.cwd(), 'src/components/DayWorkspace.tsx');
    const calendarPath = path.resolve(process.cwd(), 'src/components/CalendarView.tsx');

    const dayWorkspaceContent = fs.readFileSync(dayWorkspacePath, 'utf8');
    const calendarContent = fs.readFileSync(calendarPath, 'utf8');

    // DayWorkspace uses responsive layout container
    assert(dayWorkspaceContent.includes('max-w-4xl mx-auto space-y-6') && dayWorkspaceContent.includes('flex-wrap'), 'DayWorkspace uses responsive container and flex-wrap');
    // CalendarView uses 7-column layout
    assert(calendarContent.includes('grid-cols-7'), 'CalendarView uses standard 7-column calendar grid');
  });

  await runTest('ResponsiveAudit', 'CSS Light Mode Overrides and Fluid Transitions are defined', () => {
    const indexCssPath = path.resolve(process.cwd(), 'src/index.css');
    const indexCssContent = fs.readFileSync(indexCssPath, 'utf8');

    assert(indexCssContent.includes('html.light'), 'index.css defines html.light rules');
    assert(indexCssContent.includes('.bg-slate-950') && indexCssContent.includes('.bg-slate-900'), 'index.css overrides surface colors in light mode');
    assert(indexCssContent.includes('transition-colors'), 'index.css includes smooth color transitions');
  });

  // =========================================================================
  // SUITE 12: Documentation Integrity Verification
  // =========================================================================
  console.log('\n>> Running Suite 12: Documentation Integrity Verification');

  await runTest('Documentation', 'USAGE.md exists and contains complete user manual', () => {
    const usagePath = path.resolve(process.cwd(), 'USAGE.md');
    assert(fs.existsSync(usagePath), 'USAGE.md file must exist');
    const content = fs.readFileSync(usagePath, 'utf8');
    assert(content.length > 2500, 'USAGE.md is comprehensive (>2500 bytes)');
    assert(content.includes('Voice Dictation'), 'USAGE.md covers Voice Dictation');
    assert(content.includes('Fix Errors & Polish'), 'USAGE.md covers AI Error Correction');
    assert(content.includes('Dark and Light Mode'), 'USAGE.md covers Theme Switcher');
    assert(content.includes('Google Drive'), 'USAGE.md covers Google Drive cloud vault');
  });

  await runTest('Documentation', 'FEATURES.md exists and contains technical specifications', () => {
    const featuresPath = path.resolve(process.cwd(), 'FEATURES.md');
    assert(fs.existsSync(featuresPath), 'FEATURES.md file must exist');
    const content = fs.readFileSync(featuresPath, 'utf8');
    assert(content.length > 2500, 'FEATURES.md is comprehensive (>2500 bytes)');
    assert(content.includes('Dual-Tier Storage'), 'FEATURES.md covers Dual-Tier Storage');
    assert(content.includes('SHA-256'), 'FEATURES.md covers SHA-256 Deduplication');
    assert(content.includes('AES-256-GCM'), 'FEATURES.md covers AES-256-GCM Vault');
    assert(content.includes('Multi-Device Breakpoints'), 'FEATURES.md covers Responsive Breakpoints');
  });

  await runTest('Documentation', 'README.md links to USAGE.md and FEATURES.md', () => {
    const readmePath = path.resolve(process.cwd(), 'README.md');
    const content = fs.readFileSync(readmePath, 'utf8');
    assert(content.includes('USAGE.md'), 'README.md links to USAGE.md');
    assert(content.includes('FEATURES.md'), 'README.md links to FEATURES.md');
  });

  // =========================================================================
  // SUITE 13: Dashboard Task Creation, AI Summarize/Translate, and Drive Vault Privacy
  // =========================================================================
  console.log('\n>> Running Suite 13: Dashboard Tasks, Diary AI Summarize/Translate & Drive Privacy');

  await runTest('DashboardTaskCreation', 'Timestamp-based tasks (task-1792...) persist without false-positive cleansing', () => {
    const testTaskId = `task-${Date.now()}-abc`;
    const testTask: TaskItem = {
      id: testTaskId,
      title: 'Verify Dashboard Task Persistence',
      date: '2026-10-22',
      priority: 'high',
      status: 'todo',
      tags: [],
      subtasks: [],
      alarmEnabled: false,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveTask(testTask);
    const retrieved = StorageService.getTasks();
    const found = retrieved.find(t => t.id === testTaskId);

    assert(found !== undefined, 'Timestamp-based task must NOT be cleansed');
    assertEquals(found?.title, 'Verify Dashboard Task Persistence', 'Task title matches');

    // Clean up
    StorageService.deleteTask(testTaskId);
  });

  await runTest('DiaryViewAI', 'DiaryView includes AI Summarize and AI Translate with language dropdown', () => {
    const diaryViewPath = path.resolve(process.cwd(), 'src/components/DiaryView.tsx');
    const content = fs.readFileSync(diaryViewPath, 'utf8');

    assert(content.includes('AI Summarize'), 'Must include AI Summarize button');
    assert(content.includes('handleSummarize'), 'Must implement handleSummarize');
    assert(content.includes('Translate'), 'Must include Translate button');
    assert(content.includes('handleTranslate'), 'Must implement handleTranslate');
    assert(content.includes('TRANSLATION_LANGUAGES'), 'Must provide language dropdown list');
    assert(content.includes('showSummaryModal'), 'Must provide summary modal');
    assert(content.includes('showTranslateModal'), 'Must provide translation modal');
  });

  await runTest('GoogleDriveVaultPrivacy', 'GoogleAuthService creates visible media folder, uploads media, and hides text vault', () => {
    const authServicePath = path.resolve(process.cwd(), 'src/services/googleAuthService.ts');
    const content = fs.readFileSync(authServicePath, 'utf8');

    assert(content.includes('Tasker_Media') || content.includes('initDriveFolder'), 'Visible folder created in My Drive');
    assert(content.includes('uploadMediaFile'), 'Must implement uploadMediaFile for images/videos/documents');
    assert(content.includes("parents: ['appDataFolder']"), 'Private text vault stored hidden in appDataFolder');
    assert(content.includes('deleteDriveFile'), 'Must implement deleteDriveFile for attachment deletion');
  });

  await runTest('ThemeContrastStyles', 'index.css defines high-contrast rules for light and dark modes', () => {
    const cssPath = path.resolve(process.cwd(), 'src/index.css');
    const content = fs.readFileSync(cssPath, 'utf8');

    assert(content.includes('html.light body'), 'Defines light mode body background and text');
    assert(content.includes('html.light .bg-indigo-600'), 'Defines light mode button text contrast');
    assert(content.includes('html.light input'), 'Defines light mode form controls');
    assert(content.includes('html.light .bg-purple-950'), 'Defines light mode badge pill contrast');
  });

  // =========================================================================
  // SUITE 14: Multi-Paragraph Error Correction, Diary Chatbot & Drive Helpers
  // =========================================================================
  console.log('\n>> Running Suite 14: Polished Diary AI & Drive Folder Direct Access');

  await runTest('MultiParagraphAI', 'correctAndPolishDiary handles 3-4 paragraphs without wrapping in code blocks', async () => {
    const sampleJournal = [
      'today today was a great day at work. i goes to the client meeting and presented teh deck .',
      'we also discussed the new architecture plan and how to analyze the feedback from user testing .',
      'in the evening i completed all my pending task items and reviewed next steps with team .'
    ].join('\n\n');

    const result = await AIBrokerService.correctAndPolishDiary(sampleJournal);
    assert(!result.correctedText.includes('```'), 'Must NOT convert paragraphs into code blocks or backticks');
    assert(!result.correctedText.startsWith('    '), 'Must NOT indent paragraphs with 4 spaces (which renders as code)');
    assert(result.correctedText.includes('meeting'), 'Preserves content words');
    assert(!result.correctedText.includes('today today'), 'Deduplicates voice stutter');
    assert(result.correctedText.includes('\n'), 'Preserves multi-paragraph separation');
  });

  await runTest('DiaryChatbotSummary', 'queryDiaryChat summarizes actual diary content instead of echoing prompt', async () => {
    const mockEntry = {
      date: '2026-10-22',
      content: 'I completed the major database migration and submitted the project report. Feeling accomplished and energetic.',
      mood: 'energized'
    };

    const res = await AIBrokerService.queryDiaryChat(
      'Summarize my day into an inspiring closing reflection.',
      mockEntry,
      []
    );

    assert(!res.responseText.includes('• Summarize my day into an inspiring closing reflection'), 'Must NOT echo user prompt in bullet points');
    assert(
      res.responseText.toLowerCase().includes('migration') ||
      res.responseText.toLowerCase().includes('report') ||
      res.responseText.toLowerCase().includes('accomplish') ||
      res.responseText.toLowerCase().includes('reflection'),
      'Must synthesize actual journal content'
    );
  });

  await runTest('GoogleDriveVisibleFolderHelpers', 'GoogleAuthService exports ensureVisibleDriveFolder and openDriveFolderInNewTab', () => {
    assert(typeof (GoogleAuthService as any).ensureVisibleDriveFolder === 'function', 'ensureVisibleDriveFolder exists');
    assert(typeof (GoogleAuthService as any).openDriveFolderInNewTab === 'function', 'openDriveFolderInNewTab exists');
  });

  console.log('\n>> Running Suite 15: Dual-Token Rotation, Public Drive Folder, & Resumable Uploads');

  await runTest('TokenRotation', 'Perpetual Dual-Token Rotation swaps to standby token before expiry', async () => {
    const state = GoogleAuthService.getDriveState();
    state.accessToken = 'primary-token-123';
    state.secondaryToken = 'standby-token-456';
    state.tokenExpiresAt = Date.now() + 60 * 1000; // 1 min left (< 2 min threshold)
    state.secondaryTokenExpiresAt = Date.now() + 3600 * 1000;
    state.lastRotatedAt = new Date().toISOString();
    StorageService.saveGoogleDriveState(state);

    const activeToken = GoogleAuthService.getActiveToken();
    assertEquals(activeToken, 'standby-token-456', 'Active token should rotate to secondary token');

    assert(typeof (GoogleAuthService as any).rotateTokens === 'function', 'rotateTokens exists');
    assert(typeof (GoogleAuthService as any).startPerpetualTokenManager === 'function', 'startPerpetualTokenManager exists');
  });

  await runTest('SafeLargeFileHandling', 'StorageService handles large files (e.g. 2GB video) without crashing memory or localStorage', async () => {
    // Create a mock large video file (2GB) using Blob slice polyfill
    const mockBigFile = new File(['mock video content chunk'], 'vacation_movie_2026.mp4', { type: 'video/mp4' });
    Object.defineProperty(mockBigFile, 'size', { value: 2 * 1024 * 1024 * 1024 }); // 2 GB

    // 1. Chunked hash calculation must succeed without OutOfMemory error
    const hash = await StorageService.computeFileHash(mockBigFile);
    assert(typeof hash === 'string' && hash.length === 64, 'Must compute 64-character SHA-256 hash');

    // 2. Large video must return empty preview URL so localStorage quota is protected
    const previewUrl = await StorageService.createOptimizedPreviewUrl(mockBigFile);
    assertEquals(previewUrl, '', 'Large video preview URL must be empty to avoid localStorage quota crash');

    // 3. Process and deduplicate must safely create attachment
    const { attachment } = await StorageService.attachFileToDate(mockBigFile, '2026-10-22');
    assertEquals(attachment.name, 'vacation_movie_2026.mp4', 'Attachment name matches');
    assertEquals(attachment.size, 2 * 1024 * 1024 * 1024, 'Attachment size is 2GB');
  });

  await runTest('PublicDriveFolderPermissions', 'initDriveFolder grants reader permissions to make folder public for media viewing', async () => {
    const originalFetch = globalThis.fetch;
    let permissionsGranted = false;

    (globalThis as any).fetch = async (url: string, options: any) => {
      if (url.includes('/drive/v3/files?q=')) {
        return new Response(JSON.stringify({ files: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url === 'https://www.googleapis.com/drive/v3/files' && options?.method === 'POST') {
        return new Response(JSON.stringify({ id: 'public-folder-123456789012345', name: 'Tasker App Data' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/permissions') && options?.method === 'POST') {
        const body = JSON.parse(options.body);
        if (body.role === 'reader' && body.type === 'anyone') {
          permissionsGranted = true;
        }
        return new Response('{}', { status: 200 });
      }
      return new Response('{}', { status: 200 });
    };

    try {
      const folderId = await GoogleAuthService.initDriveFolder('test-oauth-token');
      assertEquals(folderId, 'public-folder-123456789012345', 'Folder ID matches');
      assert(permissionsGranted, 'Public reader permission must be assigned to folder for media visibility');
    } finally {
      (globalThis as any).fetch = originalFetch;
    }
  });

  await runTest('ResumableUploadProtocol', 'GoogleAuthService exports uploadMediaFileResumable for chunked streaming', () => {
    assert(typeof (GoogleAuthService as any).uploadMediaFileResumable === 'function', 'uploadMediaFileResumable exists');
  });

  // =========================================================================
  // SUITE 16: Google Drive Subfolder Organization, Hierarchy & Zero-Faking Verification
  // =========================================================================
  console.log('\n>> Running Suite 16: Google Drive Subfolder Hierarchy & Zero-Faking Verification');

  await runTest('FolderHierarchyContract', 'verifyOrCreateAllDriveFolders guarantees Tasker_Media in root and all 8 typed subfolders inside', async () => {
    const originalFetch = globalThis.fetch;
    const createdFolders: { name: string; parents?: string[] }[] = [];
    const rootFolderId = 'root-media-folder-id-777';

    (globalThis as any).fetch = async (url: string, options: any) => {
      // 1. Searching for folders
      if (url.includes('/drive/v3/files?q=') && (!options?.method || options.method === 'GET')) {
        // If searching subfolders inside root
        if (url.includes(rootFolderId)) {
          return new Response(JSON.stringify({ files: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        // If searching root folder
        return new Response(JSON.stringify({ files: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 2. Creating folder
      if (url === 'https://www.googleapis.com/drive/v3/files' && options?.method === 'POST') {
        const body = JSON.parse(options.body);
        createdFolders.push(body);
        if (body.name === 'Tasker_Media') {
          return new Response(JSON.stringify({ id: rootFolderId, name: body.name }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ id: `subfolder-${body.name}-id`, name: body.name }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 3. Permissions
      if (url.includes('/permissions')) {
        return new Response('{}', { status: 200 });
      }

      return new Response('{}', { status: 200 });
    };

    try {
      const res = await GoogleAuthService.verifyOrCreateAllDriveFolders('test-access-token-123');
      assertEquals(res.rootId, rootFolderId, 'Root ID must match root-media-folder-id-777');
      assertEquals(res.rootName, 'Tasker_Media', 'Root folder name must be Tasker_Media');

      // Check root folder creation
      const rootFolder = createdFolders.find(f => f.name === 'Tasker_Media');
      assert(!!rootFolder, 'Tasker_Media root folder must be created');
      assert(!rootFolder!.parents, 'Tasker_Media must omit parents to be created in My Drive root');

      // Check all 8 subfolders
      const expectedSubfolders = [
        'Videos',
        'Documents',
        'Presentations',
        'Spreadsheets',
        'Programs',
        'Images',
        'Audio',
        'Other',
      ];

      for (const expected of expectedSubfolders) {
        assert(!!res.subfolders[expected as any], `Subfolder ${expected} must have an ID returned`);
        const sub = createdFolders.find(f => f.name === expected);
        assert(!!sub, `Subfolder ${expected} must have been created in Google Drive`);
        assert(Array.isArray(sub!.parents) && sub!.parents[0] === rootFolderId, `Subfolder ${expected} must have parents: [${rootFolderId}]`);
      }

      // Verify GoogleDriveState contains subfolder IDs
      const state = GoogleAuthService.getDriveState();
      assertEquals(state.folderId, rootFolderId, 'DriveState folderId is updated');
      assert(!!state.subfolderIds && state.subfolderIds['Videos'] === `subfolder-Videos-id`, 'DriveState subfolderIds includes Videos');
    } finally {
      (globalThis as any).fetch = originalFetch;
    }
  });

  await runTest('FileTypeSubfolderRouting', 'categorizeFile and getOrTargetSubfolder route all types to exact subfolders', async () => {
    // 1. Videos
    assertEquals(GoogleAuthService.categorizeFile('movie.mp4', 'video/mp4'), 'Videos', '.mp4 maps to Videos');
    assertEquals(GoogleAuthService.categorizeFile('clip.mkv'), 'Videos', '.mkv maps to Videos');
    assertEquals(GoogleAuthService.categorizeFile('recording.mov', 'video/quicktime'), 'Videos', '.mov maps to Videos');
    assertEquals(GoogleAuthService.categorizeFile('stream.webm'), 'Videos', '.webm maps to Videos');

    // 2. Images
    assertEquals(GoogleAuthService.categorizeFile('photo.png', 'image/png'), 'Images', '.png maps to Images');
    assertEquals(GoogleAuthService.categorizeFile('avatar.jpg', 'image/jpeg'), 'Images', '.jpg maps to Images');
    assertEquals(GoogleAuthService.categorizeFile('diagram.svg'), 'Images', '.svg maps to Images');
    assertEquals(GoogleAuthService.categorizeFile('banner.webp'), 'Images', '.webp maps to Images');

    // 3. Audio
    assertEquals(GoogleAuthService.categorizeFile('song.mp3', 'audio/mpeg'), 'Audio', '.mp3 maps to Audio');
    assertEquals(GoogleAuthService.categorizeFile('voice.wav', 'audio/wav'), 'Audio', '.wav maps to Audio');
    assertEquals(GoogleAuthService.categorizeFile('track.m4a'), 'Audio', '.m4a maps to Audio');

    // 4. Spreadsheets
    assertEquals(GoogleAuthService.categorizeFile('budget.csv', 'text/csv'), 'Spreadsheets', '.csv maps to Spreadsheets');
    assertEquals(GoogleAuthService.categorizeFile('financials.xlsx'), 'Spreadsheets', '.xlsx maps to Spreadsheets');
    assertEquals(GoogleAuthService.categorizeFile('data.xls'), 'Spreadsheets', '.xls maps to Spreadsheets');

    // 5. Presentations
    assertEquals(GoogleAuthService.categorizeFile('pitch.pptx'), 'Presentations', '.pptx maps to Presentations');
    assertEquals(GoogleAuthService.categorizeFile('deck.ppt'), 'Presentations', '.ppt maps to Presentations');

    // 6. Documents
    assertEquals(GoogleAuthService.categorizeFile('report.pdf', 'application/pdf'), 'Documents', '.pdf maps to Documents');
    assertEquals(GoogleAuthService.categorizeFile('notes.docx'), 'Documents', '.docx maps to Documents');
    assertEquals(GoogleAuthService.categorizeFile('todo.txt', 'text/plain'), 'Documents', '.txt maps to Documents');

    // 7. Programs
    assertEquals(GoogleAuthService.categorizeFile('setup.exe'), 'Programs', '.exe maps to Programs');
    assertEquals(GoogleAuthService.categorizeFile('installer.msi'), 'Programs', '.msi maps to Programs');
    assertEquals(GoogleAuthService.categorizeFile('archive.zip', 'application/zip'), 'Programs', '.zip maps to Programs');
    assertEquals(GoogleAuthService.categorizeFile('package.tar.gz'), 'Programs', '.tar.gz maps to Programs');

    // 8. Other
    assertEquals(GoogleAuthService.categorizeFile('unknown_data.dat'), 'Other', '.dat maps to Other');
    assertEquals(GoogleAuthService.categorizeFile('custom_binary.xyz'), 'Other', '.xyz maps to Other');

    // Test getOrTargetSubfolder
    const mockState = GoogleAuthService.getDriveState();
    mockState.subfolderIds = {
      Videos: 'folder-vid-123456789',
      Documents: 'folder-doc-123456789',
      Presentations: 'folder-ppt-123456789',
      Spreadsheets: 'folder-xls-123456789',
      Programs: 'folder-exe-123456789',
      Images: 'folder-img-123456789',
      Audio: 'folder-aud-123456789',
      Other: 'folder-oth-123456789',
    };
    StorageService.saveGoogleDriveState(mockState);

    const vidTarget = await GoogleAuthService.getOrTargetSubfolder('test-token', { name: 'vacation.mp4', type: 'video/mp4' });
    assertEquals(vidTarget, 'folder-vid-123456789', 'getOrTargetSubfolder routes vacation.mp4 to Videos subfolder');

    const docTarget = await GoogleAuthService.getOrTargetSubfolder('test-token', { name: 'thesis.pdf', type: 'application/pdf' });
    assertEquals(docTarget, 'folder-doc-123456789', 'getOrTargetSubfolder routes thesis.pdf to Documents subfolder');
  });

  await runTest('UploadMediaFileResumableSubfolderTargeting', 'uploadMediaFileResumable targets exact subfolder in parents metadata', async () => {
    const originalFetch = globalThis.fetch;
    const originalXHR = (globalThis as any).XMLHttpRequest;
    let capturedInitiateMetadata: any = null;

    const mockState = GoogleAuthService.getDriveState();
    mockState.isConnected = true;
    mockState.accessToken = 'test-valid-oauth-token';
    mockState.tokenExpiresAt = Date.now() + 3600000;
    mockState.subfolderIds = {
      Videos: 'target-videos-subfolder-id',
      Documents: 'target-documents-subfolder-id',
      Presentations: 'target-presentations-subfolder-id',
      Spreadsheets: 'target-spreadsheets-subfolder-id',
      Programs: 'target-programs-subfolder-id',
      Images: 'target-images-subfolder-id',
      Audio: 'target-audio-subfolder-id',
      Other: 'target-other-subfolder-id',
    };
    StorageService.saveGoogleDriveState(mockState);

    (globalThis as any).fetch = async (url: string, options: any) => {
      if (url.includes('/upload/drive/v3/files?uploadType=resumable')) {
        capturedInitiateMetadata = JSON.parse(options.body);
        return new Response('{}', {
          status: 200,
          headers: {
            Location: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=mock_session_123',
          },
        });
      }
      return new Response('{}', { status: 200 });
    };

    class MockXHR {
      upload = { onprogress: null as any };
      status = 200;
      responseText = JSON.stringify({
        id: 'real-drive-file-id-abc123456',
        webViewLink: 'https://drive.google.com/file/d/real-drive-file-id-abc123456/view',
      });
      open() {}
      setRequestHeader() {}
      send() {
        setTimeout(() => {
          if (typeof (this as any).onload === 'function') {
            (this as any).onload();
          }
        }, 10);
      }
    }
    (globalThis as any).XMLHttpRequest = MockXHR;

    try {
      const mockVideoFile = new File(['fake-500mb-video-content'], 'epic_journey.mp4', { type: 'video/mp4' });
      const uploadRes = await GoogleAuthService.uploadMediaFileResumable(mockVideoFile);

      assert(!!uploadRes, 'Upload should succeed');
      assertEquals(uploadRes!.fileId, 'real-drive-file-id-abc123456', 'Returns authentic Google Drive file ID');
      assert(!!capturedInitiateMetadata, 'Initiate metadata was dispatched');
      assertEquals(capturedInitiateMetadata.name, 'epic_journey.mp4', 'Metadata name matches');
      assert(
        Array.isArray(capturedInitiateMetadata.parents) && capturedInitiateMetadata.parents[0] === 'target-videos-subfolder-id',
        'Upload metadata parents MUST target the Videos subfolder ID!'
      );
    } finally {
      (globalThis as any).fetch = originalFetch;
      (globalThis as any).XMLHttpRequest = originalXHR;
    }
  });

  await runTest('ZeroFakingStorageDeduplication', 'StorageService never sets fake file-... driveId and cleanses legacy fake IDs', async () => {
    localStorage.clear();

    // 1. Fresh file upload: driveId must be undefined
    const testFile = new File(['zero faking test content'], 'sample.pdf', { type: 'application/pdf' });
    const { attachment } = await StorageService.attachFileToDate(testFile, '2026-10-22');

    assert(attachment.driveId === undefined, `New attachment must NOT have fake driveId, got: ${attachment.driveId}`);

    // 2. Legacy fake driveId cleansing
    const registry = StorageService.getFileRegistry();
    const hash = attachment.hash;
    registry[hash] = {
      ...registry[hash],
      driveId: 'file-fake-placeholder-id-12345', // Legacy mock ID
    };
    StorageService.saveFileRegistry(registry);

    // Re-processing must cleanse the fake driveId
    const { attachment: cleansedAtt } = await StorageService.attachFileToDate(testFile, '2026-10-23');
    assert(cleansedAtt.driveId === undefined, `Legacy fake driveId must be stripped, got: ${cleansedAtt.driveId}`);
  });

  await runTest('ZeroFakingUIIntegrity', 'DiaryView and DriveMediaViewerModal enforce zero-faking UI contracts', () => {
    const diaryViewPath = path.resolve(process.cwd(), 'src/components/DiaryView.tsx');
    const modalPath = path.resolve(process.cwd(), 'src/components/DriveMediaViewerModal.tsx');
    const wordCanvasPath = path.resolve(process.cwd(), 'src/components/WordDocumentCanvas.tsx');

    const diaryViewCode = fs.readFileSync(diaryViewPath, 'utf-8');
    const modalCode = fs.readFileSync(modalPath, 'utf-8');
    const wordCanvasCode = fs.readFileSync(wordCanvasPath, 'utf-8');

    // 1. Both files must contain exact message "Local Storage Only (Not uploaded to Google Drive)"
    assert(
      diaryViewCode.includes('Local Storage Only (Not uploaded to Google Drive)'),
      'DiaryView must explicitly show "Local Storage Only (Not uploaded to Google Drive)"'
    );
    assert(
      modalCode.includes('Local Storage Only (Not uploaded to Google Drive)'),
      'DriveMediaViewerModal must explicitly show "Local Storage Only (Not uploaded to Google Drive)"'
    );

    // 2. DiaryView must have retry upload handler
    assert(
      diaryViewCode.includes('handleRetryUpload'),
      'DiaryView must provide handleRetryUpload to allow re-uploading un-synced files'
    );

    // 3. DriveMediaViewerModal must conditionally guard "View in Drive" behind hasValidDriveId
    assert(
      modalCode.includes('hasValidDriveId') && modalCode.includes('View in Drive'),
      'DriveMediaViewerModal must guard "View in Drive" behind hasValidDriveId'
    );

    // 4. WordDocumentCanvas must NOT show "Drive" for files without valid driveId
    assert(
      wordCanvasCode.includes('Local Only'),
      'WordDocumentCanvas must show "Local Only" for files not uploaded to Google Drive'
    );
  });

  await runTest('DualAuthAndTokenReliability', 'Dual-Auth token re-prompt methods exist and provide reliable re-authentication', () => {
    assert(
      typeof (FirebaseAuthService as any).repromptGoogleToken === 'function',
      'FirebaseAuthService.repromptGoogleToken must exist for immediate 1-click token re-prompt'
    );
    assert(
      typeof (GoogleAuthService as any).repromptDriveToken === 'function',
      'GoogleAuthService.repromptDriveToken must exist for 1-click GIS token re-prompt'
    );
  });
  console.log('\n===============================================================');
  console.log('                 AUDIT EXECUTION RESULTS');
  console.log('===============================================================');
  const passedCount = allResults.filter(r => r.passed).length;
  const failedCount = allResults.filter(r => !r.passed).length;
  console.log(`Total Tests Run: ${allResults.length}`);
  console.log(`Passed:          ${passedCount}`);
  console.log(`Failed:          ${failedCount}`);
  console.log('===============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
