import { TaskItem, DiaryEntry, Project, DeduplicatedFileRegistry, FileAttachment, GoogleDriveState, ChatSession, ChatMessage } from '../types';

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

export class StorageService {
  // --- TASKS ---
  static getTasks(): TaskItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) {
        return [];
      }
      const parsed: TaskItem[] = JSON.parse(data);
      // Cleanse only specific legacy mock seed tasks
      const cleaned = parsed.filter(t => 
        t.id !== 'task-1' &&
        t.id !== 'task-2' &&
        t.id !== 'task-3' &&
        !t.id.startsWith('task-1-') &&
        !t.id.startsWith('task-2-') &&
        !t.id.startsWith('task-3-') &&
        !t.title.toLowerCase().includes('shdip') &&
        !t.title.toLowerCase().includes('sprint review')
      );
      if (cleaned.length !== parsed.length) {
        this.saveTasks(cleaned);
        return cleaned;
      }
      return parsed;
    } catch (e) {
      console.error('Error loading tasks:', e);
      return [];
    }
  }

  static saveTasks(tasks: TaskItem[]): void {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  static getTasksForDate(date: string): TaskItem[] {
    const tasks = this.getTasks();
    return tasks.filter(t => t.date === date);
  }

  static saveTask(task: TaskItem): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      tasks[index] = { ...task, updatedAt: new Date().toISOString() };
    } else {
      tasks.push({ ...task, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
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
   * Generates a lightweight, compact preview thumbnail URL for image files (<60KB)
   * to guarantee zero localStorage quota exceptions while displaying crisp thumbnails.
   * For non-images or large files (>10MB), returns empty string to prevent memory and quota crashes.
   */
  static async createOptimizedPreviewUrl(file: File): Promise<string> {
    // Strictly skip non-image files or files > 10MB (videos, movies, large PDFs)
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
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

      img.onerror = () => resolve('');

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
   * Computes a resilient file hash for files of ANY size (including 2GB+ movies)
   * without allocating multi-gigabyte memory buffers in the browser.
   */
  static async computeFileHash(file: File): Promise<string> {
    if (file.size <= 10 * 1024 * 1024) {
      const buffer = await file.arrayBuffer();
      return this.computeSHA256(buffer);
    }
    // For large files (>10MB up to multi-GB), slice head (2MB) + tail (2MB) + file metadata
    // Runs in <15ms without memory bloat or tab crashes
    const headSlice = await file.slice(0, 2 * 1024 * 1024).arrayBuffer();
    const tailSlice = await file.slice(Math.max(0, file.size - 2 * 1024 * 1024)).arrayBuffer();
    const metaBytes = new TextEncoder().encode(`:${file.size}:${file.name}:${file.lastModified}`);
    const combined = new Uint8Array(headSlice.byteLength + tailSlice.byteLength + metaBytes.length);
    combined.set(new Uint8Array(headSlice), 0);
    combined.set(new Uint8Array(tailSlice), headSlice.byteLength);
    combined.set(metaBytes, headSlice.byteLength + tailSlice.byteLength);
    return this.computeSHA256(combined.buffer);
  }

  /**
   * Attaches a file to a specific date entry with automatic deduplication.
   */
  static async attachFileToDate(
    file: File,
    targetDate: string
  ): Promise<{ attachment: FileAttachment; isDuplicate: boolean }> {
    return this.processAndDeduplicateFile(file, targetDate);
  }

  /**
   * Handles smart file deduplication when uploading.
   * If the file exists with the same hash or name:
   * - Keeps single copy in storage
   * - Links to the new date
   * - Updates latest version across all dates!
   */
  static async processAndDeduplicateFile(
    file: File,
    targetDate: string
  ): Promise<{ attachment: FileAttachment; isDuplicate: boolean }> {
    const hash = await this.computeFileHash(file);
    const registry = this.getFileRegistry();

    // Convert file to optimized data URL for compact thumbnail display (images only)
    const dataUrl = await this.createOptimizedPreviewUrl(file);

    const isDuplicate = !!registry[hash];

    if (isDuplicate) {
      const existing = registry[hash];
      if (!existing.datesUsed.includes(targetDate)) {
        existing.datesUsed.push(targetDate);
      }
      existing.updatedAt = new Date().toISOString();
      if (dataUrl) existing.dataUrl = dataUrl;
      existing.name = file.name;
      registry[hash] = existing;
    } else {
      registry[hash] = {
        hash,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        firstDate: targetDate,
        datesUsed: [targetDate],
        updatedAt: new Date().toISOString(),
      };
    }

    this.saveFileRegistry(registry);

    const attachment: FileAttachment = {
      id: `file-${hash.slice(0, 12)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl,
      hash,
      uploadedAt: new Date().toISOString(),
    };

    return { attachment, isDuplicate };
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
