import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Clock, 
  BookOpen, 
  Bot, 
  Search, 
  Settings, 
  Cloud, 
  CheckCircle2, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  FolderOpen
} from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { GoogleDriveState, AIProvider } from '../types';
import { ThemeService, ThemeMode } from '../services/themeService';
import { GoogleAuthService } from '../services/googleAuthService';

interface NavbarProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  activeTab: 'calendar' | 'tasks' | 'scheduler' | 'diary' | 'backup';
  setActiveTab: (tab: 'calendar' | 'tasks' | 'scheduler' | 'diary' | 'backup') => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onToggleChat: () => void;
  onSignOut?: () => void;
  onOpenAttachGoogle?: () => void;
  isChatOpen: boolean;
  driveState: GoogleDriveState;
  activeAIProvider: AIProvider;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  onDateChange,
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenSettings,
  onToggleChat,
  onSignOut,
  onOpenAttachGoogle,
  isChatOpen,
  driveState,
  activeAIProvider,
}) => {
  const [theme, setTheme] = useState<ThemeMode>(() => ThemeService.getTheme());

  useEffect(() => {
    return ThemeService.subscribe((newTheme) => {
      setTheme(newTheme);
    });
  }, []);

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

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 px-2 sm:px-4 py-2 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3 flex-wrap">
        
        {/* Brand & Date Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer" onClick={() => setActiveTab('calendar')}>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex items-center">
              <span className="font-extrabold tracking-tight text-base sm:text-lg text-white">Tasker</span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-indigo-400 font-bold ml-1 px-1 sm:px-1.5 py-0.5 bg-indigo-950/80 rounded border border-indigo-800/60 hidden xs:inline">OS</span>
            </div>
          </div>

          <div className="h-4 sm:h-5 w-[1px] bg-slate-800 hidden md:block" />

          {/* Quick Date Stepper */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 sm:p-1 border border-slate-700/60 shadow-inner">
            <button 
              onClick={handlePrevDay} 
              title="Previous Day"
              className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button 
              onClick={handleToday}
              className="px-1.5 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700/60 rounded transition flex items-center gap-1"
            >
              <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400 shrink-0" />
              <span className="hidden sm:inline">{format(parsedDate, 'EEE, MMM d, yyyy')}</span>
              <span className="inline sm:hidden">{format(parsedDate, 'MMM d')}</span>
            </button>
            <button 
              onClick={handleNextDay} 
              title="Next Day"
              className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Center Nav Tabs: 5 Core Modules */}
        <nav className="flex items-center bg-slate-800/70 p-0.5 sm:p-1 rounded-xl border border-slate-700/60 text-xs sm:text-sm overflow-x-auto max-w-full scrollbar-none gap-0.5">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'calendar' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Calendar View"
          >
            <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden md:inline">Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'tasks' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Day Tasks"
          >
            <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden md:inline">Day Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduler')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'scheduler' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Scheduler & Alarms"
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden md:inline">Scheduler</span>
          </button>

          <button
            onClick={() => setActiveTab('diary')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'diary' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Word Document Diary"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden md:inline">Diary</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'backup' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Encrypted Backup & Drive Sync"
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            <span className="hidden md:inline">Backup & Sync</span>
          </button>
        </nav>

        {/* Right Action Tools */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs transition group"
            title="Global Search across all dates and files (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden lg:inline px-1.5 py-0.5 text-[9px] bg-slate-900 rounded border border-slate-700 text-slate-400">Ctrl K</kbd>
          </button>

          {/* Google Account Storage Vault & Explicit Sign Out */}
          <div className="flex items-center gap-1 p-0.5 sm:p-1 sm:pl-2 sm:pr-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-sm">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 text-left hover:opacity-90 transition p-0.5 sm:p-0"
              title={`Active Storage: ${driveState.activeStorageAccountEmail || driveState.userEmail || 'Local'}. Click to manage settings.`}
            >
              {driveState.userAvatar ? (
                <img src={driveState.userAvatar} alt="Google Account" className="w-5 h-5 rounded-full ring-1 ring-emerald-400 shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {driveState.userName ? driveState.userName.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <div className="hidden md:flex flex-col text-left leading-none max-w-[100px] lg:max-w-[160px]">
                <span className="text-[11px] font-bold text-slate-100 truncate">
                  {driveState.userName || driveState.userEmail?.split('@')[0] || 'User'}
                </span>
                <span className="text-[9px] text-slate-400 truncate font-mono mt-0.5">
                  {driveState.accessToken ? '📁 Drive Synced' : '⚠️ Local Storage'}
                </span>
              </div>
              <span 
                className={`w-2 h-2 rounded-full shrink-0 ${driveState.accessToken ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-amber-400 ring-2 ring-amber-400/30'}`} 
                title={driveState.accessToken ? 'Google Drive Connected' : 'Browser Storage Only (Unsynced)'}
              />
            </button>

            {/* Open Google Drive folder shortcut if connected */}
            {driveState.accessToken && (
              <button
                onClick={() => GoogleAuthService.openDriveFolderInNewTab()}
                className="px-1.5 py-1 rounded-lg bg-slate-700/80 hover:bg-slate-700 border border-slate-600/60 text-slate-200 hover:text-white text-[10px] font-bold hidden lg:flex items-center gap-1 transition"
                title="Open Tasker App Data folder in Google Drive"
              >
                <FolderOpen className="w-3 h-3 text-indigo-400" />
                <span className="hidden xl:inline">Drive</span>
              </button>
            )}

            {/* Attach Google Account CTA if not yet connected to Drive */}
            {!driveState.accessToken && onOpenAttachGoogle && (
              <button
                onClick={onOpenAttachGoogle}
                className="px-1.5 sm:px-2 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-600/80 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition shadow-sm animate-pulse"
                title="Browser storage is temporary. Click to attach Google Account!"
              >
                <span>Connect</span>
              </button>
            )}

            {/* Explicit Sign Out Button */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="hidden sm:flex ml-0.5 px-1.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-800/50 items-center gap-1 text-[10px] sm:text-[11px] font-semibold transition"
                title="Sign out & switch account"
              >
                <LogOut className="w-3 h-3 text-rose-400" />
                <span className="hidden lg:inline">Sign Out</span>
              </button>
            )}
          </div>

          {/* AI Toggle Button */}
          <button
            onClick={onToggleChat}
            className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
              isChatOpen 
                ? 'bg-purple-600 text-white shadow-purple-600/30' 
                : 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/50'
            }`}
            title="Open Omni-AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            <span className="hidden sm:inline text-[11px]">AI</span>
            <span className="px-1 py-0.2 text-[8px] sm:text-[9px] uppercase bg-purple-900/90 rounded text-purple-200 border border-purple-700/60 font-semibold font-mono tracking-wider">
              {activeAIProvider === 'custom' ? 'Grok' : activeAIProvider === 'groq' ? 'Groq' : activeAIProvider === 'openai' ? 'GPT' : 'Gemini'}
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition"
            title="Settings & Cloud Sync"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Theme Mode Toggle (Dark / Light) */}
          <button
            onClick={() => {
              const next = ThemeService.toggleTheme();
              setTheme(next);
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition shadow-sm cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Dark and Light Mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
