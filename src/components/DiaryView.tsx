import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { 
  BookOpen, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Upload, 
  Check, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Languages, 
  Smile, 
  CheckSquare,
  Bot,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar as CalendarIcon,
  Trash2,
  AlertTriangle,
  FileUp,
  LayoutTemplate,
  Cloud,
  Eye,
  Plus
} from 'lucide-react';
import { DiaryEntry, Mood, FileAttachment } from '../types';
import { StorageService } from '../services/storageService';
import { SpeechService } from '../services/speechService';
import { AIBrokerService } from '../services/aiBrokerService';
import { GoogleAuthService } from '../services/googleAuthService';
import { DiaryAIChatModal } from './DiaryAIChatModal';
import { DiaryAIModelSelector } from './DiaryAIModelSelector';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Word Document View vs Full Textarea Editor Mode
  const [activeTab, setActiveTab] = useState<'canvas' | 'editor'>('canvas');

  // Popup Preview Modal for Attached Files / Images (View in Drive)
  const [viewerAttachment, setViewerAttachment] = useState<FileAttachment | null>(null);

  // Diary AI Chat Companion Modal State
  const [isDiaryChatOpen, setIsDiaryChatOpen] = useState(false);

  // Multilingual Dictation & AI Whisper State
  const [dictationLang, setDictationLang] = useState('te-IN'); // Default to Telugu / Multilingual
  const [isAIRecording, setIsAIRecording] = useState(false);

  // Selective Translate State
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Telugu');
  const [translateTargetText, setTranslateTargetText] = useState('');
  const [isSelectionOnly, setIsSelectionOnly] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [translatedResult, setTranslatedResult] = useState<string | null>(null);

  // Undo state for Grammar Auto-correct
  const [previousContentForUndo, setPreviousContentForUndo] = useState<string | null>(null);

  const AVAILABLE_LANGUAGES = [
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  ];

  const DICTATION_LANGUAGES = [
    { code: 'te-IN', label: 'Telugu (తెలుగు 🇮🇳)' },
    { code: 'hi-IN', label: 'Hindi (हिंदी 🇮🇳)' },
    { code: 'en-US', label: 'English (US)' },
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

  const handleSaveContent = (content: string) => {
    const updated: DiaryEntry = {
      ...entry,
      content,
      updatedAt: new Date().toISOString(),
    };
    setEntry(updated);
    StorageService.saveDiaryForDate(updated);
  };

  const handleSelectMood = (mood: Mood) => {
    const updated: DiaryEntry = {
      ...entry,
      mood: entry.mood === mood ? undefined : mood,
      updatedAt: new Date().toISOString(),
    };
    setEntry(updated);
    StorageService.saveDiaryForDate(updated);
  };

  const dictationBaseRef = useRef<string>('');

  // --- 🎙️ SPEECH DICTATION ---
  const handleToggleDictation = () => {
    if (isDictating) {
      SpeechService.stopDictation();
      setIsDictating(false);
      setAiNotification('Dictation stopped.');
      setTimeout(() => setAiNotification(null), 3000);
    } else {
      dictationBaseRef.current = entry.content;
      setIsDictating(true);
      setAiNotification(`🎙️ Listening in ${dictationLang}... Speak into your microphone.`);

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

  // --- ✨ AI ERROR CORRECTION & MEANINGFUL SENTENCES ---
  const handleAiErrorCorrection = async () => {
    if (!entry.content.trim()) {
      setAiNotification('Document is empty. Write or dictate your thoughts first.');
      setTimeout(() => setAiNotification(null), 3500);
      return;
    }

    setAiLoading(true);
    setAiNotification('✨ AI is removing voice stutter, correcting errors & crafting meaningful sentences...');

    try {
      const res = await AIBrokerService.correctAndPolishDiary(entry.content);
      handleSaveContent(res.correctedText);
      setAiNotification(`✨ ${res.summary}`);
    } catch (err: unknown) {
      const error = err as Error;
      setAiNotification(`Error correction note: ${error.message || 'Updated with built-in engine'}`);
    } finally {
      setAiLoading(false);
      setTimeout(() => setAiNotification(null), 5000);
    }
  };

  // --- 🧠 AI WHISPER MULTILINGUAL RECORDING ---
  const handleToggleAIRecording = async () => {
    if (isAIRecording) {
      setIsAIRecording(false);
      setAiLoading(true);
      setAiNotification('Processing audio with AI Whisper model in all languages...');

      try {
        const { transcript, modelUsed } = await SpeechService.stopAIRecordingAndTranscribe();

        if (!transcript || !transcript.trim()) {
          setAiNotification('No speech detected in audio recording.');
          return;
        }

        const formatted = await SpeechService.formatVoiceIntoDiary(transcript, dictationLang);
        const separator = entry.content.trim() ? '\n\n' : '';
        const newContent = `${entry.content}${separator}${formatted.formattedDiary}`;

        const updated: DiaryEntry = {
          ...entry,
          content: newContent,
          mood: entry.mood || (formatted.mood as Mood) || undefined,
          updatedAt: new Date().toISOString(),
        };

        setEntry(updated);
        StorageService.saveDiaryForDate(updated);
        setAiNotification(`✨ AI transcribed (${modelUsed}) and crafted your diary reflection!`);
      } catch (err: unknown) {
        const error = err as Error;
        setAiNotification(`AI Voice note: ${error.message || 'Check microphone setup'}`);
      } finally {
        setAiLoading(false);
        setTimeout(() => setAiNotification(null), 5000);
      }
    } else {
      try {
        const started = await SpeechService.startAIRecording();
        if (started) {
          setIsAIRecording(true);
          setAiNotification('🎙️ Recording voice thoughts in any language... Click button again when finished speaking.');
        } else {
          setAiNotification('Could not access microphone. Please grant browser microphone permissions.');
          setTimeout(() => setAiNotification(null), 4000);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setAiNotification(`Could not start recording: ${error.message}`);
        setTimeout(() => setAiNotification(null), 4000);
      }
    }
  };

  // --- 🔊 TEXT TO SPEECH ---
  const handleToggleSpeak = () => {
    if (isSpeaking) {
      SpeechService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      if (!entry.content.trim()) {
        setAiNotification('Diary is empty. Write or dictate something to read aloud.');
        setTimeout(() => setAiNotification(null), 3000);
        return;
      }
      setIsSpeaking(true);
      SpeechService.speakText(entry.content, () => setIsSpeaking(false));
    }
  };

  // --- ✨ AUTO CORRECT GRAMMAR ---
  const handleAutoCorrectGrammar = async () => {
    if (!entry.content.trim()) return;

    let targetText = entry.content;
    let isSelected = false;

    if (textareaRef.current) {
      const { selectionStart, selectionEnd } = textareaRef.current;
      if (selectionStart !== selectionEnd) {
        targetText = entry.content.substring(selectionStart, selectionEnd);
        isSelected = true;
      }
    }

    setAiLoading(true);
    setAiNotification('Analyzing grammar, spelling & typos...');
    setPreviousContentForUndo(entry.content);

    try {
      const result = await AIBrokerService.correctGrammar(targetText);

      let newContent = entry.content;
      if (isSelected && textareaRef.current) {
        const { selectionStart, selectionEnd } = textareaRef.current;
        newContent = entry.content.substring(0, selectionStart) + result.correctedText + entry.content.substring(selectionEnd);
      } else {
        newContent = result.correctedText;
      }

      handleSaveContent(newContent);
      setAiNotification(`✔ Auto-corrected ${result.fixesApplied} item(s) using ${result.modelUsed}!`);
    } catch {
      setAiNotification('Could not complete grammar correction.');
    } finally {
      setAiLoading(false);
      setTimeout(() => setAiNotification(null), 4000);
    }
  };

  const handleUndoGrammar = () => {
    if (previousContentForUndo !== null) {
      handleSaveContent(previousContentForUndo);
      setPreviousContentForUndo(null);
      setAiNotification('Reverted back to previous text.');
      setTimeout(() => setAiNotification(null), 3000);
    }
  };

  // --- 🌐 SELECTIVE TRANSLATE ---
  const handleOpenTranslate = () => {
    let textToTranslate = entry.content;
    let isSelection = false;

    if (textareaRef.current) {
      const { selectionStart, selectionEnd } = textareaRef.current;
      if (selectionStart !== selectionEnd) {
        textToTranslate = entry.content.substring(selectionStart, selectionEnd);
        isSelection = true;
        setSelectionRange({ start: selectionStart, end: selectionEnd });
      } else {
        setSelectionRange(null);
      }
    }

    setTranslateTargetText(textToTranslate.trim());
    setIsSelectionOnly(isSelection);
    setTranslatedResult(null);
    setIsTranslateOpen(true);
  };

  const handleExecuteTranslate = async (lang: string = selectedLanguage) => {
    if (!translateTargetText.trim()) return;
    setAiLoading(true);
    setSelectedLanguage(lang);

    try {
      const res = await AIBrokerService.translateText(translateTargetText, lang);
      setTranslatedResult(res.translatedText);

      // Automatically append and format translation neatly at the bottom of the diary
      const formattedBlock = `\n\n---\n### 🌐 Translation (${lang}):\n${res.translatedText}`;
      const newContent = `${entry.content}${formattedBlock}`;
      handleSaveContent(newContent);

      setAiNotification(`✨ Translated to ${lang} and formatted neatly at the bottom of your diary!`);
    } catch {
      setAiNotification('Translation failed.');
    } finally {
      setAiLoading(false);
      setTimeout(() => setAiNotification(null), 5000);
    }
  };

  // --- 🤖 AI SUMMARIZE & EXTRACT ---
  const handleAiSummarize = async () => {
    if (!entry.content.trim()) return;
    setAiLoading(true);
    try {
      const prompt = `Summarize this diary entry into 3 concise bullet points:\n\n${entry.content}`;
      const res = await AIBrokerService.completeText(prompt);
      const updated = { ...entry, aiSummary: res.text };
      setEntry(updated);
      StorageService.saveDiaryForDate(updated);
      setAiNotification(`Summary generated using ${res.modelUsed}`);
    } catch {
      setAiNotification('Could not generate summary.');
    } finally {
      setAiLoading(false);
      setTimeout(() => setAiNotification(null), 3000);
    }
  };

  const handleAiExtractTasks = async () => {
    if (!entry.content.trim()) return;
    setAiLoading(true);
    try {
      const prompt = `Analyze this daily journal and extract actionable tasks that should be added to the to-do list.
Return ONLY valid JSON format: [{"title": "task title", "priority": "high"|"medium"|"low"}]
Diary content:
${entry.content}`;

      const res = await AIBrokerService.completeText(prompt);
      let extracted: Array<{ title: string; priority: 'low' | 'medium' | 'high' }> = [];
      try {
        const jsonMatch = res.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
      } catch {
        extracted = [{ title: 'Follow up on diary action items', priority: 'medium' }];
      }

      extracted.forEach(item => {
        StorageService.saveTask({
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: item.title,
          date: currentDate,
          priority: item.priority || 'medium',
          status: 'todo',
          tags: ['from-diary'],
          subtasks: [],
          alarmEnabled: false,
          attachments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      onTasksUpdated();
      setAiNotification(`✨ Extracted and added ${extracted.length} tasks to your list!`);
    } catch {
      setAiNotification('Could not extract tasks.');
    } finally {
      setAiLoading(false);
      setTimeout(() => setAiNotification(null), 4000);
    }
  };

  // --- INLINE MEDIA INSERTION & ATTACHMENTS ---
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
      } else if (textareaRef.current) {
        const { selectionStart, selectionEnd } = textareaRef.current;
        if (selectionStart !== undefined && selectionStart >= 0) {
          const before = entry.content.substring(0, selectionStart);
          const after = entry.content.substring(selectionEnd || selectionStart);
          newContent = `${before}${marker}${after}`;
        } else {
          newContent = entry.content ? `${entry.content.trimEnd()}${marker}` : marker.trim();
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
      setAiNotification(`✨ Inserted "${file.name}" inline into document!`);
      setTimeout(() => setAiNotification(null), 3500);

      // Proactively sync media file to Google Drive vault
      if (GoogleAuthService.isAuthenticated()) {
        GoogleAuthService.triggerDriveSync().catch(() => {});
      }
    } catch (err: unknown) {
      const error = err as Error;
      setAiNotification(`Attachment note: ${error.message || 'Saved locally'}`);
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

  const [fileToDelete, setFileToDelete] = useState<FileAttachment | null>(null);

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
      .replace(/\n{3,}/g, '\n\n');

    const updated: DiaryEntry = {
      ...StorageService.getDiaryForDate(currentDate),
      content: cleanedContent,
    };
    setEntry(updated);
    StorageService.saveDiaryForDate(updated);

    // Sync removal to Google Drive cloud vault
    if (GoogleAuthService.isAuthenticated()) {
      GoogleAuthService.triggerDriveSync().catch(() => {});
    }

    setAiNotification(`✔ Deleted "${toRemove.name}" from diary & Google Drive vault!`);
    setTimeout(() => setAiNotification(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      
      {/* Top Header & Date Stepper */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-900/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">Daily Journal & Diary</h1>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                {format(parsedDate, 'MMMM d, yyyy')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Reflections, multilingual speech dictation, Telugu translation, and AI memory companion.
            </p>
          </div>
        </div>

        {/* Date Stepper & Companion Chat Launcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Date Stepper */}
          <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700/60 shadow-inner">
            <button 
              onClick={handlePrevDay} 
              title="Previous Day"
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleToday}
              className="px-3 py-1 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700/60 rounded-lg transition flex items-center gap-1.5"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>{format(parsedDate, 'EEE, MMM d')}</span>
            </button>
            <button 
              onClick={handleNextDay} 
              title="Next Day"
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* AI Companion Chat Button */}
          <button
            onClick={() => setIsDiaryChatOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700/80 shadow-md shadow-purple-950/40 transition group"
            title="Open persistent AI Diary Chat for this date"
          >
            <Bot className="w-4 h-4 text-purple-400 group-hover:animate-pulse" />
            <span>AI Diary Companion</span>
            {entry.chatHistory && entry.chatHistory.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* Mood Selector Card */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Smile className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">How was your day?</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {(['great', 'good', 'neutral', 'challenging', 'stressful'] as Mood[]).map((mood) => {
            const isSelected = entry.mood === mood;
            const moodLabels: Record<Mood, { emoji: string; text: string; color: string }> = {
              great: { emoji: '🤩', text: 'Great', color: 'bg-emerald-950 text-emerald-300 border-emerald-700' },
              good: { emoji: '😊', text: 'Good', color: 'bg-indigo-950 text-indigo-300 border-indigo-700' },
              neutral: { emoji: '😐', text: 'Neutral', color: 'bg-slate-800 text-slate-300 border-slate-600' },
              challenging: { emoji: '🤔', text: 'Tough', color: 'bg-amber-950 text-amber-300 border-amber-700' },
              stressful: { emoji: '😫', text: 'Stressful', color: 'bg-rose-950 text-rose-300 border-rose-700' },
            };
            const item = moodLabels[mood];
            return (
              <button
                key={mood}
                onClick={() => handleSelectMood(mood)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  isSelected 
                    ? `${item.color} shadow-md font-bold ring-1 ring-white/20` 
                    : 'bg-slate-950/50 hover:bg-slate-800 text-slate-400 border-slate-800'
                }`}
              >
                <span>{item.emoji}</span>
                <span>{item.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🧠 AI Model Selector & API Key Manager */}
      <DiaryAIModelSelector onModelChanged={() => {}} />

      {/* View Switcher: Word Document Canvas vs Full Editor */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-md">
          <button
            type="button"
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'canvas'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutTemplate className="w-4 h-4" />
            <span>Word Document Canvas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'editor'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Full Editor & Markdown</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Specialized file pickers for quick insert at cursor */}
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
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 text-xs font-semibold transition shadow-sm cursor-pointer"
            title="Upload and insert an image inline at your cursor position"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>+ Insert Image</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition shadow-sm cursor-pointer"
            title="Upload and attach any file/document inline"
          >
            <FileUp className="w-3.5 h-3.5 text-slate-400" />
            <span>+ Attach File</span>
          </button>

          <button
            type="button"
            disabled={aiLoading || !entry.content.trim()}
            onClick={handleAiErrorCorrection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-800/80 text-xs font-semibold disabled:opacity-40 transition shadow-sm cursor-pointer"
            title="AI Error Correction: Remove voice stutter duplicates, fix grammar & rewrite into meaningful sentences"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>✨ Fix Errors & Polish</span>
          </button>
        </div>
      </div>

      {/* Main Journal View Body */}
      {activeTab === 'canvas' ? (
        <WordDocumentCanvas
          content={entry.content}
          attachments={entry.attachments}
          onContentChange={handleSaveContent}
          onOpenViewer={(att) => setViewerAttachment(att)}
          onDeleteAttachment={(att) => setFileToDelete(att)}
          onInsertMedia={handleInsertMediaFile}
          date={currentDate}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          {/* Editor Toolbar */}
          <div className="p-3 sm:p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Auto Correct Grammar */}
              <button
                disabled={aiLoading || !entry.content.trim()}
                onClick={handleAutoCorrectGrammar}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 disabled:opacity-40 transition shadow-sm"
                title="Auto-correct spelling, grammar, and typos"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto Correct Grammar</span>
              </button>

              {previousContentForUndo !== null && (
                <button
                  onClick={handleUndoGrammar}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  title="Undo grammar correction"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>Undo</span>
                </button>
              )}

              {/* Selective Translate */}
              <button
                disabled={aiLoading || !entry.content.trim()}
                onClick={handleOpenTranslate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 border border-indigo-800/80 disabled:opacity-40 transition shadow-sm"
                title="Translate selected text or entire diary into Telugu & multiple languages"
              >
                <Languages className="w-3.5 h-3.5 text-indigo-400" />
                <span>Translate (Telugu & 12+ Langs)</span>
              </button>

              {/* Summarize */}
              <button
                disabled={aiLoading || !entry.content.trim()}
                onClick={handleAiSummarize}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold bg-purple-950/60 hover:bg-purple-900 text-purple-200 border border-purple-800/60 disabled:opacity-40 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Summarize</span>
              </button>

              {/* Extract Tasks */}
              <button
                disabled={aiLoading || !entry.content.trim()}
                onClick={handleAiExtractTasks}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 transition"
              >
                <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Extract Tasks</span>
              </button>
            </div>

            {/* Character / Word Count & Auto-save status */}
            <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
              <span>{entry.content.length} chars</span>
              <span>{entry.content.trim() ? entry.content.trim().split(/\s+/).length : 0} words</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Auto-saved
              </span>
            </div>
          </div>

          {/* Notification Banner */}
          {aiNotification && (
            <div className="p-3 bg-indigo-950/80 border-b border-indigo-800/80 text-indigo-200 text-xs font-semibold flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{aiNotification}</span>
              </div>
              <button onClick={() => setAiNotification(null)} className="text-indigo-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Translation Sub-Panel */}
          {isTranslateOpen && (
            <div className="p-4 bg-indigo-950/30 border-b border-indigo-900/60 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <Languages className="w-4 h-4 text-indigo-400" />
                  <span>Selective Translate {isSelectionOnly ? '(Highlighted Selection)' : '(Entire Entry)'}</span>
                </div>
                <button onClick={() => setIsTranslateOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Language Picker */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Click any language to translate & auto-paste at bottom of diary:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleExecuteTranslate(lang.name)}
                      disabled={aiLoading}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        selectedLanguage === lang.name
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md font-bold'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {translatedResult && (
                <div className="mt-2 p-3 bg-indigo-950/60 border border-indigo-800/80 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-indigo-300 block">
                    ✔ Result in {selectedLanguage} (Neatly formatted at the bottom of your diary):
                  </span>
                  <p className="text-xs text-slate-200 whitespace-pre-wrap font-sans bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    {translatedResult}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Textarea Area */}
          <div className="p-5 flex-1 min-h-[350px]">
            <textarea
              ref={textareaRef}
              value={entry.content}
              onChange={(e) => handleSaveContent(e.target.value)}
              placeholder="Write your reflections, insights, wins, or meeting notes for today... (Tip: Click + Insert Image or + Attach File to place media inline between paragraphs)"
              className="w-full h-full min-h-[320px] bg-transparent text-slate-100 placeholder-slate-600 text-sm leading-relaxed resize-y focus:outline-none font-sans"
            />
          </div>

          {/* AI Summary Card (if generated) */}
          {entry.aiSummary && (
            <div className="mx-5 mb-4 p-4 bg-purple-950/30 border border-purple-800/40 rounded-2xl space-y-1">
              <span className="text-[11px] font-extrabold text-purple-300 uppercase tracking-wider block">AI Daily Summary</span>
              <p className="text-xs text-purple-200 whitespace-pre-wrap leading-relaxed">{entry.aiSummary}</p>
            </div>
          )}

          {/* Attachments Section with compact preview thumbnails & Click to View in Drive popup */}
          {entry.attachments.length > 0 && (
            <div className="mx-5 mb-4 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Attached Media & Documents ({entry.attachments.length})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Click any item to view in Drive popup
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {entry.attachments.map((file) => (
                  <div 
                    key={file.id} 
                    onClick={() => setViewerAttachment(file)}
                    className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md hover:border-indigo-600/70 transition cursor-pointer"
                  >
                    {/* Delete "X" Button on Top Right */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileToDelete(file);
                      }}
                      className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-slate-950/85 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center transition shadow-lg border border-slate-700/60 hover:border-rose-500"
                      title={`Delete ${file.name} from diary and Drive`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Thumbnail Preview Area */}
                    {file.type.startsWith('image') && file.dataUrl ? (
                      <div className="w-full h-24 sm:h-28 bg-slate-950 flex items-center justify-center overflow-hidden">
                        <img 
                          src={file.dataUrl} 
                          alt={file.name} 
                          className="w-full h-full object-cover transition group-hover:scale-105 duration-200" 
                        />
                      </div>
                    ) : (
                      <div className="w-full h-24 sm:h-28 bg-slate-950 flex flex-col items-center justify-center gap-1.5 p-3 text-center border-b border-slate-800/80">
                        <FileText className="w-7 h-7 text-indigo-400" />
                        <span className="text-[10px] text-slate-400 uppercase font-mono">{file.type.split('/')[1] || 'FILE'}</span>
                      </div>
                    )}

                    {/* File Metadata Label */}
                    <div className="p-2.5">
                      <span className="text-xs font-semibold text-slate-200 truncate block" title={file.name}>
                        {file.name}
                      </span>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                        <span>{(file.size / 1024).toFixed(0)} KB</span>
                        <span className="text-indigo-400 group-hover:underline flex items-center gap-0.5">
                          <Eye className="w-2.5 h-2.5" /> View
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Universal Bottom Voice & File Toolbar (Accessible in Canvas & Editor) */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dictation Language Picker */}
          <select
            value={dictationLang}
            onChange={(e) => setDictationLang(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            title="Select spoken language for voice dictation"
          >
            {DICTATION_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>

          {/* Standard Speech Dictation */}
          <button
            type="button"
            onClick={handleToggleDictation}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              isDictating 
                ? 'bg-rose-600 text-white animate-pulse' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Live speech dictation into journal"
          >
            {isDictating ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isDictating ? 'Listening...' : 'Dictate'}</span>
          </button>

          {/* AI Whisper Multilingual Voice-to-Diary */}
          <button
            type="button"
            disabled={aiLoading}
            onClick={handleToggleAIRecording}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-md ${
              isAIRecording 
                ? 'bg-rose-600 text-white animate-pulse' 
                : 'bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-300'
            }`}
            title="Record spoken thoughts in ANY language - Whisper AI transcribes & formats it into your diary"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isAIRecording ? 'Stop & Write Diary' : 'AI Voice-to-Diary'}</span>
          </button>

          {/* AI Error Correction & Sentence Polisher */}
          <button
            type="button"
            disabled={aiLoading || !entry.content.trim()}
            onClick={handleAiErrorCorrection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-800/80 disabled:opacity-40 transition shadow-sm"
            title="AI Error Correction: Remove voice stutter duplicates, fix grammar & rewrite into meaningful sentences"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Error Correction</span>
          </button>

          {/* Read Aloud TTS */}
          <button
            type="button"
            onClick={handleToggleSpeak}
            className={`p-2 rounded-xl text-xs transition ${
              isSpeaking 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Read diary entry aloud"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* File & Photo Attachment */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Attach documents or photos to this date"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Attach Media</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
          <span>{entry.content.length} chars</span>
          <span>&bull;</span>
          <span>{entry.attachments.length} attached media</span>
        </div>
      </div>

      {/* Drive Media Viewer Popup Modal (View in Drive, Download, Preview) */}
      <DriveMediaViewerModal
        isOpen={!!viewerAttachment}
        attachment={viewerAttachment}
        onClose={() => setViewerAttachment(null)}
        date={currentDate}
      />

      {/* Persistent Diary AI Companion Modal */}
      <DiaryAIChatModal
        date={currentDate}
        isOpen={isDiaryChatOpen}
        onClose={() => setIsDiaryChatOpen(false)}
        onDiaryContentUpdated={(content) => handleSaveContent(content)}
      />

      {/* Delete Attachment Confirmation Popup Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-950/50">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-base text-white">Delete Attachment?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to delete <span className="text-slate-200 font-semibold truncate block">"{fileToDelete.name}"</span>?
              </p>
              <p className="text-[11px] text-rose-400/90 leading-relaxed">
                This will remove the file from your diary and permanently purge it from your Google Drive storage vault.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAttachment}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete from Drive</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
