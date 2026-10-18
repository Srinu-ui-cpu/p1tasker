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
import { GoogleAuthService } from '../src/services/googleAuthService.ts';
import { AIBrokerService } from '../src/services/aiBrokerService.ts';
import { AlarmService } from '../src/services/alarmService.ts';
import { BackupService } from '../src/services/backupService.ts';
import { TaskItem, DiaryEntry } from '../src/types/index.ts';

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
    assertEquals(
      clientId,
      '634475536724-0e7apq2ee7p3udvuktuldtip5g54t2ru.apps.googleusercontent.com',
      'Must match verified Google OAuth 2.0 Client ID'
    );
  });

  await runTest('GoogleAuthService', 'Auto-healing of legacy corrupted Client ID typo', () => {
    // Simulate corrupted key in localStorage
    localStorage.setItem('tasker_google_client_id_v2', '634475536724-0e7apq2ee7p3uktldtip5g54t2ru.apps.googleusercontent.com');
    const healedId = GoogleAuthService.getClientId();
    assertEquals(
      healedId,
      '634475536724-0e7apq2ee7p3udvuktuldtip5g54t2ru.apps.googleusercontent.com',
      'Should auto-heal typo containing uktldtip'
    );
  });

  await runTest('GoogleAuthService', 'saveClientId sets custom Client ID', () => {
    const custom = '123456789-customclientid12345.apps.googleusercontent.com';
    GoogleAuthService.saveClientId(custom);
    assertEquals(GoogleAuthService.getClientId(), custom, 'Custom Client ID saved');

    // Reset back to verified default
    GoogleAuthService.saveClientId('634475536724-0e7apq2ee7p3udvuktuldtip5g54t2ru.apps.googleusercontent.com');
    assertEquals(
      GoogleAuthService.getClientId(),
      '634475536724-0e7apq2ee7p3udvuktuldtip5g54t2ru.apps.googleusercontent.com',
      'Reset back to default'
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
      assertEquals(capturedBody.name, 'Tasker App Data', 'Folder name must be "Tasker App Data"');
      assertEquals(capturedBody.mimeType, 'application/vnd.google-apps.folder', 'mimeType must be Google Drive folder');
      assert(Array.isArray(capturedBody.parents), 'parents must be an array');
      assertEquals(capturedBody.parents[0], 'root', 'parents must be explicitly ["root"] to ensure visibility in My Drive');
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
    assertEquals(searchUrl, 'https://drive.google.com/drive/search?q=Tasker', 'Fallback search URL');
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
    assert(compRes.text.includes('Comparison & Trade-off Analysis'), 'Comparative question identified');
    assert(compRes.text.includes('TypeScript') && compRes.text.includes('JavaScript'), 'Both subjects compared');

    // Procedural (How to)
    const howToRes = await AIBrokerService.completeText('How to setup automated deployment pipeline', 'System', 'openai');
    assert(howToRes.text.includes('Step-by-Step Implementation Guide'), 'How-to procedural guide identified');
    assert(howToRes.text.includes('Phase 1') && howToRes.text.includes('Phase 2'), 'Includes structured phases');
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
  // RESULTS SUMMARY
  // =========================================================================
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
