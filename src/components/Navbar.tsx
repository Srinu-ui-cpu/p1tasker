import React from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { GoogleDriveState, AIProvider } from '../types';

interface NavbarProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  activeTab: 'calendar' | 'tasks' | 'scheduler' | 'diary' | 'backup';
  setActiveTab: (tab: 'calendar' | 'tasks' | 'scheduler' | 'diary' | 'backup') => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onToggleChat: () => void;
  onSignOut?: () => void;
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
  isChatOpen,
  driveState,
  activeAIProvider,
}) => {
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
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        
        {/* Brand & Date Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('calendar')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-lg text-white">Tasker</span>
              <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold ml-1.5 px-1.5 py-0.5 bg-indigo-950/80 rounded border border-indigo-800/60">OS</span>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Quick Date Stepper */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/60 shadow-inner">
            <button 
              onClick={handlePrevDay} 
              title="Previous Day"
              className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleToday}
              className="px-2.5 py-0.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700/60 rounded transition flex items-center gap-1.5"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>{format(parsedDate, 'EEE, MMM d, yyyy')}</span>
            </button>
            <button 
              onClick={handleNextDay} 
              title="Next Day"
              className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Nav Tabs: Calendar First! */}
        <nav className="flex items-center bg-slate-800/60 p-1 rounded-xl border border-slate-800 text-sm">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'calendar' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="hidden md:inline">Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'tasks' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="hidden md:inline">Day Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduler')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'scheduler' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="hidden md:inline">Scheduler</span>
          </button>

          <button
            onClick={() => setActiveTab('diary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'diary' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden md:inline">Diary</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'backup' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Backup & Sync</span>
          </button>
        </nav>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs transition group"
            title="Global Search across all dates and files (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] bg-slate-900 rounded border border-slate-700 text-slate-400">Ctrl K</kbd>
          </button>

          {/* Google Account Storage Vault Pill */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs transition"
            title={`Active Storage: ${driveState.activeStorageAccountEmail || driveState.userEmail || 'Local'}. Click to manage Google accounts.`}
          >
            {driveState.userAvatar ? (
              <img src={driveState.userAvatar} alt="Google Account" className="w-4 h-4 rounded-full ring-1 ring-emerald-400" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] font-bold text-white">
                G
              </div>
            )}
            <span className="hidden lg:inline text-[11px] font-medium text-slate-300 truncate max-w-[130px]">
              {driveState.activeStorageAccountEmail || driveState.userEmail || 'Google Drive'}
            </span>
            <span className={`w-2 h-2 rounded-full ${driveState.isConnected ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-slate-500'}`} />
          </button>

          {/* AI Toggle Button */}
          <button
            onClick={onToggleChat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
              isChatOpen 
                ? 'bg-purple-600 text-white shadow-purple-600/30' 
                : 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/50'
            }`}
            title="Open Omni-AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            <span className="hidden sm:inline">AI Brain</span>
            <span className="px-1 text-[9px] uppercase bg-purple-900/80 rounded text-purple-200 border border-purple-700/60">
              {activeAIProvider}
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition"
            title="Settings & Cloud Sync"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
