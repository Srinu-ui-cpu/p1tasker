import React, { useState } from 'react';
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { ChevronLeft, ChevronRight, BookOpen, Clock, Calendar as CalendarIcon, CheckSquare } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface CalendarViewProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  onOpenDayWorkspace: (date: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onSelectDate,
  onOpenDayWorkspace,
}) => {
  const [currentMonth, setCurrentMonth] = useState(parseISO(selectedDate));

  const tasks = StorageService.getTasks();
  const diary = StorageService.getDiaryEntries();

  // Navigation
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onSelectDate(format(today, 'yyyy-MM-dd'));
  };

  // Month interval calculation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 max-w-5xl mx-auto">
      
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-400" />
            <span>{format(currentMonth, 'MMMM yyyy')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Click any date to open its task workspace and daily diary.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/60">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekHeaders.map(day => (
          <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = dateStr === selectedDate;
          const isCurrentMonthDay = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          const dayTasks = tasks.filter(t => t.date === dateStr);
          const hasDiary = !!diary[dateStr] && diary[dateStr].content.trim().length > 0;
          const hasUrgent = dayTasks.some(t => t.priority === 'urgent' || t.priority === 'high');
          const completedCount = dayTasks.filter(t => t.status === 'completed').length;

          return (
            <div
              key={dateStr}
              onClick={() => {
                onSelectDate(dateStr);
                onOpenDayWorkspace(dateStr);
              }}
              className={`min-h-[96px] p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between group relative ${
                isSelected 
                  ? 'border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-500/10' 
                  : isCurrentMonthDay
                  ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 hover:border-slate-700'
                  : 'border-slate-900/40 bg-slate-950/40 opacity-40 hover:opacity-80'
              }`}
            >
              {/* Day Number and Badges */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                  isToday 
                    ? 'bg-indigo-600 text-white font-extrabold shadow' 
                    : isSelected 
                    ? 'text-indigo-400' 
                    : 'text-slate-300'
                }`}>
                  {format(day, 'd')}
                </span>

                <div className="flex items-center gap-1">
                  {/* Diary Bookmark indicator */}
                  {hasDiary && (
                    <span title="Diary entry recorded" className="text-purple-400 bg-purple-950/80 p-0.5 rounded border border-purple-800/60">
                      <BookOpen className="w-3 h-3" />
                    </span>
                  )}
                  {/* Urgent task dot */}
                  {hasUrgent && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-500/20 animate-pulse" title="High / Urgent task" />
                  )}
                </div>
              </div>

              {/* Day Tasks Summary */}
              <div className="mt-1 space-y-1">
                {dayTasks.slice(0, 2).map(task => (
                  <div
                    key={task.id}
                    className={`text-[10px] truncate px-1.5 py-0.5 rounded border font-medium ${
                      task.status === 'completed'
                        ? 'bg-slate-800/60 text-slate-500 border-slate-700/40 line-through'
                        : task.priority === 'urgent'
                        ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                        : task.priority === 'high'
                        ? 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                        : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40'
                    }`}
                  >
                    {task.startTime ? `${task.startTime} ` : ''}{task.title}
                  </div>
                ))}

                {dayTasks.length > 2 && (
                  <span className="text-[10px] text-slate-500 block px-1">
                    +{dayTasks.length - 2} more tasks
                  </span>
                )}
              </div>

              {/* Bottom Quick Indicator */}
              {dayTasks.length > 0 && (
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-2.5 h-2.5 text-indigo-400" />
                    <span>{completedCount}/{dayTasks.length}</span>
                  </span>
                  {hasDiary && (
                    <span className="text-purple-400 text-[9px] font-semibold">Diary</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Urgent / High Priority</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="p-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800/60">
              <BookOpen className="w-3 h-3" />
            </span>
            <span>Diary Entry Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span>Today</span>
          </div>
        </div>
        <span className="text-slate-500">Double click any day to open Tasker workspace</span>
      </div>

    </div>
  );
};
