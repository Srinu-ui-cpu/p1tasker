import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  Trash2, 
  BookOpen, 
  ArrowDownLeft, 
  Check, 
  Smile, 
  User, 
  Copy,
  Paperclip,
  Cloud,
  FileText,
  MessageSquare,
  ChevronDown,
  Calendar,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { DiaryEntry, ChatMessage, FileAttachment } from '../types';
import { StorageService } from '../services/storageService';
import { GoogleAuthService } from '../services/googleAuthService';
import { AIBrokerService } from '../services/aiBrokerService';
import { DiaryAIModelSelector } from './DiaryAIModelSelector';
import { LocalAIModal } from './LocalAIModal';

interface DiaryAIChatModalProps {
  date: string; // YYYY-MM-DD
  isOpen: boolean;
  onClose: () => void;
  onDiaryContentUpdated?: (newContent: string) => void;
}

export const DiaryAIChatModal: React.FC<DiaryAIChatModalProps> = ({
  date,
  isOpen,
  onClose,
  onDiaryContentUpdated,
}) => {
  const [activeDate, setActiveDate] = useState<string>(date);
  const [diary, setDiary] = useState<DiaryEntry>(() => StorageService.getDiaryForDate(activeDate));
  const [messages, setMessages] = useState<ChatMessage[]>(() => diary.chatHistory || []);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveDate(date);
  }, [date]);

  useEffect(() => {
    const currentDiary = StorageService.getDiaryForDate(activeDate);
    setDiary(currentDiary);
    setMessages(currentDiary.chatHistory || []);
  }, [activeDate, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const parsedDate = parseISO(activeDate);

  // All diary chat sessions list
  const allDiaries = StorageService.getDiaryEntries();
  const diaryChatSessions = Object.values(allDiaries)
    .filter(d => d.chatHistory && d.chatHistory.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  const saveChatHistory = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    const updatedDiary: DiaryEntry = {
      ...diary,
      chatHistory: newMessages,
      updatedAt: new Date().toISOString(),
    };
    setDiary(updatedDiary);
    StorageService.saveDiaryForDate(updatedDiary);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const attachment: FileAttachment = {
        id: `dmedia-${Date.now()}`,
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
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSaveToDrive = async () => {
    setIsSyncingDrive(true);
    setNotice(null);
    try {
      await GoogleAuthService.triggerDriveSync();
      setNotice('✔ Diary conversation & media attachments synced and saved to Google Drive!');
    } catch {
      setNotice('Failed to sync with Google Drive.');
    } finally {
      setIsSyncingDrive(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue;
    if ((!textToSend.trim() && attachedFiles.length === 0) || loading) return;

    const currentMedia = [...attachedFiles];

    const userMessage: ChatMessage = {
      id: `dchat-${Date.now()}-u`,
      sender: 'user',
      content: textToSend.trim() || '(Attached media)',
      timestamp: new Date().toISOString(),
      media: currentMedia.length > 0 ? currentMedia : undefined,
    };

    const newHistory = [...messages, userMessage];
    saveChatHistory(newHistory);
    setInputValue('');
    setAttachedFiles([]);
    setLoading(true);

    try {
      const promptQuery = currentMedia.length > 0
        ? `${textToSend} [Attached user media: ${currentMedia.map(m => m.name).join(', ')}]`
        : textToSend;

      const res = await AIBrokerService.queryDiaryChat(
        promptQuery,
        diary,
        newHistory
      );

      const replyContent = res.responseText || (res as unknown as { text?: string }).text || "I have received and reflected on your diary thoughts.";
      const assistantMessage: ChatMessage = {
        id: `dchat-${Date.now()}-a`,
        sender: 'assistant',
        content: replyContent,
        timestamp: new Date().toISOString(),
      };

      saveChatHistory([...newHistory, assistantMessage]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `dchat-${Date.now()}-err`,
        sender: 'assistant',
        content: "I'm having trouble connecting to the AI broker right now. Please check your connection or settings.",
        timestamp: new Date().toISOString(),
      };
      saveChatHistory([...newHistory, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear the AI conversation for this diary entry?')) {
      saveChatHistory([]);
      setNotice('Conversation cleared.');
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handlePasteInsightsIntoDiary = () => {
    if (messages.length === 0) return;

    const insights = messages
      .filter(m => m.sender === 'assistant')
      .slice(-2)
      .map(m => m.content)
      .join('\n\n');

    const formattedBlock = `\n\n---\n### 💡 AI Diary Reflections (${format(new Date(), 'hh:mm a')}):\n${insights}`;
    const newContent = `${diary.content}${formattedBlock}`;

    const updatedDiary: DiaryEntry = {
      ...diary,
      content: newContent,
      updatedAt: new Date().toISOString(),
    };

    setDiary(updatedDiary);
    StorageService.saveDiaryForDate(updatedDiary);
    if (onDiaryContentUpdated) onDiaryContentUpdated(newContent);

    setNotice('✔ Pasted AI chat reflection into your diary!');
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl h-[88vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">AI Diary Companion</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/80">
                  {format(parsedDate, 'MMMM d, yyyy')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Persistent reflection companion. Entire conversation is saved with this day’s journal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* View All Diary Sessions */}
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isHistoryOpen 
                  ? 'bg-purple-900/80 text-white border-purple-600' 
                  : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/80 hover:bg-slate-800'
              }`}
              title="Browse all previous daily AI reflection sessions"
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Sessions</span>
              <span className="px-1.5 py-0.2 bg-purple-950 text-purple-300 text-[10px] rounded-full font-mono border border-purple-800/80">
                {diaryChatSessions.length}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Save to Drive */}
            <button
              onClick={handleSaveToDrive}
              disabled={isSyncingDrive}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 text-xs font-semibold text-indigo-200 transition shadow-sm"
              title="Sync this diary conversation & media to Google Drive"
            >
              <Cloud className={`w-3.5 h-3.5 text-indigo-400 ${isSyncingDrive ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">{isSyncingDrive ? 'Syncing...' : 'Save to Drive'}</span>
            </button>

            {messages.length > 0 && (
              <button
                onClick={handlePasteInsightsIntoDiary}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition"
                title="Paste AI takeaways directly into your journal text"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Paste into Diary</span>
              </button>
            )}

            <button
              onClick={handleClearChat}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible Diary Sessions History Drawer */}
        {isHistoryOpen && (
          <div className="bg-slate-950 border-b border-slate-800 p-3 max-h-52 overflow-y-auto space-y-1.5 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 text-[11px] font-bold text-slate-400">
              <span>All Daily AI Chat Sessions ({diaryChatSessions.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">Click a date to open its session</span>
            </div>
            {diaryChatSessions.length === 0 ? (
              <div className="text-center py-3 text-xs text-slate-500">
                No saved diary chat sessions yet. Talk with the companion to record conversations!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {diaryChatSessions.map((d) => {
                  const isCurrent = d.date === activeDate;
                  const chatMediaCount = (d.chatHistory || []).reduce((acc, m) => acc + (m.media ? m.media.length : 0), 0);
                  return (
                    <div
                      key={d.date}
                      onClick={() => {
                        setActiveDate(d.date);
                        setIsHistoryOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between gap-2 ${
                        isCurrent 
                          ? 'bg-purple-950/70 border-purple-700/80 text-white font-semibold' 
                          : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="font-mono text-[11px]">{d.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono shrink-0">
                        <span>{(d.chatHistory || []).length} msgs</span>
                        {chatMediaCount > 0 && (
                          <span className="text-indigo-400 font-semibold">📷 {chatMediaCount}</span>
                        )}
                        {d.mood && <span>{d.mood === 'great' ? '🤩' : d.mood === 'good' ? '😊' : '😐'}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* AI Engine & Key Selector Bar */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800">
          <DiaryAIModelSelector
            title="Diary AI Model & Key Manager"
            onOpenLocalAI={() => setIsLocalModalOpen(true)}
          />
        </div>

        {/* Notice Bar */}
        {notice && (
          <div className="px-5 py-2 text-xs font-semibold bg-emerald-950/90 text-emerald-200 border-b border-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notice}</span>
          </div>
        )}

        {/* Diary Context Pill */}
        <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <BookOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">
              {diary.content ? `Journal [${activeDate}]: "${diary.content.slice(0, 80)}..."` : `(No journal text written for ${activeDate})`}
            </span>
          </div>
          {diary.mood && (
            <span className="text-[11px] capitalize px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 shrink-0 ml-2">
              Mood: {diary.mood}
            </span>
          )}
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 px-4 max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400">
                <Sparkles className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">Daily Reflection Chat ({activeDate})</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Talk to your AI Diary Companion, attach photos/media, unpack emotions, or brainstorm solutions. Entire conversation & media are saved and synced.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                {[
                  'What are the key takeaways from today’s journal?',
                  'Help me reflect on today’s challenges and how to improve tomorrow.',
                  'Summarize my day into an inspiring closing reflection.',
                ].map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(promptText)}
                    className="text-left text-xs bg-slate-800/80 hover:bg-slate-800 hover:text-indigo-300 text-slate-300 p-2.5 rounded-xl border border-slate-700/60 transition"
                  >
                    💬 {promptText}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800/80 flex items-center justify-center text-purple-400 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md space-y-2 ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-none'
                    }`}
                  >
                    {/* Attached Media in Message */}
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

                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className={`text-[10px] mt-1.5 opacity-60 ${isUser ? 'text-right text-indigo-200' : 'text-left text-slate-400'}`}>
                      {format(new Date(msg.timestamp), 'hh:mm a')}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-800/80 flex items-center justify-center text-indigo-400 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800/80 flex items-center justify-center text-purple-400">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-800 p-3 rounded-2xl text-xs text-slate-400 animate-pulse">
                Reflecting on your journal and media...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Attached Media Previews */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-2">
          {/* Staged Media Previews */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-1">
              {attachedFiles.map((f) => (
                <div key={f.id} className="flex items-center gap-1.5 bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-xl border border-slate-700">
                  {f.type.startsWith('image') ? <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> : <FileText className="w-3.5 h-3.5 text-indigo-400" />}
                  <span className="truncate max-w-[130px]">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(f.id)}
                    className="text-slate-400 hover:text-rose-400 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition border border-slate-700"
              title="Attach photo or document to AI reflection chat"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Talk about your day, attach photos, ask for advice, or brainstorm..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
            <button
              type="submit"
              disabled={(!inputValue.trim() && attachedFiles.length === 0) || loading}
              className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl transition shadow-md shadow-purple-600/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {/* Local AI Configuration / Install Modal */}
      <LocalAIModal
        isOpen={isLocalModalOpen}
        onClose={() => setIsLocalModalOpen(false)}
        onInstalled={() => {
          setIsLocalModalOpen(false);
          setNotice('✔ Local WebGPU AI model updated and ready!');
          setTimeout(() => setNotice(null), 3000);
        }}
      />
    </div>
  );
};
