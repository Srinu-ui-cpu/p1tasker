import React, { useState } from 'react';
import { 
  CheckSquare, 
  ArrowRight, 
  AlertCircle,
  Mail, 
  User, 
  ShieldCheck, 
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { GoogleAuthService } from '../services/googleAuthService';
import { FirebaseAuthService } from '../services/firebaseAuthService';

interface GoogleLoginPageProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
}

export const GoogleLoginPage: React.FC<GoogleLoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGooglePopupActive, setIsGooglePopupActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showEmailFallback, setShowEmailFallback] = useState(false);

  // --- Official Firebase Google Sign-In Flow ---
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setIsGooglePopupActive(true);
    setErrorMessage(null);

    try {
      if (rememberMe) {
        localStorage.setItem('tasker_remember_me', 'true');
      } else {
        localStorage.removeItem('tasker_remember_me');
      }

      // Firebase handles authentication and Google Drive scopes in a single popup
      await FirebaseAuthService.signInWithGoogle();
      
      setIsSubmitting(false);
      setIsGooglePopupActive(false);
      onLoginSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setIsSubmitting(false);
      setIsGooglePopupActive(false);
      console.error('Sign-in error:', error);
      setErrorMessage(error.message || 'Google Sign-In was cancelled or failed. Please try again.');
    }
  };

  // --- Direct Email Vault Fallback ---
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
      setErrorMessage(error.message || 'Could not open account vault.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Subtle Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Clean Card */}
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6">
        
        {/* Top Back to Home Button */}
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
              Autonomous Productivity & Personal Google Drive Cloud Vault
            </p>
          </div>
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
              <span className="text-xs text-rose-300 block leading-relaxed">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* PRIMARY GOOGLE AUTH BUTTON */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-4 px-4 bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-3 transition shadow-xl shadow-white/10 border border-slate-200 group relative overflow-hidden"
          >
            {isGooglePopupActive ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Connecting with Google...</span>
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
                  {authMode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
                </span>
                <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:translate-x-1 group-hover:text-slate-900 transition" />
              </>
            )}
          </button>

          {/* Clean Single-Screen Permission Notice */}
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Google will ask permission to create and sync your private <strong className="text-white">Tasker App Data</strong> folder. 
              Your existing Google Drive files are never accessed or shared.
            </p>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span>Remember my session</span>
            </label>
            <span className="text-[10px] text-emerald-400 font-medium">Auto-Sync Enabled</span>
          </div>
        </div>

        {/* Minimal Email Fallback (Clean Accordion) */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowEmailFallback(!showEmailFallback)}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition py-1 flex items-center justify-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>{showEmailFallback ? 'Hide email entry' : 'Or continue with email'}</span>
          </button>

          {showEmailFallback && (
            <form onSubmit={handleEmailSubmit} className="mt-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 animate-fade-in">
              <div className="space-y-1">
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>

              {authMode === 'signup' && (
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Your Name (Optional)"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !emailInput.trim()}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Continue with Email
              </button>
            </form>
          )}
        </div>

        {/* Footer Links */}
        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60">
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
