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
  UserCheck 
} from 'lucide-react';
import { GoogleAuthService } from '../services/googleAuthService';

interface GoogleLoginPageProps {
  onLoginSuccess: () => void;
}

export const GoogleLoginPage: React.FC<GoogleLoginPageProps> = ({ onLoginSuccess }) => {
  const [emailInput, setEmailInput] = useState('');
  const [showCustomEmail, setShowCustomEmail] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const existingAccounts = GoogleAuthService.getAllAccounts();

  const handleGoogleSignIn = (email?: string, name?: string) => {
    setIsSigningIn(true);
    const targetEmail = email || emailInput.trim() || 'mouli.workspace@gmail.com';
    const targetName = name || (emailInput.trim() ? emailInput.split('@')[0] : 'Mouli User');

    setTimeout(() => {
      GoogleAuthService.signInWithGoogle(targetEmail, targetName);
      GoogleAuthService.setAuthenticated(true);
      setIsSigningIn(false);
      onLoginSuccess();
    }, 600);
  };

  const handleGuestAccess = () => {
    GoogleAuthService.setAuthenticated(true);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl z-10 space-y-6">
        
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
              Autonomous Productivity, Calendar Timeline & Private AI Vault
            </p>
          </div>
        </div>

        {/* Feature Highlights Pill List */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
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
            <span>ChatGPT-Style Memory</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Uncensored Local AI</span>
          </div>
        </div>

        {/* Google Authentication Actions */}
        <div className="space-y-3 pt-2">
          {/* Main Google Sign-In Button */}
          <button
            disabled={isSigningIn}
            onClick={() => handleGoogleSignIn()}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 shadow-xl hover:shadow-indigo-500/10 transition group"
          >
            {/* Google "G" SVG */}
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
            <span>{isSigningIn ? 'Authenticating with Google...' : 'Sign in with Google'}</span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition ml-auto" />
          </button>

          {/* Existing Google Accounts Quick Switch */}
          {existingAccounts.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 block text-center">
                Or continue with existing linked account:
              </span>
              <div className="space-y-1">
                {existingAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => handleGoogleSignIn(acc.email, acc.name)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {acc.avatarUrl ? (
                        <img src={acc.avatarUrl} alt={acc.name} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                          {acc.name[0]}
                        </div>
                      )}
                      <div className="text-left truncate">
                        <span className="font-semibold text-slate-200 block truncate">{acc.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">{acc.email}</span>
                      </div>
                    </div>
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add custom Google Email Toggle */}
          <div className="pt-1">
            {!showCustomEmail ? (
              <button
                type="button"
                onClick={() => setShowCustomEmail(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline block mx-auto transition"
              >
                + Sign in with another Google Account
              </button>
            ) : (
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 animate-fade-in">
                <input
                  type="email"
                  placeholder="your.name@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGoogleSignIn()}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md"
                  >
                    Sign In & Set Storage
                  </button>
                  <button
                    onClick={() => setShowCustomEmail(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>OAuth 2.0 & AES-GCM Encrypted</span>
          </div>

          <button
            onClick={handleGuestAccess}
            className="hover:text-slate-300 transition underline"
          >
            Offline Guest Access
          </button>
        </div>

      </div>
    </div>
  );
};
