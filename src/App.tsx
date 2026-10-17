import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Navbar } from './components/Navbar';
import { DayWorkspace } from './components/DayWorkspace';
import { CalendarView } from './components/CalendarView';
import { TeamsScheduleGrid } from './components/TeamsScheduleGrid';
import { DiaryView } from './components/DiaryView';
import { DiaryModal } from './components/DiaryModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { GlobalChatbotDrawer } from './components/GlobalChatbotDrawer';
import { SettingsModal } from './components/SettingsModal';
import { LocalAIModal } from './components/LocalAIModal';
import { AlarmAlertModal } from './components/AlarmAlertModal';
import { GoogleLoginPage } from './components/GoogleLoginPage';
import { BackupRestoreView } from './components/BackupRestoreView';
import { StorageService } from './services/storageService';
import { GoogleAuthService } from './services/googleAuthService';
import { AlarmService, ActiveAlarmTrigger } from './services/alarmService';
import { AIBrokerService } from './services/aiBrokerService';
import { TaskItem, GoogleDriveState, AIProvider } from './types';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => GoogleAuthService.isAuthenticated());
  const [currentDate, setCurrentDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  // Calendar appears first after Google authentication
  const [activeTab, setActiveTab] = useState<'calendar' | 'tasks' | 'scheduler' | 'diary' | 'backup'>('calendar');
  const [tasks, setTasks] = useState<TaskItem[]>(() => StorageService.getTasksForDate(currentDate));

  // Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [isLocalAIOpen, setIsLocalAIOpen] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarmTrigger | null>(null);

  // States
  const [driveState, setDriveState] = useState<GoogleDriveState>(() => GoogleAuthService.getDriveState());
  const [activeAIProvider, setActiveAIProvider] = useState<AIProvider>(() => AIBrokerService.getConfig().activeProvider);

  // Refresh tasks whenever date changes or tasks are updated
  const refreshTasks = () => {
    setTasks(StorageService.getTasksForDate(currentDate));
    setDriveState(GoogleAuthService.getDriveState());
    setActiveAIProvider(AIBrokerService.getConfig().activeProvider);
  };

  useEffect(() => {
    refreshTasks();
  }, [currentDate]);

  // Start background alarm polling loop & subscribe to alarms
  useEffect(() => {
    AlarmService.startScheduler();
    const unsubscribe = AlarmService.onAlarm((trigger) => {
      setActiveAlarm(trigger);
    });

    return () => {
      AlarmService.stopScheduler();
      unsubscribe();
    };
  }, []);

  const handleDateSelect = (date: string, tab: 'tasks' | 'diary' | 'scheduler' | 'calendar' | 'backup' = 'tasks') => {
    setCurrentDate(date);
    setActiveTab(tab as 'calendar' | 'tasks' | 'scheduler' | 'diary' | 'backup');
  };

  // If user is not authenticated with Google, show the Google Sign-In page
  if (!isAuthenticated) {
    return (
      <GoogleLoginPage
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          setActiveTab('calendar');
          refreshTasks();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Universal Sticky Top Navbar with Global Search & Global AI Chatbot */}
      <Navbar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onSignOut={() => {
          GoogleAuthService.signOut();
          setIsAuthenticated(false);
        }}
        isChatOpen={isChatOpen}
        driveState={driveState}
        activeAIProvider={activeAIProvider}
      />

      {/* Main View Area: Calendar First, Date Workspace on Click, Full Diary View */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'calendar' && (
          <CalendarView
            selectedDate={currentDate}
            onSelectDate={setCurrentDate}
            onOpenDayWorkspace={(date) => {
              setCurrentDate(date);
              setActiveTab('tasks');
            }}
          />
        )}

        {activeTab === 'tasks' && (
          <DayWorkspace
            currentDate={currentDate}
            tasks={tasks}
            onTasksUpdated={refreshTasks}
            onOpenDiary={() => setActiveTab('diary')}
            onOpenScheduler={() => setActiveTab('scheduler')}
          />
        )}

        {activeTab === 'scheduler' && (
          <TeamsScheduleGrid
            currentDate={currentDate}
            tasks={tasks}
            onTasksUpdated={refreshTasks}
            onOpenDiary={() => setActiveTab('diary')}
          />
        )}

        {activeTab === 'diary' && (
          <DiaryView
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onTasksUpdated={refreshTasks}
          />
        )}

        {activeTab === 'backup' && (
          <BackupRestoreView
            onDataRestored={refreshTasks}
          />
        )}
      </main>

      {/* DIARY MODAL (Quick popout from DayWorkspace if triggered) */}
      <DiaryModal
        date={currentDate}
        isOpen={isDiaryOpen}
        onClose={() => setIsDiaryOpen(false)}
        onTasksUpdated={refreshTasks}
      />

      {/* GLOBAL SEARCH MODAL (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectDate={handleDateSelect}
      />

      {/* CHATGPT-STYLE GLOBAL AI CHATBOT DRAWER (Stores all conversations & media) */}
      <GlobalChatbotDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSelectDate={(date) => {
          setCurrentDate(date);
          setActiveTab('tasks');
        }}
        activeProvider={activeAIProvider}
      />

      {/* SYSTEM SETTINGS & GOOGLE STORAGE VAULT MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigUpdated={refreshTasks}
        onOpenLocalAI={() => setIsLocalAIOpen(true)}
      />

      {/* UNCENSORED & EFFICIENT LOCAL AI MODAL */}
      <LocalAIModal
        isOpen={isLocalAIOpen}
        onClose={() => setIsLocalAIOpen(false)}
        onInstalled={refreshTasks}
      />

      {/* ACTIVE ALARM TAKEOVER MODAL (15m & 5m prior) */}
      <AlarmAlertModal
        alarm={activeAlarm}
        onDismiss={() => setActiveAlarm(null)}
        onSnooze={() => {
          setActiveAlarm(null);
          // Re-trigger alert in 5 minutes
          setTimeout(() => {
            if (activeAlarm) {
              AlarmService.playAlarmSound('urgent');
              setActiveAlarm({
                ...activeAlarm,
                message: `[Snoozed Alert] "${activeAlarm.task.title}" is starting now!`,
              });
            }
          }, 5 * 60 * 1000);
        }}
      />

    </div>
  );
}

export default App;
