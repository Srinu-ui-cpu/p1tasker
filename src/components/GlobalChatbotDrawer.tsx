import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Calendar, 
  Image as ImageIcon, 
  Paperclip,
  Trash2,
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Loader2,
  FileText,
  Cloud,
  CheckCircle2
} from 'lucide-react';
declare global {
  interface Window {
    mermaid?: {
      initialize: (config: Record<string, unknown>) => void;
      contentLoaded: () => void;
      run?: () => void;
    };
  }
}
import { ChatMessage, ChatSession, FileAttachment, AIProvider } from '../types';
import { StorageService } from '../services/storageService';
import { GoogleAuthService } from '../services/googleAuthService';
import { AIBrokerService } from '../services/aiBrokerService';
import { DiaryAIModelSelector } from './DiaryAIModelSelector';
import { LocalAIModal } from './LocalAIModal';

interface GlobalChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  activeProvider: AIProvider;
}

export const GlobalChatbotDrawer: React.FC<GlobalChatbotDrawerProps> = ({
  isOpen,
  onClose,
  onSelectDate,
  activeProvider,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => StorageService.getChatSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => StorageService.getActiveChatId());
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<AIProvider>(activeProvider);
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentProvider(AIBrokerService.getConfig().activeProvider);
  }, [isOpen, activeProvider]);

  const handleSaveToDrive = async () => {
    setIsSyncingDrive(true);
    setSyncNotice(null);
    try {
      await GoogleAuthService.triggerDriveSync();
      setSyncNotice('✔ All chat sessions & media saved and synced to Google Drive!');
    } catch {
      setSyncNotice('Could not sync with Google Drive.');
    } finally {
      setIsSyncingDrive(false);
      setTimeout(() => setSyncNotice(null), 4000);
    }
  };

  // Active Session
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    if (isOpen) {
      const loadedSessions = StorageService.getChatSessions();
      setSessions(loadedSessions);
      const activeId = StorageService.getActiveChatId();
      setActiveSessionId(activeId);
    }
  }, [isOpen]);

  // Mermaid chart rendering
  useEffect(() => {
    if (typeof window !== 'undefined' && window.mermaid) {
      try {
        window.mermaid.initialize({
          startOnLoad: true,
          theme: 'dark',
          securityLevel: 'loose',
        });
        window.mermaid.contentLoaded();
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.mermaid) {
        window.mermaid.contentLoaded();
      }
    } catch {
      // ignore
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isLoading]);

  if (!isOpen) return null;

  // --- NEW CHAT ---
  const handleNewChat = () => {
    const newSession = StorageService.createChatSession('New Conversation');
    setSessions(StorageService.getChatSessions());
    setActiveSessionId(newSession.id);
    setAttachedFiles([]);
  };

  // --- SWITCH CHAT ---
  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    StorageService.setActiveChatId(id);
    setAttachedFiles([]);
  };

  // --- DELETE CHAT ---
  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this conversation history?')) {
      const remaining = StorageService.deleteChatSession(id);
      setSessions(remaining);
      setActiveSessionId(StorageService.getActiveChatId());
    }
  };

  // --- CLEAR ALL CHATS ---
  const handleClearAll = () => {
    if (confirm('Clear all conversation histories? This will remove all previous chats.')) {
      StorageService.clearAllChatSessions();
      setSessions(StorageService.getChatSessions());
      setActiveSessionId(StorageService.getActiveChatId());
    }
  };

  // --- ATTACH MEDIA ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const attachment: FileAttachment = {
          id: `media-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
          hash: `hash-${Date.now()}`,
          uploadedAt: new Date().toISOString(),
        };
        setAttachedFiles(prev => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    } catch {
      alert('Could not attach file.');
    }
  };

  // --- SEND MESSAGE ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading || !activeSession) return;

    const userText = inputValue.trim();
    const currentMedia = [...attachedFiles];

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: userText || '(Attached media)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      media: currentMedia.length > 0 ? currentMedia : undefined,
    };

    // Update session title on first message
    let sessionTitle = activeSession.title;
    if (activeSession.messages.length === 0 || activeSession.title === 'New Conversation') {
      sessionTitle = userText ? (userText.length > 30 ? `${userText.slice(0, 30)}...` : userText) : 'Attached Media Discussion';
    }

    const updatedMessages = [...activeSession.messages, userMsg];
    const updatedSession: ChatSession = {
      ...activeSession,
      title: sessionTitle,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    StorageService.updateChatSession(updatedSession);
    setSessions(StorageService.getChatSessions());
    setInputValue('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      const promptQuery = currentMedia.length > 0 
        ? `${userText} [User attached media: ${currentMedia.map(m => m.name).join(', ')}]` 
        : userText;

      const { responseText, modelUsed, artifact } = await AIBrokerService.queryGlobalChatbot(promptQuery, currentProvider);

      const dateMatches = responseText.match(/\[(\d{4}-\d{2}-\d{2})\]/g);
      const linkedDates = dateMatches ? dateMatches.map(m => m.replace(/[[\]]/g, '')) : [];

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'assistant',
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        linkedDates: linkedDates.length > 0 ? linkedDates : undefined,
        artifacts: artifact,
      };

      const finalSession: ChatSession = {
        ...updatedSession,
        messages: [...updatedMessages, assistantMsg],
        updatedAt: new Date().toISOString(),
      };

      StorageService.updateChatSession(finalSession);
      setSessions(StorageService.getChatSessions());
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        sender: 'assistant',
        content: 'I encountered an issue querying the active model. Please verify your connection or model provider settings.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const finalSession: ChatSession = {
        ...updatedSession,
        messages: [...updatedMessages, fallbackMsg],
        updatedAt: new Date().toISOString(),
      };
      StorageService.updateChatSession(finalSession);
      setSessions(StorageService.getChatSessions());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end animate-fade-in">
      <div 
        className={`bg-slate-900 border-l border-slate-800 h-full flex flex-row shadow-2xl transition-all duration-300 ${
          isExpanded ? 'w-full' : 'w-full sm:w-[720px] md:w-[860px]'
        }`}
      >
        
        {/* LEFT SIDEBAR: CHATGPT-STYLE CONVERSATION HISTORY */}
        {isSidebarOpen && (
          <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 hidden sm:flex">
            {/* Sidebar Top: New Chat */}
            <div className="p-3 border-b border-slate-800/80 space-y-2">
              <button
                onClick={handleNewChat}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>
            </div>

            {/* Conversation History List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 block">
                Conversations ({sessions.length})
              </span>
              {sessions.map((s) => {
                const isActive = s.id === activeSessionId;
                const mediaCount = s.messages.reduce((acc, m) => acc + (m.media ? m.media.length : 0), 0);
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSession(s.id)}
                    className={`group w-full p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                      isActive 
                        ? 'bg-slate-800 text-white font-semibold border border-slate-700/80 shadow-sm' 
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-1">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <div className="truncate text-left">
                        <span className="truncate block">{s.title}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>{s.messages.length} msg{s.messages.length === 1 ? '' : 's'}</span>
                          {mediaCount > 0 && (
                            <span className="text-indigo-400 font-semibold flex items-center gap-0.5">
                              • 🖼️ {mediaCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 hover:bg-slate-700/60 rounded transition"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Sidebar Bottom: Storage & Clear */}
            <div className="p-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-slate-500 font-mono">Synced to Drive</span>
              {sessions.length > 1 && (
                <button
                  onClick={handleClearAll}
                  className="hover:text-rose-400 transition"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}

        {/* RIGHT MAIN CHAT AREA */}
        <div className="flex-1 flex flex-col h-full bg-slate-900 min-w-0">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden sm:block p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title={isSidebarOpen ? 'Hide conversation history' : 'Show conversation history'}
              >
                {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-white truncate">
                  {activeSession?.title || 'Omni-AI Assistant'}
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.2 bg-purple-950 text-purple-300 rounded border border-purple-800/60 uppercase font-semibold">
                    {currentProvider}
                  </span>
                  <span>• Indexed memory across all dates</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSaveToDrive}
                disabled={isSyncingDrive}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 text-xs font-semibold text-indigo-200 transition shadow-sm"
                title="Save and sync all conversations and media to Google Drive"
              >
                <Cloud className={`w-3.5 h-3.5 text-indigo-400 ${isSyncingDrive ? 'animate-bounce' : ''}`} />
                <span className="hidden sm:inline">{isSyncingDrive ? 'Saving...' : 'Save to Drive'}</span>
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden md:block p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title={isExpanded ? 'Restore window size' : 'Expand full width'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* AI Model & Key Selector Bar */}
          <div className="p-2 sm:p-3 bg-slate-950/80 border-b border-slate-800">
            <DiaryAIModelSelector
              title="Chatbot AI Model & Key Manager"
              onOpenLocalAI={() => setIsLocalModalOpen(true)}
              onModelChanged={(newProv) => {
                setCurrentProvider(newProv);
              }}
            />
          </div>

          {/* Drive Sync Notification */}
          {syncNotice && (
            <div className="px-4 py-2 bg-emerald-950/90 text-emerald-200 border-b border-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncNotice}</span>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {(activeSession?.messages || []).map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                      : 'bg-slate-950/80 text-slate-200 border border-slate-800 rounded-bl-none shadow-md'
                  }`}
                >
                  {/* User-attached Media Previews */}
                  {msg.media && msg.media.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-1">
                      {msg.media.map((file) => (
                        <div key={file.id} className="rounded-xl overflow-hidden border border-white/20 bg-slate-900/60">
                          {file.type.startsWith('image') && file.dataUrl ? (
                            <img src={file.dataUrl} alt={file.name} className="max-h-36 max-w-full rounded-lg object-contain" />
                          ) : (
                            <div className="p-2 flex items-center gap-1.5 text-xs">
                              <FileText className="w-4 h-4 text-indigo-300" />
                              <span className="truncate max-w-[150px]">{file.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Artifacts (Mind Map / Visual Diagrams) */}
                  {msg.artifacts && msg.artifacts.type === 'mindmap' && (
                    <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-purple-900/60">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-400 mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Interactive Mind Map Diagram</span>
                      </div>
                      <pre className="mermaid text-xs font-mono overflow-x-auto bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-purple-200">
                        {msg.artifacts.content}
                      </pre>
                    </div>
                  )}

                  {/* Linked Dates Navigator Chips */}
                  {msg.linkedDates && msg.linkedDates.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-slate-400">View Date:</span>
                      {msg.linkedDates.map((date) => (
                        <button
                          key={date}
                          onClick={() => {
                            onSelectDate(date);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-md text-[11px] border border-slate-700 transition"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{date}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={`text-[10px] ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'} text-right`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start items-center text-xs text-purple-300">
                <div className="w-7 h-7 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span>Synthesizing response and indexing workspace...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attached Files Preview Bar */}
          {attachedFiles.length > 0 && (
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Ready to send:</span>
              {attachedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 shrink-0">
                  {file.type.startsWith('image') ? (
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button
                    onClick={() => setAttachedFiles(attachedFiles.filter((_, i) => i !== idx))}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Model Selector Pills Bar */}
          <div className="px-3 sm:px-4 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-[11px] shrink-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Model:</span>
              {[
                { id: 'local' as AIProvider, label: 'Local AI', icon: '🧠', tag: 'WebGPU Offline' },
                { id: 'gemini' as AIProvider, label: 'Gemini', icon: '✨', tag: 'Google AI' },
                { id: 'groq' as AIProvider, label: 'Groq', icon: '⚡', tag: 'Llama 70B' },
                { id: 'custom' as AIProvider, label: 'xAI Grok', icon: '🚀', tag: 'grok-2' },
                { id: 'openai' as AIProvider, label: 'OpenAI', icon: '🤖', tag: 'GPT-4o' },
              ].map((m) => {
                const isActive = currentProvider === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setCurrentProvider(m.id);
                      const cfg = AIBrokerService.getConfig();
                      cfg.activeProvider = m.id;
                      AIBrokerService.saveConfig(cfg);
                      if (m.id === 'local' && !cfg.localAI.installed) {
                        setIsLocalModalOpen(true);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl font-medium transition flex items-center gap-1.5 shrink-0 border ${
                      isActive
                        ? 'bg-purple-950/90 text-purple-200 border-purple-500 shadow-sm shadow-purple-500/20 ring-1 ring-purple-500/30'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span className="font-semibold">{m.label}</span>
                    <span className="text-[9px] opacity-70 hidden md:inline font-mono">({m.tag})</span>
                  </button>
                );
              })}
            </div>

            {currentProvider === 'local' && (
              <button
                type="button"
                onClick={() => setIsLocalModalOpen(true)}
                className="text-[10px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-xl bg-purple-950/50 border border-purple-800/60 hover:bg-purple-900/40 transition"
              >
                <span>⚙️ Local Model</span>
              </button>
            )}
          </div>

          {/* Bottom Chat Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800/60">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-2xl p-1.5 focus-within:border-indigo-500 transition shadow-inner">
              
              {/* Media Attachment Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                title="Attach photo, screenshot, or document"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder="Ask anything, query project timelines, or discuss media..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 text-xs sm:text-sm px-2 focus:outline-none"
              />

              <button
                type="submit"
                disabled={isLoading || (!inputValue.trim() && attachedFiles.length === 0)}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition shadow-md shadow-indigo-600/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

        </div>

      </div>

      {/* Local AI Offline Model Manager / Downloader */}
      <LocalAIModal 
        isOpen={isLocalModalOpen}
        onClose={() => setIsLocalModalOpen(false)}
        onInstalled={() => {}}
      />
    </div>
  );
};
