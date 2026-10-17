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
        // Return default welcome tasks
        const today = new Date().toISOString().split('T')[0];
        const defaultTasks: TaskItem[] = [
          {
            id: 'task-1',
            title: 'Design transaction tables architecture in project shdip',
            description: 'Define schema, mapping rules, and relational indices for transaction persistence.',
            date: today,
            startTime: '10:00',
            endTime: '11:30',
            priority: 'high',
            status: 'in_progress',
            projectId: 'proj-work',
            tags: ['architecture', 'database', 'shdip'],
            subtasks: [
              { id: 'sub-1', title: 'Complete schema mapping', completed: true },
              { id: 'sub-2', title: 'Data flow analysis', completed: true },
              { id: 'sub-3', title: 'Execute unit testing', completed: false },
            ],
            alarmEnabled: true,
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'task-2',
            title: 'Weekly sprint review & client check-in',
            description: 'Teams video conference with stakeholders.',
            date: today,
            startTime: '14:00',
            endTime: '15:00',
            priority: 'urgent',
            status: 'todo',
            projectId: 'proj-work',
            tags: ['meeting', 'teams'],
            subtasks: [],
            alarmEnabled: true,
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'task-3',
            title: '30-minute evening outdoor run',
            description: 'Cardio workout and stretching.',
            date: today,
            startTime: '17:30',
            endTime: '18:15',
            priority: 'medium',
            status: 'todo',
            projectId: 'proj-health',
            tags: ['workout', 'cardio'],
            subtasks: [],
            alarmEnabled: false,
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ];
        this.saveTasks(defaultTasks);
        return defaultTasks;
      }
      return JSON.parse(data);
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
  }

  static deleteTask(id: string): void {
    const tasks = this.getTasks().filter(t => t.id !== id);
    this.saveTasks(tasks);
  }

  // --- DIARY ENTRIES ---
  static getDiaryEntries(): Record<string, DiaryEntry> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DIARY);
      if (!data) {
        const today = new Date().toISOString().split('T')[0];
        const initialDiary: Record<string, DiaryEntry> = {
          [today]: {
            id: `diary-${today}`,
            date: today,
            content: `Productive day today. Completed transaction mapping analysis for project shdip. Meeting scheduled this afternoon on Teams to discuss deployment timelines. Need to make sure unit tests are completed tomorrow morning before release.`,
            mood: 'great',
            attachments: [],
            aiSummary: 'Worked on project shdip transaction tables mapping and analysis. Prepping for unit testing.',
            tags: ['shdip', 'milestone'],
            updatedAt: new Date().toISOString(),
          }
        };
        this.saveDiaryEntries(initialDiary);
        return initialDiary;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error loading diary entries:', e);
      return {};
    }
  }

  static saveDiaryEntries(entries: Record<string, DiaryEntry>): void {
    localStorage.setItem(STORAGE_KEYS.DIARY, JSON.stringify(entries));
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
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
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
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(registry));
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
    const buffer = await file.arrayBuffer();
    const hash = await this.computeSHA256(buffer);
    const registry = this.getFileRegistry();

    // Convert file to Base64 data URL for local display/offline storage
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const isDuplicate = !!registry[hash];

    if (isDuplicate) {
      const existing = registry[hash];
      if (!existing.datesUsed.includes(targetDate)) {
        existing.datesUsed.push(targetDate);
      }
      existing.updatedAt = new Date().toISOString();
      existing.dataUrl = dataUrl; // Keep latest content
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
