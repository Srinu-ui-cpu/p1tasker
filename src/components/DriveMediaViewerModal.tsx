import React from 'react';
import { 
  X, 
  ExternalLink, 
  Download, 
  FileText, 
  Cloud, 
  ShieldCheck, 
  Calendar, 
  HardDrive,
  Maximize2,
  Video,
  Play
} from 'lucide-react';
import { FileAttachment } from '../types';
import { GoogleAuthService } from '../services/googleAuthService';

interface DriveMediaViewerModalProps {
  isOpen: boolean;
  attachment: FileAttachment | null;
  onClose: () => void;
  date?: string;
}

export const DriveMediaViewerModal: React.FC<DriveMediaViewerModalProps> = ({
  isOpen,
  attachment,
  onClose,
  date,
}) => {
  if (!isOpen || !attachment) return null;

  const isImage = attachment.type.startsWith('image/');
  const isVideo = attachment.type.startsWith('video/');
  const driveFileUrl = (attachment.driveId && !attachment.driveId.startsWith('file-'))
    ? `https://drive.google.com/file/d/${attachment.driveId}/view`
    : GoogleAuthService.getDriveFolderUrl();

  const handleDownload = () => {
    if (attachment.dataUrl) {
      const a = document.createElement('a');
      a.href = attachment.dataUrl;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    if (driveFileUrl) {
      window.open(driveFileUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/80 shrink-0">
              {isImage ? <Cloud className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-white truncate" title={attachment.name}>
                {attachment.name}
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                <span>{(attachment.size / 1024).toFixed(1)} KB</span>
                <span>&bull;</span>
                <span className="uppercase">{attachment.type.split('/')[1] || 'FILE'}</span>
                {date && (
                  <>
                    <span>&bull;</span>
                    <span>Journal: {date}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={driveFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              title="Open file or vault directly in Google Drive"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View in Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 hover:text-white text-slate-400 transition"
              title="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Media Preview Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950 flex items-center justify-center min-h-[300px]">
          {isImage && attachment.dataUrl ? (
            <div className="relative max-w-full max-h-[60vh] flex items-center justify-center rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 p-2">
              <img 
                src={attachment.dataUrl} 
                alt={attachment.name} 
                className="max-w-full max-h-[58vh] object-contain rounded-xl shadow-lg"
              />
            </div>
          ) : isVideo ? (
            <div className="p-8 max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-5 shadow-2xl">
              <div className="w-20 h-20 rounded-3xl bg-indigo-950/80 text-indigo-400 border border-indigo-700/80 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/10 animate-pulse">
                <Video className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-extrabold text-lg text-white truncate max-w-xs mx-auto" title={attachment.name}>
                  {attachment.name}
                </h4>
                <p className="text-xs text-indigo-300 font-semibold mt-1">
                  {(attachment.size / (1024 * 1024)).toFixed(1)} MB &bull; High-Definition Media
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Uploaded directly to your public Google Drive media vault. Tap below to stream with full controls.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <a
                  href={driveFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Play in Google Drive</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-8 max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-800 mx-auto flex items-center justify-center shadow-lg">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">{attachment.name}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Document / Binary attachment synced to your private Google Drive cloud vault.
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 mx-auto shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Document</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Meta & Drive Vault Status */}
        <div className="p-3 sm:p-4 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
              Synced to 📁 Tasker App Data on Google Drive
            </span>
          </div>

          <div className="text-[10px] font-mono text-slate-500">
            SHA-256: <span className="text-slate-400">{attachment.hash}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
