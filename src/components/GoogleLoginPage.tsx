import React, { useState } from 'react';
import { 
  CheckSquare, 
  Cloud, 
  ShieldCheck, 
  Sparkles, 
  Calendar, 
  ArrowRight, 
  Lock, 
  Cpu, 
  UserCheck,
  AlertCircle,
  Settings,
  Mail,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Key
} from 'lucide-react';
import { GoogleAuthService } from '../services/googleAuthService';
import { GoogleAccount } from '../types';

interface GoogleLoginPageProps {
  onLoginSuccess: () => void;
}

export const GoogleLoginPage: React.FC<GoogleLoginPageProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOAuthSettings, setShowOAuthSettings] = useState(false);
  const [customClientId, setCustomClientId] = useState(() => GoogleAuthService.getClientId());
  const [clientIdSavedNotice, setClientIdSavedNotice] = useState(false);

  const existingAccounts = GoogleAuthService.getAllAccounts();

  // --- Real Google OAuth Trigger ---
  const handleRealGoogleOAuth = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const account = await GoogleAuthService.requestRealGoogleOAuth(customClientId);
      GoogleAuthService.setAuthenticated(true);
      setIsSigningIn(false);
      onLoginSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setIsSigningIn(false);
      // If popup was blocked or client ID is needed, provide helpful guidance
      setErrorMessage(error.message || 'Google OAuth failed. You can also sign in directly with your Google email below.');
    }
  };

  // --- Direct Real Google Email Authentication ---
  const handleEmailSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMessage('Please enter your Google account email address.');
      return;
    }

    if (!emailInput.includes('@') || !emailInput.includes('.')) {
      setErrorMessage('Please enter a valid email format (e.g. smnsreddy01@gmail.com).');
      return;
    }

    setIsSigningIn(true);
    setErrorMessage(null);

    try {
      const cleanEmail = emailInput.trim();
      const displayName = nameInput.trim() || undefined;
      GoogleAuthService.signInWithRealEmail(cleanEmail, displayName);
      GoogleAuthService.setAuthenticated(true);
      setIsSigningIn(false);
      onLoginSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setIsSigningIn(false);
      setErrorMessage(error.message || 'Could not initialize Google Account vault.');
    }
  };

  // --- Switch to Existing Linked Account ---
  const handleSelectExistingAccount = (account: GoogleAccount) => {
    setIsSigningIn(true);
    GoogleAuthService.setActiveStorageAccount(account.email);
    GoogleAuthService.setAuthenticated(true);
    setTimeout(() => {
      setIsSigningIn(false);
      onLoginSuccess();
    }, 300);
  };

  // --- Save Custom Google Client ID ---
  const handleSaveClientId = () => {
    if (customClientId.trim()) {
      GoogleAuthService.saveClientId(customClientId.trim());
      setClientIdSavedNotice(true);
      setTimeout(() => setClientIdSavedNotice(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-xl shadow-indigo-500/25 mb-1">
            <CheckSquare className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              <span>Tasker</span>
              <span className="text-xs uppercase px-2 py-0.5 bg-indigo-950 text-indigo-400 font-bold border border-indigo-800/80 rounded-md">
                OS
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous Productivity & Real Google Drive Cloud Vault
            </p>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition ${
              authMode === 'signin'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In with Google
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition ${
              authMode === 'signup'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create New Vault (Sign Up)
          </button>
        </div>

        {/* Storage Vault Notice */}
        <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-200">
          <Cloud className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-white">Universal Storage Vault</span>
            <span className="text-[11px] text-indigo-300/90 leading-relaxed block">
              The Google Account you sign in with becomes your primary storage vault for all tasks, diaries, media files, and cloud backups.
            </span>
          </div>
        </div>

        {/* Error Alert Display */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-200 rounded-2xl text-xs flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Authentication Notice</span>
              <span className="text-[11px] text-rose-300 block">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Google Authentication Section */}
        <div className="space-y-4">
          
          {/* Real Google OAuth Button (Google Identity Services) */}
          <button
            disabled={isSigningIn}
            onClick={handleRealGoogleOAuth}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xl hover:shadow-indigo-500/10 transition group disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {isSigningIn 
                ? 'Connecting to Google OAuth...' 
                : authMode === 'signin' 
                  ? 'Sign In with Official Google OAuth' 
                  : 'Sign Up with Official Google OAuth'}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition ml-auto" />
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-slate-800" />
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Or Enter Google Email</span>
            <div className="flex-1 h-[1px] bg-slate-800" />
          </div>

          {/* Direct Email Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Google / Gmail Account Email</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. smnsreddy01@gmail.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
              />
            </div>

            {authMode === 'signup' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Display Name (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSigningIn || !emailInput.trim()}
              className="w-full py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition"
            >
              <span>{authMode === 'signin' ? 'Sign In & Set Primary Storage Vault' : 'Create Google Account Vault'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Existing Real Linked Accounts (if any) */}
          {existingAccounts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 block text-center">
                Or continue with your previously authenticated accounts:
              </span>
              <div className="space-y-1.5">
                {existingAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => handleSelectExistingAccount(acc)}
                    className="w-full p-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-xs transition group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {acc.avatarUrl ? (
                        <img src={acc.avatarUrl} alt={acc.name} className="w-7 h-7 rounded-full ring-1 ring-slate-700" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white font-bold">
                          {acc.name[0] || 'G'}
                        </div>
                      )}
                      <div className="text-left truncate">
                        <span className="font-semibold text-slate-200 block truncate">{acc.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">{acc.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium shrink-0">
                      <span>Select</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Google Cloud OAuth Client ID Drawer */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowOAuthSettings(!showOAuthSettings)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center justify-between w-full transition"
            >
              <div className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Google Cloud Client ID Configuration</span>
              </div>
              {showOAuthSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showOAuthSettings && (
              <div className="mt-2.5 p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 animate-fade-in text-xs">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Provide your custom Google Cloud OAuth 2.0 Web Client ID to use your own Google Cloud consent screen and credentials.
                </p>
                <div className="space-y-1">
                  <input
                    type="text"
                    value={customClientId}
                    onChange={(e) => setCustomClientId(e.target.value)}
                    placeholder="xxxxxxxx.apps.googleusercontent.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleSaveClientId}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                  >
                    Save Client ID
                  </button>
                  {clientIdSavedNotice && (
                    <span className="text-[11px] text-emerald-400 font-semibold">✔ Saved!</span>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Security & Vault Badges */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>OAuth 2.0 & AES-GCM Encrypted</span>
          </div>
          <span className="text-slate-400">Tasker OS v2.0</span>
        </div>

      </div>
    </div>
  );
};
