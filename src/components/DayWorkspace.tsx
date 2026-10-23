import React, { useState, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  BookOpen, 
  Trash2, 
  Clock, 
  Bell, 
  BellRing,
  Tag, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  X,
  Volume2,
  FileText,
  Cloud,
  Play,
  Paperclip,
  Maximize2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TaskItem, Priority, Subtask, FileAttachment } from '../types';
import { StorageService } from '../services/storageService';
import { AlarmService } from '../services/alarmService';
import { GoogleAuthService } from '../services/googleAuthService';
import { DriveMediaViewerModal } from './DriveMediaViewerModal';

interface DayWorkspaceProps {
  currentDate: string; // YYYY-MM-DD
  tasks: TaskItem[];
  onTasksUpdated: () => void;
  onOpenDiary: () => void;
  onOpenScheduler: () => void;
}

export const DayWorkspace: React.FC<DayWorkspaceProps> = ({
  currentDate,
  tasks,
  onTasksUpdated,
  onOpenDiary,
  onOpenScheduler,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('medium');
  const [quickTime, setQuickTime] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Time Slot & Alarm Editor Modal State
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [modalStartTime, setModalStartTime] = useState('09:00');
  const [modalEndTime, setModalEndTime] = useState('10:00');
  const [modalAlarmEnabled, setModalAlarmEnabled] = useState(true);

  // Task Attachment State & Media Viewer
  const [viewingTaskAttachment, setViewingTaskAttachment] = useState<FileAttachment | null>(null);
  const [attachingToTaskId, setAttachingToTaskId] = useState<string | null>(null);
  const taskFileInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerAttachFileToTask = (taskId: string) => {
    setAttachingToTaskId(taskId);
    taskFileInputRef.current?.click();
  };

  const handleTaskFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !attachingToTaskId) return;

    try {
      const task = tasks.find(t => t.id === attachingToTaskId);
      if (!task) return;

      const deduplication = await StorageService.attachFileToDate(file, currentDate);
      const attachment = deduplication.attachment;

      // Upload to Drive if connected and not exact duplicate with driveId
      if (deduplication.isDuplicate && deduplication.existingDriveId) {
        attachment.driveId = deduplication.existingDriveId;
      } else if (GoogleAuthService.isAuthenticated()) {
        try {
          const driveUploaded = await GoogleAuthService.uploadMediaFileResumable(file);
          if (driveUploaded?.fileId) {
            attachment.driveId = driveUploaded.fileId;
          }
        } catch {
          // keep local
        }
      }

      const updatedTask: TaskItem = {
        ...task,
        attachments: [...(task.attachments || []).filter(a => a.id !== attachment.id), attachment],
      };
      StorageService.saveTask(updatedTask);
      onTasksUpdated();
      showToast(`Attached "${file.name}" to "${task.title}"!`);
    } finally {
      if (e.target) e.target.value = '';
      setAttachingToTaskId(null);
    }
  };

  const parsedDate = parseISO(currentDate);
  const diary = StorageService.getDiaryForDate(currentDate);
  const hasDiaryContent = diary.content.trim().length > 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: quickTitle.trim(),
      date: currentDate,
      startTime: quickTime || undefined,
      endTime: quickTime ? `${(parseInt(quickTime.split(':')[0], 10) + 1).toString().padStart(2, '0')}:00` : undefined,
      priority: quickPriority,
      status: 'todo',
      tags: [],
      subtasks: [],
      alarmEnabled: !!quickTime,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveTask(newTask);
    setQuickTitle('');
    setQuickTime('');
    onTasksUpdated();

    if (quickTime) {
      AlarmService.playAlarmSound('gentle');
      AlarmService.requestNotificationPermission();
      showToast(`Added "${newTask.title}" scheduled for ${quickTime} with alarms active!`);
    } else {
      showToast(`Added task "${newTask.title}"!`);
    }
  };

  const handleToggleTaskStatus = (task: TaskItem) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    const updated: TaskItem = { ...task, status: newStatus };
    StorageService.saveTask(updated);
    onTasksUpdated();

    if (newStatus === 'completed') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  const handleDeleteTask = (id: string) => {
    StorageService.deleteTask(id);
    onTasksUpdated();
  };

  // --- 🔔 INTERACTIVE ALARM TOGGLE ---
  const handleToggleAlarm = async (task: TaskItem) => {
    const nextState = !task.alarmEnabled;

    // If enabling alarm but task has no start time, assign upcoming time
    let assignedStartTime = task.startTime;
    if (nextState && !assignedStartTime) {
      const now = new Date();
      // Default to 15 minutes in the future
      const future = new Date(now.getTime() + 15 * 60 * 1000);
      assignedStartTime = format(future, 'HH:mm');
    }

    const updated: TaskItem = {
      ...task,
      startTime: assignedStartTime,
      alarmEnabled: nextState,
      notified15m: false,
      notified5m: false,
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveTask(updated);
    onTasksUpdated();

    if (nextState) {
      // Play audio chime and request notifications
      AlarmService.playAlarmSound('gentle');
      const granted = await AlarmService.requestNotificationPermission();
      showToast(
        `🔔 Alarm enabled for "${task.title}" at ${assignedStartTime}! ${
          granted ? 'Desktop alerts & sound active.' : 'Web Audio chime active (permission needed for banners).'
        }`
      );
    } else {
      showToast(`🔕 Alarm disabled for "${task.title}".`);
    }
  };

  // --- ⏱️ OPEN TIME SLOT MODAL ---
  const handleOpenTimeModal = (task: TaskItem) => {
    setEditingTask(task);
    setModalStartTime(task.startTime || format(new Date(), 'HH:mm'));
    setModalEndTime(task.endTime || format(new Date(Date.now() + 60 * 60 * 1000), 'HH:mm'));
    setModalAlarmEnabled(task.alarmEnabled ?? true);
  };

  const handleSaveTimeModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const updated: TaskItem = {
      ...editingTask,
      startTime: modalStartTime,
      endTime: modalEndTime,
      alarmEnabled: modalAlarmEnabled,
      notified15m: false,
      notified5m: false,
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveTask(updated);
    onTasksUpdated();
    setEditingTask(null);

    if (modalAlarmEnabled) {
      AlarmService.playAlarmSound('gentle');
      await AlarmService.requestNotificationPermission();
      showToast(`Time slot set to ${modalStartTime} - ${modalEndTime} with alarms active!`);
    } else {
      showToast(`Time slot updated to ${modalStartTime} - ${modalEndTime}.`);
    }
  };

  const handleTriggerTestAlarm = () => {
    AlarmService.triggerTestAlarm('Tasker Alarm System Test');
    showToast('🚨 Triggered test alarm! Sound chime and alert modal active.');
  };

  const handleAddSubtask = (task: TaskItem) => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    const updated = {
      ...task,
      subtasks: [...task.subtasks, newSub],
    };
    StorageService.saveTask(updated);
    setNewSubtaskTitle('');
    onTasksUpdated();
  };

  const handleToggleSubtask = (task: TaskItem, subId: string) => {
    const updatedSubtasks = task.subtasks.map(s =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    const updated = { ...task, subtasks: updatedSubtasks };
    StorageService.saveTask(updated);
    onTasksUpdated();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 transition-colors duration-200">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-indigo-950/90 border border-indigo-700/80 text-indigo-100 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 sm:gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xl flex items-center justify-between flex-wrap gap-3 sm:gap-4">
        <div>
          <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-indigo-400">Day Overview</span>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
            {format(parsedDate, 'EEEE, MMMM d')}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            {completedTasks} of {totalTasks} tasks completed ({progressPercent}%)
          </p>

          {/* Progress Bar */}
          <div className="w-full sm:w-56 h-2 bg-slate-800 rounded-full mt-2.5 sm:mt-3 overflow-hidden border border-slate-700/50">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
          {/* Direct Alarm Test Button */}
          <button
            onClick={handleTriggerTestAlarm}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 transition shadow-sm"
            title="Immediately test alarm chime, notification banner, and alert takeover modal"
          >
            <BellRing className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="hidden xs:inline">Test Alarm</span>
          </button>

          <button
            onClick={onOpenDiary}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition shadow-lg ${
              hasDiaryContent 
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30' 
                : 'bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-800/80'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300" />
            <span>{hasDiaryContent ? '📔 Diary' : '📔 Diary'}</span>
          </button>

          <button
            onClick={onOpenScheduler}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
            <span>Schedule</span>
          </button>
        </div>
      </div>

      {/* Quick Add Bar with optional time input */}
      <form onSubmit={handleQuickAdd} className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <div className="p-1.5 sm:p-2 text-indigo-400 shrink-0">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <input
          type="text"
          value={quickTitle}
          onChange={e => setQuickTitle(e.target.value)}
          placeholder={`Add task for ${format(parsedDate, 'MMM d')}...`}
          className="flex-1 min-w-0 w-full sm:w-auto bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
        />

        {/* Optional Time slot input directly on creation */}
        <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-xl px-2 py-1 text-xs text-slate-300 shrink-0">
          <Clock className="w-3 h-3 text-indigo-400" />
          <input
            type="time"
            value={quickTime}
            onChange={e => setQuickTime(e.target.value)}
            className="bg-transparent text-[11px] sm:text-xs text-slate-200 focus:outline-none"
            title="Optional start time (auto-enables alarms)"
          />
        </div>

        <select
          value={quickPriority}
          onChange={e => setQuickPriority(e.target.value as Priority)}
          className="bg-slate-800 border border-slate-700 text-[11px] sm:text-xs text-slate-300 rounded-xl px-2 py-1 sm:py-1.5 focus:outline-none shrink-0"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <button
          type="submit"
          disabled={!quickTitle.trim()}
          className="px-3 sm:px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-sm shrink-0"
        >
          Add
        </button>
      </form>

      {/* Task List */}
      <div className="space-y-2.5 sm:space-y-3">
        {tasks.length === 0 ? (
          <div className="py-12 sm:py-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl sm:rounded-3xl border border-dashed border-slate-800 p-4">
            <CheckSquare className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 opacity-20 text-indigo-400" />
            <p className="text-xs sm:text-sm">No tasks scheduled for this date yet.</p>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-1">Use the bar above or Scheduler to plan your day.</p>
          </div>
        ) : (
          tasks.map(task => {
            const isCompleted = task.status === 'completed';
            const isExpanded = expandedTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`bg-slate-900 border rounded-xl sm:rounded-2xl p-3 sm:p-4 transition shadow-md ${
                  isCompleted 
                    ? 'border-slate-800/60 opacity-60' 
                    : task.priority === 'urgent'
                    ? 'border-rose-900/50 bg-rose-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      className="mt-0.5 text-slate-400 hover:text-indigo-400 transition shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm ${isCompleted ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {StorageService.sanitizeTaskText(task.title)}
                        </span>

                        {/* Priority Badge */}
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                          task.priority === 'urgent' ? 'bg-rose-950/80 text-rose-300 border-rose-800/60' :
                          task.priority === 'high' ? 'bg-amber-950/80 text-amber-300 border-amber-800/60' :
                          task.priority === 'medium' ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {task.priority}
                        </span>

                        {/* CLICKABLE Time slot button */}
                        {task.startTime ? (
                          <button
                            onClick={() => handleOpenTimeModal(task)}
                            title="Click to adjust time slot or schedule"
                            className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 px-2.5 py-1 rounded-lg border border-indigo-700/50 hover:border-indigo-400 transition shadow-sm cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{task.startTime}{task.endTime ? ` - ${task.endTime}` : ''}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenTimeModal(task)}
                            title="Click to assign a time slot to this task"
                            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-indigo-300 bg-slate-800/60 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60 hover:border-indigo-600/60 transition cursor-pointer"
                          >
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>+ Set Time</span>
                          </button>
                        )}

                        {/* CLICKABLE Alarm toggle button */}
                        <button
                          onClick={() => handleToggleAlarm(task)}
                          title={task.alarmEnabled ? "Alarm active! Click to turn off" : "Click to activate 15m & 5m alarms"}
                          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                            task.alarmEnabled 
                              ? 'bg-amber-950/80 text-amber-300 border-amber-600/80 shadow-sm shadow-amber-900/40 hover:bg-amber-900' 
                              : 'bg-slate-800/60 text-slate-400 hover:text-amber-300 border-slate-700 hover:border-amber-600/50'
                          }`}
                        >
                          {task.alarmEnabled ? (
                            <>
                              <BellRing className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              <span>Alarm ON</span>
                            </>
                          ) : (
                            <>
                              <Bell className="w-3.5 h-3.5 text-slate-400" />
                              <span>Set Alarm</span>
                            </>
                          )}
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {StorageService.sanitizeTaskText(task.description)}
                        </p>
                      )}

                      {/* Small Clickable Media Attachment Badges */}
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                          {task.attachments.map((att) => {
                            const isImg = att.type?.startsWith('image/');
                            const isVid = att.type?.startsWith('video/');
                            return (
                              <div
                                key={att.id}
                                onClick={() => setViewingTaskAttachment(att)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/80 cursor-pointer transition text-xs shadow-sm group"
                                title={`Click to view in popup: ${att.name}`}
                              >
                                {isImg && att.dataUrl ? (
                                  <img src={att.dataUrl} alt={att.name} className="w-4 h-4 rounded object-cover" />
                                ) : isVid ? (
                                  <Play className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                                ) : (
                                  <FileText className="w-3 h-3 text-indigo-400" />
                                )}
                                <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[140px] group-hover:text-white">
                                  {att.name}
                                </span>
                                {att.driveId && (
                                  <Cloud className="w-2.5 h-2.5 text-emerald-400" title="Synced with Google Drive" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Subtasks summary */}
                      {task.subtasks.length > 0 && (
                        <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                          <span>
                            {task.subtasks.filter(s => s.completed).length} of {task.subtasks.length} subtasks
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Toggle Subtasks"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks Expansion Panel */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 pl-8">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Checklist Items</span>
                    {task.subtasks.map(sub => (
                      <div key={sub.id} className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => handleToggleSubtask(task, sub.id)}
                          className="text-slate-400 hover:text-indigo-400"
                        >
                          {sub.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <span className={sub.completed ? 'line-through text-slate-500' : 'text-slate-300'}>
                          {sub.title}
                        </span>
                      </div>
                    ))}

                    {/* Add Subtask input & Attach File Action */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <input
                        type="text"
                        placeholder="Add subtask..."
                        value={newSubtaskTitle}
                        onChange={e => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubtask(task);
                          }
                        }}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none flex-1 min-w-[140px]"
                      />
                      <button
                        onClick={() => handleAddSubtask(task)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg transition"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerAttachFileToTask(task.id)}
                        className="px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-xs text-indigo-300 rounded-lg transition flex items-center gap-1 font-semibold"
                        title="Attach a document, image, or media to this task"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>+ Attach File</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* TIME SLOT & ALARM EDITOR MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Adjust Time Slot & Alarms</h3>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-medium mb-4 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60 truncate">
              Task: <span className="text-white font-bold">{editingTask.title}</span>
            </p>

            <form onSubmit={handleSaveTimeModal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={modalStartTime}
                    onChange={e => setModalStartTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={modalEndTime}
                    onChange={e => setModalEndTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Alarm Checkbox and Test Sound */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
                  <input
                    type="checkbox"
                    checked={modalAlarmEnabled}
                    onChange={e => setModalAlarmEnabled(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0 bg-slate-800 border-slate-700"
                  />
                  <span>Enable 15m & 5m prior alarms</span>
                </label>

                <button
                  type="button"
                  onClick={() => AlarmService.playAlarmSound('gentle')}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-1 rounded-lg bg-amber-950/60 border border-amber-800/60 transition"
                  title="Test chime audio in browser"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Test Audio</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden File Input for Task Attachments */}
      <input
        ref={taskFileInputRef}
        type="file"
        className="hidden"
        onChange={handleTaskFileSelected}
      />

      {/* Media Viewer Modal for Task Attachments */}
      <DriveMediaViewerModal
        isOpen={!!viewingTaskAttachment}
        attachment={viewingTaskAttachment}
        onClose={() => setViewingTaskAttachment(null)}
        date={currentDate}
      />
    </div>
  );
};
