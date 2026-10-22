import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Download, 
  FileText, 
  Cloud, 
  Upload,
  AlertCircle,
  Video,
  Play,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { FileAttachment } from '../types';
import { GoogleAuthService } from '../services/googleAuthService';

interface DriveMediaViewerModalProps {
  isOpen: boolean;
  attachment: FileAttachment | null;
  onClose: () => void;
  date?: string;
  onRetryUpload?: (attachment: FileAttachment) => Promise<void>;
}

export const DriveMediaViewerModal: React.FC<DriveMediaViewerModalProps> = ({
  isOpen,
  attachment,
  onClose,
  date,
  onRetryUpload,
}) => {
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  if (!isOpen || !attachment) return null;

  const isImage = attachment.type.startsWith('image/');
  const isVideo = attachment.type.startsWith('video/');
  const hasValidDriveId = !!(
    attachment.driveId && 
    !attachment.driveId.startsWith('file-') && 
    /^[a-zA-Z0-9_-]{15,}$/.test(attachment.driveId)
  );

  const driveFileUrl = hasValidDriveId
    ? `https://drive.google.com/file/d/${attachment.driveId}/view`
    : null;

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

  const handleTriggerRetry = async () => {
    if (!onRetryUpload) return;
    setRetrying(true);
    setRetryMessage('Connecting to Google Drive and uploading...');
    try {
      await onRetryUpload(attachment);
      setRetryMessage('Upload complete!');
      setTimeout(() => setRetryMessage(null), 3000);
    } catch (e: any) {
      setRetryMessage(`Upload error: ${e.message || e}`);
    } finally {
      setRetrying(false);
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
            {hasValidDriveId && driveFileUrl ? (
              <a
                href={driveFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                title="Open file directly in Google Drive"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View in Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : onRetryUpload ? (
              <button
                type="button"
                onClick={handleTriggerRetry}
                disabled={retrying}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                title="Upload file to Google Drive"
              >
                {retrying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{retrying ? 'Uploading...' : 'Upload to Drive'}</span>
              </button>
            ) : null}

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
        <div className="flex-1 overflow-hidden p-2 sm:p-4 bg-slate-950 flex items-center justify-center min-h-[400px]">
          {hasValidDriveId ? (
            <div className="w-full h-[65vh] rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl relative">
              <iframe
                src={`https://drive.google.com/file/d/${attachment.driveId}/preview`}
                allow="autoplay"
                className="w-full h-full border-0 rounded-2xl"
                title={attachment.name}
              />
            </div>
          ) : isImage && attachment.dataUrl ? (
            <div className="flex flex-col items-center justify-center max-w-full space-y-3">
              <div className="relative max-w-full max-h-[52vh] flex items-center justify-center rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 p-2">
                <img 
                  src={attachment.dataUrl} 
                  alt={attachment.name} 
                  className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-lg"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs text-amber-400 font-medium flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Local Storage Only (Not uploaded to Google Drive)
                </p>
                {attachment.uploadError && (
                  <p className="text-[10px] text-rose-400/90 font-mono">
                    Drive error: {attachment.uploadError}
                  </p>
                )}
                {onRetryUpload && (
                  <button
                    onClick={handleTriggerRetry}
                    disabled={retrying}
                    className="mt-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 shadow"
                  >
                    {retrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    <span>{retrying ? 'Uploading to Drive...' : 'Retry Upload to Google Drive'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : isVideo ? (
            <div className="p-8 max-w-md w-full bg-slate-900 border border-amber-900/50 rounded-3xl text-center space-y-4 shadow-2xl">
              <div className="w-20 h-20 rounded-3xl bg-amber-950/60 text-amber-400 border border-amber-700/80 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
                <Video className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-extrabold text-lg text-white truncate max-w-xs mx-auto" title={attachment.name}>
                  {attachment.name}
                </h4>
                <p className="text-xs text-amber-300 font-semibold mt-1">
                  {(attachment.size / (1024 * 1024)).toFixed(1)} MB &bull; High-Definition Video
                </p>
                <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Local Storage Only (Not uploaded to Google Drive)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {attachment.uploadError
                      ? `Upload error: ${attachment.uploadError}`
                      : 'This file has not yet been streamed to your Google Drive Videos folder.'}
                  </p>
                </div>
              </div>
              {onRetryUpload && (
                <div className="pt-2">
                  <button
                    onClick={handleTriggerRetry}
                    disabled={retrying}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 w-full"
                  >
                    {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{retrying ? 'Uploading to Drive Videos...' : 'Upload Video to Google Drive'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-950/60 text-amber-400 border border-amber-800/80 mx-auto flex items-center justify-center shadow-lg">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">{attachment.name}</h4>
                <div className="mt-2 p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Local Storage Only (Not uploaded to Google Drive)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {attachment.uploadError
                      ? `Error: ${attachment.uploadError}`
                      : 'File is saved in local browser storage only.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                {onRetryUpload && (
                  <button
                    onClick={handleTriggerRetry}
                    disabled={retrying}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    {retrying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{retrying ? 'Uploading...' : 'Upload to Google Drive'}</span>
                  </button>
                )}
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Meta & Drive Vault Status */}
        <div className="p-3 sm:p-4 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {hasValidDriveId ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  Saved to Google Drive: Tasker_Media Vault
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[11px] font-mono text-amber-400 font-semibold">
                  Local Storage Only (Not uploaded to Google Drive)
                </span>
                {attachment.uploadError && (
                  <span className="text-[10px] font-mono text-rose-400 ml-1 truncate max-w-[200px]" title={attachment.uploadError}>
                    &bull; {attachment.uploadError}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="text-[10px] font-mono text-slate-500">
            SHA-256: <span className="text-slate-400">{attachment.hash}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
