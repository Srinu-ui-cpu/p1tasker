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
  Calendar as CalendarIcon
} from 'lucide-react';
import { DiaryEntry, Mood, FileAttachment } from '../types';
import { StorageService } from '../services/storageService';
import { SpeechService } from '../services/speechService';
import { AIBrokerService } from '../services/aiBrokerService';
import { DiaryAIChatModal } from './DiaryAIChatModal';
import { DiaryAIModelSelector } from './DiaryAIModelSelector';

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

  // --- 🎙️ SPEECH DICTATION ---
  const handleToggleDictation = () => {
    if (isDictating) {
      SpeechService.stopDictation();
      setIsDictating(false);
    } else {
      setIsDictating(true);
      SpeechService.startDictation(
        (transcript) => {
          const newContent = entry.content ? `${entry.content} ${transcript}` : transcript;
          handleSaveContent(newContent);
        },
        () => setIsDictating(false),
        dictationLang
      );
    }
  };

  // --- 🧠 AI WHISPER MULTILINGUAL RECORDING ---
  const handleToggleAIRecording = async () => {
    if (isAIRecording) {
      setIsAIRecording(false);
      setAiLoading(true);
      setAiNotification('Processing audio with AI Whisper model in all languages...');

      try {
        const audioBlob = await SpeechService.stopMediaRecording();
        const transcription = await SpeechService.transcribeAudioWithAI(audioBlob);

        if (!transcription.trim()) {
          setAiNotification('No speech detected in audio.');
          return;
        }

        const formatted = await SpeechService.formatVoiceIntoDiary(transcription, currentDate);
        const newContent = entry.content
          ? `${entry.content}\n\n---\n### 🎙️ Spoken Reflection (${new Date().toLocaleTimeString()}):\n${formatted.formattedContent}`
          : formatted.formattedContent;

        const updated: DiaryEntry = {
          ...entry,
          content: newContent,
          mood: entry.mood || (formatted.detectedMood as Mood) || undefined,
          updatedAt: new Date().toISOString(),
        };

        setEntry(updated);
        StorageService.saveDiaryForDate(updated);
        setAiNotification(`✨ Spoken audio transcribed and formatted into diary! Mood: ${formatted.detectedMood}`);
      } catch (err: unknown) {
        const error = err as Error;
        setAiNotification(`Audio processing error: ${error.message || 'Check audio setup'}`);
      } finally {
        setAiLoading(false);
        setTimeout(() => setAiNotification(null), 5000);
      }
    } else {
      try {
        await SpeechService.startMediaRecording();
        setIsAIRecording(true);
        setAiNotification('🎙️ Recording voice thoughts in any language... Click button again when finished speaking.');
      } catch (err: unknown) {
        const error = err as Error;
        alert(`Could not start recording: ${error.message}`);
      }
    }
  };

  // --- 🔊 TEXT TO SPEECH ---
  const handleToggleSpeak = () => {
    if (isSpeaking) {
      SpeechService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      if (!entry.content.trim()) return;
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

  // --- ATTACHMENTS ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { attachment } = await StorageService.attachFileToDate(file, currentDate);
      const updated: DiaryEntry = {
        ...entry,
        attachments: [...entry.attachments, attachment],
        updatedAt: new Date().toISOString(),
      };
      setEntry(updated);
      StorageService.saveDiaryForDate(updated);
      setAiNotification(`Attached "${file.name}" to diary!`);
      setTimeout(() => setAiNotification(null), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      alert(`File upload error: ${error.message}`);
    }
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

      {/* Main Journal Editor & Actions */}
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
            placeholder="Write your reflections, insights, wins, or meeting notes for today... (Tip: Select text and click Translate or Auto-Correct Grammar)"
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

        {/* Attachments Section */}
        {entry.attachments.length > 0 && (
          <div className="mx-5 mb-4 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Attached Documents & Media</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {entry.attachments.map((file) => (
                <div key={file.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                  {file.type.startsWith('image') ? (
                    <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-slate-200 truncate block">{file.name}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">SHA: {file.hash.slice(0, 8)}...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Voice & File Toolbar */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
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

            {/* Read Aloud TTS */}
            <button
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
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Attach documents or photos to this date"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Attach Media</span>
            </button>
          </div>
        </div>

      </div>

      {/* Persistent Diary AI Companion Modal */}
      <DiaryAIChatModal
        date={currentDate}
        isOpen={isDiaryChatOpen}
        onClose={() => setIsDiaryChatOpen(false)}
        onDiaryContentUpdated={(content) => handleSaveContent(content)}
      />

    </div>
  );
};
