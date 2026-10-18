import React, { useState } from 'react';
import { 
  CheckSquare, 
  Cloud, 
  Sparkles, 
  Calendar, 
  ArrowRight, 
  AlertCircle,
  Mail, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2,
  Key,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ExternalLink,
  Flame,
  Info
} from 'lucide-react';
import { GoogleAuthService } from '../services/googleAuthService';
import { FirebaseAuthService, FirebaseConfig } from '../services/firebaseAuthService';

interface GoogleLoginPageProps {
  onLoginSuccess: () => void;
}

export const GoogleLoginPage: React.FC<GoogleLoginPageProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGooglePopupActive, setIsGooglePopupActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDirectEmail, setShowDirectEmail] = useState(false);
  const [showHelpExplainer, setShowHelpExplainer] = useState(false);

  // Firebase Configuration Drawer
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(() => FirebaseAuthService.isConfigured());
  const [showFirebaseConfig, setShowFirebaseConfig] = useState(!FirebaseAuthService.isConfigured());
  const [firebaseSnippetInput, setFirebaseSnippetInput] = useState('');
  const [firebaseConfigObj, setFirebaseConfigObj] = useState<FirebaseConfig>(() => FirebaseAuthService.getConfig());
  const [firebaseSavedSuccess, setFirebaseSavedSuccess] = useState(false);

  // Direct GCP Client ID fallback
  const [showClientIdConfig, setShowClientIdConfig] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(() => GoogleAuthService.getClientId());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Helper to parse pasted Firebase config (JS object or JSON)
  const parseFirebaseSnippet = (raw: string): Partial<FirebaseConfig> | null => {
    try {
      // 1. Try direct JSON parse
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    } catch {
      // 2. Try regex extraction from JS code (const firebaseConfig = { ... })
      const apiKeyMatch = raw.match(/apiKey:\s*["']([^"']+)["']/);
      const authDomainMatch = raw.match(/authDomain:\s*["']([^"']+)["']/);
      const projectIdMatch = raw.match(/projectId:\s*["']([^"']+)["']/);
      const storageBucketMatch = raw.match(/storageBucket:\s*["']([^"']+)["']/);
      const messagingSenderIdMatch = raw.match(/messagingSenderId:\s*["']([^"']+)["']/);
      const appIdMatch = raw.match(/appId:\s*["']([^"']+)["']/);

      if (apiKeyMatch && projectIdMatch) {
        return {
          apiKey: apiKeyMatch[1],
          authDomain: authDomainMatch ? authDomainMatch[1] : `${projectIdMatch[1]}.firebaseapp.com`,
          projectId: projectIdMatch[1],
          storageBucket: storageBucketMatch ? storageBucketMatch[1] : undefined,
          messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1] : undefined,
          appId: appIdMatch ? appIdMatch[1] : undefined,
        };
      }
    }
    return null;
  };

  // --- Primary Firebase Google Sign-In Flow ---
  const handleFirebaseGoogleSignIn = async () => {
    setIsSubmitting(true);
    setIsGooglePopupActive(true);
    setErrorMessage(null);

    // If Firebase is not configured, open the setup drawer
    if (!FirebaseAuthService.isConfigured()) {
      setShowFirebaseConfig(true);
      setIsSubmitting(false);
      setIsGooglePopupActive(false);
      setErrorMessage(
        'Firebase configuration needed: Please paste your Firebase web project config below to enable universal Google Sign-In.'
      );
      return;
    }

    try {
      if (rememberMe) {
        localStorage.setItem('tasker_remember_me', 'true');
      } else {
        localStorage.removeItem('tasker_remember_me');
      }

      await FirebaseAuthService.signInWithGoogle();
      setIsSubmitting(false);
      setIsGooglePopupActive(false);
      onLoginSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setIsSubmitting(false);
      setIsGooglePopupActive(false);
      console.error('Firebase Auth error:', error);
      setErrorMessage(error.message || 'Firebase Google Sign-In failed. Please check the setup or try direct email.');
    }
  };

  // --- Save Firebase Configuration ---
  const handleSaveFirebaseConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let cfgToSave: FirebaseConfig = { ...firebaseConfigObj };

    if (firebaseSnippetInput.trim()) {
      const parsed = parseFirebaseSnippet(firebaseSnippetInput);
      if (parsed && parsed.apiKey && parsed.projectId) {
        cfgToSave = {
          apiKey: parsed.apiKey || '',
          authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
          projectId: parsed.projectId || '',
          storageBucket: parsed.storageBucket || '',
          messagingSenderId: parsed.messagingSenderId || '',
          appId: parsed.appId || '',
        };
        setFirebaseConfigObj(cfgToSave);
      } else {
        setErrorMessage('Could not extract Firebase config from snippet. Please check the snippet format or fill the fields below.');
        return;
      }
    }

    if (!cfgToSave.apiKey?.trim() || !cfgToSave.projectId?.trim()) {
      setErrorMessage('Please provide both Firebase API Key and Project ID.');
      return;
    }

    FirebaseAuthService.saveConfig(cfgToSave);
    setIsFirebaseConfigured(true);
    setFirebaseSavedSuccess(true);
    setErrorMessage(null);
    setTimeout(() => setFirebaseSavedSuccess(false), 3000);
  };

  // --- Direct GCP Client ID fallback ---
  const handleDirectGcpOAuth = async () => {
    setIsSubmitting(true);
    setIsGooglePopupActive(true);
    setErrorMessage(null);

    try {
      if (rememberMe) {
        localStorage.setItem('tasker_remember_me', 'true');
      } else {
        localStorage.removeItem('tasker_remember_me');
      }

      await GoogleAuthService.requestRealGoogleOAuth();
      GoogleAuthService.setAuthenticated(true);
      setIsSubmitting(false);
      setIsGooglePopupActive(false);
      onLoginSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setIsSubmitting(false);
      setIsGooglePopupActive(false);
      setErrorMessage(error.message || 'Direct Google OAuth failed.');
    }
  };

  const handleSaveClientId = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = clientIdInput.trim();
    if (!cleanId) return;

    GoogleAuthService.saveClientId(cleanId);
    setSavedSuccess(true);
    setErrorMessage(null);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // --- Direct Email Vault Flow (Fallback / Instant Access) ---
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid Google Account or Gmail address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (rememberMe) {
        localStorage.setItem('tasker_remember_me', 'true');
      }

      GoogleAuthService.signInWithRealEmail(cleanEmail, nameInput.trim() || undefined);
      GoogleAuthService.setAuthenticated(true);

      setTimeout(() => {
        setIsSubmitting(false);
        onLoginSuccess();
      }, 300);
    } catch (err: unknown) {
      const error = err as Error;
      setIsSubmitting(false);
      setErrorMessage(error.message || 'Could not initialize Google Account vault.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-5">
        
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
              Autonomous Productivity & Personal Google Drive Cloud Vault
            </p>
          </div>
        </div>

        {/* Why Google Login says "Authorization Error" Explainer Banner */}
        <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-2xl text-xs space-y-1.5">
          <button
            type="button"
            onClick={() => setShowHelpExplainer(!showHelpExplainer)}
            className="w-full flex items-center justify-between text-left text-amber-300 font-semibold hover:text-amber-200"
          >
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Why did Google say "Access blocked: Authorization Error"?</span>
            </div>
            {showHelpExplainer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showHelpExplainer && (
            <div className="pt-2 text-[11px] text-amber-200/90 leading-relaxed space-y-1.5 border-t border-amber-800/40 animate-fade-in">
              <p>
                <strong>Google Cloud OAuth in "Testing" mode:</strong> In GCP Console, when an OAuth consent screen is set to <em>Testing</em>, Google strictly permits only emails listed in the manual "Test Users" whitelist. Any other Google account receives:
              </p>
              <div className="p-2 bg-slate-950/90 rounded-lg font-mono text-[10px] text-rose-300 border border-rose-900/40">
                Access blocked: Authorization Error - The developer has not given you access to this app.
              </div>
              <p>
                <strong>How Firebase Auth solves this:</strong> Firebase Authentication uses Firebase's verified OAuth domain handler (<code>firebaseapp.com</code>). It allows <strong>any user with any Google account</strong> to sign in smoothly without manual test user lists!
              </p>
            </div>
          )}
        </div>

        {/* Auth Mode Toggle Pill (Sign In / Sign Up) */}
        <div className="p-1 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center">
          <button
            type="button"
            onClick={() => setAuthMode('signin')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              authMode === 'signin'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              authMode === 'signup'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Display */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-200 rounded-2xl text-xs flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Notice</span>
              <span className="text-[11px] text-rose-300 block leading-relaxed">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* PRIMARY FIREBASE GOOGLE AUTH BUTTON */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleFirebaseGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-3 transition shadow-xl shadow-white/10 border border-slate-200 group relative overflow-hidden"
          >
            {isGooglePopupActive ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Connecting with Firebase Google Auth...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>
                  {authMode === 'signin' ? 'Sign in with Google (Firebase)' : 'Sign up with Google (Firebase)'}
                </span>
                <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:translate-x-1 group-hover:text-slate-900 transition" />
              </>
            )}
          </button>

          {/* Unified Permissions Information */}
          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2 text-[11px] text-slate-300">
            <span className="font-bold text-slate-200 block text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Single-Screen Drive Permissions</span>
              </span>
              <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Firebase Enabled</span>
              </span>
            </span>
            <div className="space-y-1.5 text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Supports any Google Account (no whitelist restrictions)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Auto-creates <code>📁 Tasker App Data</code> on Google Drive</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Syncs diary notes, tasks, alarms & encrypted backups</span>
              </div>
            </div>
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span>Remember my session on this device</span>
            </label>
            <span className="text-[10px] text-emerald-400 font-medium">Auto-Sync Enabled</span>
          </div>
        </div>

        {/* FIREBASE CONFIGURATION DRAWER */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowFirebaseConfig(!showFirebaseConfig)}
            className="w-full py-2 px-2.5 rounded-xl text-left text-xs flex items-center justify-between transition bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800"
          >
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-slate-200">Firebase Project Configuration</span>
              {isFirebaseConfigured ? (
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded border border-emerald-800">
                  Ready
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-950 text-amber-300 rounded border border-amber-800">
                  Setup Needed
                </span>
              )}
            </div>
            {showFirebaseConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showFirebaseConfig && (
            <div className="mt-2.5 p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3.5 text-xs animate-fade-in">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white block">Smart Paste: Firebase Config Snippet</span>
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
                  >
                    <span>Firebase Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-400">
                  In Firebase Console &gt; Project Settings &gt; General &gt; <em>Your apps</em>, copy the <code>firebaseConfig</code> code snippet and paste it below:
                </p>
              </div>

              <textarea
                rows={3}
                placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "my-app.firebaseapp.com",\n  projectId: "my-app"\n};`}
                value={firebaseSnippetInput}
                onChange={(e) => setFirebaseSnippetInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">API Key</label>
                  <input
                    type="text"
                    placeholder="AIzaSy..."
                    value={firebaseConfigObj.apiKey}
                    onChange={(e) => setFirebaseConfigObj({ ...firebaseConfigObj, apiKey: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Project ID</label>
                  <input
                    type="text"
                    placeholder="my-project-id"
                    value={firebaseConfigObj.projectId}
                    onChange={(e) => setFirebaseConfigObj({ ...firebaseConfigObj, projectId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleSaveFirebaseConfig}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Save & Connect Firebase</span>
                </button>
              </div>

              {firebaseSavedSuccess && (
                <div className="p-2 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-[11px] font-medium flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Firebase config saved! You can now click "Sign in with Google (Firebase)" above.</span>
                </div>
              )}

              <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[10px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">Quick 2-Step Setup in Firebase:</div>
                <div>1. In Firebase Console, go to <strong>Build &gt; Authentication &gt; Sign-in method</strong> and enable <strong>Google</strong>.</div>
                <div>2. Under <strong>Settings &gt; Authorized domains</strong>, make sure <code>localhost</code> and your Vercel domain (<code>p1tasker.vercel.app</code>) are listed.</div>
              </div>
            </div>
          )}
        </div>

        {/* ALTERNATIVE 1: DIRECT EMAIL VAULT (INSTANT ACCESS) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowDirectEmail(!showDirectEmail)}
            className="w-full py-2 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 text-left text-xs flex items-center justify-between transition text-slate-400 hover:text-slate-200"
          >
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Or sign in with Google Email directly (Instant)</span>
            </div>
            {showDirectEmail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDirectEmail && (
            <form onSubmit={handleEmailSubmit} className="mt-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 animate-fade-in">
              <div className="space-y-1">
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>

              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Display Name (Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !emailInput.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
              >
                <span>Enter Personal Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* ALTERNATIVE 2: DIRECT GCP OAUTH CLIENT ID CONFIGURATION */}
        <div>
          <button
            type="button"
            onClick={() => setShowClientIdConfig(!showClientIdConfig)}
            className="w-full py-1.5 px-2 rounded-xl text-left text-[11px] flex items-center justify-between transition text-slate-500 hover:text-slate-300"
          >
            <div className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-500" />
              <span>Direct Google Cloud Client ID (Advanced Fallback)</span>
            </div>
            {showClientIdConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showClientIdConfig && (
            <div className="mt-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs animate-fade-in">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="xxxx.apps.googleusercontent.com"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleSaveClientId}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  Save
                </button>
              </div>
              <button
                type="button"
                onClick={handleDirectGcpOAuth}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-medium transition"
              >
                Sign In with Direct GCP OAuth
              </button>
              {savedSuccess && (
                <span className="text-[11px] text-emerald-400 font-semibold block">✔ Client ID saved!</span>
              )}
            </div>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Google Drive Vault</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Interactive Calendar</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span>AI Second Brain</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Zero-Data Privacy</span>
          </div>
        </div>

        {/* Security & Compliance Links */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <a href="/privacy" target="_blank" rel="noreferrer" className="hover:text-slate-300 underline">Privacy Policy</a>
            <span>•</span>
            <a href="/terms" target="_blank" rel="noreferrer" className="hover:text-slate-300 underline">Terms of Service</a>
          </div>
          <span className="text-slate-400 font-mono">v2.1 Production</span>
        </div>

      </div>
    </div>
  );
};
