export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // base64 or blob url
  driveId?: string; // Google Drive file ID ONLY if successfully synced to Drive
  uploadError?: string; // Real Google Drive error message if upload failed
  category?: string; // Subfolder category (e.g. Videos, Documents, Images, etc.)
  hash: string; // SHA-256 content hash for deduplication
  uploadedAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm (e.g., "09:30")
  endTime?: string; // HH:mm (e.g., "10:30")
  priority: Priority;
  status: TaskStatus;
  projectId?: string;
  tags: string[];
  subtasks: Subtask[];
  alarmEnabled: boolean;
  notified15m?: boolean;
  notified5m?: boolean;
  attachments: FileAttachment[];
  createdAt: string;
  updatedAt: string;
}

export type Mood = 'great' | 'good' | 'neutral' | 'challenging' | 'stressful';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  linkedDates?: string[];
  media?: FileAttachment[]; // Attached images/documents like ChatGPT
  artifacts?: {
    type: 'mindmap' | 'image' | 'document';
    content: string;
    caption?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  pinned?: boolean;
}

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  mood?: Mood;
  voiceNotes?: string[];
  attachments: FileAttachment[];
  aiSummary?: string;
  tags: string[];
  chatHistory?: ChatMessage[]; // Full AI conversation saved specifically with this diary
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface DeduplicatedFileRegistry {
  [hash: string]: {
    hash: string;
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
    driveId?: string;
    uploadError?: string;
    category?: string;
    firstDate: string;
    datesUsed: string[];
    updatedAt: string;
  };
}

export type AIProvider = 'gemini' | 'groq' | 'openai' | 'custom';

export interface CustomAIConfig {
  providerName: string; // e.g. "xAI Grok", "DeepSeek", "OpenRouter"
  baseUrl: string; // e.g. "https://api.x.ai/v1"
  modelName: string; // e.g. "grok-2-latest"
  apiKey: string;
}

export interface AIState {
  activeProvider: AIProvider;
  apiKeys: {
    gemini?: string;
    groq?: string;
    openai?: string;
  };
  selectedModels: {
    gemini?: string;
    groq?: string;
    openai?: string;
  };
  discoveredModels: {
    gemini: string[];
    groq: string[];
    openai: string[];
  };
  customConfig: CustomAIConfig;
}

export interface GoogleAccount {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  accessToken?: string;
  tokenExpiresAt?: number;
  addedAt: string;
  isPrimary?: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
  status: 'initiating' | 'uploading' | 'finalizing' | 'completed' | 'error';
  speed?: string;
  errorMessage?: string;
}

export interface GoogleDriveState {
  isConnected: boolean;
  clientId?: string;
  accessToken?: string;
  secondaryToken?: string;
  tokenExpiresAt?: number;
  secondaryTokenExpiresAt?: number;
  lastRotatedAt?: string;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  folderId?: string;
  subfolderIds?: Record<string, string>;
  lastSyncedAt?: string;
  isSyncing: boolean;
  accounts: GoogleAccount[];
  activeStorageAccountEmail?: string;
}

export interface EncryptedBackupBundle {
  format: 'TASKER_ENCRYPTED_BACKUP';
  version: '2.0';
  createdAt: string;
  createdByEmail: string;
  salt: string; // Base64 16-byte random salt
  iv: string; // Base64 12-byte AES-GCM IV
  ciphertext: string; // Base64 AES-GCM ciphertext
  checksum: string; // SHA-256 integrity hash of raw JSON
  summary: {
    tasksCount: number;
    diaryCount: number;
    filesCount: number;
    conversationsCount: number;
  };
}

export interface RawBackupData {
  version: '2.0';
  exportedAt: string;
  exportedBy: string;
  tasks: TaskItem[];
  diary: Record<string, DiaryEntry>;
  projects: Project[];
  fileRegistry: DeduplicatedFileRegistry;
  globalChat?: ChatMessage[];
  chatSessions?: ChatSession[]; // ChatGPT-style sessions with all conversation media
  diaryChats?: Record<string, ChatMessage[]>;
}

