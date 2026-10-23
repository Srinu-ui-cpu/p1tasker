import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Check, 
  Key, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Zap, 
  Cpu, 
  X, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { AIProvider, AIState } from '../types';
import { AIBrokerService } from '../services/aiBrokerService';

interface DiaryAIModelSelectorProps {
  onModelChanged?: (provider: AIProvider) => void;
  title?: string;
  compact?: boolean;
  defaultCollapsed?: boolean;
}

export const DiaryAIModelSelector: React.FC<DiaryAIModelSelectorProps> = ({
  onModelChanged,
  title,
  compact = false,
  defaultCollapsed,
}) => {
  const [config, setConfig] = useState<AIState>(() => AIBrokerService.getConfig());
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider>(config.activeProvider);
  const [keyInput, setKeyInput] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Collapse state: defaults to collapsed on mobile viewports (<= 640px) or if explicitly set
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (defaultCollapsed !== undefined) return defaultCollapsed;
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 640;
    }
    return false;
  });

  useEffect(() => {
    setConfig(AIBrokerService.getConfig());
  }, []);

  const providers: Array<{
    id: AIProvider;
    name: string;
    model: string;
    hasKey: boolean;
    keySnippet?: string;
    badge: string;
    isFreeOrOffline?: boolean;
    hint: string;
  }> = [
    {
      id: 'gemini',
      name: 'Google Gemini',
      model: config.selectedModels.gemini || 'gemini-1.5-flash',
      hasKey: !!config.apiKeys.gemini?.trim(),
      keySnippet: config.apiKeys.gemini ? `AIzaSy...${config.apiKeys.gemini.slice(-4)}` : undefined,
      badge: 'Google AI',
      isFreeOrOffline: true,
      hint: 'Official free tier',
    },
    {
      id: 'groq',
      name: 'Groq',
      model: config.selectedModels.groq || 'llama-3.3-70b-versatile',
      hasKey: !!config.apiKeys.groq?.trim(),
      keySnippet: config.apiKeys.groq ? `gsk_...${config.apiKeys.groq.slice(-4)}` : undefined,
      badge: 'Ultra-Fast 70B',
      isFreeOrOffline: true,
      hint: 'Free fast cloud tier',
    },
    {
      id: 'custom',
      name: config.customConfig.providerName || 'xAI Grok',
      model: config.customConfig.modelName || 'grok-2-latest',
      hasKey: !!config.customConfig.apiKey?.trim(),
      keySnippet: config.customConfig.apiKey ? `...${config.customConfig.apiKey.slice(-4)}` : undefined,
      badge: 'xAI Grok',
      hint: 'xAI Grok / Custom API',
    },
    {
      id: 'openai',
      name: 'OpenAI',
      model: config.selectedModels.openai || 'gpt-4o-mini',
      hasKey: !!config.apiKeys.openai?.trim(),
      keySnippet: config.apiKeys.openai ? `sk-...${config.apiKeys.openai.slice(-4)}` : undefined,
      badge: 'GPT-4o',
      hint: 'BYOK API Key',
    },
  ];

  const handleSelectProvider = (prov: AIProvider) => {
    const current = AIBrokerService.getConfig();
    current.activeProvider = prov;
    AIBrokerService.saveConfig(current);
    setConfig({ ...current });
    onModelChanged?.(prov);

    const target = providers.find(p => p.id === prov);
    if (!target?.hasKey) {
      setEditingProvider(prov);
      setKeyInput('');
      setIsEditingKey(true);
      setIsCollapsed(false);
      setNotification(`Switched to ${target?.name}. Please paste your API key below for live responses.`);
    } else {
      setNotification(`✔ Active AI Engine set to: ${target?.name} (${target?.model})`);
      setIsEditingKey(false);
    }

    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    const current = AIBrokerService.getConfig();
    if (editingProvider === 'groq') current.apiKeys.groq = keyInput.trim();
    if (editingProvider === 'gemini') current.apiKeys.gemini = keyInput.trim();
    if (editingProvider === 'openai') current.apiKeys.openai = keyInput.trim();
    if (editingProvider === 'custom') current.customConfig.apiKey = keyInput.trim();

    current.activeProvider = editingProvider;
    AIBrokerService.saveConfig(current);
    setConfig({ ...current });
    setIsEditingKey(false);
    setKeyInput('');
    setNotification(`✔ Key saved for ${editingProvider.toUpperCase()}! AI is live and ready.`);
    onModelChanged?.(editingProvider);
    setTimeout(() => setNotification(null), 3500);
  };

  const activeObj = providers.find(p => p.id === config.activeProvider) || providers[0];

  return (
    <div className={`bg-slate-950/80 border border-slate-800 rounded-2xl transition-all duration-200 ${
      isCollapsed ? 'p-2 sm:p-2.5' : 'p-3 sm:p-4 space-y-3'
    }`}>
      {/* Header Bar with Collapse / Uncollapse Toggle Arrow */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between gap-2 cursor-pointer select-none group"
        title={isCollapsed ? "Click to expand AI keys & models" : "Click to collapse AI keys section"}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-purple-950/80 border border-purple-800/80 flex items-center justify-center shrink-0 group-hover:border-purple-600 transition">
            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider group-hover:text-white transition truncate">
            {title || 'AI Model & Key Manager'}
          </span>
          <span className="hidden lg:inline text-[10px] text-slate-400 font-normal">
            (Select model where keys are available)
          </span>
        </div>

        {/* Current Active Badge + Collapse Toggle Arrow */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] sm:text-xs font-semibold shadow-sm">
            <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="truncate max-w-[85px] sm:max-w-[130px]">{activeObj.name}</span>
            {activeObj.hasKey ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Key Ready" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="No Key" />
            )}
            {!isCollapsed && (
              <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">({activeObj.model})</span>
            )}
          </div>

          {/* Explicit Collapse/Expand Arrow Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs shadow-sm hover:border-purple-500/60"
            title={isCollapsed ? 'Click to expand AI keys & models' : 'Click to collapse AI keys'}
            aria-label={isCollapsed ? 'Expand AI keys' : 'Collapse AI keys'}
          >
            <span className="hidden sm:inline text-[10px] text-slate-400 font-medium">
              {isCollapsed ? 'Keys' : 'Hide'}
            </span>
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-transform" />
            ) : (
              <ChevronUp className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-transform" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Content Area */}
      {!isCollapsed && (
        <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Model Selection Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {providers.map((p) => {
              const isSelected = p.id === config.activeProvider;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProvider(p.id)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {p.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    {p.hasKey ? (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Key Ready</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>No Key</span>
                      </span>
                    )}

                    <span className="text-[9px] font-mono text-slate-500">
                      {p.badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Notification Feedback */}
          {notification && (
            <div className="p-2.5 bg-indigo-950/90 border border-indigo-800 text-indigo-200 text-xs rounded-xl flex items-center justify-between animate-fade-in">
              <span>{notification}</span>
              <button onClick={() => setNotification(null)} className="text-indigo-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Inline Key Setup / Edit Form */}
          {isEditingKey ? (
            <form onSubmit={handleSaveKey} className="p-3 bg-slate-900 rounded-xl border border-indigo-800/80 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">
                  Enter {editingProvider.toUpperCase()} API Key:
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingKey(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  required
                  placeholder={editingProvider === 'groq' ? 'gsk_...' : editingProvider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Save Key & Use
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {activeObj.hasKey
                    ? `Key configured (${activeObj.keySnippet || 'Active'})`
                    : `No API key entered for ${activeObj.name}`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingProvider(activeObj.id);
                  setKeyInput('');
                  setIsEditingKey(true);
                }}
                className="text-indigo-400 hover:text-indigo-300 underline font-semibold transition"
              >
                {activeObj.hasKey ? 'Update Key' : '+ Enter API Key'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
