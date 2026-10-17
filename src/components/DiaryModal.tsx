import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
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
  BrainCircuit, 
  Smile, 
  CheckSquare,
  Bot,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { DiaryEntry, Mood, FileAttachment, Priority } from '../types';
import { StorageService } from '../services/storageService';
import { SpeechService } from '../services/speechService';
import { AIBrokerService } from '../services/aiBrokerService';
import { DiaryAIChatModal } from './DiaryAIChatModal';
import { DiaryAIModelSelector } from './DiaryAIModelSelector';

interface DiaryModalProps {
  date: string; // YYYY-MM-DD
  isOpen: boolean;
  onClose: () => void;
  onTasksUpdated: () => void;
}

export const DiaryModal: React.FC<DiaryModalProps> = ({
  date,
  isOpen,
  onClose,
  onTasksUpdated,
}) => {
  const [entry, setEntry] = useState<DiaryEntry>(() => StorageService.getDiaryForDate(date));
  const [isDictating, setIsDictating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotification, setAiNotification] = useState<string | null>(null);
  const [dedupNotice, setDedupNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    { code: 'te-IN', label: 'Telugu (తెలుగు)' },
    { code: 'hi-IN', label: 'Hindi (हिंदी)' },
    { code: 'en-US', label: 'English (US)' },
    { code: 'es-ES', label: 'Spanish' },
    { code: 'fr-FR', label: 'French' },
    { code: 'de-DE', label: 'German' },
    { code: 'zh-CN', label: 'Chinese' },
    { code: 'ja-JP', label: 'Japanese' },
    { code: 'ar-SA', label: 'Arabic' },
  ];

  useEffect(() => {
    setEntry(StorageService.getDiaryForDate(date));
  }, [date]);

  if (!isOpen) return null;

  const parsedDate = parseISO(date);

  const handleSaveContent = (content: string) => {
    const updated = { ...entry, content, updatedAt: new Date().toISOString() };
    setEntry(updated);
    StorageService.saveDiaryForDate(updated);
  };

  const handleSetMood = (mood: Mood) => {
    const updated = { ...entry, mood, updatedAt: new Date().toISOString() };
    setEntry(updated);
    StorageService.saveDiaryForDate(updated);
  };

  // --- 🎙️ MULTILINGUAL VOICE DICTATION ---
  const handleToggleDictation = () => {
    if (isDictating) {
      SpeechService.stopDictation();
      setIsDictating(false);
    } else {
      const initialText = entry.content;
      const success = SpeechService.startDictation(
        (transcript) => {
          const separator = initialText && !initialText.endsWith(' ') ? ' ' : '';
          const newContent = `${initialText}${separator}${transcript}`;
          handleSaveContent(newContent);
        },
        (err) => {
          setAiNotification(`Mic error: ${err}`);
          setIsDictating(false);
        },
        () => setIsDictating(false),
        dictationLang
      );
      if (success) setIsDictating(true);
    }
  };

  // --- 🤖 AI WHISPER ANY-LANGUAGE VOICE-TO-DIARY ---
  const handleToggleAIRecorder = async () => {
    if (isAIRecording) {
      setAiNotification('⏳ Transcribing audio with AI and formatting into diary...');
      setIsAIRecording(false);
      setAiLoading(true);

      try {
        const { transcript, modelUsed } = await SpeechService.stopAIRecordingAndTranscribe();
        if (!transcript.trim()) {
          setAiNotification('No speech detected in recording.');
          return;
        }

        // Use AI to format spoken words into a beautiful diary reflection
        const formatted = await SpeechService.formatVoiceIntoDiary(transcript, dictationLang);
        const separator = entry.content.trim() ? '\n\n' : '';
        const newContent = `${entry.content}${separator}${formatted.formattedDiary}`;

        handleSaveContent(newContent);
        handleSetMood(formatted.mood as Mood);
        setAiNotification(`✨ AI transcribed (${modelUsed}) and crafted your diary reflection!`);
      } catch (err: unknown) {
        const error = err as Error;
        setAiNotification(`AI Voice Error: ${error.message}`);
      } finally {
        setAiLoading(false);
        setTimeout(() => setAiNotification(null), 5000);
      }
    } else {
      const started = await SpeechService.startAIRecording();
      if (started) {
        setIsAIRecording(true);
        setAiNotification('🎙️ Recording in any language... Speak naturally, then click Stop to format your diary.');
      } else {
        setAiNotification('Could not access microphone.');
      }
    }
  };

  // --- 🔊 TEXT-TO-SPEECH (READ ALOUD) ---
  const handleToggleReadAloud = () => {
    if (isSpeaking) {
      SpeechService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      if (!entry.content.trim()) return;
      setIsSpeaking(true);
      SpeechService.speakText(entry.content, () => setIsSpeaking(false));
    }
  };

  // --- 📎 FILE UPLOAD WITH SHA-256 DEDUPLICATION ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { attachment, isDuplicate } = await StorageService.processAndDeduplicateFile(file, date);

      const updatedAttachments = [...entry.attachments, attachment];
      const updated = { ...entry, attachments: updatedAttachments };
      setEntry(updated);
      StorageService.saveDiaryForDate(updated);

      if (isDuplicate) {
        setDedupNotice(`⚡ Reused existing file "${file.name}" (SHA-256 deduplicated, 0 redundant bytes).`);
      } else {
        setDedupNotice(`Uploaded "${file.name}" to Google Drive folder.`);
      }
      setTimeout(() => setDedupNotice(null), 4000);
    }
  };

  const [fileToDelete, setFileToDelete] = useState<FileAttachment | null>(null);

  const handleConfirmDeleteAttachment = async () => {
    if (!fileToDelete) return;
    const toRemove = fileToDelete;
    setFileToDelete(null);

    StorageService.deleteDiaryAttachment(date, toRemove.id);
    const updated = StorageService.getDiaryForDate(date);
    setEntry(updated);

    // Sync removal to Google Drive cloud vault
    try {
      import('../services/googleAuthService').then(({ GoogleAuthService }) => {
        if (GoogleAuthService.isAuthenticated()) {
          GoogleAuthService.triggerDriveSync().catch(() => {});
        }
      });
    } catch {
      // ignore
    }

    setAiNotification(`✔ Deleted "${toRemove.name}" from diary & Google Drive vault!`);
    setTimeout(() => setAiNotification(null), 3500);
  };

  // --- ✍️ AUTO CORRECT GRAMMAR ---
  const handleAutoCorrectGrammar = async () => {
    if (!entry.content.trim()) return;

    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? 0;
    const hasSelection = end > start;

    const textToCorrect = hasSelection ? entry.content.substring(start, end) : entry.content;
    if (!textToCorrect.trim()) return;

    setAiLoading(true);
    setPreviousContentForUndo(entry.content);

    try {
      const res = await AIBrokerService.correctGrammar(textToCorrect);
      let newFullContent = '';

      if (hasSelection) {
        newFullContent = entry.content.substring(0, start) + res.correctedText + entry.content.substring(end);
      } else {
        newFullContent = res.correctedText;
      }

      handleSaveContent(newFullContent);
      setAiNotification(`✨ Grammar & spelling auto-corrected (${res.fixesApplied} adjustments made via ${res.modelUsed}).`);
    } catch {
      setAiNotification('Failed to auto-correct grammar.');
    } finally {
      setAiLoading(false);
      setTimeout(() => setAiNotification(null), 6000);
    }
  };

  const handleUndoGrammar = () => {
    if (previousContentForUndo !== null) {
      handleSaveContent(previousContentForUndo);
      setPreviousContentForUndo(null);
      setAiNotification('↩️ Reverted grammar auto-correction.');
      setTimeout(() => setAiNotification(null), 3000);
    }
  };

  // --- 🌐 OPEN SELECTIVE TRANSLATE MODAL/PANEL ---
  const handleOpenTranslate = () => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? 0;
    const hasSelection = end > start && entry.content.substring(start, end).trim().length > 0;

    if (hasSelection) {
      setTranslateTargetText(entry.content.substring(start, end));
      setIsSelectionOnly(true);
      setSelectionRange({ start, end });
    } else {
      setTranslateTargetText(entry.content);
      setIsSelectionOnly(false);
      setSelectionRange(null);
    }

    setTranslatedResult(null);
    setIsTranslateOpen(true);
  };

  // --- EXECUTE TRANSLATION & AUTO-PASTE AT BOTTOM ---
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

  // --- APPLY TRANSLATION ACTIONS ---
  const handleApplyTranslation = (action: 'replace' | 'insertBelow' | 'append') => {
    if (!translatedResult) return;

    let newContent = entry.content;

    if (action === 'replace') {
      if (isSelectionOnly && selectionRange) {
        newContent = entry.content.substring(0, selectionRange.start) + translatedResult + entry.content.substring(selectionRange.end);
      } else {
        newContent = translatedResult;
      }
    } else if (action === 'insertBelow') {
      if (isSelectionOnly && selectionRange) {
        newContent = entry.content.substring(0, selectionRange.end) + `\n\n${translatedResult}\n` + entry.content.substring(selectionRange.end);
      } else {
        newContent = `${entry.content}\n\n${translatedResult}`;
      }
    } else if (action === 'append') {
      newContent = `${entry.content}\n\n---\n### 🌐 Translation (${selectedLanguage}):\n${translatedResult}`;
    }

    handleSaveContent(newContent);
    setIsTranslateOpen(false);
    setTranslatedResult(null);
    setAiNotification(`Applied ${selectedLanguage} translation to diary!`);
    setTimeout(() => setAiNotification(null), 3000);
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
      setAiNotification('Failed to generate summary.');
    } finally {
      setAiLoading(false);
      setTimeout(() => setAiNotification(null), 4000);
    }
  };

  const handleAiExtractTasks = async () => {
    if (!entry.content.trim()) return;
    setAiLoading(true);
    try {
      const prompt = `Inspect this diary entry and extract any actionable tasks or commitments mentioned.
Return ONLY valid JSON array with objects: [{"title": "string", "priority": "medium" | "high" | "urgent"}].
Diary text:
${entry.content}`;

      const res = await AIBrokerService.completeText(prompt);
      let extracted: Array<{ title: string; priority?: Priority }> = [];
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
          date: date,
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">Daily Journal & Diary</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {format(parsedDate, 'MMMM d, yyyy')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Reflections, multilingual dictation, and AI reflection companion.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Open AI Diary Chat Companion Button */}
            <button
              onClick={() => setIsDiaryChatOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700/80 shadow-md transition"
              title="Open persistent AI Diary Chat for this day's entry"
            >
              <Bot className="w-4 h-4 text-purple-400" />
              <span>AI Diary Chat</span>
              {entry.chatHistory && entry.chatHistory.length > 0 && (
                <span className="px-1.5 py-0.2 bg-purple-600 text-white rounded-full text-[10px] font-mono">
                  {entry.chatHistory.length}
                </span>
              )}
            </button>

            {/* Mood selector */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              {(['great', 'good', 'neutral', 'challenging', 'stressful'] as Mood[]).map((m) => (
                <button
                  key={m}
                  onClick={() => handleSetMood(m)}
                  title={`Mood: ${m}`}
                  className={`px-2 py-1 text-xs rounded-lg transition ${
                    entry.mood === m ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'great' ? '🌟' : m === 'good' ? '😊' : m === 'neutral' ? '😐' : m === 'challenging' ? '🤔' : '🌧️'}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications Bar */}
        {(aiNotification || dedupNotice || previousContentForUndo) && (
          <div className="px-5 py-2 text-xs font-medium bg-indigo-950/80 text-indigo-200 border-b border-indigo-800/60 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{aiNotification || dedupNotice || 'Text updated'}</span>
            </div>
            {previousContentForUndo && (
              <button
                onClick={handleUndoGrammar}
                className="px-2.5 py-1 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-[11px] shrink-0 transition"
              >
                ↩️ Undo Correction
              </button>
            )}
          </div>
        )}

        {/* Editor Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <DiaryAIModelSelector />

          <textarea
            ref={textareaRef}
            rows={9}
            value={entry.content}
            onChange={(e) => handleSaveContent(e.target.value)}
            placeholder="Write your thoughts for today, or speak in any language (Telugu, Hindi, English, etc.) using the microphone..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 leading-relaxed resize-none"
          />

          {/* Selective Translate Panel */}
          {isTranslateOpen && (
            <div className="p-4 bg-slate-950 border border-indigo-700/60 rounded-2xl space-y-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Multi-Language Translate (Auto-Pastes at Bottom)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80 font-mono">
                    {isSelectionOnly ? '✂️ Selected Snippet' : '📄 Full Diary'}
                  </span>
                </div>
                <button
                  onClick={() => setIsTranslateOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Text Snippet Preview */}
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 max-h-24 overflow-y-auto text-xs text-slate-300 font-mono">
                {translateTargetText || '(No text to translate)'}
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
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 font-bold'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Translation Output & Application Options */}
              {translatedResult && (
                <div className="mt-3 p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-300">
                      ✔ Result in {selectedLanguage} (Already appended to diary):
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(translatedResult)}
                      className="text-[10px] text-indigo-400 hover:text-white transition"
                    >
                      📋 Copy Text
                    </button>
                  </div>
                  <p className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    {translatedResult}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* AI Summary Card (if exists) */}
          {entry.aiSummary && (
            <div className="p-4 bg-purple-950/30 border border-purple-800/40 rounded-2xl">
              <span className="text-[11px] font-extrabold text-purple-300 uppercase tracking-wider block mb-1">AI Daily Summary</span>
              <p className="text-xs text-purple-200 whitespace-pre-wrap leading-relaxed">{entry.aiSummary}</p>
            </div>
          )}

          {/* Attachments Section with compact preview thumbnails & "X" delete button */}
          {entry.attachments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Attached Documents & Media ({entry.attachments.length})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Synced to Drive Vault</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {entry.attachments.map((file) => (
                  <div 
                    key={file.id} 
                    className="relative group rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-800/80 shadow-md hover:border-slate-600 transition"
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

                    {/* Thumbnail Preview Area (compact size, NOT original giant size) */}
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
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>{(file.size / 1024).toFixed(0)} KB</span>
                        <span>SHA: {file.hash.slice(0, 6)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Toolbar */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
          {/* Voice & Media Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Dictation Language Picker */}
            <select
              value={dictationLang}
              onChange={(e) => setDictationLang(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
              title="Select spoken language for voice dictation"
            >
              {DICTATION_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>

            {/* Speech to Text Microphone */}
            <button
              onClick={handleToggleDictation}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isDictating 
                  ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/30' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Start real-time voice typing in selected language"
            >
              {isDictating ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-purple-400" />}
              <span>{isDictating ? 'Listening...' : 'Voice Dictate'}</span>
            </button>

            {/* AI Whisper: Speak Any Language & AI writes diary */}
            <button
              onClick={handleToggleAIRecorder}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isAIRecording 
                  ? 'bg-red-600 text-white animate-bounce shadow-red-600/40 ring-2 ring-red-400' 
                  : 'bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 text-purple-200 border border-purple-700/80'
              }`}
              title="Speak freely in any language; AI will transcribe with Whisper and write a formatted diary reflection for you"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>{isAIRecording ? 'Stop & AI Write Diary' : 'AI Voice-to-Diary'}</span>
            </button>

            {/* Read Aloud */}
            <button
              onClick={handleToggleReadAloud}
              className={`p-2 rounded-xl text-xs font-medium border transition ${
                isSpeaking 
                  ? 'bg-indigo-600 text-white border-indigo-500' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={isSpeaking ? 'Stop Reading' : 'Read Diary Aloud'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* File Upload Trigger */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Upload photo, receipt, or document (Deduplicated with SHA-256)"
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Attach</span>
            </button>
          </div>

          {/* AI Assist Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto Correct Grammar */}
            <button
              disabled={aiLoading || !entry.content.trim()}
              onClick={handleAutoCorrectGrammar}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 disabled:opacity-40 transition shadow-sm"
              title="Auto-correct spelling, grammar, and typos (Selected text or entire entry)"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto Correct Grammar</span>
            </button>

            {/* Selective Translate */}
            <button
              disabled={aiLoading || !entry.content.trim()}
              onClick={handleOpenTranslate}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-800/60 disabled:opacity-40 transition"
              title="Selectively translate highlighted text or entire entry into Telugu & multiple languages"
            >
              <Languages className="w-3.5 h-3.5 text-indigo-400" />
              <span>Translate</span>
            </button>

            {/* Summarize */}
            <button
              disabled={aiLoading || !entry.content.trim()}
              onClick={handleAiSummarize}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-800/60 disabled:opacity-40 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Summarize</span>
            </button>

            {/* Extract Tasks */}
            <button
              disabled={aiLoading || !entry.content.trim()}
              onClick={handleAiExtractTasks}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 transition"
            >
              <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>Extract Tasks</span>
            </button>
          </div>
        </div>

      </div>

      {/* SEPARATE DIARY AI COMPANION CHAT MODAL */}
      <DiaryAIChatModal
        date={date}
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
