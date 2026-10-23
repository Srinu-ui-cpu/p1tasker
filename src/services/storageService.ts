import { TaskItem, DiaryEntry, Project, DeduplicatedFileRegistry, FileAttachment, GoogleDriveState, ChatSession, ChatMessage } from '../types';
import { AnalyticsService } from './analyticsService';

const STORAGE_KEYS = {
  TASKS: 'tasker_tasks_v1',
  DIARY: 'tasker_diary_v1',
  PROJECTS: 'tasker_projects_v1',
  FILES: 'tasker_files_registry_v1',
  GDRIVE: 'tasker_gdrive_config_v1',
  CHAT_SESSIONS: 'tasker_ai_chat_sessions_v1',
  ACTIVE_CHAT_ID: 'tasker_active_chat_id_v1',
};

// Initial Seed Data so the app opens with rich, realistic content immediately
const INITIAL_PROJECTS: Project[] = [
  { id: 'proj-work', name: 'Work & Projects', color: '#6366f1', icon: 'Briefcase' },
  { id: 'proj-personal', name: 'Personal & Life', color: '#10b981', icon: 'User' },
  { id: 'proj-finance', name: 'Finance & Invoices', color: '#f59e0b', icon: 'DollarSign' },
  { id: 'proj-health', name: 'Health & Fitness', color: '#ec4899', icon: 'Heart' },
];

export interface DeduplicationResult {
  attachment: FileAttachment;
  isDuplicate: boolean;
  isUpdate: boolean;
  existingDriveId?: string;
  updatedFrom?: {
    id: string;
    name: string;
    hash: string;
    version?: number;
  };
}

export class StorageService {
  /**
   * Cleanses raw JSON, tags, and code blocks from task text and titles:
   * 1. Extracts clean title if raw JSON array/object was passed (e.g. [{"title":"..."}] or {"title":"..."})
   * 2. Strips {{attachment:...}}, {{file:...}}, and ![...](attachment:...) markers
   * 3. Strips markdown code blocks
   */
  static sanitizeTaskText(text?: string): string {
    if (!text) return '';
    let cleaned = text.trim();

    // Unwrap markdown code fences: ```json ... ``` or ``` ... ```
    cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();

    // Check if entire text is a JSON array or object
    if ((cleaned.startsWith('{') && cleaned.endsWith('}')) || (cleaned.startsWith('[') && cleaned.endsWith(']'))) {
      try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0];
          if (typeof first === 'string') return this.sanitizeTaskText(first);
          if (first && typeof first === 'object' && first.title) return this.sanitizeTaskText(first.title);
        } else if (parsed && typeof parsed === 'object' && parsed.title) {
          return this.sanitizeTaskText(parsed.title);
        }
      } catch {
        // Not valid JSON, continue with string cleansing
      }
    }

    // Strip JSON field patterns like {"title": "..."}
    cleaned = cleaned.replace(/\{\s*"title"\s*:\s*"([^"]+)"[^\}]*\}/g, '$1');

    // Strip inline attachment tags
    cleaned = cleaned.replace(/\{\{(?:attachment|file):[a-zA-Z0-9_\-.:]+\}\}/g, '').trim();
    cleaned = cleaned.replace(/!\[[^\]]*\]\(attachment:[a-zA-Z0-9_\-.:]+\)/g, '').trim();

    // Remove any leftover leading JSON formatting characters like [, ], {, }
    cleaned = cleaned.replace(/^[\[\{\s"]+|[\]\}\s"]+$/g, '').trim();

    return cleaned || text.trim();
  }

  /**
   * Helper to categorize files without circular module dependencies
   */
  static categorizeFile(fileName: string, mimeType: string): string {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    const mime = (mimeType || '').toLowerCase();
    if (mime.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv'].includes(ext)) return 'Videos';
    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'Images';
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) return 'Audio';
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'md'].includes(ext) || mime.includes('pdf') || mime.includes('word') || mime.includes('document')) return 'Documents';
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) return 'Spreadsheets';
    if (['ppt', 'pptx', 'odp'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) return 'Presentations';
    if (['exe', 'msi', 'apk', 'dmg', 'bin', 'iso', 'bat', 'cmd', 'ps1', 'sh', 'zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'Programs';
    return 'Other';
  }

  // --- TASKS ---
  static getTasks(): TaskItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) {
        return [];
      }
      const parsed: TaskItem[] = JSON.parse(data);
      // Cleanse only specific legacy mock seed tasks and sanitize text
      const cleaned = parsed
        .filter(t => 
          t.id !== 'task-1' &&
          t.id !== 'task-2' &&
          t.id !== 'task-3' &&
          !t.id.startsWith('task-1-') &&
          !t.id.startsWith('task-2-') &&
          !t.id.startsWith('task-3-') &&
          !t.title.toLowerCase().includes('shdip') &&
          !t.title.toLowerCase().includes('sprint review')
        )
        .map(t => ({
          ...t,
          title: this.sanitizeTaskText(t.title),
          description: t.description ? this.sanitizeTaskText(t.description) : undefined,
          attachments: t.attachments || [],
        }));
      if (cleaned.length !== parsed.length) {
        this.saveTasks(cleaned);
        return cleaned;
      }
      return cleaned;
    } catch (e) {
      console.error('Error loading tasks:', e);
      return [];
    }
  }

  static saveTasks(tasks: TaskItem[]): void {
    const sanitized = tasks.map(t => ({
      ...t,
      title: this.sanitizeTaskText(t.title),
      description: t.description ? this.sanitizeTaskText(t.description) : undefined,
      attachments: t.attachments || [],
    }));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(sanitized));
  }

  static getTasksForDate(date: string): TaskItem[] {
    const tasks = this.getTasks();
    return tasks.filter(t => t.date === date);
  }

  static saveTask(task: TaskItem): void {
    const sanitized: TaskItem = {
      ...task,
      title: this.sanitizeTaskText(task.title),
      description: task.description ? this.sanitizeTaskText(task.description) : undefined,
      attachments: task.attachments || [],
    };
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === sanitized.id);
    const isNew = index < 0;
    const wasCompleted = !isNew && tasks[index].status === 'completed';
    const isNowCompleted = sanitized.status === 'completed';

    if (index >= 0) {
      tasks[index] = { ...sanitized, updatedAt: new Date().toISOString() };
    } else {
      tasks.push({ ...sanitized, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.saveTasks(tasks);

    try {
      if (isNew) {
        AnalyticsService.trackEvent('task_created', `Task created: ${sanitized.title.slice(0, 30)}`, sanitized.priority);
      } else if (!wasCompleted && isNowCompleted) {
        AnalyticsService.trackEvent('task_completed', `Task completed: ${sanitized.title.slice(0, 30)}`, sanitized.priority);
      }
    } catch {
      // safe fallback
    }

    try {
      import('./googleAuthService').then(({ GoogleAuthService }) => {
        if (GoogleAuthService.isAuthenticated()) {
          GoogleAuthService.triggerDriveSync().catch(() => {});
        }
      });
    } catch {
      // ignore
    }
  }

  static deleteTask(id: string): void {
    const tasks = this.getTasks().filter(t => t.id !== id);
    this.saveTasks(tasks);
    try {
      import('./googleAuthService').then(({ GoogleAuthService }) => {
        if (GoogleAuthService.isAuthenticated()) {
          GoogleAuthService.triggerDriveSync().catch(() => {});
        }
      });
    } catch {
      // ignore
    }
  }

  // --- DIARY ENTRIES ---
  static getDiaryEntries(): Record<string, DiaryEntry> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DIARY);
      if (!data) {
        return {};
      }
      const parsed: Record<string, DiaryEntry> = JSON.parse(data);
      // Cleanse any legacy mock seed diary entries
      let modified = false;
      for (const key of Object.keys(parsed)) {
        if (parsed[key].content && (parsed[key].content.toLowerCase().includes('shdip') || parsed[key].content.toLowerCase().includes('teams to discuss deployment'))) {
          delete parsed[key];
          modified = true;
        }
      }
      if (modified) {
        this.saveDiaryEntries(parsed);
      }
      return parsed;
    } catch (e) {
      console.error('Error loading diary entries:', e);
      return {};
    }
  }

  static saveDiaryEntries(entries: Record<string, DiaryEntry>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DIARY, JSON.stringify(entries));
    } catch (e) {
      console.warn('Quota warning while saving diary entries, attempting safe fallback:', e);
      try {
        localStorage.setItem(STORAGE_KEYS.DIARY, JSON.stringify(entries));
      } catch {
        // Safe catch
      }
    }
  }

  static getDiaryForDate(date: string): DiaryEntry {
    const entries = this.getDiaryEntries();
    if (entries[date]) {
      return entries[date];
    }
    return {
      id: `diary-${date}`,
      date,
      content: '',
      mood: 'good',
      attachments: [],
      tags: [],
      updatedAt: new Date().toISOString(),
    };
  }

  static saveDiaryForDate(entry: DiaryEntry): void {
    const entries = this.getDiaryEntries();
    entries[entry.date] = { ...entry, updatedAt: new Date().toISOString() };
    this.saveDiaryEntries(entries);
    try {
      AnalyticsService.trackEvent('diary_written', `Diary updated for ${entry.date}`, entry.mood);
    } catch {
      // safe fallback
    }
  }

  // --- PROJECTS ---
  static getProjects(): Project[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (!data) {
        this.saveProjects(INITIAL_PROJECTS);
        return INITIAL_PROJECTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PROJECTS;
    }
  }

  static saveProjects(projects: Project[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch {
      // ignore
    }
  }

  // --- DEDUPLICATED FILE REGISTRY & SHA-256 COMPUTATION ---
  static getFileRegistry(): DeduplicatedFileRegistry {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FILES);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  static saveFileRegistry(registry: DeduplicatedFileRegistry): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(registry));
    } catch (e) {
      console.warn('File registry quota reached, storing metadata with lightweight previews:', e);
      try {
        const trimmed: DeduplicatedFileRegistry = {};
        Object.entries(registry).forEach(([k, v]) => {
          trimmed[k] = { ...v, dataUrl: undefined };
        });
        localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(trimmed));
      } catch {
        // ignore
      }
    }
  }

  /**
   * Generates a lightweight, compact preview thumbnail URL for image files (<5MB)
   * to guarantee zero localStorage quota exceptions while displaying crisp thumbnails.
   * For non-images or large files (like a 2GB video/movie), returns empty string
   * so localStorage quota is NEVER exceeded.
   */
  static async createOptimizedPreviewUrl(file: File): Promise<string> {
    // Large files or non-images must NEVER be converted to base64 for localStorage
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      return '';
    }

    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');

      img.onload = () => {
        try {
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.75);
            resolve(compressed);
            return;
          }
        } catch {
          // fallback
        }
        resolve(img.src);
      };

      img.onerror = () => {
        resolve('');
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Computes SHA-256 checksum of an ArrayBuffer in the browser using Web Crypto API
   */
  static async computeSHA256(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Computes a resilient content hash for any file.
   * For large files (e.g. 2GB movies), samples chunk slices without loading gigabytes into RAM.
   */
  static async computeFileHash(file: File): Promise<string> {
    if (file.size <= 10 * 1024 * 1024) {
      const buffer = await file.arrayBuffer();
      return this.computeSHA256(buffer);
    }
    // High-performance chunked sampling for large files (movies, large videos, ISOs)
    const sliceStart = file.slice(0, 2 * 1024 * 1024);
    const sliceEnd = file.slice(Math.max(0, file.size - 2 * 1024 * 1024));
    const [bufStart, bufEnd] = await Promise.all([sliceStart.arrayBuffer(), sliceEnd.arrayBuffer()]);
    const metaString = `${file.name}-${file.size}-${file.lastModified}`;
    const enc = new TextEncoder().encode(metaString);
    const combined = new Uint8Array(bufStart.byteLength + bufEnd.byteLength + enc.byteLength);
    combined.set(new Uint8Array(bufStart), 0);
    combined.set(new Uint8Array(bufEnd), bufStart.byteLength);
    combined.set(enc, bufStart.byteLength + bufEnd.byteLength);
    return this.computeSHA256(combined.buffer);
  }

  /**
   * Attaches a file to a specific date entry with automatic deduplication.
   */
  static async attachFileToDate(
    file: File,
    targetDate: string
  ): Promise<DeduplicationResult> {
    return this.processAndDeduplicateFile(file, targetDate);
  }

  /**
   * Handles smart file deduplication and file versioning:
   * 1. Exact Duplicate (matching SHA-256 hash):
   *    - Does NOT re-upload to Google Drive if already present. Re-uses existing Drive file!
   *    - Links target date into registry.
   * 2. Updated File (same filename, different content hash):
   *    - Keeps BOTH latest file AND old file in registry!
   *    - Marks new file with isUpdated: true, version: (prevVersion + 1), and records updatedFromId/updatedFromName.
   *    - Marks old file with supersededBy: newId.
   * 3. Brand New File:
   *    - Registers with version: 1.
   */
  static async processAndDeduplicateFile(
    file: File,
    targetDate: string
  ): Promise<DeduplicationResult> {
    const hash = await this.computeFileHash(file);
    const registry = this.getFileRegistry();
    const dataUrl = await this.createOptimizedPreviewUrl(file);
    const category = this.categorizeFile(file.name, file.type);

    // --- CASE 1: EXACT DUPLICATE (Matching SHA-256 Hash) ---
    if (registry[hash]) {
      const existing = registry[hash];
      if (!existing.datesUsed.includes(targetDate)) {
        existing.datesUsed.push(targetDate);
      }
      existing.updatedAt = new Date().toISOString();
      if (dataUrl && !existing.dataUrl) existing.dataUrl = dataUrl;
      existing.name = file.name;
      if (!existing.category) existing.category = category;

      // Cleanse legacy fake driveId
      if (existing.driveId && (existing.driveId.startsWith('file-') || existing.driveId.length < 15)) {
        delete existing.driveId;
      }

      registry[hash] = existing;
      this.saveFileRegistry(registry);

      const isAuthenticDriveId = !!(
        existing.driveId &&
        !existing.driveId.startsWith('file-') &&
        /^[a-zA-Z0-9_-]{15,}$/.test(existing.driveId)
      );

      const attachment: FileAttachment = {
        id: `file-${hash.slice(0, 12)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: existing.dataUrl || dataUrl,
        driveId: isAuthenticDriveId ? existing.driveId : undefined,
        uploadError: isAuthenticDriveId ? undefined : existing.uploadError,
        category: existing.category || category,
        hash,
        uploadedAt: existing.updatedAt || new Date().toISOString(),
        version: existing.version || 1,
        isUpdated: existing.isUpdated,
        updatedFromId: existing.updatedFromId,
        updatedFromName: existing.updatedFromName,
        updatedFromHash: existing.updatedFromHash,
        supersededBy: existing.supersededBy,
      };

      try {
        AnalyticsService.trackEvent('file_uploaded', `Re-used existing file: ${file.name}`, category);
      } catch {
        // safe fallback
      }

      return {
        attachment,
        isDuplicate: true,
        isUpdate: false,
        existingDriveId: isAuthenticDriveId ? existing.driveId : undefined,
      };
    }

    // --- CASE 2: UPDATED FILE (Same filename, different content hash) ---
    const normalizedName = file.name.trim().toLowerCase();
    const existingSameNameItem = Object.values(registry).find(
      (item) => item.name.trim().toLowerCase() === normalizedName && item.hash !== hash
    );

    if (existingSameNameItem) {
      const prevVersion = existingSameNameItem.version || 1;
      const nextVersion = prevVersion + 1;
      const prevId = `file-${existingSameNameItem.hash.slice(0, 12)}`;
      const newId = `file-${hash.slice(0, 12)}`;

      // Update old file in registry to record that it was superseded, BUT KEEP IT!
      registry[existingSameNameItem.hash] = {
        ...existingSameNameItem,
        supersededBy: newId,
        updatedAt: new Date().toISOString(),
      };

      // Register the updated file
      registry[hash] = {
        hash,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        category,
        firstDate: targetDate,
        datesUsed: [targetDate],
        updatedAt: new Date().toISOString(),
        version: nextVersion,
        isUpdated: true,
        updatedFromId: prevId,
        updatedFromName: existingSameNameItem.name,
        updatedFromHash: existingSameNameItem.hash,
      };

      this.saveFileRegistry(registry);

      const attachment: FileAttachment = {
        id: newId,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        category,
        hash,
        uploadedAt: new Date().toISOString(),
        version: nextVersion,
        isUpdated: true,
        updatedFromId: prevId,
        updatedFromName: existingSameNameItem.name,
        updatedFromHash: existingSameNameItem.hash,
      };

      try {
        AnalyticsService.trackEvent('file_uploaded', `Updated version v${nextVersion}: ${file.name}`, category);
      } catch {
        // safe fallback
      }

      return {
        attachment,
        isDuplicate: false,
        isUpdate: true,
        updatedFrom: {
          id: prevId,
          name: existingSameNameItem.name,
          hash: existingSameNameItem.hash,
          version: prevVersion,
        },
      };
    }

    // --- CASE 3: BRAND NEW FILE ---
    const newId = `file-${hash.slice(0, 12)}`;
    registry[hash] = {
      hash,
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl,
      category,
      firstDate: targetDate,
      datesUsed: [targetDate],
      updatedAt: new Date().toISOString(),
      version: 1,
      isUpdated: false,
    };
    this.saveFileRegistry(registry);

    const attachment: FileAttachment = {
      id: newId,
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl,
      category,
      hash,
      uploadedAt: new Date().toISOString(),
      version: 1,
      isUpdated: false,
    };

    try {
      AnalyticsService.trackEvent('file_uploaded', `Uploaded: ${file.name}`, category);
    } catch {
      // safe fallback
    }

    return {
      attachment,
      isDuplicate: false,
      isUpdate: false,
    };
  }

  static deleteDiaryAttachment(targetDate: string, fileId: string): boolean {
    const entry = this.getDiaryForDate(targetDate);
    const toDelete = entry.attachments.find(a => a.id === fileId);
    if (!toDelete) return false;

    entry.attachments = entry.attachments.filter(a => a.id !== fileId);
    entry.updatedAt = new Date().toISOString();
    this.saveDiaryForDate(entry);

    // Update file registry to remove reference or remove completely if no longer used
    const registry = this.getFileRegistry();
    if (registry[toDelete.hash]) {
      registry[toDelete.hash].datesUsed = (registry[toDelete.hash].datesUsed || []).filter(d => d !== targetDate);
      if (registry[toDelete.hash].datesUsed.length === 0) {
        delete registry[toDelete.hash];
      }
      this.saveFileRegistry(registry);
    }
    return true;
  }

  // --- GOOGLE DRIVE INTEGRATION STATE ---
  static getGoogleDriveState(): GoogleDriveState {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GDRIVE);
      return data ? JSON.parse(data) : { isConnected: false, isSyncing: false };
    } catch {
      return { isConnected: false, isSyncing: false };
    }
  }

  static saveGoogleDriveState(state: GoogleDriveState): void {
    localStorage.setItem(STORAGE_KEYS.GDRIVE, JSON.stringify(state));
  }

  // --- CHATGPT-STYLE CONVERSATIONS & SESSIONS ---
  static getChatSessions(): ChatSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
      if (!data) {
        const initialSession: ChatSession = {
          id: 'session-default',
          title: 'Welcome to Tasker Omni-AI',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [
            {
              id: 'msg-welcome',
              sender: 'assistant',
              content: `Hello! I am your **Tasker Omni-AI Assistant**. I have complete indexed knowledge of your tasks, diary entries, files, and project schedules across all dates.\n\nYou can ask me questions, attach photos or documents, brainstorm, or explore cross-date timelines. All our conversations and media are saved here just like ChatGPT!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ],
        };
        this.saveChatSessions([initialSession]);
        return [initialSession];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveChatSessions(sessions: ChatSession[]): void {
    localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
    try {
      import('./googleAuthService').then(({ GoogleAuthService }) => {
        if (GoogleAuthService.isAuthenticated()) {
          GoogleAuthService.triggerDriveSync().catch(() => {});
        }
      });
    } catch {
      // ignore
    }
  }

  static getActiveChatId(): string {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT_ID);
    const sessions = this.getChatSessions();
    if (id && sessions.some(s => s.id === id)) {
      return id;
    }
    return sessions[0]?.id || 'session-default';
  }

  static setActiveChatId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT_ID, id);
  }

  static createChatSession(title: string = 'New Conversation'): ChatSession {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    const sessions = [newSession, ...this.getChatSessions()];
    this.saveChatSessions(sessions);
    this.setActiveChatId(newSession.id);
    return newSession;
  }

  static updateChatSession(session: ChatSession): void {
    const sessions = this.getChatSessions().map(s => s.id === session.id ? session : s);
    this.saveChatSessions(sessions);
  }

  static deleteChatSession(id: string): ChatSession[] {
    const sessions = this.getChatSessions().filter(s => s.id !== id);
    if (sessions.length === 0) {
      const defaultS: ChatSession = {
        id: `session-${Date.now()}`,
        title: 'New Conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      sessions.push(defaultS);
    }
    this.saveChatSessions(sessions);
    if (this.getActiveChatId() === id) {
      this.setActiveChatId(sessions[0].id);
    }
    return sessions;
  }

  static clearAllChatSessions(): void {
    localStorage.removeItem(STORAGE_KEYS.CHAT_SESSIONS);
    this.getChatSessions(); // will seed new default
  }

  /**
   * Universal Export to JSON (Backup)
   */
  static exportFullBackup(): string {
    const backup = {
      exportedAt: new Date().toISOString(),
      version: '2.0',
      tasks: this.getTasks(),
      diary: this.getDiaryEntries(),
      projects: this.getProjects(),
      fileRegistry: this.getFileRegistry(),
      chatSessions: this.getChatSessions(),
    };
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Import from JSON (Restore)
   */
  static importFullBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.tasks) this.saveTasks(data.tasks);
      if (data.diary) this.saveDiaryEntries(data.diary);
      if (data.projects) this.saveProjects(data.projects);
      if (data.fileRegistry) this.saveFileRegistry(data.fileRegistry);
      if (data.chatSessions) this.saveChatSessions(data.chatSessions);
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  }
}
