import React, { useState } from 'react';
import { 
  CheckSquare, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Loader2, 
  ArrowLeft, 
  RotateCcw,
  Cloud,
  CheckCircle2,
  FolderOpen,
  Sparkles
} from 'lucide-react';
import { GoogleAuthService } from '../services/googleAuthService';
import { FirebaseAuthService } from '../services/firebaseAuthService';

interface GoogleLoginPageProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
}

export const GoogleLoginPage: React.FC<GoogleLoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [customClientId, setCustomClientId] = useState(() => GoogleAuthService.getClientId());

  // Firebase Google Sign-In with Google Drive Scopes (Bypasses Google Origin Authorization Error)
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessStatus('Connecting with Google via Firebase Authentication...');

    try {
      setSuccessStatus('Signing in & requesting Google Drive permissions...');
      const { user, accessToken } = await FirebaseAuthService.signInWithGoogle();

      setSuccessStatus(`Authenticated as ${user.email}! Initializing Google Drive Media folder...`);
      
      // Proactively create/verify Tasker_Media folder in My Drive
      if (accessToken) {
        try {
          const folderId = await GoogleAuthService.initDriveFolder(accessToken);
          console.log('Tasker Google Drive media folder ready:', folderId);
        } catch (folderErr) {
          console.warn('Initial drive folder notification:', folderErr);
        }
      }

      setSuccessStatus('Ready! Opening your Tasker Workspace...');
      setTimeout(() => {
        setIsSubmitting(false);
        onLoginSuccess();
      }, 500);
    } catch (err: unknown) {
      const error = err as Error;
      setIsSubmitting(false);
      setSuccessStatus(null);
      console.error('Firebase sign-in error:', error);
      setErrorMessage(
        error.message || 'Google Sign-In was cancelled or failed. Please ensure popups are allowed.'
      );
    }
  };

  // Direct Google Identity Services (GIS) fallback if desired
  const handleGISFallback = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessStatus('Connecting directly via Google Identity Services...');

    try {
      const account = await GoogleAuthService.requestRealGoogleOAuth(customClientId.trim() || undefined);
      if (account.accessToken) {
        await GoogleAuthService.initDriveFolder(account.accessToken).catch(() => {});
      }
      setIsSubmitting(false);
      onLoginSuccess();
    } catch (err: unknown) {
      setIsSubmitting(false);
      setSuccessStatus(null);
      setErrorMessage((err as Error).message);
    }
  };

  const handleStartFresh = () => {
    if (window.confirm('Clear all local session data and restart fresh?')) {
      GoogleAuthService.resetAllAuthAndStartFresh();
      window.location.reload();
    }
  };

  const handleSaveClientId = () => {
    if (customClientId.trim()) {
      GoogleAuthService.saveClientId(customClientId.trim());
      alert('Google Client ID saved!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6">
        
        {/* Back to Home Navigation */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition -mt-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </button>
        )}

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
              Personal Productivity & Google Drive Media Cloud Vault
            </p>
          </div>
        </div>

        {/* Success Status Banner */}
        {successStatus && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-200 rounded-2xl text-xs flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
            <span className="leading-relaxed">{successStatus}</span>
          </div>
        )}

        {/* Error Alert Display */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-200 rounded-2xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-xs text-rose-300 block leading-relaxed">{errorMessage}</span>
              {errorMessage.includes('origin_mismatch') && (
                <span className="text-[11px] text-amber-300 block mt-1">
                  Ensure <code>https://p1tasker.vercel.app</code> is in Google Cloud Console &gt; Credentials &gt; Authorized JavaScript Origins.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Primary Action: Official Google Sign-In with Real Google Drive Scopes */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-3 transition shadow-xl shadow-white/10 border border-slate-200 group relative overflow-hidden"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Authorizing with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign in with Google</span>
                <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:translate-x-1 group-hover:text-slate-900 transition" />
              </>
            )}
          </button>

          {/* Drive Permissions Explanation */}
          <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real Google Drive Cloud Integration (Firebase Auth)</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              When prompted, please allow Google Drive access. Tasker will automatically create a public <strong className="text-slate-200">Tasker_Media</strong> folder in your root My Drive for your photos, videos, and attachments.
            </p>
          </div>

          {/* Alternative Direct GIS option */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleGISFallback}
              disabled={isSubmitting}
              className="text-[11px] text-slate-400 hover:text-indigo-300 underline transition"
              title="Direct Google Identity Services authorization"
            >
              Alternative: Sign in via Google Identity Services (GIS)
            </button>
          </div>
        </div>

        {/* Config & Reset Actions */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="hover:text-slate-200 underline text-[11px]"
            >
              {showConfig ? 'Hide Client ID Settings' : 'OAuth Client ID: ...' + customClientId.slice(-12)}
            </button>

            <button
              type="button"
              onClick={handleStartFresh}
              className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium"
              title="Clears all local storage and restarts cleanly"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Start Fresh</span>
            </button>
          </div>

          {showConfig && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <label className="text-[11px] text-slate-400 font-medium">Google Cloud OAuth 2.0 Web Client ID:</label>
              <input
                type="text"
                value={customClientId}
                onChange={(e) => setCustomClientId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveClientId}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                >
                  Save ID
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <a href="/privacy" target="_blank" rel="noreferrer" className="hover:text-slate-300 underline">Privacy Policy</a>
            <span>•</span>
            <a href="/terms" target="_blank" rel="noreferrer" className="hover:text-slate-300 underline">Terms of Service</a>
          </div>
          <span className="text-slate-400 font-mono">v2.3 Drive Engine</span>
        </div>

      </div>
    </div>
  );
};
