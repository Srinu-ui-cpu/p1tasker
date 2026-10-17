import { EncryptedBackupBundle, RawBackupData, TaskItem, DiaryEntry } from '../types';
import { StorageService } from './storageService';
import { GoogleAuthService } from './googleAuthService';

export class BackupService {
  // --- HELPER BUFFERS TO/FROM BASE64 ---
  private static bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private static base64ToBuffer(b64: string): Uint8Array {
    const binary = window.atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private static async computeSha256(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private static async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generates a fully encrypted backup bundle protected with the user's secret key
   */
  static async createEncryptedBackup(passphraseKey: string, customCreatorEmail?: string): Promise<{ bundle: EncryptedBackupBundle; jsonString: string; filename: string }> {
    if (!passphraseKey || passphraseKey.trim().length === 0) {
      throw new Error('A security passphrase key is strictly required to encrypt the backup.');
    }

    const activeAccount = GoogleAuthService.getActiveAccount();
    const creatorEmail = customCreatorEmail || activeAccount.email || 'accountX@gmail.com';

    // 1. Gather all system data
    const tasks = StorageService.getTasks();
    const diary = StorageService.getDiaryEntries();
    const projects = StorageService.getProjects();
    const fileRegistry = StorageService.getFileRegistry();
    const chatSessions = StorageService.getChatSessions();

    const rawData: RawBackupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      exportedBy: creatorEmail,
      tasks,
      diary,
      projects,
      fileRegistry,
      chatSessions,
    };

    const rawJson = JSON.stringify(rawData);
    const checksum = await this.computeSha256(rawJson);

    // 2. Cryptographic Salt & IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 3. Key derivation & AES-GCM Encryption
    const key = await this.deriveKey(passphraseKey, salt);
    const enc = new TextEncoder();
    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(rawJson)
    );

    // 4. Construct bundle
    const bundle: EncryptedBackupBundle = {
      format: 'TASKER_ENCRYPTED_BACKUP',
      version: '2.0',
      createdAt: new Date().toISOString(),
      createdByEmail: creatorEmail,
      salt: this.bufferToBase64(salt),
      iv: this.bufferToBase64(iv),
      ciphertext: this.bufferToBase64(ciphertextBuffer),
      checksum,
      summary: {
        tasksCount: tasks.length,
        diaryCount: Object.keys(diary).length,
        filesCount: Object.keys(fileRegistry).length,
        conversationsCount: chatSessions.length + Object.values(diary).filter(d => d.chatHistory && d.chatHistory.length > 0).length,
      },
    };

    const jsonString = JSON.stringify(bundle, null, 2);
    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = `tasker_vault_backup_${dateStamp}.taskerbackup`;

    return { bundle, jsonString, filename };
  }

  /**
   * Directly saves and syncs the encrypted backup bundle to Google Drive Vault
   */
  static async saveEncryptedBackupToDrive(passphraseKey: string): Promise<{ filename: string; bundle: EncryptedBackupBundle }> {
    const { bundle, jsonString, filename } = await this.createEncryptedBackup(passphraseKey);
    localStorage.setItem('tasker_drive_encrypted_backup_vault', jsonString);
    await GoogleAuthService.triggerDriveSync();
    return { filename, bundle };
  }

  /**
   * Retrieves the latest encrypted backup bundle stored in Google Drive Vault
   */
  static getEncryptedBackupFromDrive(): { jsonString: string; bundle: EncryptedBackupBundle } | null {
    const jsonString = localStorage.getItem('tasker_drive_encrypted_backup_vault');
    if (!jsonString) return null;
    try {
      const bundle = JSON.parse(jsonString) as EncryptedBackupBundle;
      return { jsonString, bundle };
    } catch {
      return null;
    }
  }

  /**
   * Triggers download of the encrypted backup file to the user's computer
   */
  static downloadBackupFile(jsonString: string, filename: string): void {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Decrypts an uploaded backup bundle using the secret key provided by Account X
   */
  static async verifyAndDecryptBackup(
    fileContent: string,
    passphraseKey: string
  ): Promise<{ data: RawBackupData; bundle: EncryptedBackupBundle }> {
    let bundle: EncryptedBackupBundle;
    try {
      bundle = JSON.parse(fileContent);
    } catch {
      throw new Error('Invalid file format. Please upload a valid .taskerbackup or JSON file.');
    }

    if (bundle.format !== 'TASKER_ENCRYPTED_BACKUP' || !bundle.ciphertext || !bundle.salt || !bundle.iv) {
      // Check if it's an unencrypted legacy backup
      if ('tasks' in (bundle as unknown as Record<string, unknown>)) {
        return {
          data: bundle as unknown as RawBackupData,
          bundle: {
            format: 'TASKER_ENCRYPTED_BACKUP',
            version: '2.0',
            createdAt: new Date().toISOString(),
            createdByEmail: 'Legacy Backup',
            salt: '',
            iv: '',
            ciphertext: '',
            checksum: '',
            summary: {
              tasksCount: ((bundle as unknown as RawBackupData).tasks || []).length,
              diaryCount: Object.keys((bundle as unknown as RawBackupData).diary || {}).length,
              filesCount: Object.keys((bundle as unknown as RawBackupData).fileRegistry || {}).length,
              conversationsCount: 0,
            },
          },
        };
      }
      throw new Error('Unrecognized backup format. This is not a Tasker OS backup file.');
    }

    if (!passphraseKey || passphraseKey.trim().length === 0) {
      throw new Error('Please enter the security key provided by the backup creator.');
    }

    try {
      const salt = this.base64ToBuffer(bundle.salt);
      const iv = this.base64ToBuffer(bundle.iv);
      const ciphertext = this.base64ToBuffer(bundle.ciphertext);

      const key = await this.deriveKey(passphraseKey, salt);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      const dec = new TextDecoder();
      const rawJson = dec.decode(decryptedBuffer);

      // Verify integrity checksum
      const computedHash = await this.computeSha256(rawJson);
      if (bundle.checksum && computedHash !== bundle.checksum) {
        throw new Error('Backup integrity verification failed (checksum mismatch). File may be corrupted.');
      }

      const data: RawBackupData = JSON.parse(rawJson);
      return { data, bundle };
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'OperationError' || error.message.includes('operation')) {
        throw new Error(
          `❌ Invalid Security Key! Decryption failed. Please verify the key with the creator (${bundle.createdByEmail}).`
        );
      }
      throw error;
    }
  }

  /**
   * Applies the decrypted data to the current account and triggers Drive sync
   */
  static restoreBackupData(
    data: RawBackupData,
    mode: 'merge' | 'replace'
  ): { tasksCount: number; diaryCount: number; filesCount: number } {
    if (mode === 'replace') {
      StorageService.saveTasks(data.tasks || []);
      StorageService.saveDiaryEntries(data.diary || {});
      if (data.projects) StorageService.saveProjects(data.projects);
      if (data.fileRegistry) StorageService.saveFileRegistry(data.fileRegistry);
      if (data.chatSessions) StorageService.saveChatSessions(data.chatSessions);
    } else {
      // Merge mode
      const existingTasks = StorageService.getTasks();
      const existingMap = new Map(existingTasks.map(t => [t.id, t]));
      (data.tasks || []).forEach(t => existingMap.set(t.id, t));
      StorageService.saveTasks(Array.from(existingMap.values()));

      const existingDiary = StorageService.getDiaryEntries();
      const mergedDiary = { ...existingDiary, ...(data.diary || {}) };
      StorageService.saveDiaryEntries(mergedDiary);

      const existingFiles = StorageService.getFileRegistry();
      const mergedFiles = { ...existingFiles, ...(data.fileRegistry || {}) };
      StorageService.saveFileRegistry(mergedFiles);

      if (data.chatSessions) {
        const existingSessions = StorageService.getChatSessions();
        const sessionMap = new Map(existingSessions.map(s => [s.id, s]));
        data.chatSessions.forEach(s => sessionMap.set(s.id, s));
        StorageService.saveChatSessions(Array.from(sessionMap.values()));
      }
    }

    // Trigger Drive sync with the current active Google Account
    GoogleAuthService.triggerDriveSync();

    return {
      tasksCount: (data.tasks || []).length,
      diaryCount: Object.keys(data.diary || {}).length,
      filesCount: Object.keys(data.fileRegistry || {}).length,
    };
  }
}
