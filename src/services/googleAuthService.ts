import { GoogleAccount, GoogleDriveState } from '../types';
import { StorageService } from './storageService';

const GOOGLE_AUTH_STORAGE_KEY = 'tasker_google_auth_v1';

export class GoogleAuthService {
  private static defaultAccounts: GoogleAccount[] = [
    {
      id: 'acc-primary',
      email: 'mouli.workspace@gmail.com',
      name: 'Mouli User (Google Account X)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      addedAt: new Date().toISOString(),
      isPrimary: true,
    },
  ];

  static getDriveState(): GoogleDriveState {
    const raw = StorageService.getGoogleDriveState();
    if (!raw.accounts || raw.accounts.length === 0) {
      const initial: GoogleDriveState = {
        isConnected: true,
        userEmail: this.defaultAccounts[0].email,
        userName: this.defaultAccounts[0].name,
        userAvatar: this.defaultAccounts[0].avatarUrl,
        folderId: 'tasker-app-data-vault-01',
        lastSyncedAt: new Date().toISOString(),
        isSyncing: false,
        accounts: this.defaultAccounts,
        activeStorageAccountEmail: this.defaultAccounts[0].email,
      };
      StorageService.saveGoogleDriveState(initial);
      return initial;
    }
    return raw;
  }

  static getActiveAccount(): GoogleAccount {
    const state = this.getDriveState();
    const active = state.accounts.find(a => a.email === state.activeStorageAccountEmail);
    return active || state.accounts[0] || this.defaultAccounts[0];
  }

  static getAllAccounts(): GoogleAccount[] {
    return this.getDriveState().accounts;
  }

  static signInWithGoogle(email: string, name?: string): GoogleAccount {
    const state = this.getDriveState();
    const existing = state.accounts.find(a => a.email.toLowerCase() === email.toLowerCase());

    const accountName = name || email.split('@')[0].replace(/[._]/g, ' ').toUpperCase();
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(accountName)}&background=6366f1&color=fff`;

    if (existing) {
      state.isConnected = true;
      state.userEmail = existing.email;
      state.userName = existing.name;
      state.userAvatar = existing.avatarUrl;
      state.activeStorageAccountEmail = existing.email;
      state.lastSyncedAt = new Date().toISOString();
      StorageService.saveGoogleDriveState(state);
      return existing;
    }

    const newAcc: GoogleAccount = {
      id: `acc-${Date.now()}`,
      email,
      name: accountName,
      avatarUrl: avatar,
      addedAt: new Date().toISOString(),
      isPrimary: state.accounts.length === 0,
    };

    const updatedAccounts = [...state.accounts, newAcc];
    const newState: GoogleDriveState = {
      ...state,
      isConnected: true,
      userEmail: newAcc.email,
      userName: newAcc.name,
      userAvatar: newAcc.avatarUrl,
      activeStorageAccountEmail: newAcc.email,
      accounts: updatedAccounts,
      lastSyncedAt: new Date().toISOString(),
    };

    StorageService.saveGoogleDriveState(newState);
    return newAcc;
  }

  static addGoogleAccount(email: string, name?: string): GoogleAccount {
    return this.signInWithGoogle(email, name);
  }

  static setActiveStorageAccount(email: string): boolean {
    const state = this.getDriveState();
    const found = state.accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!found) return false;

    state.activeStorageAccountEmail = found.email;
    state.userEmail = found.email;
    state.userName = found.name;
    state.userAvatar = found.avatarUrl;
    state.lastSyncedAt = new Date().toISOString();
    StorageService.saveGoogleDriveState(state);
    return true;
  }

  static removeAccount(email: string): void {
    const state = this.getDriveState();
    const filtered = state.accounts.filter(a => a.email.toLowerCase() !== email.toLowerCase());
    state.accounts = filtered;

    if (state.activeStorageAccountEmail?.toLowerCase() === email.toLowerCase()) {
      if (filtered.length > 0) {
        state.activeStorageAccountEmail = filtered[0].email;
        state.userEmail = filtered[0].email;
        state.userName = filtered[0].name;
        state.userAvatar = filtered[0].avatarUrl;
      } else {
        state.isConnected = false;
        state.activeStorageAccountEmail = undefined;
        state.userEmail = undefined;
        state.userName = undefined;
      }
    }

    StorageService.saveGoogleDriveState(state);
  }

  static triggerDriveSync(): Promise<boolean> {
    const state = this.getDriveState();
    state.isSyncing = true;
    StorageService.saveGoogleDriveState(state);

    return new Promise((resolve) => {
      setTimeout(() => {
        const updated = this.getDriveState();
        updated.isSyncing = false;
        updated.lastSyncedAt = new Date().toISOString();
        StorageService.saveGoogleDriveState(updated);
        resolve(true);
      }, 1200);
    });
  }

  static isAuthenticated(): boolean {
    const raw = localStorage.getItem('tasker_google_authenticated_v1');
    if (raw === null) {
      const state = this.getDriveState();
      return state.isConnected && !!state.userEmail;
    }
    return raw === 'true';
  }

  static setAuthenticated(auth: boolean): void {
    localStorage.setItem('tasker_google_authenticated_v1', auth ? 'true' : 'false');
  }

  static signOut(): void {
    this.setAuthenticated(false);
  }
}
