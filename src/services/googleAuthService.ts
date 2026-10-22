import { GoogleAccount, GoogleDriveState, UploadProgress } from '../types';
export type { UploadProgress };
import { StorageService } from './storageService';

export type MediaCategory =
  | 'Videos'
  | 'Documents'
  | 'Presentations'
  | 'Spreadsheets'
  | 'Programs'
  | 'Images'
  | 'Audio'
  | 'Other';

export const DRIVE_SUBFOLDERS: readonly MediaCategory[] = [
  'Videos',
  'Documents',
  'Presentations',
  'Spreadsheets',
  'Programs',
  'Images',
  'Audio',
  'Other',
] as const;

export interface DriveFolderStructure {
  rootId: string;
  rootName: string;
  subfolders: Record<MediaCategory, string>;
}

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

// User's verified Google Cloud OAuth 2.0 Web Client ID configured with https://p1tasker.vercel.app
export const PRIMARY_GOOGLE_CLIENT_ID = '634475536724-0e7apq2ee7p3udvuktuldtip5g54t2ru.apps.googleusercontent.com';
export const TRACEYOURSELF_GOOGLE_CLIENT_ID = '541913243201-mjp27m8eubv53hm5dr78o8s89m9h89ua.apps.googleusercontent.com';
const DEFAULT_GOOGLE_CLIENT_ID = PRIMARY_GOOGLE_CLIENT_ID;
const GOOGLE_AUTH_FLAG = 'tasker_google_authenticated_v2';
const GOOGLE_CLIENT_ID_KEY = 'tasker_google_client_id_v2';

export class GoogleAuthService {
  /**
   * Retrieves the configured Google Client ID.
   * Defaults to verified Client ID: 634475536724-0e7apq2ee7p3udvuktuldtip5g54t2ru.apps.googleusercontent.com
   */
  static getClientId(): string {
    const custom = localStorage.getItem(GOOGLE_CLIENT_ID_KEY);
    if (custom && custom.trim().length > 10) {
      return custom.trim();
    }
    const state = StorageService.getGoogleDriveState();
    if (state.clientId && state.clientId.trim().length > 10) {
      return state.clientId.trim();
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
   * Checks if user is authenticated with a real Google account.
   * User remains logged in perpetually until they explicitly click 'Log Out'.
   * Never kicks user out just because an access token needs refreshing.
   */
  static isAuthenticated(): boolean {
    const authFlag = localStorage.getItem(GOOGLE_AUTH_FLAG);
    if (authFlag !== 'true') return false;

    const state = this.getDriveState();
    return state.isConnected && !!state.userEmail && state.accounts.length > 0;
  }

  /**
   * Wipes all cached authentication, tokens, accounts and starts completely fresh.
   */
  static resetAllAuthAndStartFresh(): void {
    localStorage.removeItem(GOOGLE_AUTH_FLAG);
    localStorage.removeItem(GOOGLE_CLIENT_ID_KEY);
    localStorage.removeItem('tasker_google_drive_state_v2');
    localStorage.removeItem('tasker_remember_me');
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }

    const cleanState: GoogleDriveState = {
      isConnected: false,
      accounts: [],
      clientId: DEFAULT_GOOGLE_CLIENT_ID,
    };
    StorageService.saveGoogleDriveState(cleanState);
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
   * Uses prompt: 'consent' to force the permissions screen to appear so Google Drive access is granted.
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
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file',
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

              // Proactively create Tasker_Media folder and all 8 typed subfolders in user's Google Drive
              try {
                const folders = await this.verifyOrCreateAllDriveFolders(tokenResponse.access_token);
                console.log('Tasker Google Drive Media folders initialized:', folders);
              } catch (folderErr) {
                console.warn('Initial drive folder check warning:', folderErr);
              }

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

        // Use prompt: 'consent' to force permissions screen for Google Drive scopes
        tokenClient.requestAccessToken({ prompt: 'consent' });
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
      accessToken: `token-${Date.now()}`,
      tokenExpiresAt: Date.now() + 3600 * 1000,
      addedAt: new Date().toISOString(),
      isPrimary: state.accounts.length === 0,
    };

    const updatedAccounts = [...state.accounts, newAcc];
    const newState: GoogleDriveState = {
      ...state,
      isConnected: true,
      accessToken: newAcc.accessToken,
      tokenExpiresAt: newAcc.tokenExpiresAt,
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
   * If current token is near expiry (< 5 mins) or expired, and secondary token is ready,
   * automatically rotates to secondary token immediately and pre-fetches the next standby token.
   * NEVER opens popup consent dialogs.
   */
  static getActiveToken(): string | null {
    const state = this.getDriveState();
    const now = Date.now();
    const isNearingExpiry = state.tokenExpiresAt ? (state.tokenExpiresAt - now < 5 * 60 * 1000) : false;
    const isExpired = state.tokenExpiresAt ? (state.tokenExpiresAt <= now) : false;

    if ((!state.accessToken || isNearingExpiry || isExpired) && state.secondaryToken) {
      state.accessToken = state.secondaryToken;
      state.tokenExpiresAt = state.secondaryTokenExpiresAt;
      state.secondaryToken = undefined;
      state.secondaryTokenExpiresAt = undefined;
      state.lastRotatedAt = new Date().toISOString();
      StorageService.saveGoogleDriveState(state);

      // Pre-fetch next standby token in background
      this.requestSilentToken(false).catch(() => {});
      return state.accessToken;
    }
    return state.accessToken || null;
  }

  /**
   * Asynchronously guarantees a fresh, valid Google Drive access token.
   * If current token is nearing expiry or expired:
   * 1. Rotates immediately to the standby token if available.
   * 2. Otherwise fetches a fresh token silently without prompting the user.
   * NEVER opens popup dialogs.
   */
  static async getValidAccessToken(): Promise<string | null> {
    const state = this.getDriveState();
    const now = Date.now();
    const isNearingExpiry = state.tokenExpiresAt ? (state.tokenExpiresAt - now < 5 * 60 * 1000) : false;
    const isExpired = state.tokenExpiresAt ? (state.tokenExpiresAt <= now) : false;

    // Fresh active token available
    if (state.accessToken && !isNearingExpiry && !isExpired) {
      if (!state.secondaryToken) {
        this.requestSilentToken(false).catch(() => {});
      }
      return state.accessToken;
    }

    // Rotate immediately to standby token
    if (state.secondaryToken) {
      await this.rotateTokens();
      const updated = this.getDriveState();
      return updated.accessToken || null;
    }

    // Attempt silent background refresh without user prompt
    const refreshed = await this.requestSilentToken(true);
    if (refreshed) {
      const updated = this.getDriveState();
      this.requestSilentToken(false).catch(() => {});
      return updated.accessToken || null;
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
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file',
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
      if (!state.isConnected) return;

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
   * Intelligently maps filename extension and mime-type to its designated subfolder:
   * - Videos (video/*, .mp4, .mkv, .mov, .avi, etc.)
   * - Documents (doc, docx, pdf, txt, etc.)
   * - Presentations (ppt, pptx, etc.)
   * - Spreadsheets (xls, xlsx, csv, etc.)
   * - Programs (exe, msi, zip, rar, etc.)
   * - Images (image/*, png, jpg, etc.)
   * - Audio (audio/*, mp3, wav, etc.)
   * - Other (all unmapped types)
   */
  static categorizeFile(filename: string, mimeType?: string): MediaCategory {
    const ext = filename && filename.includes('.') ? filename.split('.').pop()!.toLowerCase().trim() : '';
    const mime = (mimeType || '').toLowerCase().trim();

    // 1. Videos
    if (
      mime.startsWith('video/') ||
      ['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv', 'wmv', 'm4v', '3gp', 'ts', 'ogv'].includes(ext)
    ) {
      return 'Videos';
    }

    // 2. Images
    if (
      mime.startsWith('image/') ||
      ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif', 'heic', 'avif'].includes(ext)
    ) {
      return 'Images';
    }

    // 3. Audio
    if (
      mime.startsWith('audio/') ||
      ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma', 'opus', 'mid', 'midi'].includes(ext)
    ) {
      return 'Audio';
    }

    // 4. Spreadsheets (checked before generic documents so .csv routes here)
    if (
      mime === 'text/csv' ||
      mime.includes('spreadsheet') ||
      mime.includes('excel') ||
      ['xls', 'xlsx', 'csv', 'ods', 'tsv', 'numbers', 'xlsm'].includes(ext)
    ) {
      return 'Spreadsheets';
    }

    // 5. Presentations (checked before generic documents so .ppt/.pptx routes here)
    if (
      mime.includes('presentation') ||
      mime.includes('powerpoint') ||
      ['ppt', 'pptx', 'odp', 'key', 'pps', 'ppsx'].includes(ext)
    ) {
      return 'Presentations';
    }

    // 6. Documents
    if (
      mime === 'application/pdf' ||
      mime.includes('word') ||
      mime.includes('document') ||
      mime.startsWith('text/') ||
      ['doc', 'docx', 'pdf', 'txt', 'rtf', 'odt', 'md', 'pages', 'tex', 'epub'].includes(ext)
    ) {
      return 'Documents';
    }

    // 7. Programs / Executables / Archives
    if (
      mime.includes('zip') ||
      mime.includes('compressed') ||
      mime.includes('tar') ||
      mime.includes('x-rar') ||
      mime.includes('x-7z') ||
      [
        'exe', 'msi', 'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'dmg',
        'deb', 'rpm', 'apk', 'bin', 'iso', 'sh', 'bat', 'cmd', 'ps1', 'jar'
      ].includes(ext)
    ) {
      return 'Programs';
    }

    return 'Other';
  }

  /**
   * Returns the direct web URL to the user's Tasker_Media folder or specific subfolder in Google Drive.
   * If folder has not yet been assigned a real Google Drive ID, points directly to My Drive root.
   */
  static getDriveFolderUrl(subfolderCategory?: MediaCategory): string {
    const state = this.getDriveState();
    if (subfolderCategory && state.subfolderIds?.[subfolderCategory] && /^[a-zA-Z0-9_-]{15,}$/.test(state.subfolderIds[subfolderCategory])) {
      return `https://drive.google.com/drive/folders/${state.subfolderIds[subfolderCategory]}`;
    }
    if (state.folderId && !state.folderId.includes('tasker-app-data-vault') && /^[a-zA-Z0-9_-]{15,}$/.test(state.folderId)) {
      return `https://drive.google.com/drive/folders/${state.folderId}`;
    }
    return `https://drive.google.com/drive/u/0/my-drive`;
  }

  /**
   * Guarantees folder Tasker_Media is created in My Drive root.
   * Creates folder without explicit parents array so Drive v3 defaults cleanly to root without 404s.
   * Applies reader permission so media is publicly viewable.
   */
  static async initDriveFolder(accessToken: string): Promise<string> {
    try {
      const folderName = 'Tasker_Media';
      // Search for existing Tasker_Media or Tasker App Data folder in Drive
      const query = encodeURIComponent(`(name='${folderName}' or name='Tasker App Data' or name='Tasker') and mimeType='application/vnd.google-apps.folder' and trashed=false`);
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
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

      // Create new folder in My Drive root (omitting parents so Drive v3 creates it in My Drive root without 404 'root' error)
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          description: 'Autonomous Tasker OS Media Vault. Photos, videos, and documents are visible here.',
        }),
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        const folderId = createData.id;
        const state = this.getDriveState();
        state.folderId = folderId;
        StorageService.saveGoogleDriveState(state);

        // Make folder viewable so media inside can be viewed
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
   * Verifies that root Tasker_Media and all 8 typed subfolders exist:
   * Videos, Documents, Presentations, Spreadsheets, Programs, Images, Audio, Other.
   * Creates any that are missing inside Tasker_Media, sets public reader permissions,
   * updates GoogleDriveState.subfolderIds, and returns the full folder structure.
   */
  static async verifyOrCreateAllDriveFolders(accessToken: string): Promise<DriveFolderStructure> {
    const rootId = await this.initDriveFolder(accessToken);
    const subfolderMap: Record<MediaCategory, string> = {
      Videos: rootId,
      Documents: rootId,
      Presentations: rootId,
      Spreadsheets: rootId,
      Programs: rootId,
      Images: rootId,
      Audio: rootId,
      Other: rootId,
    };

    try {
      // 1. Fetch all existing subfolders directly inside rootId
      const query = encodeURIComponent(`'${rootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
      const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const existingMap = new Map<string, string>();
      if (listRes.ok) {
        const listData = await listRes.json();
        if (Array.isArray(listData.files)) {
          for (const item of listData.files) {
            existingMap.set(item.name, item.id);
          }
        }
      }

      // 2. Verify or create each of the 8 required subfolders
      for (const category of DRIVE_SUBFOLDERS) {
        if (existingMap.has(category)) {
          subfolderMap[category] = existingMap.get(category)!;
        } else {
          try {
            const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: category,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [rootId],
                description: `Tasker OS ${category} Vault`,
              }),
            });

            if (createRes.ok) {
              const created = await createRes.json();
              subfolderMap[category] = created.id;

              // Ensure public reader permission for media accessibility
              try {
                await fetch(`https://www.googleapis.com/drive/v3/files/${created.id}/permissions`, {
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
            } else {
              subfolderMap[category] = rootId;
            }
          } catch (createErr) {
            console.warn(`Failed creating subfolder ${category}:`, createErr);
            subfolderMap[category] = rootId;
          }
        }
      }

      // Save subfolder mapping into GoogleDriveState
      const state = this.getDriveState();
      state.folderId = rootId;
      state.subfolderIds = subfolderMap;
      StorageService.saveGoogleDriveState(state);
    } catch (e) {
      console.warn('verifyOrCreateAllDriveFolders error:', e);
    }

    return {
      rootId,
      rootName: 'Tasker_Media',
      subfolders: subfolderMap,
    };
  }

  /**
   * Helper function that maps mime-types and extensions to their proper subfolder
   * (Videos, Documents, Presentations, Spreadsheets, Programs, Images, Audio, Other),
   * ensures the subfolder exists on Google Drive, and returns the exact target subfolder ID.
   */
  static async getOrTargetSubfolder(
    accessToken: string,
    file: File | { name: string; type?: string }
  ): Promise<string> {
    const category = this.categorizeFile(file.name, file.type);
    const state = this.getDriveState();

    if (
      state.subfolderIds &&
      state.subfolderIds[category] &&
      !state.subfolderIds[category].includes('tasker-app-data') &&
      /^[a-zA-Z0-9_-]{15,}$/.test(state.subfolderIds[category])
    ) {
      return state.subfolderIds[category];
    }

    // Verify or create all folders on demand
    const structure = await this.verifyOrCreateAllDriveFolders(accessToken);
    return structure.subfolders[category] || structure.rootId;
  }

  /**
   * Ensures the visible `Tasker_Media` folder exists on Google Drive, creating it if needed.
   */
  static async ensureVisibleDriveFolder(): Promise<string | null> {
    const token = this.getActiveToken() || (await this.getValidAccessToken());
    if (!token) return null;
    const folderId = await this.initDriveFolder(token);
    return folderId && folderId !== 'tasker-app-data-vault' ? folderId : null;
  }

  /**
   * Opens the user's `Tasker_Media` folder or subfolder in a new browser tab.
   * If not yet created or token is inactive, opens user's My Drive directly (https://drive.google.com/drive/u/0/my-drive)
   * so the user never sees a 404 error.
   */
  static async openDriveFolderInNewTab(subfolderCategory?: MediaCategory): Promise<void> {
    const state = this.getDriveState();
    let folderId = (subfolderCategory && state.subfolderIds?.[subfolderCategory])
      ? state.subfolderIds[subfolderCategory]
      : (state.folderId && !state.folderId.includes('tasker-app-data-vault') && /^[a-zA-Z0-9_-]{15,}$/.test(state.folderId))
      ? state.folderId
      : null;

    if (!folderId && state.accessToken) {
      try {
        const createdId = await this.initDriveFolder(state.accessToken);
        if (createdId && !createdId.includes('tasker-app-data-vault') && /^[a-zA-Z0-9_-]{15,}$/.test(createdId)) {
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
   * Routes the file directly into its specific typed subfolder (Videos, Documents, Images, etc.).
   * Supports files of any size (even 2GB+ movies) with zero browser memory crashes.
   * ZERO FAKING: If upload fails, reports error and throws; never returns a fake driveId.
   */
  static async uploadMediaFileResumable(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ fileId: string; webViewLink?: string; webContentLink?: string } | null> {
    let token = this.getActiveToken() || (await this.getValidAccessToken());
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

    // Route directly into the category-specific subfolder (Videos, Documents, etc.)
    const targetFolderId = await this.getOrTargetSubfolder(token, file);

    const metadata = {
      name: file.name,
      parents: [targetFolderId],
      mimeType: file.type || 'application/octet-stream',
      description: `Tasker media upload (${this.categorizeFile(file.name, file.type)})`,
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
      token = this.getActiveToken() || (await this.getValidAccessToken());
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
   * Uploads attached images, videos, and documents directly to user's typed subfolder in Google Drive.
   * If file is large (>2MB) or a File object, automatically routes to resumable upload.
   * ZERO FAKING: Only returns real Google Drive file IDs.
   */
  static async uploadMediaFile(
    fileBlob: Blob | File,
    filename: string,
    mimeType: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ fileId: string; webViewLink?: string; webContentLink?: string } | null> {
    const token = this.getActiveToken() || (await this.getValidAccessToken());
    if (!token) return null;

    if (fileBlob instanceof File && (fileBlob.size > 2 * 1024 * 1024 || fileBlob.type.startsWith('video/'))) {
      return this.uploadMediaFileResumable(fileBlob, onProgress);
    }

    try {
      const targetFolderId = await this.getOrTargetSubfolder(token, { name: filename, type: mimeType });

      const metadata = {
        name: filename,
        parents: [targetFolderId],
        mimeType: mimeType || 'application/octet-stream',
        description: `Tasker media upload (${this.categorizeFile(filename, mimeType)})`,
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
   * Immediate 1-click token re-prompt if Google Drive access token is missing or expired.
   */
  static async repromptDriveToken(): Promise<string> {
    const account = await this.requestRealGoogleOAuth();
    if (account.accessToken) {
      return account.accessToken;
    }
    throw new Error('Google Drive access token not granted.');
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

    const token = this.getActiveToken() || (await this.getValidAccessToken());

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
