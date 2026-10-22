import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Cloud, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  HardDrive 
} from 'lucide-react';
import { FirebaseAuthService } from '../services/firebaseAuthService';
import { GoogleAuthService } from '../services/googleAuthService';

interface AttachGoogleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
  userEmail?: string;
}

export const AttachGoogleModal: React.FC<AttachGoogleModalProps> = ({
  isOpen,
  onClose,
  onConnected,
  userEmail,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      const account = await GoogleAuthService.requestRealGoogleOAuth();
      if (account.accessToken) {
        await GoogleAuthService.initDriveFolder(account.accessToken).catch(() => {});
      }
      await GoogleAuthService.triggerDriveSync().catch(() => {});
      setIsConnecting(false);
      onConnected();
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setIsConnecting(false);
      setErrorMessage(error.message || 'Could not connect Google account. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="max-w-md w-full bg-slate-900 border border-amber-600/50 rounded-3xl p-6 sm:p-7 shadow-2xl relative space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          title="Dismiss for now"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-amber-950/80 border border-amber-700/80 text-amber-400 rounded-2xl shrink-0 mt-0.5 shadow-lg shadow-amber-500/10">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">Temporary Browser Storage</h3>
            <p className="text-xs text-amber-300 font-semibold mt-0.5">
              Your data is not yet backed up to Google Drive
            </p>
          </div>
        </div>

        {/* Informative Body */}
        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            You are currently signed in as <strong className="text-white font-mono">{userEmail || 'Local User'}</strong> using <strong>browser local storage</strong>.
          </p>
          <div className="space-y-1.5 text-[11px] text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-rose-400 font-bold shrink-0">⚠️ Risk:</span>
              <span>If you clear browser cookies or site cache, your tasks, diary entries, and schedules will be lost.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">💡 Solution:</span>
              <span>Attach your Google Account to create a permanent <strong>📁 Tasker App Data</strong> cloud vault on Google Drive.</span>
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-200 rounded-xl text-xs">
            {errorMessage}
          </div>
        )}

        {/* Call to Action Button */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleConnectGoogle}
            disabled={isConnecting}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-bold text-sm rounded-2xl flex items-center justify-center gap-3 transition shadow-xl shadow-white/10 border border-slate-200 group"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Connecting Google Drive...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Connect Google Account for Drive Backup</span>
                <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:translate-x-1 group-hover:text-slate-900 transition" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Continue with browser storage for now
          </button>
        </div>

      </div>
    </div>
  );
};
