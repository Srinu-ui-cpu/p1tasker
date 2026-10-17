import React from 'react';
import { BellRing, Clock, X, CheckCircle2 } from 'lucide-react';
import { ActiveAlarmTrigger } from '../services/alarmService';

interface AlarmAlertModalProps {
  alarm: ActiveAlarmTrigger | null;
  onDismiss: () => void;
  onSnooze: () => void;
}

export const AlarmAlertModal: React.FC<AlarmAlertModalProps> = ({
  alarm,
  onDismiss,
  onSnooze,
}) => {
  if (!alarm) return null;

  const isUrgent = alarm.type === '5m' || alarm.type === 'exact';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
      <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
        isUrgent 
          ? 'bg-rose-950/90 border-rose-600 text-rose-100 ring-4 ring-rose-500/20' 
          : 'bg-slate-900 border-indigo-500 text-slate-100 ring-4 ring-indigo-500/20'
      }`}>
        
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center animate-bounce ${
            isUrgent ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'
          }`}>
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-extrabold opacity-80 block">
              {isUrgent ? '🚨 URGENT ALARM (5 MINUTES)' : '🔔 UPCOMING REMINDER (15 MINUTES)'}
            </span>
            <h3 className="text-lg font-bold text-white">{alarm.task.title}</h3>
          </div>
        </div>

        <p className="text-xs opacity-90 leading-relaxed mb-6 bg-slate-950/40 p-3 rounded-2xl border border-white/10">
          {alarm.message}
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={onSnooze}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Snooze (5 Min)
          </button>

          <button
            onClick={onDismiss}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-lg ${
              isUrgent ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
            }`}
          >
            Acknowledge / Dismiss
          </button>
        </div>

      </div>
    </div>
  );
};
