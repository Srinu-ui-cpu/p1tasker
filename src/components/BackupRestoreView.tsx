import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Upload, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Sparkles, 
  Database, 
  RefreshCw, 
  Users, 
  ArrowRight,
  Lock,
  Unlock,
  Cloud
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StorageService } from '../services/storageService';
import { GoogleAuthService } from '../services/googleAuthService';
import { BackupService } from '../services/backupService';
import { RawBackupData, EncryptedBackupBundle } from '../types';

interface BackupRestoreViewProps {
  onDataRestored: () => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({ onDataRestored }) => {
  const activeAccount = GoogleAuthService.getActiveAccount();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup State
  const [backupKey, setBackupKey] = useState('');
  const [showBackupKey, setShowBackupKey] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDriveSaving, setIsDriveSaving] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Import State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileSummary, setFileSummary] = useState<EncryptedBackupBundle['summary'] | null>(null);
  const [fileCreatorEmail, setFileCreatorEmail] = useState<string | null>(null);
  const [importKey, setImportKey] = useState('');
  const [showImportKey, setShowImportKey] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [decryptedData, setDecryptedData] = useState<RawBackupData | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Current stats
  const tasksCount = StorageService.getTasks().length;
  const diaryCount = Object.keys(StorageService.getDiaryEntries()).length;
  const filesCount = Object.keys(StorageService.getFileRegistry()).length;
  const chatSessionsCount = StorageService.getChatSessions().length;

  // --- HANDLE CREATE BACKUP ---
  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupKey.trim()) return;

    setIsExporting(true);
    setExportSuccess(null);

    try {
      const { jsonString, filename } = await BackupService.createEncryptedBackup(
        backupKey.trim(),
        activeAccount?.email || 'local_user'
      );

      BackupService.downloadBackupFile(jsonString, filename);
      setExportSuccess(`✔ Encrypted backup created and downloaded: ${filename}`);
      setBackupKey('');
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Export error: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // --- HANDLE SAVE BACKUP TO GOOGLE DRIVE ---
  const handleSaveBackupToDrive = async () => {
    if (!backupKey.trim()) {
      alert('Please enter a secret key / passphrase first to encrypt your backup before saving to Google Drive.');
      return;
    }

    setIsDriveSaving(true);
    setExportSuccess(null);

    try {
      const { filename } = await BackupService.saveEncryptedBackupToDrive(backupKey.trim());
      setExportSuccess(`✔ Encrypted backup "${filename}" securely synced and saved to Google Drive vault for ${activeAccount?.email || 'Local User'}!`);
      setBackupKey('');
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Google Drive backup error: ${error.message}`);
    } finally {
      setIsDriveSaving(false);
    }
  };

  // --- HANDLE LOAD BACKUP FROM GOOGLE DRIVE ---
  const handleLoadDriveBackup = () => {
    const driveBackup = BackupService.getEncryptedBackupFromDrive();
    if (!driveBackup) {
      alert('No encrypted backup found in your Google Drive vault. Please create or save a backup first.');
      return;
    }

    const mockFile = new File([driveBackup.jsonString], `GoogleDrive_Vault_Backup.taskerbackup`, { type: 'application/json' });
    setSelectedFile(mockFile);
    setFileContent(driveBackup.jsonString);
    if (driveBackup.bundle.createdByEmail) setFileCreatorEmail(driveBackup.bundle.createdByEmail);
    if (driveBackup.bundle.summary) setFileSummary(driveBackup.bundle.summary);
    setDecryptError(null);
    setDecryptedData(null);
  };

  // --- HANDLE FILE SELECTION ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setDecryptError(null);
    setDecryptedData(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);

      try {
        const parsed = JSON.parse(text);
        if (parsed.createdByEmail) setFileCreatorEmail(parsed.createdByEmail);
        if (parsed.summary) setFileSummary(parsed.summary);
      } catch {
        // Handled upon decryption
      }
    };
    reader.readAsText(file);
  };

  // --- HANDLE DECRYPT & VERIFY ---
  const handleDecryptFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileContent || !importKey.trim()) return;

    setIsDecrypting(true);
    setDecryptError(null);

    try {
      const { data, bundle } = await BackupService.verifyAndDecryptBackup(
        fileContent,
        importKey.trim()
      );

      setDecryptedData(data);
      setFileSummary(bundle.summary);
      setFileCreatorEmail(bundle.createdByEmail);
    } catch (err: unknown) {
      const error = err as Error;
      setDecryptError(error.message);
    } finally {
      setIsDecrypting(false);
    }
  };

  // --- HANDLE RESTORE & SYNC ---
  const handleApplyRestore = () => {
    if (!decryptedData) return;

    const result = BackupService.restoreBackupData(decryptedData, restoreMode);

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
    });

    setImportSuccess(
      `🎉 Successfully imported ${result.tasksCount} tasks, ${result.diaryCount} diary entries, and ${result.filesCount} files into ${activeAccount?.email || 'Local Storage'}!`
    );

    setDecryptedData(null);
    setSelectedFile(null);
    setFileContent(null);
    setImportKey('');
    onDataRestored();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60">
                <Database className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight">Security-Encrypted Backup & Cross-Account Vault Sync</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              Export an AES-256 encrypted snapshot of your entire workspace (tasks, checklists, daily journals, attachments, alarms, and AI conversations). 
              If <span className="text-slate-200 font-semibold">Account X</span> shares this backup with <span className="text-slate-200 font-semibold">Account Y</span>, 
              Account Y can seamlessly import and sync all items by providing the creator's security key.
            </p>
          </div>

          {/* Active Account Pill */}
          <div className="bg-slate-950/80 border border-slate-700/80 rounded-2xl p-3 flex items-center gap-3">
            <img
              src={activeAccount?.avatarUrl || 'https://ui-avatars.com/api/?name=Tasker+User&background=4285F4&color=fff'}
              alt={activeAccount?.name || 'Local Vault'}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/50"
            />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Active Storage Account</span>
              <span className="text-xs font-semibold text-slate-200">{activeAccount?.email || 'Local User (No Cloud Account)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Create Backup vs Import Backup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD 1: CREATE BACKUP */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-800/80 flex items-center justify-center text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Protected Backup</h3>
              <p className="text-xs text-slate-400">Generates an encrypted .taskerbackup bundle</p>
            </div>
          </div>

          {/* Current Vault Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center">
            <div>
              <span className="text-[11px] text-slate-400 block">Tasks</span>
              <span className="text-sm font-bold text-white">{tasksCount}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Diary Entries</span>
              <span className="text-sm font-bold text-purple-400">{diaryCount}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Media Files</span>
              <span className="text-sm font-bold text-indigo-400">{filesCount}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">AI Chat Sessions</span>
              <span className="text-sm font-bold text-emerald-400">{chatSessionsCount}</span>
            </div>
          </div>

          <form onSubmit={handleCreateBackup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Set Security Key / Passphrase <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showBackupKey ? 'text' : 'password'}
                  required
                  placeholder="e.g., SecretPassphrase2026!"
                  value={backupKey}
                  onChange={(e) => setBackupKey(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowBackupKey(!showBackupKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showBackupKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                🛡️ This key encrypts your entire workspace (tasks, diaries, alarms, chat sessions, attached media) using AES-GCM (256-bit). To import this backup into Account Y, the recipient must enter this key.
              </p>
            </div>

            {exportSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{exportSuccess}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="submit"
                disabled={isExporting || isDriveSaving || !backupKey.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{isExporting ? 'Encrypting...' : 'Download Encrypted File (.taskerbackup)'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveBackupToDrive}
                disabled={isExporting || isDriveSaving || !backupKey.trim()}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                title="Save encrypted backup directly into Google Drive Vault"
              >
                {isDriveSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4 text-indigo-400" />}
                <span>{isDriveSaving ? 'Saving...' : 'Sync to Google Drive'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* CARD 2: IMPORT BACKUP */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-purple-950 border border-purple-800/80 flex items-center justify-center text-purple-400">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Import Cross-Account Backup</h3>
              <p className="text-xs text-slate-400">Unlock data from Account X using their key</p>
            </div>
          </div>

          {/* File Picker */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".taskerbackup,.json"
            onChange={handleFileChange}
            className="hidden"
          />

          {!selectedFile ? (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-purple-500/80 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-950/40 group"
              >
                <Upload className="w-8 h-8 mx-auto text-slate-500 group-hover:text-purple-400 transition mb-2" />
                <span className="text-xs font-semibold text-slate-200 block">Click to select backup file</span>
                <span className="text-[11px] text-slate-500 block mt-1">Accepts .taskerbackup or .json files</span>
              </div>

              <button
                type="button"
                onClick={handleLoadDriveBackup}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-center gap-2"
              >
                <Cloud className="w-4 h-4 text-purple-400" />
                <span>Or Load Latest Backup from Google Drive Vault</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 truncate">
                <FileText className="w-5 h-5 text-purple-400 shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-bold text-white block truncate">{selectedFile.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {fileCreatorEmail ? `Created by: ${fileCreatorEmail}` : 'Encrypted Tasker File'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setDecryptedData(null);
                  setDecryptError(null);
                }}
                className="text-xs text-slate-400 hover:text-white transition px-2 py-1"
              >
                Change
              </button>
            </div>
          )}

          {/* Key Form */}
          {selectedFile && !decryptedData && (
            <form onSubmit={handleDecryptFile} className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Security Key from {fileCreatorEmail || 'Account X'} <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showImportKey ? 'text' : 'password'}
                    required
                    placeholder="Enter creator’s security key..."
                    value={importKey}
                    onChange={(e) => setImportKey(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowImportKey(!showImportKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showImportKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {decryptError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{decryptError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isDecrypting || !importKey.trim()}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-600/30 flex items-center justify-center gap-2"
              >
                {isDecrypting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                <span>{isDecrypting ? 'Verifying Key...' : 'Decrypt & Verify Key'}</span>
              </button>
            </form>
          )}

          {/* Unlocked Decrypted View */}
          {decryptedData && (
            <div className="space-y-4 p-4 bg-emerald-950/20 border border-emerald-800/50 rounded-2xl animate-in zoom-in-95">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Key Verified! Unlocked data from {fileCreatorEmail || 'Account X'}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Tasks</span>
                  <span className="font-bold text-white">{decryptedData.tasks?.length || 0}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Diary</span>
                  <span className="font-bold text-white">{Object.keys(decryptedData.diary || {}).length}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Files</span>
                  <span className="font-bold text-white">{Object.keys(decryptedData.fileRegistry || {}).length}</span>
                </div>
              </div>

              {/* Restore Mode Radio Buttons */}
              <div>
                <span className="text-[11px] font-bold text-slate-300 block mb-1.5">Select Import Mode:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className={`p-2.5 rounded-xl border cursor-pointer transition ${
                    restoreMode === 'merge' ? 'bg-indigo-950 border-indigo-600 text-indigo-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="mode"
                      checked={restoreMode === 'merge'}
                      onChange={() => setRestoreMode('merge')}
                      className="hidden"
                    />
                    <span className="font-bold block">Merge Data</span>
                    <span className="text-[10px] opacity-75">Keep existing & append</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border cursor-pointer transition ${
                    restoreMode === 'replace' ? 'bg-purple-950 border-purple-600 text-purple-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="mode"
                      checked={restoreMode === 'replace'}
                      onChange={() => setRestoreMode('replace')}
                      className="hidden"
                    />
                    <span className="font-bold block">Clean Replace</span>
                    <span className="text-[10px] opacity-75">Overwrite current</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleApplyRestore}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Apply Import & Sync to {activeAccount?.email || 'Local Storage'}</span>
              </button>
            </div>
          )}

          {importSuccess && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
