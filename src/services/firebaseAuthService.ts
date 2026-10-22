import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { GoogleAuthService } from './googleAuthService';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const FIREBASE_CONFIG_KEY = 'tasker_firebase_config_v1';

// User-provided Firebase configuration for p1tasker
const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyB2F-9F-pB3r32VLa4twyfNBCRtbctEH1M",
  authDomain: "p1tasker.firebaseapp.com",
  projectId: "p1tasker",
  storageBucket: "p1tasker.firebasestorage.app",
  messagingSenderId: "616794995226",
  appId: "1:616794995226:web:6f63b1a4b05dc2dcbdefa3"
};

export class FirebaseAuthService {
  private static cachedAuth: Auth | null = null;
  private static cachedApp: FirebaseApp | null = null;

  /**
   * Retrieves stored or env Firebase configuration.
   */
  static getConfig(): FirebaseConfig {
    try {
      const stored = localStorage.getItem(FIREBASE_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.apiKey?.trim() && parsed.projectId?.trim()) {
          return { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_FIREBASE_CONFIG;
  }

  /**
   * Saves updated Firebase configuration to local storage.
   */
  static saveConfig(config: FirebaseConfig): void {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
    this.cachedAuth = null;
    this.cachedApp = null;
  }

  /**
   * Checks if Firebase Auth is configured with valid credentials.
   */
  static isConfigured(): boolean {
    const cfg = this.getConfig();
    return !!(cfg.apiKey?.trim() && cfg.authDomain?.trim() && cfg.projectId?.trim());
  }

  /**
   * Initializes or returns the active Firebase App instance.
   */
  static getFirebaseApp(): FirebaseApp | null {
    if (this.cachedApp) return this.cachedApp;

    const config = this.getConfig();
    if (!config.apiKey || !config.projectId) {
      return null;
    }

    try {
      const existing = getApps();
      if (existing.length > 0) {
        this.cachedApp = getApp();
        return this.cachedApp;
      }

      this.cachedApp = initializeApp(config);
      return this.cachedApp;
    } catch (e) {
      console.warn('Firebase initializeApp error:', e);
      return null;
    }
  }

  /**
   * Returns Firebase Auth instance.
   */
  static getAuthInstance(): Auth | null {
    if (this.cachedAuth) return this.cachedAuth;
    const app = this.getFirebaseApp();
    if (!app) return null;

    try {
      this.cachedAuth = getAuth(app);
      return this.cachedAuth;
    } catch (e) {
      console.warn('Firebase getAuth error:', e);
      return null;
    }
  }

  /**
   * Initiates Google Sign-In with Firebase Auth popup.
   * Requests Google Drive scopes so the user's storage vault is synced to Google Drive.
   */
  static async signInWithGoogle(): Promise<{
    user: FirebaseUser;
    accessToken?: string;
  }> {
    const auth = this.getAuthInstance();
    if (!auth) {
      throw new Error(
        'Firebase is not yet configured. Please enter your Firebase Project Config (API Key, Auth Domain, Project ID) to enable 1-click Google Sign-In.'
      );
    }

    const provider = new GoogleAuthProvider();
    // Request Drive file access, appdata and profile scopes
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.addScope('https://www.googleapis.com/auth/drive.appdata');

    provider.setCustomParameters({
      prompt: 'select_account',
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Extract OAuth credential containing Google Drive access token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      const userEmail = user.email || '';
      const userName = user.displayName || userEmail.split('@')[0] || 'User';
      const userAvatar = user.photoURL || undefined;

      // Update Tasker GoogleDriveState with authenticated account details
      const driveState = GoogleAuthService.getDriveState();
      driveState.isConnected = true;
      driveState.userEmail = userEmail;
      driveState.userName = userName;
      driveState.userAvatar = userAvatar;
      driveState.activeStorageAccountEmail = userEmail;
      driveState.lastSyncedAt = new Date().toISOString();
      if (accessToken) {
        driveState.accessToken = accessToken;
        driveState.tokenExpiresAt = Date.now() + 3600 * 1000;
      }

      // Add to linked accounts if not already present
      const existingAccount = driveState.accounts.find(a => a.email.toLowerCase() === userEmail.toLowerCase());
      if (!existingAccount) {
        driveState.accounts.push({
          id: `acc-${Date.now()}`,
          name: userName,
          email: userEmail,
          avatarUrl: userAvatar,
          accessToken: accessToken,
          tokenExpiresAt: Date.now() + 3600 * 1000,
          isPrimary: true,
          addedAt: new Date().toISOString(),
          isActiveStorage: true,
        });
      } else {
        existingAccount.avatarUrl = userAvatar;
        existingAccount.name = userName;
        if (accessToken) {
          existingAccount.accessToken = accessToken;
          existingAccount.tokenExpiresAt = Date.now() + 3600 * 1000;
        }
      }

      // Save drive state and mark as authenticated
      const { StorageService } = await import('./storageService');
      StorageService.saveGoogleDriveState(driveState);
      GoogleAuthService.setAuthenticated(true);

      // Proactively create Tasker_Media folder in user's root Google Drive & sync vault
      if (accessToken) {
        try {
          const folderId = await GoogleAuthService.initDriveFolder(accessToken);
          console.log('Firebase Auth -> Created Google Drive Media Folder:', folderId);
        } catch (folderErr) {
          console.warn('Firebase Auth folder initialization:', folderErr);
        }
        GoogleAuthService.triggerDriveSync().catch(() => {});
      }

      return { user, accessToken };
    } catch (err: unknown) {
      const error = err as Error & { code?: string };
      console.error('Firebase Google Sign-In error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in popup was closed before completing. Please try again or use direct email entry below.');
      }
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Your browser blocked the Google sign-in popup. Please allow popups for this site, or use direct email entry below.');
      }
      if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Another sign-in request was already active.');
      }
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error(
          `Domain ${typeof window !== 'undefined' ? window.location.hostname : 'current domain'} is not yet added in Firebase Console > Authentication > Settings > Authorized domains. You can use direct email sign-in below immediately.`
        );
      }
      throw new Error(error.message || 'Firebase Google Sign-In failed.');
    }
  }

  /**
   * Signs the user out of Firebase and purges local session.
   */
  static async signOut(): Promise<void> {
    const auth = this.getAuthInstance();
    if (auth) {
      try {
        await fbSignOut(auth);
      } catch {
        // ignore
      }
    }
    GoogleAuthService.signOut();
  }

  /**
   * Listens to Firebase Auth state changes.
   */
  static onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    const auth = this.getAuthInstance();
    if (!auth) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }
}
