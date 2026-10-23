import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, Plus, Bell, BellRing, CheckCircle2, AlertCircle, Calendar, Volume2, Trash2 } from 'lucide-react';
import { TaskItem, Priority } from '../types';
import { StorageService } from '../services/storageService';
import { AlarmService } from '../services/alarmService';

interface TeamsScheduleGridProps {
  currentDate: string; // YYYY-MM-DD
  tasks: TaskItem[];
  onTasksUpdated: () => void;
  onOpenDiary: () => void;
}

export const TeamsScheduleGrid: React.FC<TeamsScheduleGridProps> = ({
  currentDate,
  tasks,
  onTasksUpdated,
  onOpenDiary,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState<Priority>('high');
  const [alarmEnabled, setAlarmEnabled] = useState(true);

  // Time slots from 08:00 to 20:00
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

  const handleOpenCreateModal = (slotStart: string, slotEnd: string) => {
    setEditingTaskId(null);
    setNewTitle('');
    setNewDescription('');
    setStartTime(slotStart);
    setEndTime(slotEnd);
    setPriority('high');
    setAlarmEnabled(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setNewTitle(task.title);
    setNewDescription(task.description || '');
    setStartTime(task.startTime || '09:00');
    setEndTime(task.endTime || '10:00');
    setPriority(task.priority);
    setAlarmEnabled(task.alarmEnabled);
    setIsModalOpen(true);
  };

  const handleScheduleTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (editingTaskId) {
      const existing = tasks.find(t => t.id === editingTaskId);
      if (existing) {
        const updated: TaskItem = {
          ...existing,
          title: newTitle.trim(),
          description: newDescription.trim(),
          startTime,
          endTime,
          priority,
          alarmEnabled,
          notified15m: false,
          notified5m: false,
          updatedAt: new Date().toISOString(),
        };
        StorageService.saveTask(updated);
      }
    } else {
      const newTask: TaskItem = {
        id: `task-${Date.now()}`,
        title: newTitle.trim(),
        description: newDescription.trim(),
        date: currentDate,
        startTime,
        endTime,
        priority,
        status: 'todo',
        tags: ['scheduled'],
        subtasks: [],
        alarmEnabled,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      StorageService.saveTask(newTask);
    }

    if (alarmEnabled) {
      AlarmService.playAlarmSound('gentle');
      await AlarmService.requestNotificationPermission();
    }

    onTasksUpdated();
    setIsModalOpen(false);
    setEditingTaskId(null);
  };

  const handleToggleAlarm = async (task: TaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !task.alarmEnabled;
    const updated: TaskItem = {
      ...task,
      alarmEnabled: nextState,
      notified15m: false,
      notified5m: false,
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveTask(updated);
    onTasksUpdated();

    if (nextState) {
      AlarmService.playAlarmSound('gentle');
      await AlarmService.requestNotificationPermission();
    }
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.deleteTask(taskId);
    onTasksUpdated();
  };

  const handleTriggerTestAlarm = () => {
    AlarmService.triggerTestAlarm('Scheduler Alarm Test');
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'urgent': return 'bg-rose-950/80 border-rose-600 text-rose-200 hover:border-rose-400';
      case 'high': return 'bg-amber-950/80 border-amber-600 text-amber-200 hover:border-amber-400';
      case 'medium': return 'bg-indigo-950/80 border-indigo-600 text-indigo-200 hover:border-indigo-400';
      case 'low': return 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-2.5 sm:p-4 md:p-6 max-w-5xl mx-auto transition-colors duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60 shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">Teams Schedule Planner</h2>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
            Visual day timeline for <span className="font-semibold text-slate-200">{format(parseISO(currentDate), 'EEEE, MMMM d')}</span> with 15m & 5m prior alarms.
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={handleTriggerTestAlarm}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 rounded-xl text-xs font-bold transition shadow-sm"
            title="Immediately trigger test chime and takeover alert"
          >
            <BellRing className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="hidden xs:inline">Test Alarm</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal('09:00', '10:00')}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Schedule Slot</span>
          </button>

          <button
            onClick={onOpenDiary}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800/60 rounded-xl text-xs font-semibold transition"
          >
            <span>📔 Diary</span>
          </button>
        </div>
      </div>

      {/* Grid Timeline */}
      <div className="relative border-l border-slate-800 ml-12 sm:ml-16 space-y-3 sm:space-y-4 py-2">
        {hours.map(hour => {
          const timeString = `${hour.toString().padStart(2, '0')}:00`;
          const nextTimeString = `${(hour + 1).toString().padStart(2, '0')}:00`;
          const displayLabel = format(new Date().setHours(hour, 0), 'hh:mm a');

          // Find tasks that start in this hour
          const hourTasks = tasks.filter(t => {
            if (!t.startTime) return false;
            const taskHour = parseInt(t.startTime.split(':')[0], 10);
            return taskHour === hour;
          });

          return (
            <div key={hour} className="relative group min-h-[56px] sm:min-h-[64px] border-b border-slate-800/40 pb-2.5 sm:pb-3">
              {/* Left Hour Label */}
              <div className="absolute -left-12 sm:-left-16 -top-2.5 w-10 sm:w-14 text-right pr-1 sm:pr-2 text-[10px] sm:text-xs font-mono font-medium text-slate-500">
                {displayLabel}
              </div>

              {/* Hour Line Marker */}
              <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-800 border-2 border-slate-900 group-hover:bg-indigo-500 transition" />

              {/* Tasks within this slot */}
              <div className="pl-2 sm:pl-4 space-y-2">
                {hourTasks.length === 0 ? (
                  <div 
                    onClick={() => handleOpenCreateModal(timeString, nextTimeString)}
                    className="text-xs text-slate-600 hover:text-indigo-400 cursor-pointer transition py-1.5 rounded-xl hover:bg-slate-800/40 px-3 border border-transparent hover:border-slate-800 flex items-center justify-between"
                  >
                    <span>+ Free slot at {timeString} (Click to schedule)</span>
                    <span className="text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition">Click to add task</span>
                  </div>
                ) : (
                  <>
                    {hourTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => handleOpenEditModal(task)}
                        title="Click to edit task, time slot, or alarms"
                        className={`p-3 rounded-xl border transition shadow-md flex items-center justify-between flex-wrap gap-2 cursor-pointer ${getPriorityColor(task.priority)}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{task.title}</span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-950/70 text-slate-300 border border-slate-800">
                              {task.startTime} – {task.endTime || 'End'}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-xs text-slate-300/80">{task.description}</p>
                          )}
                        </div>

                        {/* Reminder Badges & Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleToggleAlarm(task, e)}
                            title={task.alarmEnabled ? "Alarm active: Click to turn off" : "Click to enable 15m & 5m alarms"}
                            className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                              task.alarmEnabled 
                                ? 'bg-amber-950/90 text-amber-300 border-amber-600/80 hover:bg-amber-900' 
                                : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-amber-300'
                            }`}
                          >
                            {task.alarmEnabled ? (
                              <>
                                <BellRing className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                <span>15m & 5m Alarms ON</span>
                              </>
                            ) : (
                              <>
                                <Bell className="w-3.5 h-3.5 text-slate-400" />
                                <span>Enable Alarm</span>
                              </>
                            )}
                          </button>

                          <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${
                            task.priority === 'urgent' ? 'border-rose-500 text-rose-300' :
                            task.priority === 'high' ? 'border-amber-500 text-amber-300' : 'border-indigo-500 text-indigo-300'
                          }`}>
                            {task.priority}
                          </span>

                          <button
                            onClick={(e) => handleDeleteTask(task.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
                            title="Delete slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Button to add another task in this same slot */}
                    <button
                      onClick={() => handleOpenCreateModal(timeString, nextTimeString)}
                      className="text-[11px] text-slate-500 hover:text-indigo-400 font-medium py-1 px-2 rounded hover:bg-slate-800/30 transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add another task at {timeString}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>{editingTaskId ? 'Edit Scheduled Task & Alarms' : 'Schedule New Task Slot'}</span>
            </h3>

            <form onSubmit={handleScheduleTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Task / Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Client Review Meeting on Teams"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Agenda, zoom link, or key objectives..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as Priority)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alarmEnabled}
                    onChange={e => setAlarmEnabled(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-slate-200">15m & 5m Alarms Active</span>
                </label>

                <button
                  type="button"
                  onClick={() => AlarmService.playAlarmSound('gentle')}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-1 rounded-lg bg-amber-950/60 border border-amber-800/60 transition"
                  title="Test chime in browser"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Test Sound</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
