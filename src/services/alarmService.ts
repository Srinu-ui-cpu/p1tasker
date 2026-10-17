import { format } from 'date-fns';
import { TaskItem } from '../types';
import { StorageService } from './storageService';

export interface ActiveAlarmTrigger {
  task: TaskItem;
  type: '15m' | '5m' | 'exact';
  message: string;
}

export class AlarmService {
  private static audioCtx: AudioContext | null = null;
  private static checkInterval: number | null = null;
  private static alarmListeners: Array<(trigger: ActiveAlarmTrigger) => void> = [];

  private static getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Synthesize a melodic browser alarm chime using Web Audio API oscillators
   */
  static playAlarmSound(type: 'gentle' | 'urgent' = 'gentle') {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      if (type === 'gentle') {
        // 15m chime: Ascending 3-tone peaceful chime (C5 -> E5 -> G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.18);

          gain.gain.setValueAtTime(0, now + idx * 0.18);
          gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.18 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.7);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.18);
          osc.stop(now + idx * 0.18 + 0.7);
        });
      } else {
        // 5m / Urgent alarm: Dual pulsing warning tones (A5 -> C6 -> A5 -> C6)
        const freqs = [880, 1046.5, 880, 1046.5];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);

          gain.gain.setValueAtTime(0, now + idx * 0.14);
          gain.gain.linearRampToValueAtTime(0.4, now + idx * 0.14 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.35);
        });
      }
    } catch (e) {
      console.warn('AudioContext playback restricted by user gesture or unsupported:', e);
    }
  }

  /**
   * Request OS Web Notifications permission
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Send OS desktop push notification
   */
  static showDesktopNotification(title: string, body: string, tag: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          tag,
          icon: '/favicon.svg',
          requireInteraction: true,
        });
      } catch (e) {
        console.warn('Failed to dispatch notification:', e);
      }
    }
  }

  /**
   * Manually trigger a test alarm immediately so the user can verify sound, modal, and notifications
   */
  static triggerTestAlarm(customTitle?: string) {
    this.playAlarmSound('urgent');
    this.showDesktopNotification(
      `🚨 TEST ALARM: ${customTitle || 'Demonstration Task'}`,
      'Alarm system verified! Web Audio chime and desktop notifications are fully active.',
      `task-test-${Date.now()}`
    );

    const testTask: TaskItem = {
      id: `task-test-${Date.now()}`,
      title: customTitle || 'Alarm System Verification Test',
      description: 'Testing the 5m urgent alarm chime, audio synthesis, and screen takeover alert.',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: format(new Date(), 'HH:mm'),
      priority: 'urgent',
      status: 'in_progress',
      tags: ['alarm-test'],
      subtasks: [],
      alarmEnabled: true,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.alarmListeners.forEach(cb =>
      cb({
        task: testTask,
        type: '5m',
        message: `🚨 Test alarm active! "${testTask.title}" chime audio and notification verified.`,
      })
    );
  }

  /**
   * Subscribe to in-app active alarm triggers
   */
  static onAlarm(callback: (trigger: ActiveAlarmTrigger) => void) {
    this.alarmListeners.push(callback);
    return () => {
      this.alarmListeners = this.alarmListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Start the background scheduler polling loop
   */
  static startScheduler() {
    if (this.checkInterval) return;

    // Check every 15 seconds
    this.checkInterval = window.setInterval(() => {
      this.checkUpcomingAlarms();
    }, 15000);

    // Initial check right away
    this.checkUpcomingAlarms();
  }

  static stopScheduler() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Checks tasks for today and fires 15m and 5m reminders
   */
  static checkUpcomingAlarms() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const tasks = StorageService.getTasksForDate(today);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let hasUpdates = false;

    tasks.forEach(task => {
      if (!task.alarmEnabled || task.status === 'completed' || !task.startTime) {
        return;
      }

      const [taskHours, taskMins] = task.startTime.split(':').map(Number);
      if (isNaN(taskHours) || isNaN(taskMins)) return;
      const taskStartMinutes = taskHours * 60 + taskMins;
      const minutesRemaining = taskStartMinutes - currentMinutes;

      // 15-Minute Warning: window between 6 and 15 minutes prior
      if (minutesRemaining <= 15 && minutesRemaining > 5 && !task.notified15m) {
        task.notified15m = true;
        hasUpdates = true;

        this.playAlarmSound('gentle');
        this.showDesktopNotification(
          `🔔 Starting in 15 Minutes: ${task.title}`,
          `Scheduled for ${task.startTime}. Get ready!`,
          `task-15m-${task.id}`
        );

        this.alarmListeners.forEach(cb =>
          cb({
            task,
            type: '15m',
            message: `"${task.title}" is scheduled to begin in 15 minutes (${task.startTime})!`,
          })
        );
      }

      // 5-Minute Warning: window between -2 and 5 minutes prior
      if (minutesRemaining <= 5 && minutesRemaining >= -2 && !task.notified5m) {
        task.notified5m = true;
        hasUpdates = true;

        this.playAlarmSound('urgent');
        this.showDesktopNotification(
          `🚨 URGENT ALARM: ${task.title} starting now!`,
          `Scheduled for ${task.startTime}. Please prepare to join or start now.`,
          `task-5m-${task.id}`
        );

        this.alarmListeners.forEach(cb =>
          cb({
            task,
            type: '5m',
            message: `"${task.title}" is starting now (${task.startTime})!`,
          })
        );
      }
    });

    if (hasUpdates) {
      // Persist notified flags so alerts don't duplicate
      const allTasks = StorageService.getTasks();
      const updatedMap = new Map(tasks.map(t => [t.id, t]));
      const merged = allTasks.map(t => updatedMap.get(t.id) || t);
      StorageService.saveTasks(merged);
    }
  }
}
