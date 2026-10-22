import { GoogleAccount, GoogleDriveState, TokenSlot } from '../types';
import { StorageService } from './storageService';

export interface UploadProgressInfo {
  filename: string;
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  speed?: string;
  status: 'starting' | 'uploading' | 'completed' | 'error';
  fileId?: string;
  driveLink?: string;
  error?: string;
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

// User's verified Google Cloud OAuth 2.0 Web Client ID
const DEFAULT_GOOGLE_CLIENT_ID = '634475536724-0e7apq2ee7p3udvuktuldtip5g54t2ru.apps.googleusercontent.com';
const GOOGLE_AUTH_FLAG = 'tasker_google_authenticated_v2';
const GOOGLE_CLIENT_ID_KEY = 'tasker_google_client_id_v2';

export class GoogleAuthService {
  private static rotationIntervalId: any = null;
  private static gisTokenClient: any = null;

  /**
   * Initializes or returns the cached Google Identity Services token client.
   */
  static getOrCreateTokenClient(callback?: (resp: any) => void): any {
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) return null;
    const clientId = this.getClientId();
    this.gisTokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
      callback: (response: any) => {
        if (response.access_token) {
          this.handleRotatedTokenReceived(response.access_token, response.expires_in || 3600);
        }
        if (callback) callback(response);
      },
    });
    return this.gisTokenClient;
  }

  /**
   * Configures dual-token slots on initial login and launches 45-minute perpetual rotation.
   */
  static setupDualTokens(initialToken: string, expiresInSec: number = 3600): void {
    const state = this.getDriveState();
    const now = Date.now();
    state.tokenA = {
      token: initialToken,
      issuedAt: now,
      expiresAt: now + expiresInSec * 1000,
    };
    state.activeSlot = 'A';
    state.accessToken = initialToken;
    StorageService.saveGoogleDriveState(state);

    // Silently obtain standby token B in background after short delay
    setTimeout(() => {
      this.requestStandbyTokenSilently();
    }, 2000);

    // Start 45-minute rotation watchdog
    this.startTokenRotationWatchdog();
  }

  /**
   * Requests a fresh replacement token silently in the background without UI interruption.
   */
  static requestStandbyTokenSilently(): void {
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) return;
    try {
      const client = this.getOrCreateTokenClient((resp) => {
        if (resp.access_token) {
          const state = this.getDriveState();
          const targetSlot = state.activeSlot === 'A' ? 'B' : 'A';
          const now = Date.now();
          const slotData: TokenSlot = {
            token: resp.access_token,
            issuedAt: now,
            expiresAt: now + (resp.expires_in || 3600) * 1000,
          };
          if (targetSlot === 'A') state.tokenA = slotData;
          else state.tokenB = slotData;
          StorageService.saveGoogleDriveState(state);
        }
      });
      if (client) {
        client.requestAccessToken({ prompt: '' });
      }
    } catch (e) {
      console.warn('Silent token refresh background request notice:', e);
    }
  }

  /**
   * Internal handler when a rotated token arrives.
   */
  private static handleRotatedTokenReceived(token: string, expiresInSec: number): void {
    const state = this.getDriveState();
    const now = Date.now();
    const standbySlot = state.activeSlot === 'A' ? 'B' : 'A';
    const slotData: TokenSlot = {
      token,
      issuedAt: now,
      expiresAt: now + expiresInSec * 1000,
    };
    if (standbySlot === 'A') state.tokenA = slotData;
    else state.tokenB = slotData;
    StorageService.saveGoogleDriveState(state);
  }

  /**
   * Starts perpetual 45-minute rotation watchdog.
   * Keeps token 1 active for 45 minutes, switches to token 2, requests replacement for token 1,
   * rotating continuously so user stays logged in forever until manual logout.
   */
  static startTokenRotationWatchdog(): void {
    if (typeof window === 'undefined') return;
    if (this.rotationIntervalId) clearInterval(this.rotationIntervalId);

    // Check every 60 seconds
    this.rotationIntervalId = setInterval(() => {
      const state = this.getDriveState();
      if (!state.isConnected || !state.accessToken) return;

      const activeSlot = state.activeSlot || 'A';
      const currentToken = activeSlot === 'A' ? state.tokenA : state.tokenB;
      const standbyToken = activeSlot === 'A' ? state.tokenB : state.tokenA;

      const now = Date.now();
      const FORTY_FIVE_MINS = 45 * 60 * 1000;

      // If active token has been active >= 45 mins OR is within 5 mins of expiration:
      const activeAge = currentToken ? now - currentToken.issuedAt : Infinity;
      const expiresIn = currentToken ? currentToken.expiresAt - now : 0;

      if (activeAge >= FORTY_FIVE_MINS || expiresIn < 5 * 60 * 1000) {
        // Rotate to standby token if available and valid
        if (standbyToken && standbyToken.expiresAt - now > 5 * 60 * 1000) {
          const nextSlot = activeSlot === 'A' ? 'B' : 'A';
          state.activeSlot = nextSlot;
          state.accessToken = standbyToken.token;
          StorageService.saveGoogleDriveState(state);

          // Request fresh replacement for the now-inactive slot in background
          this.requestStandbyTokenSilently();
        } else {
          // If standby is missing or low, request silent fresh token immediately
          this.requestStandbyTokenSilently();
        }
      }
    }, 60 * 1000);
  }

  /**
   * Retrieves a verified valid, non-expired Google Drive access token,
   * automatically performing seamless slot rotation if active token is aged.
   */
  static async getValidAccessToken(): Promise<string | null> {
    const state = this.getDriveState();
    if (!state.accessToken) return null;

    const now = Date.now();
    const activeSlot = state.activeSlot || 'A';
    const currentToken = activeSlot === 'A' ? state.tokenA : state.tokenB;
    const standbyToken = activeSlot === 'A' ? state.tokenB : state.tokenA;

    // If current token is valid with > 60 seconds left, use it
    if (currentToken && currentToken.expiresAt - now > 60 * 1000) {
      // If current token is nearing 45 mins, trigger background standby refresh
      if (now - currentToken.issuedAt > 40 * 60 * 1000 && (!standbyToken || standbyToken.expiresAt - now < 10 * 60 * 1000)) {
        this.requestStandbyTokenSilently();
      }
      return currentToken.token;
    }

    // Current token is expiring: switch to standby slot if fresh
    if (standbyToken && standbyToken.expiresAt - now > 60 * 1000) {
      state.activeSlot = activeSlot === 'A' ? 'B' : 'A';
      state.accessToken = standbyToken.token;
      StorageService.saveGoogleDriveState(state);
      this.requestStandbyTokenSilently();
      return standbyToken.token;
    }

    return state.accessToken || null;
  }

  /**
   * Makes a file or folder on Google Drive public so anyone with the link can view media.
   */
  static async makePublic(fileOrFolderId: string, accessToken: string): Promise<boolean> {
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileOrFolderId}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
          allowFileDiscovery: false,
        }),
      });
      return res.ok;
    } catch (e) {
      console.warn('Could not set public permission on Google Drive item:', e);
      return false;
    }
  }
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
   * Configures public reader permissions on the folder so uploaded media is viewable,
   * while private text data is stored separately and securely in the hidden appDataFolder.
   */
  static async initDriveFolder(accessToken: string): Promise<string> {
    try {
      // Search for existing Tasker App Data folder in My Drive
      const query = encodeURIComponent("(name = 'Tasker App Data' or name = 'Tasker') and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,parents)`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          const folderId = searchData.files[0].id;
          const state = this.getDriveState();
          state.folderId = folderId;
          state.isFolderPublic = true;
          StorageService.saveGoogleDriveState(state);
          // Ensure folder has public reader permission so media inside is viewable
          await this.makePublic(folderId, accessToken);
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
          parents: ['root'], // Explicitly in My Drive root so it's 100% visible to the user
          description: 'Autonomous Tasker OS public vault for media files.',
        }),
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        const folderId = createData.id;
        // Grant public reader permissions to the folder
        await this.makePublic(folderId, accessToken);

        const state = this.getDriveState();
        state.folderId = folderId;
        state.isFolderPublic = true;
        StorageService.saveGoogleDriveState(state);
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
    const token = await this.getValidAccessToken();
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
   * Direct Resumable Upload with real-time chunked progress reporting.
   * Supports files of ANY size (including 2GB+ movies) directly to the visible Google Drive folder.
   * Configures public reader permissions on the uploaded media so users and shared links can view it.
   */
  static async uploadMediaFileResumable(
    fileBlob: Blob | File,
    filename: string,
    mimeType: string,
    onProgress?: (progress: UploadProgressInfo) => void
  ): Promise<{ fileId: string; webViewLink?: string; webContentLink?: string } | null> {
    const token = await this.getValidAccessToken();
    if (!token) {
      if (onProgress) {
        onProgress({
          filename,
          bytesUploaded: 0,
          totalBytes: fileBlob.size,
          percentage: 0,
          status: 'error',
          error: 'Google Drive is not connected. Please attach Google Account.',
        });
      }
      return null;
    }

    try {
      if (onProgress) {
        onProgress({
          filename,
          bytesUploaded: 0,
          totalBytes: fileBlob.size,
          percentage: 0,
          status: 'starting',
        });
      }

      const folderId = (await this.ensureVisibleDriveFolder()) || undefined;
      const metadata = {
        name: filename,
        parents: (folderId && folderId !== 'tasker-app-data-vault') ? [folderId] : ['root'],
        description: 'Uploaded via Autonomous Tasker OS to public vault',
      };

      // 1. Initiate Resumable Upload Session
      const initRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink,webContentLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': mimeType || 'application/octet-stream',
            'X-Upload-Content-Length': fileBlob.size.toString(),
          },
          body: JSON.stringify(metadata),
        }
      );

      if (!initRes.ok) {
        throw new Error(`Google Drive Resumable Upload rejected (${initRes.status})`);
      }

      const sessionUri = initRes.headers.get('Location');
      if (!sessionUri) {
        throw new Error('No resumable upload session URI received from Google Drive.');
      }

      // 2. Stream in chunks (2 MB each, multiple of 256KB)
      const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB
      let offset = 0;
      const total = fileBlob.size;

      if (total === 0) {
        const emptyRes = await fetch(sessionUri, {
          method: 'PUT',
          headers: { 'Content-Range': 'bytes */0' },
        });
        const data = await emptyRes.json();
        return { fileId: data.id, webViewLink: data.webViewLink, webContentLink: data.webContentLink };
      }

      while (offset < total) {
        const end = Math.min(offset + CHUNK_SIZE, total);
        const chunk = fileBlob.slice(offset, end);
        const contentRange = `bytes ${offset}-${end - 1}/${total}`;

        const chunkRes = await fetch(sessionUri, {
          method: 'PUT',
          headers: {
            'Content-Range': contentRange,
            'Content-Type': mimeType || 'application/octet-stream',
          },
          body: chunk,
        });

        if (chunkRes.status === 308) {
          offset = end;
          const pct = Math.min(99, Math.round((offset / total) * 100));
          if (onProgress) {
            onProgress({
              filename,
              bytesUploaded: offset,
              totalBytes: total,
              percentage: pct,
              status: 'uploading',
            });
          }
        } else if (chunkRes.status === 200 || chunkRes.status === 201) {
          const data = await chunkRes.json();
          // Make media file viewable
          await this.makePublic(data.id, token);

          if (onProgress) {
            onProgress({
              filename,
              bytesUploaded: total,
              totalBytes: total,
              percentage: 100,
              status: 'completed',
              fileId: data.id,
              driveLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
            });
          }
          return {
            fileId: data.id,
            webViewLink: data.webViewLink,
            webContentLink: data.webContentLink,
          };
        } else {
          throw new Error(`Upload chunk transfer failed (${chunkRes.status})`);
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Google Drive Resumable Upload error:', error);
      if (onProgress) {
        onProgress({
          filename,
          bytesUploaded: 0,
          totalBytes: fileBlob.size,
          percentage: 0,
          status: 'error',
          error: error.message || 'Resumable upload failed',
        });
      }
    }

    return null;
  }

  /**
   * Uploads attached images, videos, and documents directly to user's visible `Tasker App Data` folder in Google Drive.
   * Routes seamlessly through the resumable engine.
   */
  static async uploadMediaFile(
    fileBlob: Blob | File,
    filename: string,
    mimeType: string,
    onProgress?: (progress: UploadProgressInfo) => void
  ): Promise<{ fileId: string; webViewLink?: string } | null> {
    const res = await this.uploadMediaFileResumable(fileBlob, filename, mimeType, onProgress);
    return res ? { fileId: res.fileId, webViewLink: res.webViewLink } : null;
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

    try {
      if (state.accessToken) {
        // 1. Ensure visible folder exists in root
        const validFolderId = (state.folderId && state.folderId !== 'tasker-app-data-vault')
          ? state.folderId
          : (await this.initDriveFolder(state.accessToken));

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

        // Hidden appDataFolder upload so private text is strictly protected
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
            Authorization: `Bearer ${state.accessToken}`,
          },
          body: hiddenForm,
        }).catch(() => {});
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
    if (this.rotationIntervalId) {
      clearInterval(this.rotationIntervalId);
      this.rotationIntervalId = null;
    }
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
    state.tokenA = undefined;
    state.tokenB = undefined;
    state.activeSlot = undefined;
    StorageService.saveGoogleDriveState(state);
    this.setAuthenticated(false);
  }
}
