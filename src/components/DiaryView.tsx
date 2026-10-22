import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { 
  FileText, 
  FileUp, 
  Sparkles, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Paperclip, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Trash2, 
  Cloud, 
  Plus, 
  Bot, 
  Check, 
  X,
  ExternalLink,
  Eye,
  Maximize2,
  FolderOpen,
  Image as ImageIcon,
  CheckCircle2,
  Languages,
  ListCollapse,
  Copy
} from 'lucide-react';
import { DiaryEntry, FileAttachment } from '../types';
import { StorageService } from '../services/storageService';
import { SpeechService } from '../services/speechService';
import { AIBrokerService } from '../services/aiBrokerService';
import { GoogleAuthService } from '../services/googleAuthService';
import { DiaryAIChatModal } from './DiaryAIChatModal';
import { DriveMediaViewerModal } from './DriveMediaViewerModal';
import { WordDocumentCanvas, parseDocumentContent } from './WordDocumentCanvas';

interface DiaryViewProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  onTasksUpdated: () => void;
}

export const DiaryView: React.FC<DiaryViewProps> = ({
  currentDate,
  onDateChange,
  onTasksUpdated,
}) => {
  const [entry, setEntry] = useState<DiaryEntry>(() => StorageService.getDiaryForDate(currentDate));
  const [isDictating, setIsDictating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotification, setAiNotification] = useState<string | null>(null);
  
  // File inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentsSectionRef = useRef<HTMLDivElement>(null);

  // Popup Preview Modal for Attached Files / Images (View in Drive)
  const [viewerAttachment, setViewerAttachment] = useState<FileAttachment | null>(null);

  // Delete confirmation modal state
  const [fileToDelete, setFileToDelete] = useState<FileAttachment | null>(null);

  // Diary AI Chat Companion Modal State
  const [isDiaryChatOpen, setIsDiaryChatOpen] = useState(false);

  // Multilingual Dictation State
  const [dictationLang, setDictationLang] = useState('te-IN'); // Default to Telugu / Multilingual
  const dictationBaseRef = useRef<string>('');

  // Multilingual Translation State
  const [selectedTranslateLang, setSelectedTranslateLang] = useState('Telugu');
  const [translationResult, setTranslationResult] = useState<string | null>(null);
  const [showTranslateModal, setShowTranslateModal] = useState(false);

  // AI Summary State
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const TRANSLATION_LANGUAGES = [
    { code: 'Telugu', label: 'Telugu (తెలుగు)' },
    { code: 'Hindi', label: 'Hindi (हिंदी)' },
    { code: 'Spanish', label: 'Spanish (Español)' },
    { code: 'French', label: 'French (Français)' },
    { code: 'German', label: 'German (Deutsch)' },
    { code: 'Japanese', label: 'Japanese (日本語)' },
    { code: 'Chinese', label: 'Chinese (中文)' },
    { code: 'Arabic', label: 'Arabic (العربية)' },
    { code: 'Russian', label: 'Russian (Русский)' },
    { code: 'Portuguese', label: 'Portuguese (Português)' },
    { code: 'English', label: 'English' },
  ];

  const DICTATION_LANGUAGES = [
    { code: 'te-IN', label: 'Telugu (తెలుగు 🇮🇳)' },
    { code: 'hi-IN', label: 'Hindi (हिंदी 🇮🇳)' },
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-IN', label: 'English (India)' },
    { code: 'es-ES', label: 'Spanish' },
    { code: 'fr-FR', label: 'French' },
    { code: 'de-DE', label: 'German' },
    { code: 'zh-CN', label: 'Chinese' },
    { code: 'ja-JP', label: 'Japanese' },
    { code: 'ar-SA', label: 'Arabic' },
  ];

  useEffect(() => {
    setEntry(StorageService.getDiaryForDate(currentDate));
  }, [currentDate]);

  const parsedDate = parseISO(currentDate);

  const handlePrevDay = () => {
    const prev = subDays(parsedDate, 1);
    onDateChange(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const next = addDays(parsedDate, 1);
    onDateChange(format(next, 'yyyy-MM-dd'));
  };

  const handleToday = () => {
    onDateChange(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleSaveContent = (newContent: string) => {
    const updated: DiaryEntry = {
      ...entry,
      content: newContent,
      updatedAt: new Date().toISOString(),
    };
    setEntry(updated);
    StorageService.saveDiaryForDate(updated);
  };

  // --- 🎙️ MULTILINGUAL VOICE DICTATION (WITH CONTINUOUS STUTTER DEDUPLICATION) ---
  const handleToggleDictation = () => {
    if (isDictating) {
      SpeechService.stopDictation();
      setIsDictating(false);
      setAiNotification('Dictation stopped.');
      setTimeout(() => setAiNotification(null), 3000);
    } else {
      dictationBaseRef.current = entry.content;
      setIsDictating(true);
      setAiNotification(`🎙️ Listening in ${dictationLang}... Speak naturally into your microphone.`);

      const started = SpeechService.startDictation(
        (transcript) => {
          const base = dictationBaseRef.current;
          const separator = base && !base.endsWith(' ') ? ' ' : '';
          const newContent = `${base}${separator}${transcript}`;
          handleSaveContent(newContent);
        },
        (errorMsg) => {
          setIsDictating(false);
          setAiNotification(errorMsg || 'Speech recognition interrupted or microphone permission denied.');
          setTimeout(() => setAiNotification(null), 4000);
        },
        () => {
          setIsDictating(false);
        },
        dictationLang
      );

      if (!started) {
        setIsDictating(false);
        setAiNotification('Speech recognition is not supported or microphone access was denied.');
        setTimeout(() => setAiNotification(null), 4000);
      }
    }
  };

  // --- ✨ AI ERROR CORRECTION & SENTENCE RECONSTRUCTION ENGINE ---
  const handleAiErrorCorrection = async () => {
    if (!entry.content.trim()) {
      setAiNotification('Document is empty. Write or dictate your thoughts first.');
      setTimeout(() => setAiNotification(null), 3500);
      return;
    }

    setAiLoading(true);
    setAiNotification('✨ Analyzing diary, correcting errors, removing voice stutter & rewriting sentences...');

    try {
      const res = await AIBrokerService.correctAndPolishDiary(entry.content);
      handleSaveContent(res.correctedText);
      setAiNotification(`✨ ${res.summary}`);
    } catch (err: unknown) {
      const error = err as Error;
      setAiNotification(`Error correction note: ${error.message || 'Fixed with built-in engine'}`);
    } finally {
      setAiLoading(false);
      setTimeout(() => setAiNotification(null), 5000);
    }
  };

  // --- 📑 AI DIARY SUMMARIZE ---
  const handleSummarize = async () => {
    if (!entry.content.trim()) {
      setAiNotification('Write or dictate some diary text first before summarizing!');
      setTimeout(() => setAiNotification(null), 3000);
      return;
    }
    setAiLoading(true);
    setAiNotification('🧠 Generating AI diary summary...');
    try {
      const prompt = `Summarize this diary entry into 3-4 clear, insightful bullet points capturing key events, emotional reflections, and action items:\n\n${entry.content}`;
      const res = await AIBrokerService.completeText(prompt, 'You are an executive biographer and summarizer.');
      const summaryText = res.text
        .replace(/^```(?:markdown|text)?\n?/i, '')
        .replace(/\n?```$/i, '')
        .replace(/^[ \t]{4,}/gm, '')
        .trim();
      
      const updated: DiaryEntry = {
        ...entry,
        aiSummary: summaryText,
        updatedAt: new Date().toISOString(),
      };
      setEntry(updated);
      StorageService.saveDiaryForDate(updated);
      setSummaryResult(summaryText);
      setShowSummaryModal(true);
      setAiNotification(`✔ Diary summarized (${res.modelUsed})`);
    } catch {
      setAiNotification('Summary generation failed. Check your network or AI settings.');
    } finally {
      setAiLoading(false);
      setTimeout(() => setAiNotification(null), 3500);
    }
  };

  // --- 🌐 AI MULTILINGUAL TRANSLATION ---
  const handleTranslate = async () => {
    if (!entry.content.trim()) {
      setAiNotification('Write some diary text first before translating!');
      setTimeout(() => setAiNotification(null), 3000);
      return;
    }
    setAiLoading(true);
    setAiNotification(`🌐 Translating into ${selectedTranslateLang}...`);
    try {
      const res = await AIBrokerService.translateText(entry.content, selectedTranslateLang);
      setTranslationResult(res.translatedText);
      setShowTranslateModal(true);
      setAiNotification(`✔ Translated into ${selectedTranslateLang}!`);
    } catch {
      setAiNotification('Translation failed. Check your network or AI settings.');
    } finally {
      setAiLoading(false);
      setTimeout(() => setAiNotification(null), 3500);
    }
  };

  // --- 🔊 TEXT TO SPEECH (READ ALOUD) ---
  const handleToggleSpeak = () => {
    if (isSpeaking) {
      SpeechService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      if (!entry.content.trim()) {
        setAiNotification('Nothing to read aloud yet. Type or dictate your entry first!');
        setTimeout(() => setAiNotification(null), 3000);
        return;
      }
      setIsSpeaking(true);
      SpeechService.speakText(entry.content, () => setIsSpeaking(false));
    }
  };

  // --- 📎 ATTACH FILE / INLINE MEDIA INSERTION ---
  const handleInsertMediaFile = async (file: File, insertAfterIndex?: number) => {
    try {
      const { attachment } = await StorageService.attachFileToDate(file, currentDate);

      // Splicing inline tag {{attachment:<id>}} at cursor position, after block, or appending
      let newContent = entry.content;
      const marker = `\n\n{{attachment:${attachment.id}}}\n\n`;

      if (insertAfterIndex !== undefined && insertAfterIndex !== null) {
        const blocks = parseDocumentContent(entry.content, entry.attachments);
        if (insertAfterIndex >= 0 && insertAfterIndex < blocks.length) {
          const beforeBlocks = blocks.slice(0, insertAfterIndex + 1);
          const afterBlocks = blocks.slice(insertAfterIndex + 1);
          const beforeStr = beforeBlocks
            .map((b) => (b.type === 'text' ? b.content || '' : b.originalTag || `{{attachment:${b.id}}}`))
            .join('');
          const afterStr = afterBlocks
            .map((b) => (b.type === 'text' ? b.content || '' : b.originalTag || `{{attachment:${b.id}}}`))
            .join('');
          newContent = `${beforeStr.trimEnd()}${marker}${afterStr.trimStart()}`;
        } else {
          newContent = `${entry.content.trimEnd()}${marker}`;
        }
      } else {
        newContent = entry.content ? `${entry.content.trimEnd()}${marker}` : marker.trim();
      }

      const updated: DiaryEntry = {
        ...entry,
        content: newContent,
        attachments: [...entry.attachments.filter((a) => a.id !== attachment.id), attachment],
        updatedAt: new Date().toISOString(),
      };
      setEntry(updated);
      StorageService.saveDiaryForDate(updated);
      setAiNotification(`✨ Attached "${file.name}" to diary!`);
      setTimeout(() => setAiNotification(null), 3500);

      // Proactively upload media file to Google Drive vault
      if (GoogleAuthService.isAuthenticated()) {
        GoogleAuthService.uploadMediaFile(file, file.name, file.type).then((uploaded) => {
          if (uploaded?.fileId) {
            setEntry((prev) => {
              const updatedAttachments = prev.attachments.map((a) =>
                a.id === attachment.id ? { ...a, driveId: uploaded.fileId } : a
              );
              const withDriveId = { ...prev, attachments: updatedAttachments };
              StorageService.saveDiaryForDate(withDriveId);
              return withDriveId;
            });
          }
        }).catch(() => {});
        GoogleAuthService.triggerDriveSync().catch(() => {});
      }
    } catch (err: unknown) {
      const error = err as Error;
      setAiNotification(`Attachment error: ${error.message || 'Saved locally'}`);
      setTimeout(() => setAiNotification(null), 4000);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await handleInsertMediaFile(file);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // --- 🗑️ DELETE ATTACHMENT FROM DIARY & GOOGLE DRIVE ---
  const handleConfirmDeleteAttachment = async () => {
    if (!fileToDelete) return;
    const toRemove = fileToDelete;
    setFileToDelete(null);

    StorageService.deleteDiaryAttachment(currentDate, toRemove.id);

    // Also clean up any {{attachment:id}} tags from content
    const cleanedContent = entry.content
      .split(`{{attachment:${toRemove.id}}}`)
      .join('')
      .split(`{{file:${toRemove.id}}}`)
      .join('')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const updated: DiaryEntry = {
      ...StorageService.getDiaryForDate(currentDate),
      content: cleanedContent,
    };
    setEntry(updated);
    StorageService.saveDiaryForDate(updated);

    // Sync removal to Google Drive cloud vault
    if (GoogleAuthService.isAuthenticated()) {
      if (toRemove.driveId) {
        GoogleAuthService.deleteDriveFile(toRemove.driveId).catch(() => {});
      }
      GoogleAuthService.triggerDriveSync().catch(() => {});
    }

    setAiNotification(`Deleted "${toRemove.name}" from diary and Google Drive.`);
    setTimeout(() => setAiNotification(null), 3000);
  };

  const scrollToAttachments = () => {
    attachmentsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const wordCount = entry.content.trim() ? entry.content.trim().split(/\s+/).length : 0;
  const charCount = entry.content.length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Hidden Universal File Pickers */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* =========================================================================
          WORD DOCUMENT BAR (CLEAN, POWERFUL, UNCLUTTERED TOP RIBBON)
         ========================================================================= */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-xl flex items-center justify-between flex-wrap gap-3 sticky top-16 z-30 backdrop-blur-md bg-slate-900/95">
        
        {/* Left: Date Stepper & Metrics */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 shadow-inner">
            <button 
              onClick={handlePrevDay} 
              title="Previous Day"
              className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-white hover:bg-slate-700 rounded-lg transition flex items-center gap-1.5"
              title="Jump to Today"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>{format(parsedDate, 'EEEE, MMM d, yyyy')}</span>
            </button>
            <button 
              onClick={handleNextDay} 
              title="Next Day"
              className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs font-mono">
            <span>{wordCount} words</span>
            <span>&bull;</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" /> Auto-saved
            </span>
          </div>
        </div>

        {/* Right: Core Action Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* 📎 + Attach File / Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            title="Attach an image or document inline at end or between paragraphs"
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>+ Attach File</span>
          </button>

          {/* ✨ AI Error Correction & Sentence Formation Button */}
          <button
            type="button"
            disabled={aiLoading || !entry.content.trim()}
            onClick={handleAiErrorCorrection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-800/80 text-xs font-bold disabled:opacity-40 transition shadow-sm cursor-pointer"
            title="Analyze entire diary, fix errors, remove voice stutter & rewrite into meaningful sentences"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>✨ Fix Errors & Sentences</span>
          </button>

          {/* 📑 AI Summarize Button */}
          <button
            type="button"
            disabled={aiLoading || !entry.content.trim()}
            onClick={handleSummarize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800/80 text-xs font-bold disabled:opacity-40 transition shadow-sm cursor-pointer"
            title="Summarize diary entry into concise bullet points using AI"
          >
            <ListCollapse className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Summarize</span>
          </button>

          {/* 🌐 AI Translate with Language Dropdown */}
          <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
            <select
              value={selectedTranslateLang}
              onChange={(e) => setSelectedTranslateLang(e.target.value)}
              className="bg-transparent text-slate-300 text-[11px] px-2 py-1 focus:outline-none cursor-pointer"
              title="Select target language for translation"
            >
              {TRANSLATION_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={aiLoading || !entry.content.trim()}
              onClick={handleTranslate}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition cursor-pointer"
              title="Translate diary content into chosen language using AI"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Translate</span>
            </button>
          </div>

          {/* 🎙️ Multilingual Voice-to-Text */}
          <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
            <select
              value={dictationLang}
              onChange={(e) => setDictationLang(e.target.value)}
              className="bg-transparent text-slate-300 text-[11px] px-2 py-1 focus:outline-none cursor-pointer"
              title="Select spoken language for voice dictation"
            >
              {DICTATION_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleToggleDictation}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                isDictating 
                  ? 'bg-rose-600 text-white animate-pulse' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
              title="Dictate in chosen language with auto stutter removal"
            >
              {isDictating ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3 text-indigo-400" />}
              <span>{isDictating ? 'Listening...' : 'Dictate'}</span>
            </button>
          </div>

          {/* 🤖 In-Diary AI Chatbot Button */}
          <button
            type="button"
            onClick={() => setIsDiaryChatOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/80 text-xs font-bold transition shadow-sm cursor-pointer"
            title="Open in-diary AI chatbot to analyze journal & attached docs or generate and paste content"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Diary AI Chatbot</span>
          </button>

          {/* 📁 Attachments Quick Scroll Pill */}
          <button
            type="button"
            onClick={scrollToAttachments}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            title="View all attached documents in separate attachments section"
          >
            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
            <span>Files ({entry.attachments.length})</span>
          </button>

          {/* 📂 Open Tasker Folder in Google Drive */}
          <button
            type="button"
            onClick={() => GoogleAuthService.openDriveFolderInNewTab()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
            title="Open Tasker App Data folder in Google Drive (My Drive)"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Drive Folder</span>
          </button>

          {/* 🔊 Text-to-Speech Read Aloud */}
          <button
            type="button"
            onClick={handleToggleSpeak}
            className={`p-1.5 rounded-xl text-xs transition border ${
              isSpeaking 
                ? 'bg-indigo-600 text-white border-indigo-500' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Read diary aloud"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {aiNotification && (
        <div className="p-3 bg-indigo-950/90 border border-indigo-800/80 rounded-2xl text-indigo-200 text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{aiNotification}</span>
          </div>
          <button onClick={() => setAiNotification(null)} className="text-indigo-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          WORD DOCUMENT SHEET CANVAS (MAIN WRITING AREA)
         ========================================================================= */}
      <WordDocumentCanvas
        content={entry.content}
        attachments={entry.attachments}
        onContentChange={handleSaveContent}
        onOpenViewer={(att) => setViewerAttachment(att)}
        onDeleteAttachment={(att) => setFileToDelete(att)}
        onInsertMedia={handleInsertMediaFile}
        date={currentDate}
      />

      {/* =========================================================================
          SEPARATE ATTACHMENTS SECTION (ALL ATTACHED DOCUMENTS & MEDIA)
         ========================================================================= */}
      <div 
        ref={attachmentsSectionRef}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                Attached Documents & Media ({entry.attachments.length})
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              All files attached to this diary entry. Synced with your Google Drive vault.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-sm"
              title="Upload and attach any file or document directly here"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Upload Attachment</span>
            </button>
          </div>
        </div>

        {entry.attachments.length === 0 ? (
          <div className="py-10 text-center space-y-2 border-2 border-dashed border-slate-800 rounded-2xl p-6">
            <Paperclip className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">No documents or photos attached to this date yet.</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Click "+ Upload Attachment" or insert files between paragraphs in the Word Document above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
            {entry.attachments.map((file) => {
              const isImage = file.type.startsWith('image/');
              return (
                <div 
                  key={file.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md hover:border-indigo-600/70 transition flex flex-col group"
                >
                  {/* Thumbnail / Header Area */}
                  <div 
                    onClick={() => setViewerAttachment(file)}
                    className="w-full h-28 bg-slate-900 flex items-center justify-center overflow-hidden cursor-pointer relative group/thumb"
                    title="Click to view/read in popup modal"
                  >
                    {isImage && file.dataUrl ? (
                      <img 
                        src={file.dataUrl} 
                        alt={file.name} 
                        className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105" 
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-400">
                        <FileText className="w-8 h-8 text-indigo-400" />
                        <span className="text-[9px] font-mono uppercase text-slate-500">
                          {file.type.split('/')[1] || 'FILE'}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition gap-1 text-xs text-white font-semibold backdrop-blur-[2px]">
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>View in Popup</span>
                    </div>
                  </div>

                  {/* Metadata and Delete Action */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <span 
                        onClick={() => setViewerAttachment(file)}
                        className="text-xs font-bold text-white truncate block cursor-pointer hover:text-indigo-400 transition" 
                        title={file.name}
                      >
                        {file.name}
                      </span>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                        <span>{(file.size / 1024).toFixed(0)} KB</span>
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <Cloud className="w-2.5 h-2.5" /> Drive
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setViewerAttachment(file)}
                        className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        title="Open popup viewer"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Read / View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFileToDelete(file)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                        title={`Delete ${file.name} from diary and Google Drive`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          POPUP MODALS: DRIVE MEDIA VIEWER, DIARY AI CHATBOT & DELETE CONFIRMATION
         ========================================================================= */}
      
      {/* 1. Drive Media Viewer Popup Modal (View in Drive, Zoom, Download, Read) */}
      <DriveMediaViewerModal
        isOpen={!!viewerAttachment}
        attachment={viewerAttachment}
        onClose={() => setViewerAttachment(null)}
        date={currentDate}
      />

      {/* 2. In-Diary AI Chatbot Modal (Analyze current diary, analyze docs, or generate & paste) */}
      <DiaryAIChatModal
        date={currentDate}
        isOpen={isDiaryChatOpen}
        onClose={() => setIsDiaryChatOpen(false)}
        onDiaryContentUpdated={(newContent) => {
          handleSaveContent(newContent);
          setAiNotification('✨ Pasted AI insights into your diary!');
          setTimeout(() => setAiNotification(null), 3500);
        }}
      />

      {/* 3. Delete File Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-950/80 border border-rose-800">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Attachment?</h3>
                <p className="text-xs text-slate-400">This action will remove the file from your diary and Google Drive.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono truncate">
              {fileToDelete.name} ({(fileToDelete.size / 1024).toFixed(0)} KB)
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAttachment}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md"
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. AI Diary Summary Modal */}
      {showSummaryModal && summaryResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
                  <ListCollapse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AI Diary Summary</h3>
                  <p className="text-xs text-slate-400">Executive highlights for {format(parsedDate, 'MMMM d, yyyy')}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSummaryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {summaryResult}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(summaryResult);
                  setAiNotification('✔ Copied summary to clipboard!');
                  setTimeout(() => setAiNotification(null), 2500);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Summary</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSummaryModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const block = `\n\n---\n### 📌 AI Summary:\n${summaryResult}\n`;
                    handleSaveContent(entry.content + block);
                    setShowSummaryModal(false);
                    setAiNotification('✔ Appended AI summary to diary!');
                    setTimeout(() => setAiNotification(null), 3000);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Paste into Diary</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. AI Translation Modal */}
      {showTranslateModal && translationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400">
                  <Languages className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AI Translation ({selectedTranslateLang})</h3>
                  <p className="text-xs text-slate-400">Target language: {selectedTranslateLang}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTranslateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {translationResult}
            </div>

            <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(translationResult);
                  setAiNotification('✔ Copied translation to clipboard!');
                  setTimeout(() => setAiNotification(null), 2500);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const block = `\n\n---\n### 🌐 Translation (${selectedTranslateLang}):\n${translationResult}\n`;
                    handleSaveContent(entry.content + block);
                    setShowTranslateModal(false);
                    setAiNotification(`✔ Appended ${selectedTranslateLang} translation!`);
                    setTimeout(() => setAiNotification(null), 3000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  Append Below
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveContent(translationResult);
                    setShowTranslateModal(false);
                    setAiNotification(`✔ Replaced diary with ${selectedTranslateLang} translation!`);
                    setTimeout(() => setAiNotification(null), 3000);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Replace Diary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
