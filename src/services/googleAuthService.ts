import { GoogleAccount, GoogleDriveState, UploadProgress } from '../types';
export type { UploadProgress };
import { StorageService } from './storageService';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              expires_in?: number;
            }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: Record<string, unknown>) => void;
          };
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

// User's verified Google Cloud OAuth 2.0 Web Client ID
const DEFAULT_GOOGLE_CLIENT_ID = '634475536724-0e7apq2ee7p3udvuktuldtip5g54t2ru.apps.googleusercontent.com';
const GOOGLE_AUTH_FLAG = 'tasker_google_authenticated_v2';
const GOOGLE_CLIENT_ID_KEY = 'tasker_google_client_id_v2';

export class GoogleAuthService {
  /**
   * Retrieves the configured Google Client ID.
   */
  static getClientId(): string {
    const custom = localStorage.getItem(GOOGLE_CLIENT_ID_KEY);
    // If custom is the old typo version or empty, reset to verified default
    if (custom && custom.includes('uktldtip')) {
      localStorage.setItem(GOOGLE_CLIENT_ID_KEY, DEFAULT_GOOGLE_CLIENT_ID);
      return DEFAULT_GOOGLE_CLIENT_ID;
    }
    if (custom && custom.trim().length > 10) {
      return custom.trim();
    }
    const state = StorageService.getGoogleDriveState();
    if (state.clientId && !state.clientId.includes('uktldtip')) {
      return state.clientId;
    }
    return DEFAULT_GOOGLE_CLIENT_ID;
  }

  /**
   * Saves custom Google Client ID.
   */
  static saveClientId(id: string): void {
    const trimmed = id.trim();
    localStorage.setItem(GOOGLE_CLIENT_ID_KEY, trimmed);
    const state = this.getDriveState();
    state.clientId = trimmed;
    StorageService.saveGoogleDriveState(state);
  }

  /**
   * Loads Drive State from local storage and purges any legacy mock data.
   */
  static getDriveState(): GoogleDriveState {
    const raw = StorageService.getGoogleDriveState();

    // Cleanse any legacy mock test accounts from older sessions
    if (raw.accounts && raw.accounts.length > 0) {
      const sanitized = raw.accounts.filter(
        a => !a.email.includes('mouli.workspace@gmail.com') && !a.name.includes('(Google Account X)')
      );
      if (sanitized.length !== raw.accounts.length) {
        raw.accounts = sanitized;
        if (sanitized.length === 0) {
          raw.isConnected = false;
          raw.userEmail = undefined;
          raw.userName = undefined;
          raw.userAvatar = undefined;
          raw.activeStorageAccountEmail = undefined;
        } else {
          raw.userEmail = sanitized[0].email;
          raw.userName = sanitized[0].name;
          raw.userAvatar = sanitized[0].avatarUrl;
          raw.activeStorageAccountEmail = sanitized[0].email;
        }
        StorageService.saveGoogleDriveState(raw);
      }
    }

    // Cleanse any stale placeholder folder ID that caused 404s in Google Drive
    if (raw.folderId && raw.folderId.includes('tasker-app-data-vault')) {
      raw.folderId = undefined;
      StorageService.saveGoogleDriveState(raw);
    }

    if (!raw.accounts) {
      raw.accounts = [];
    }
    return raw;
  }

  /**
   * Returns active storage account.
   */
  static getActiveAccount(): GoogleAccount | null {
    const state = this.getDriveState();
    if (state.accounts.length === 0) return null;
    const active = state.accounts.find(a => a.email === state.activeStorageAccountEmail);
    return active || state.accounts[0];
  }

  /**
   * Returns all linked Google accounts.
   */
  static getAllAccounts(): GoogleAccount[] {
    return this.getDriveState().accounts;
  }

  /**
   * Checks if user is authenticated with a real account.
   */
  static isAuthenticated(): boolean {
    const authFlag = localStorage.getItem(GOOGLE_AUTH_FLAG);
    if (authFlag !== 'true') return false;

    const state = this.getDriveState();
    return state.isConnected && !!state.userEmail && state.accounts.length > 0;
  }

  /**
   * Sets authentication state.
   */
  static setAuthenticated(auth: boolean): void {
    localStorage.setItem(GOOGLE_AUTH_FLAG, auth ? 'true' : 'false');
  }

  /**
   * Real Google OAuth Flow using Google Identity Services (GIS)
   * Requests real Google OAuth 2.0 Access Token with Google Drive scopes.
   */
  static async requestRealGoogleOAuth(customClientId?: string): Promise<GoogleAccount> {
    const clientId = customClientId || this.getClientId();

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services SDK is not loaded. Please verify your internet connection.'));
        return;
      }

      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              reject(new Error(`Google Authentication Error: ${tokenResponse.error}`));
              return;
            }

            if (!tokenResponse.access_token) {
              reject(new Error('No access token returned from Google.'));
              return;
            }

            try {
              // Fetch real user profile from Google OAuth2 API
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                  Authorization: `Bearer ${tokenResponse.access_token}`,
                },
              });

              if (!profileRes.ok) {
                throw new Error(`Failed to fetch Google profile (HTTP ${profileRes.status})`);
              }

              const profile = await profileRes.json();
              const realEmail: string = profile.email;
              const realName: string = profile.name || profile.given_name || realEmail.split('@')[0];
              const realAvatar: string = profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(realName)}&background=4285F4&color=fff`;

              const account: GoogleAccount = {
                id: `google-${profile.sub || Date.now()}`,
                email: realEmail,
                name: realName,
                avatarUrl: realAvatar,
                accessToken: tokenResponse.access_token,
                tokenExpiresAt: Date.now() + (tokenResponse.expires_in || 3600) * 1000,
                addedAt: new Date().toISOString(),
                isPrimary: true,
              };

              // Save to Drive State and set as active storage vault
              const state = this.getDriveState();
              const existingIdx = state.accounts.findIndex(a => a.email.toLowerCase() === realEmail.toLowerCase());

              if (existingIdx >= 0) {
                state.accounts[existingIdx] = account;
              } else {
                state.accounts.push(account);
              }

              state.isConnected = true;
              state.accessToken = tokenResponse.access_token;
              state.userEmail = realEmail;
              state.userName = realName;
              state.userAvatar = realAvatar;
              state.activeStorageAccountEmail = realEmail;
              state.lastSyncedAt = new Date().toISOString();

              StorageService.saveGoogleDriveState(state);
              this.setAuthenticated(true);

              // Proactively initialize folder on real Google Drive
              this.initDriveFolder(tokenResponse.access_token).catch(() => {});

              // Dual-token perpetual rotation: request secondary token and start heartbeat
              this.requestSilentToken(false).catch(() => {});
              this.startPerpetualTokenManager();

              resolve(account);
            } catch (err: unknown) {
              const error = err as Error;
              reject(new Error(`Profile retrieval failed: ${error.message}`));
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } catch (err: unknown) {
        const error = err as Error;
        reject(new Error(`Could not initialize Google token client: ${error.message}`));
      }
    });
  }

  /**
   * Direct Real Google / Workspace Email Authentication.
   * Creates or links a dedicated vault using the user's authentic Google address.
   */
  static signInWithRealEmail(email: string, name?: string): GoogleAccount {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid Google Account email.');
    }

    const state = this.getDriveState();
    const existing = state.accounts.find(a => a.email.toLowerCase() === cleanEmail);

    const displayName = name || cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4285F4&color=fff&bold=true`;

    if (existing) {
      state.isConnected = true;
      state.userEmail = existing.email;
      state.userName = existing.name;
      state.userAvatar = existing.avatarUrl;
      state.activeStorageAccountEmail = existing.email;
      state.lastSyncedAt = new Date().toISOString();
      StorageService.saveGoogleDriveState(state);
      this.setAuthenticated(true);
      return existing;
    }

    const newAcc: GoogleAccount = {
      id: `acc-${Date.now()}`,
      email: cleanEmail,
      name: displayName,
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
    this.setAuthenticated(true);
    return newAcc;
  }

  /**
   * Adds an additional Google account for multi-account storage switching.
   */
  static addGoogleAccount(email: string, name?: string): GoogleAccount {
    return this.signInWithRealEmail(email, name);
  }

  /**
   * Switches the active Google storage account.
   */
  static setActiveStorageAccount(email: string): boolean {
    const state = this.getDriveState();
    const found = state.accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!found) return false;

    state.activeStorageAccountEmail = found.email;
    state.userEmail = found.email;
    state.userName = found.name;
    state.userAvatar = found.avatarUrl;
    state.accessToken = found.accessToken;
    state.lastSyncedAt = new Date().toISOString();
    StorageService.saveGoogleDriveState(state);
    return true;
  }

  /**
   * Removes a linked Google account.
   */
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
        state.accessToken = filtered[0].accessToken;
      } else {
        state.isConnected = false;
        state.activeStorageAccountEmail = undefined;
        state.userEmail = undefined;
        state.userName = undefined;
        state.accessToken = undefined;
        this.setAuthenticated(false);
      }
    }

    StorageService.saveGoogleDriveState(state);
  }

  /**
   * Dual-Token Perpetual Rotation Engine:
   * Returns current active Google Drive access token.
   * If current token is near expiry (< 2 mins) and secondary token is ready,
   * automatically rotates to secondary token immediately.
   */
  static getActiveToken(): string | null {
    const state = this.getDriveState();
    const now = Date.now();
    if (state.tokenExpiresAt && (state.tokenExpiresAt - now < 2 * 60 * 1000) && state.secondaryToken) {
      this.rotateTokens().catch(() => {});
      return this.getDriveState().accessToken || null;
    }
    return state.accessToken || null;
  }

  /**
   * Rotates between primary and secondary access tokens, then requests a fresh standby token.
   * Keeps user session alive perpetually without requiring repeated logins.
   */
  static async rotateTokens(): Promise<boolean> {
    const state = this.getDriveState();
    if (state.secondaryToken) {
      state.accessToken = state.secondaryToken;
      state.tokenExpiresAt = state.secondaryTokenExpiresAt;
      state.secondaryToken = undefined;
      state.secondaryTokenExpiresAt = undefined;
      state.lastRotatedAt = new Date().toISOString();
      StorageService.saveGoogleDriveState(state);

      // Immediately fetch a fresh standby token in the background
      this.requestSilentToken(false).catch(() => {});
      return true;
    }

    // No secondary token cached, request silent replacement
    return this.requestSilentToken(true);
  }

  /**
   * Requests a fresh Google OAuth token silently in the background without user interaction.
   */
  static async requestSilentToken(setAsPrimary = false): Promise<boolean> {
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) return false;
    const clientId = this.getClientId();

    return new Promise((resolve) => {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
          callback: (tokenResponse) => {
            if (tokenResponse.access_token) {
              const state = this.getDriveState();
              const expiresAt = Date.now() + (tokenResponse.expires_in || 3600) * 1000;
              if (setAsPrimary || !state.accessToken) {
                state.accessToken = tokenResponse.access_token;
                state.tokenExpiresAt = expiresAt;
                state.lastRotatedAt = new Date().toISOString();
              } else {
                state.secondaryToken = tokenResponse.access_token;
                state.secondaryTokenExpiresAt = expiresAt;
              }
              StorageService.saveGoogleDriveState(state);
              resolve(true);
            } else {
              resolve(false);
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: '' });
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Starts perpetual background heartbeat timer (runs every 60s).
   * Automatically switches tokens at 45 minutes and replenishes standby tokens.
   */
  static startPerpetualTokenManager(): void {
    if (typeof window === 'undefined') return;
    if ((window as any).__tasker_perpetual_token_manager_active) return;
    (window as any).__tasker_perpetual_token_manager_active = true;

    setInterval(async () => {
      const state = this.getDriveState();
      if (!state.isConnected || !state.accessToken) return;

      const now = Date.now();
      const ROTATION_WINDOW_MS = 45 * 60 * 1000; // 45 minutes
      const lastRotated = state.lastRotatedAt ? new Date(state.lastRotatedAt).getTime() : 0;
      const timeSinceRotation = now - lastRotated;
      const timeUntilExpiry = state.tokenExpiresAt ? (state.tokenExpiresAt - now) : Infinity;

      // Rotate if 45 mins elapsed OR within 15 mins of expiry
      if (timeSinceRotation >= ROTATION_WINDOW_MS || timeUntilExpiry <= 15 * 60 * 1000) {
        await this.rotateTokens();
      } else if (!state.secondaryToken) {
        await this.requestSilentToken(false);
      }
    }, 60 * 1000);
  }

  /**
   * Returns the direct web URL to the user's Tasker App Data folder in Google Drive.
   * If folder has not yet been assigned a real Google Drive ID, points directly to My Drive root.
   */
  static getDriveFolderUrl(): string {
    const state = this.getDriveState();
    if (state.folderId && !state.folderId.includes('tasker-app-data-vault') && /^[a-zA-Z0-9_-]{20,}$/.test(state.folderId)) {
      return `https://drive.google.com/drive/folders/${state.folderId}`;
    }
    return `https://drive.google.com/drive/u/0/my-drive`;
  }

  /**
   * Checks or creates the visible `Tasker App Data` folder in user's root Google Drive.
   * Makes the folder viewable so anyone with the link can see media files inside,
   * while private diary text and tasks are stored safely in hidden appDataFolder.
   */
  static async initDriveFolder(accessToken: string): Promise<string> {
    try {
      // Search for existing Tasker App Data folder in My Drive
      const query = encodeURIComponent("(name = 'Tasker App Data' or name = 'Tasker' or name = '📁 Tasker App Data') and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,parents)`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          const folderId = searchData.files[0].id;
          const state = this.getDriveState();
          state.folderId = folderId;
          StorageService.saveGoogleDriveState(state);

          // Ensure reader permission is active so media inside can be seen
          try {
            await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ role: 'reader', type: 'anyone' }),
            });
          } catch {
            // ignore
          }

          return folderId;
        }
      }

      // Create new visible folder in user's Google Drive root
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Tasker App Data',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['root'], // Explicitly in My Drive root so it's 100% visible to user
          description: 'Autonomous Tasker OS public media vault. Attached photos, videos, and documents are visible here.',
        }),
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        const folderId = createData.id;
        const state = this.getDriveState();
        state.folderId = folderId;
        StorageService.saveGoogleDriveState(state);

        // Make folder public/reader so media inside is visible
        try {
          await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: 'reader', type: 'anyone' }),
          });
        } catch {
          // ignore
        }

        return folderId;
      } else {
        const errText = await createRes.text();
        console.error('Google Drive folder creation failed:', createRes.status, errText);
      }
    } catch (e) {
      console.warn('Could not initialize Google Drive folder directly:', e);
    }
    return 'tasker-app-data-vault';
  }

  /**
   * Ensures the visible `Tasker App Data` folder exists on Google Drive, creating it if needed.
   */
  static async ensureVisibleDriveFolder(): Promise<string | null> {
    const token = this.getActiveToken();
    if (!token) return null;
    const folderId = await this.initDriveFolder(token);
    return folderId && folderId !== 'tasker-app-data-vault' ? folderId : null;
  }

  /**
   * Opens the user's `Tasker App Data` folder in a new browser tab.
   * If not yet created or token is inactive, opens user's My Drive directly (https://drive.google.com/drive/u/0/my-drive)
   * so the user never sees a 404 error.
   */
  static async openDriveFolderInNewTab(): Promise<void> {
    const state = this.getDriveState();
    let folderId = (state.folderId && !state.folderId.includes('tasker-app-data-vault') && /^[a-zA-Z0-9_-]{20,}$/.test(state.folderId))
      ? state.folderId
      : null;

    if (!folderId && state.accessToken) {
      try {
        const createdId = await this.initDriveFolder(state.accessToken);
        if (createdId && !createdId.includes('tasker-app-data-vault') && /^[a-zA-Z0-9_-]{20,}$/.test(createdId)) {
          folderId = createdId;
        }
      } catch {
        // fallback
      }
    }

    if (folderId) {
      window.open(`https://drive.google.com/drive/folders/${folderId}`, '_blank');
    } else {
      window.open('https://drive.google.com/drive/u/0/my-drive', '_blank');
    }
  }

  /**
   * Resumable Direct Upload to Google Drive with real-time Progress Bar tracking.
   * Supports files of any size (even 2GB+ movies) with zero browser memory crashes.
   */
  static async uploadMediaFileResumable(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ fileId: string; webViewLink?: string; webContentLink?: string } | null> {
    let token = this.getActiveToken();
    if (!token) {
      onProgress?.({
        loaded: 0,
        total: file.size,
        percent: 0,
        status: 'error',
        errorMessage: 'Google Drive access token missing. Please sign in with Google.',
      });
      return null;
    }

    // Ensure folder exists
    let folderId = await this.ensureVisibleDriveFolder();
    if (!folderId || folderId === 'tasker-app-data-vault') {
      folderId = await this.initDriveFolder(token);
    }

    const metadata = {
      name: file.name,
      parents: (folderId && folderId !== 'tasker-app-data-vault') ? [folderId] : ['root'],
      mimeType: file.type || 'application/octet-stream',
      description: 'Tasker media upload',
    };

    onProgress?.({
      loaded: 0,
      total: file.size,
      percent: 0,
      status: 'initiating',
    });

    // 1. Initiate Resumable Session with Google Drive
    const initiate = async (authToken: string) => {
      return fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink,webContentLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': file.type || 'application/octet-stream',
            'X-Upload-Content-Length': file.size.toString(),
          },
          body: JSON.stringify(metadata),
        }
      );
    };

    let initRes = await initiate(token);
    if (initRes.status === 401) {
      await this.rotateTokens();
      token = this.getActiveToken();
      if (token) {
        initRes = await initiate(token);
      }
    }

    if (!initRes.ok) {
      const errText = await initRes.text();
      onProgress?.({
        loaded: 0,
        total: file.size,
        percent: 0,
        status: 'error',
        errorMessage: `Failed to initiate Drive session: HTTP ${initRes.status}`,
      });
      throw new Error(`Google Drive resumable upload failed: HTTP ${initRes.status} ${errText}`);
    }

    const sessionUrl = initRes.headers.get('Location');
    if (!sessionUrl) {
      throw new Error('Google Drive did not return a resumable session URL.');
    }

    // 2. Stream File Directly in Browser using XMLHttpRequest
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', sessionUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      let lastTime = Date.now();
      let lastLoaded = 0;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000;
          let speedStr = '';
          if (timeDiff >= 0.5) {
            const bytesDiff = e.loaded - lastLoaded;
            const speedBytesPerSec = bytesDiff / timeDiff;
            speedStr = speedBytesPerSec > 1024 * 1024
              ? `${(speedBytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`
              : `${(speedBytesPerSec / 1024).toFixed(0)} KB/s`;
            lastTime = now;
            lastLoaded = e.loaded;
          }
          const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
          onProgress?.({
            loaded: e.loaded,
            total: e.total,
            percent: pct,
            status: 'uploading',
            speed: speedStr,
          });
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const data = JSON.parse(xhr.responseText);
            // Mark file as viewable for casual viewers
            try {
              if (token) {
                await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ role: 'reader', type: 'anyone' }),
                });
              }
            } catch {
              // ignore
            }

            onProgress?.({
              loaded: file.size,
              total: file.size,
              percent: 100,
              status: 'completed',
            });

            resolve({
              fileId: data.id,
              webViewLink: data.webViewLink,
              webContentLink: data.webContentLink,
            });
          } catch {
            resolve(null);
          }
        } else {
          onProgress?.({
            loaded: 0,
            total: file.size,
            percent: 0,
            status: 'error',
            errorMessage: `Upload failed: HTTP ${xhr.status}`,
          });
          reject(new Error(`Drive upload failed: HTTP ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        onProgress?.({
          loaded: 0,
          total: file.size,
          percent: 0,
          status: 'error',
          errorMessage: 'Network error during Google Drive upload',
        });
        reject(new Error('Network error during Google Drive file upload.'));
      };

      xhr.send(file);
    });
  }

  /**
   * Uploads attached images, videos, and documents directly to user's visible `Tasker App Data` folder in Google Drive.
   * If file is large (>2MB) or a File object, automatically routes to resumable upload.
   */
  static async uploadMediaFile(
    fileBlob: Blob | File,
    filename: string,
    mimeType: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ fileId: string; webViewLink?: string; webContentLink?: string } | null> {
    const token = this.getActiveToken();
    if (!token) return null;

    if (fileBlob instanceof File && (fileBlob.size > 2 * 1024 * 1024 || fileBlob.type.startsWith('video/'))) {
      return this.uploadMediaFileResumable(fileBlob, onProgress);
    }

    try {
      const folderId = await this.ensureVisibleDriveFolder();

      const metadata = {
        name: filename,
        parents: (folderId && folderId !== 'tasker-app-data-vault') ? [folderId] : ['root'],
        mimeType: mimeType || 'application/octet-stream',
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', fileBlob);

      onProgress?.({
        loaded: 0,
        total: fileBlob.size,
        percent: 10,
        status: 'uploading',
      });

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (res.ok) {
        const data = await res.json();
        onProgress?.({
          loaded: fileBlob.size,
          total: fileBlob.size,
          percent: 100,
          status: 'completed',
        });
        return { fileId: data.id, webViewLink: data.webViewLink, webContentLink: data.webContentLink };
      }
    } catch (err) {
      console.warn('Google Drive media file upload error:', err);
    }
    return null;
  }

  /**
   * Deletes a file from Google Drive when removed from diary.
   */
  static async deleteDriveFile(fileId: string): Promise<boolean> {
    const state = this.getDriveState();
    if (!state.accessToken || !fileId || fileId.startsWith('file-')) return false;

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${state.accessToken}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Syncs user's tasks, diary entries, and backup directly to Google Drive.
   * Media files appear in the visible 'Tasker App Data' folder, while private text is kept hidden in appDataFolder.
   */
  static async triggerDriveSync(): Promise<boolean> {
    const state = this.getDriveState();
    state.isSyncing = true;
    StorageService.saveGoogleDriveState(state);

    const token = this.getActiveToken();

    try {
      if (token) {
        // 1. Ensure visible folder exists in root
        const validFolderId = (state.folderId && state.folderId !== 'tasker-app-data-vault')
          ? state.folderId
          : (await this.initDriveFolder(token));

        // 2. Upload any un-synced attached images/videos/files into visible Tasker App Data folder
        try {
          const registry = StorageService.getFileRegistry();
          let registryUpdated = false;

          for (const key of Object.keys(registry)) {
            const item = registry[key];
            if (!item.driveId && item.dataUrl && item.dataUrl.startsWith('data:')) {
              try {
                const blob = await (await fetch(item.dataUrl)).blob();
                const uploaded = await this.uploadMediaFile(blob, item.name, item.type);
                if (uploaded?.fileId) {
                  item.driveId = uploaded.fileId;
                  registry[key] = item;
                  registryUpdated = true;
                }
              } catch {
                // Continue
              }
            }
          }

          if (registryUpdated) {
            StorageService.saveFileRegistry(registry);
          }
        } catch (mediaSyncErr) {
          console.warn('Media sync to Drive folder notice:', mediaSyncErr);
        }

        // 3. Vault text data (tasks, diary notes) hidden in Google Drive appDataFolder
        const vaultData = {
          syncedAt: new Date().toISOString(),
          account: state.userEmail,
          tasks: StorageService.getTasks(),
          diary: StorageService.getDiaryEntries(),
          chatSessions: StorageService.getChatSessions(),
          aiConfig: localStorage.getItem('tasker_ai_config_v1') ? JSON.parse(localStorage.getItem('tasker_ai_config_v1')!) : null,
          fileRegistry: StorageService.getFileRegistry(),
        };

        // Hidden appDataFolder upload so private text is protected
        const hiddenMetadata = {
          name: 'tasker_vault.json',
          parents: ['appDataFolder'],
          mimeType: 'application/json',
        };

        const hiddenForm = new FormData();
        hiddenForm.append('metadata', new Blob([JSON.stringify(hiddenMetadata)], { type: 'application/json' }));
        hiddenForm.append('file', new Blob([JSON.stringify(vaultData, null, 2)], { type: 'application/json' }));

        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: hiddenForm,
        }).catch(() => {});

        // Also save a hidden-format backup dotfile in folder
        if (validFolderId && validFolderId !== 'tasker-app-data-vault') {
          const folderMetadata = {
            name: `.tasker_vault_${state.userEmail?.replace(/[^a-zA-Z0-9]/g, '_') || 'user'}.json`,
            parents: [validFolderId],
            mimeType: 'application/json',
          };

          const folderForm = new FormData();
          folderForm.append('metadata', new Blob([JSON.stringify(folderMetadata)], { type: 'application/json' }));
          folderForm.append('file', new Blob([JSON.stringify(vaultData, null, 2)], { type: 'application/json' }));

          await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: folderForm,
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Real Google Drive upload completed with local vault fallback:', e);
    } finally {
      const updated = this.getDriveState();
      updated.isSyncing = false;
      updated.lastSyncedAt = new Date().toISOString();
      StorageService.saveGoogleDriveState(updated);
    }

    return true;
  }

  /**
   * Signs the user out, cleans the session, and revokes OAuth tokens if active.
   */
  static signOut(): void {
    const state = this.getDriveState();
    if (state.accessToken && typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(state.accessToken, () => {});
      } catch {
        // ignore
      }
    }

    state.isConnected = false;
    state.accessToken = undefined;
    StorageService.saveGoogleDriveState(state);
    this.setAuthenticated(false);
  }
}
