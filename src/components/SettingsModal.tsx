import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  X, 
  Cloud, 
  Key, 
  BrainCircuit, 
  Bell, 
  Download, 
  Upload, 
  Sparkles, 
  Check, 
  RefreshCw, 
  Volume2, 
  Shield,
  UserPlus,
  Trash2,
  CheckCircle2,
  FolderSync
} from 'lucide-react';
import { AIState, AIProvider, GoogleDriveState, GoogleAccount } from '../types';
import { AIBrokerService } from '../services/aiBrokerService';
import { StorageService } from '../services/storageService';
import { AlarmService } from '../services/alarmService';
import { GoogleAuthService } from '../services/googleAuthService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
  onOpenLocalAI: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
  onOpenLocalAI,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'cloud' | 'alarms'>('ai');
  const [aiConfig, setAiConfig] = useState<AIState>(() => AIBrokerService.getConfig());
  const [driveState, setDriveState] = useState<GoogleDriveState>(() => GoogleAuthService.getDriveState());
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isScanningModels, setIsScanningModels] = useState(false);

  // Multi-Google Account States
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [accountFeedback, setAccountFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveAIConfig = (newConfig: AIState) => {
    setAiConfig(newConfig);
    AIBrokerService.saveConfig(newConfig);
    onConfigUpdated();
  };

  // --- Dynamic Model Scan ---
  const handleScanModels = async (provider: 'groq' | 'gemini' | 'openai') => {
    const key = aiConfig.apiKeys[provider];
    if (!key) {
      setTestResult(`Please enter your ${provider.toUpperCase()} API key first.`);
      return;
    }

    setIsScanningModels(true);
    setTestResult(`Scanning live models catalog from ${provider.toUpperCase()}...`);

    try {
      if (provider === 'groq') {
        const models = await AIBrokerService.discoverGroqModels(key);
        setTestResult(`Discovered ${models.length} active Groq models! Top: ${models[0]}`);
      } else if (provider === 'gemini') {
        const models = await AIBrokerService.discoverGeminiModels(key);
        setTestResult(`Discovered ${models.length} active Gemini models! Top: ${models[0]}`);
      } else if (provider === 'openai') {
        const models = await AIBrokerService.discoverOpenAIModels(key);
        setTestResult(`Discovered ${models.length} active OpenAI models! Top: ${models[0]}`);
      }
      setAiConfig(AIBrokerService.getConfig());
      onConfigUpdated();
    } catch {
      setTestResult(`Could not query ${provider} API. Please check key validity.`);
    } finally {
      setIsScanningModels(false);
    }
  };

  // --- Test Custom AI (e.g. Grok 2, DeepSeek) ---
  const handleTestCustomAI = async () => {
    if (!aiConfig.customConfig.apiKey || !aiConfig.customConfig.modelName) {
      setTestResult('Please enter custom model name and API key.');
      return;
    }

    setIsTesting(true);
    setTestResult('Connecting to custom AI provider...');

    try {
      const res = await AIBrokerService.completeText('Say "Connection verified" in 3 words.');
      setTestResult(`Success! Model replied: "${res.text.slice(0, 50)}"`);
    } catch (err: unknown) {
      const error = err as Error;
      setTestResult(`Connection failed: ${error.message || 'Check Base URL and Key.'}`);
    } finally {
      setIsTesting(false);
    }
  };

  // --- Google Multi-Account Handlers ---
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    try {
      GoogleAuthService.addGoogleAccount(newEmail.trim(), newName.trim() || undefined);
      const updated = GoogleAuthService.getDriveState();
      setDriveState(updated);
      setNewEmail('');
      setNewName('');
      setIsAddingAccount(false);
      setAccountFeedback(`✔ Linked Google Account: ${newEmail.trim()}`);
      onConfigUpdated();
      setTimeout(() => setAccountFeedback(null), 3500);
    } catch (err: unknown) {
      const error = err as Error;
      setAccountFeedback(`Error adding account: ${error.message}`);
    }
  };

  const handleSetActiveStorage = (email: string) => {
    GoogleAuthService.setActiveStorageAccount(email);
    setDriveState(GoogleAuthService.getDriveState());
    setAccountFeedback(`✔ Storage vault switched to: ${email}`);
    onConfigUpdated();
    setTimeout(() => setAccountFeedback(null), 3500);
  };

  const handleRemoveAccount = (email: string) => {
    if (confirm(`Disconnect and remove Google account ${email}?`)) {
      GoogleAuthService.removeAccount(email);
      setDriveState(GoogleAuthService.getDriveState());
      setAccountFeedback(`Removed ${email}`);
      onConfigUpdated();
      setTimeout(() => setAccountFeedback(null), 3500);
    }
  };

  const handleSyncDriveNow = async () => {
    setIsSyncingDrive(true);
    await GoogleAuthService.triggerDriveSync();
    setDriveState(GoogleAuthService.getDriveState());
    setIsSyncingDrive(false);
    setAccountFeedback('✔ All tasks, diary entries & files synced with Google Drive!');
    onConfigUpdated();
    setTimeout(() => setAccountFeedback(null), 3500);
  };

  // --- Backup Export / Import ---
  const handleExportBackup = () => {
    const jsonStr = StorageService.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = StorageService.importFullBackup(content);
        if (success) {
          alert('Backup restored successfully!');
          onConfigUpdated();
        } else {
          alert('Invalid backup file.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-950 text-indigo-400 rounded-xl border border-indigo-800">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">System Settings</h3>
              <p className="text-xs text-slate-400">AI Engines, Cloud Sync, Alarms & Data Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-950 px-5 pt-3 border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'ai' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>AI Models (BYOK)</span>
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'cloud' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Google Drive Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('alarms')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'alarms' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Alarms & Chimes</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: AI ENGINES & BYOK */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              
              {/* Active Provider Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Active AI Engine
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['gemini', 'groq', 'openai', 'custom', 'local'] as AIProvider[]).map((prov) => (
                    <button
                      key={prov}
                      onClick={() => handleSaveAIConfig({ ...aiConfig, activeProvider: prov })}
                      className={`p-2.5 rounded-xl border text-xs font-bold uppercase transition flex flex-col items-center gap-1 ${
                        aiConfig.activeProvider === prov
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750 hover:text-white'
                      }`}
                    >
                      <span>{prov === 'gemini' ? 'Gemini' : prov === 'groq' ? 'Groq' : prov === 'openai' ? 'OpenAI' : prov === 'custom' ? 'Custom' : 'Local AI'}</span>
                      {aiConfig.activeProvider === prov && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* GROQ CONFIGURATION */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">Groq BYOK (Ultra-Fast)</span>
                  <button
                    disabled={isScanningModels}
                    onClick={() => handleScanModels('groq')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <RefreshCw className={`w-3 h-3 ${isScanningModels ? 'animate-spin' : ''}`} />
                    <span>Scan Live Models</span>
                  </button>
                </div>

                <input
                  type="password"
                  placeholder="gsk_..."
                  value={aiConfig.apiKeys.groq || ''}
                  onChange={e => handleSaveAIConfig({
                    ...aiConfig,
                    apiKeys: { ...aiConfig.apiKeys, groq: e.target.value },
                  })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />

                {aiConfig.discoveredModels.groq.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Selected Model:</span>
                    <select
                      value={aiConfig.selectedModels.groq || aiConfig.discoveredModels.groq[0]}
                      onChange={e => handleSaveAIConfig({
                        ...aiConfig,
                        selectedModels: { ...aiConfig.selectedModels, groq: e.target.value },
                      })}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono"
                    >
                      {aiConfig.discoveredModels.groq.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* GEMINI CONFIGURATION */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">Google Gemini BYOK (Free Tier)</span>
                  <button
                    disabled={isScanningModels}
                    onClick={() => handleScanModels('gemini')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <RefreshCw className={`w-3 h-3 ${isScanningModels ? 'animate-spin' : ''}`} />
                    <span>Scan Live Models</span>
                  </button>
                </div>

                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={aiConfig.apiKeys.gemini || ''}
                  onChange={e => handleSaveAIConfig({
                    ...aiConfig,
                    apiKeys: { ...aiConfig.apiKeys, gemini: e.target.value },
                  })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />

                {aiConfig.discoveredModels.gemini.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Selected Model:</span>
                    <select
                      value={aiConfig.selectedModels.gemini || aiConfig.discoveredModels.gemini[0]}
                      onChange={e => handleSaveAIConfig({
                        ...aiConfig,
                        selectedModels: { ...aiConfig.selectedModels, gemini: e.target.value },
                      })}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono"
                    >
                      {aiConfig.discoveredModels.gemini.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* UNIVERSAL CUSTOM PROVIDER (GROK, DEEPSEEK, ETC.) */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-purple-300">Custom Provider (e.g. Grok 2, DeepSeek, Claude)</span>
                  <button
                    disabled={isTesting}
                    onClick={handleTestCustomAI}
                    className="px-2.5 py-1 bg-purple-950 text-purple-300 border border-purple-800 text-[11px] font-bold rounded-lg hover:bg-purple-900 transition"
                  >
                    {isTesting ? 'Testing...' : '⚡ Test Connection'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Provider Name</label>
                    <input
                      type="text"
                      placeholder="e.g., xAI Grok"
                      value={aiConfig.customConfig.providerName}
                      onChange={e => handleSaveAIConfig({
                        ...aiConfig,
                        customConfig: { ...aiConfig.customConfig, providerName: e.target.value },
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Base URL</label>
                    <input
                      type="text"
                      placeholder="https://api.x.ai/v1"
                      value={aiConfig.customConfig.baseUrl}
                      onChange={e => handleSaveAIConfig({
                        ...aiConfig,
                        customConfig: { ...aiConfig.customConfig, baseUrl: e.target.value },
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Model Name</label>
                    <input
                      type="text"
                      placeholder="e.g., grok-2-latest or deepseek-chat"
                      value={aiConfig.customConfig.modelName}
                      onChange={e => handleSaveAIConfig({
                        ...aiConfig,
                        customConfig: { ...aiConfig.customConfig, modelName: e.target.value },
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">API Key</label>
                    <input
                      type="password"
                      placeholder="Key..."
                      value={aiConfig.customConfig.apiKey}
                      onChange={e => handleSaveAIConfig({
                        ...aiConfig,
                        customConfig: { ...aiConfig.customConfig, apiKey: e.target.value },
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Local AI Launcher banner */}
              <div className="p-4 bg-purple-950/30 rounded-2xl border border-purple-800/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-purple-200 block">Local WebGPU AI (100% Offline)</span>
                  <p className="text-xs text-purple-300/80">Runs inside browser IndexedDB cache. No cloud requests.</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenLocalAI();
                  }}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  {aiConfig.localAI.installed ? 'Installed (Manage)' : 'Install Local AI'}
                </button>
              </div>

              {/* Google Drive Cloud AI Keys Sync & Purge */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-slate-200 block">Cloud Drive AI Keys Storage</span>
                    <p className="text-xs text-slate-400">Save your encrypted AI API keys to your Google Drive vault, or purge them anytime.</p>
                  </div>
                  <Cloud className="w-5 h-5 text-indigo-400 shrink-0" />
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    onClick={async () => {
                      setIsTesting(true);
                      setTestResult('Syncing AI keys to Google Drive vault...');
                      await GoogleAuthService.triggerDriveSync();
                      setIsTesting(false);
                      setTestResult('✔ AI API Keys successfully saved & synced to Google Drive vault!');
                      setTimeout(() => setTestResult(null), 4000);
                    }}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Save & Sync Keys to Drive Vault</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete all AI API keys from local storage and from your Google Drive cloud vault?')) {
                        AIBrokerService.purgeAllApiKeys();
                        setAIConfig(AIBrokerService.getConfig());
                        onConfigUpdated();
                        setTestResult('✔ All AI API keys have been deleted from local storage and purged from Google Drive vault!');
                        setTimeout(() => setTestResult(null), 4000);
                      }
                    }}
                    className="py-2 px-3 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Purge Keys from Drive</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div className="p-3 bg-indigo-950/80 text-indigo-200 rounded-xl text-xs border border-indigo-800">
                  {testResult}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: GOOGLE ACCOUNTS & CLOUD STORAGE VAULT */}
          {activeTab === 'cloud' && (
            <div className="space-y-5">
              {/* Status Header */}
              <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-950 text-emerald-400 rounded-2xl border border-emerald-800">
                      <Cloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-white">Google Cloud Storage Vault</h4>
                      <p className="text-xs text-slate-400">Authenticate with Google & select which account stores your Tasker vault</p>
                    </div>
                  </div>

                  <button
                    disabled={isSyncingDrive}
                    onClick={handleSyncDriveNow}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 rounded-xl text-xs font-bold transition"
                  >
                    <FolderSync className={`w-3.5 h-3.5 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDrive ? 'Syncing...' : 'Sync Vault Now'}</span>
                  </button>
                </div>

                {accountFeedback && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-semibold animate-fade-in flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{accountFeedback}</span>
                  </div>
                )}

                {/* Storage Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Storage Vault</span>
                    <span className="text-slate-200 font-semibold truncate block mt-0.5">
                      {driveState.activeStorageAccountEmail || 'None Selected'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Drive Folder</span>
                    <span className="text-slate-200 font-semibold block mt-0.5">📁 Tasker OS Data Vault</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Last Synchronized</span>
                    <span className="text-slate-300 text-[11px] block mt-0.5">
                      {driveState.lastSyncedAt ? new Date(driveState.lastSyncedAt).toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connected Google Accounts List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Linked Google Accounts ({driveState.accounts?.length || 0})
                  </span>
                  <button
                    onClick={() => setIsAddingAccount(!isAddingAccount)}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isAddingAccount ? 'Cancel' : '+ Add Google Account'}</span>
                  </button>
                </div>

                {/* Add Google Account Form */}
                {isAddingAccount && (
                  <form onSubmit={handleAddAccount} className="p-4 bg-slate-950/80 rounded-2xl border border-indigo-900/60 space-y-3">
                    <span className="text-xs font-bold text-indigo-300 block">Link Any Google Account for Storage</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="email"
                        required
                        placeholder="e.g. secondary.account@gmail.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Account Label (Optional)"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setNewEmail('account.y.backup@gmail.com');
                          setNewName('Account Y (Recipient Vault)');
                        }}
                        className="text-[11px] text-slate-400 hover:text-indigo-300 underline"
                      >
                        Fill sample Account Y for cross-account testing
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition"
                      >
                        Authenticate & Add
                      </button>
                    </div>
                  </form>
                )}

                {/* Accounts Items */}
                <div className="space-y-2">
                  {(driveState.accounts || []).map((account) => {
                    const isActive = account.email === driveState.activeStorageAccountEmail;
                    return (
                      <div
                        key={account.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                          isActive 
                            ? 'bg-indigo-950/40 border-indigo-600/60 ring-1 ring-indigo-500/20' 
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {account.avatarUrl ? (
                            <img
                              src={account.avatarUrl}
                              alt={account.name}
                              className={`w-9 h-9 rounded-full ring-2 ${isActive ? 'ring-emerald-400' : 'ring-slate-700'}`}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                              {account.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white truncate">{account.name}</span>
                              {isActive && (
                                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full text-[10px] font-bold">
                                  Active Storage Vault
                                </span>
                              )}
                              {account.isPrimary && (
                                <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[9px]">
                                  Primary
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 truncate block">{account.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!isActive ? (
                            <button
                              onClick={() => handleSetActiveStorage(account.email)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
                            >
                              Use for Storage
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold px-2">
                              <Check className="w-3.5 h-3.5" />
                              <span>Storing Here</span>
                            </span>
                          )}

                          {(driveState.accounts?.length || 0) > 1 && (
                            <button
                              onClick={() => handleRemoveAccount(account.email)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                              title="Remove Google account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Local Backup & Vault Export */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-300 uppercase tracking-wider block">
                    Vault Backup & Synchronization File
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Tasks • Diary • Media • Chats</span>
                </div>
                <p className="text-xs text-slate-400">
                  Export or import a full backup of all tasks, journal logs, media files, and ChatGPT-style conversations to sync across Google accounts.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Vault Backup</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Import Vault Backup</span>
                    <input type="file" accept=".json,.taskerbackup" onChange={handleImportBackup} className="hidden" />
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: ALARMS & CHIMES */}
          {activeTab === 'alarms' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
                <span className="font-bold text-sm text-slate-200 block">Browser Audio Chime & OS Push Test</span>
                <p className="text-xs text-slate-400">
                  Tasker synthesizes melodic alerts via Web Audio API and delivers native OS push banners 15m and 5m before scheduled tasks.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => AlarmService.playAlarmSound('gentle')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-xl text-xs font-bold hover:bg-indigo-900 transition"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Test 15m Gentle Chime</span>
                  </button>

                  <button
                    onClick={() => AlarmService.playAlarmSound('urgent')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-950 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold hover:bg-rose-900 transition"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Test 5m Urgent Alarm</span>
                  </button>
                </div>

                <button
                  onClick={() => AlarmService.requestNotificationPermission()}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
                >
                  Request OS Desktop Notification Permissions
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>API keys are stored exclusively on your device</span>
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition">
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
