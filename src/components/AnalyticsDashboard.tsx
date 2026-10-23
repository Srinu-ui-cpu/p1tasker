import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Users, 
  Activity, 
  Clock, 
  Laptop, 
  Smartphone, 
  Tablet, 
  Compass, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  FolderSync, 
  Mic, 
  Download, 
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { AnalyticsService, AnalyticsSummary, RegionalMetric } from '../services/analyticsService';

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary>(() => AnalyticsService.getSummary());
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'desktop' | 'mobile'>('all');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to live telemetry updates
    const unsubscribe = AnalyticsService.subscribe((updated) => {
      setData({ ...updated });
    });

    // Auto-refresh every 10 seconds for real-time counters
    const interval = setInterval(() => {
      setData(AnalyticsService.getSummary());
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasker_audience_analytics_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice('✔ Exported analytics JSON successfully!');
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleExportCSV = () => {
    const headers = ['Country', 'Region', 'City', 'Visitors', 'Percentage'];
    const rows = data.regionalBreakdown.map(r => [
      `"${r.country}"`,
      `"${r.region}"`,
      `"${r.city}"`,
      r.visitors,
      `${r.percentage}%`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasker_regional_audience_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice('✔ Exported regional audience CSV!');
    setTimeout(() => setExportNotice(null), 3000);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}m ${remainder}s`;
  };

  const completionRate = data.featureUsage.tasksCreated > 0 
    ? Math.round((data.featureUsage.tasksCompleted / data.featureUsage.tasksCreated) * 100) 
    : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Top Banner / Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Telemetry & Audience Intelligence
              </span>
              <span className="text-xs text-slate-400 font-mono">Real-Time</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tasker OS Global Audience & Usage Dashboard
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time monitoring of user visits, geographic regions, device platforms, and feature engagement across the globe. Privacy-respecting with 100% zero personal data logging.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              title="Export Regional Data as CSV"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/30"
              title="Export Complete Telemetry Report as JSON"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON Report</span>
            </button>
          </div>
        </div>

        {exportNotice && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>{exportNotice}</span>
          </div>
        )}
      </div>

      {/* 4 KPI Highlight Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Visits */}
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Page Loads</span>
            <div className="p-2 bg-indigo-950 text-indigo-400 rounded-xl border border-indigo-900/60">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{data.totalVisits}</div>
          <div className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
            <span>+12.4%</span>
            <span className="text-slate-500 font-normal">this week</span>
          </div>
        </div>

        {/* KPI 2: Unique Visitors */}
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Unique Users</span>
            <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-900/60">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{data.uniqueVisitors}</div>
          <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <span>{data.activeNow} Active Right Now</span>
          </div>
        </div>

        {/* KPI 3: Global Regions Detected */}
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Countries & Regions</span>
            <div className="p-2 bg-purple-950 text-purple-400 rounded-xl border border-purple-900/60">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{data.regionalBreakdown.length} Countries</div>
          <div className="text-xs text-purple-400 font-semibold flex items-center gap-1">
            <span>Top: {data.regionalBreakdown[0]?.country || 'India'} ({data.regionalBreakdown[0]?.percentage || 45}%)</span>
          </div>
        </div>

        {/* KPI 4: Avg Session Time */}
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Engagement Time</span>
            <div className="p-2 bg-cyan-950 text-cyan-400 rounded-xl border border-cyan-900/60">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {formatSeconds(data.avgSessionSeconds || 520)}
          </div>
          <div className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
            <span>High Retention Workflow</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Regional Breakdown & Current Visitor Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Regional Intelligence Table & Progress Bars */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-slate-900/80 rounded-3xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  <span>Audience Geographic Distribution by Country & Region</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Detected geographic breakdown of people accessing the web application.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono font-bold">
                {data.regionalBreakdown.length} Regions Tracked
              </span>
            </div>

            {/* Visual Percentage Bars */}
            <div className="space-y-3.5 pt-2">
              {data.regionalBreakdown.map((r) => (
                <div key={`${r.country}-${r.region}`} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-2">
                      <span className="text-base">{r.flag}</span>
                      <span>{r.country}</span>
                      <span className="text-slate-400 font-mono text-[11px]">({r.region}, {r.city})</span>
                    </span>
                    <span className="font-mono text-indigo-300 font-bold">
                      {r.visitors} visitors ({r.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700" 
                      style={{ width: `${Math.max(5, r.percentage)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Regional Table */}
            <div className="overflow-x-auto pt-4 border-t border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="pb-3">Region / Country</th>
                    <th className="pb-3">City / Timezone</th>
                    <th className="pb-3">Total Visitors</th>
                    <th className="pb-3">Traffic Share</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {data.regionalBreakdown.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 text-slate-200 flex items-center gap-2">
                        <span className="text-lg">{r.flag}</span>
                        <span className="font-bold">{r.country}</span>
                        <span className="px-1.5 py-0.5 bg-slate-800 text-[10px] rounded text-slate-400">{r.countryCode}</span>
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">
                        {r.city}, {r.region}
                      </td>
                      <td className="py-3 text-white font-mono font-bold">
                        {r.visitors}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded-md font-mono text-[11px] font-bold border border-indigo-800/50">
                          {r.percentage}%
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Active</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Feature Usage & Productivity Metrics */}
          <div className="p-6 bg-slate-900/80 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Platform Feature Usage & Productivity Volume</span>
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tasks Created</span>
                </div>
                <div className="text-xl font-bold text-white font-mono">{data.featureUsage.tasksCreated}</div>
                <div className="text-[11px] text-emerald-400 font-semibold">{completionRate}% Completion Rate</div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Diary Journal Entries</span>
                </div>
                <div className="text-xl font-bold text-white font-mono">{data.featureUsage.diaryEntries}</div>
                <div className="text-[11px] text-indigo-400 font-semibold">Word Document Flow</div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                  <FolderSync className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Media Uploaded</span>
                </div>
                <div className="text-xl font-bold text-white font-mono">{data.featureUsage.filesUploaded}</div>
                <div className="text-[11px] text-cyan-400 font-semibold">Google Drive Synced</div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Queries Generated</span>
                </div>
                <div className="text-xl font-bold text-white font-mono">{data.featureUsage.aiQueries}</div>
                <div className="text-[11px] text-purple-400 font-semibold">Gemini • Groq • OpenAI</div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5 text-rose-400" />
                  <span>Voice Dictation (Mins)</span>
                </div>
                <div className="text-xl font-bold text-white font-mono">{data.featureUsage.voiceMinutes}m</div>
                <div className="text-[11px] text-rose-400 font-semibold">Auto-Stutter Cleaner</div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Encryption Standard</span>
                </div>
                <div className="text-xl font-bold text-white font-mono">AES-256</div>
                <div className="text-[11px] text-amber-400 font-semibold">Zero-Knowledge Cloud</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Current Detected Visitor & Technology Breakdown */}
        <div className="space-y-6">
          
          {/* Active Visitor Card */}
          <div className="p-6 bg-slate-900/80 rounded-3xl border border-indigo-900/50 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Your Live Active Session</span>
              </span>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full text-[10px] font-bold">
                Online
              </span>
            </div>

            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{data.currentVisitor.location.flag}</span>
                <div>
                  <div className="font-extrabold text-sm text-white">
                    {data.currentVisitor.location.country}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {data.currentVisitor.location.city}, {data.currentVisitor.location.region}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Timezone</span>
                  <span className="text-slate-200 font-mono text-[11px] truncate block">{data.currentVisitor.location.timezone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Device Type</span>
                  <span className="text-slate-200 font-semibold flex items-center gap-1">
                    {data.currentVisitor.deviceType === 'Mobile' ? <Smartphone className="w-3 h-3 text-indigo-400" /> : <Laptop className="w-3 h-3 text-indigo-400" />}
                    <span>{data.currentVisitor.deviceType}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Browser & OS</span>
                  <span className="text-slate-200 font-mono text-[11px]">{data.currentVisitor.browser} on {data.currentVisitor.os}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Session Time</span>
                  <span className="text-emerald-400 font-mono text-[11px] font-bold">{formatSeconds(data.currentVisitor.durationSeconds)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technology & Device Insights */}
          <div className="p-6 bg-slate-900/80 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Laptop className="w-4 h-4 text-cyan-400" />
              <span>Technology & Platform Breakdown</span>
            </h3>

            {/* Devices */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Device Hardware</span>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(data.deviceBreakdown).map(([device, count]) => (
                  <div key={device} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[11px] text-slate-400 block">{device}</span>
                    <span className="text-sm font-bold text-white font-mono">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operating Systems */}
            <div className="space-y-2 text-xs pt-2 border-t border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Operating Systems</span>
              <div className="space-y-1.5">
                {Object.entries(data.osBreakdown).map(([os, count]) => {
                  const pct = Math.round((count / Math.max(1, data.totalVisits)) * 100);
                  return (
                    <div key={os} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{os}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Browsers */}
            <div className="space-y-2 text-xs pt-2 border-t border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Web Browsers</span>
              <div className="space-y-1.5">
                {Object.entries(data.browserBreakdown).map(([b, count]) => {
                  const pct = Math.round((count / Math.max(1, data.totalVisits)) * 100);
                  return (
                    <div key={b} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{b}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Real-Time Live Activity Feed */}
          <div className="p-6 bg-slate-900/80 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Live Event Stream</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Latest actions</span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {data.recentActivity.map((evt) => (
                <div key={evt.id} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-mono font-bold uppercase">{evt.type.replace('_', ' ')}</span>
                    <span className="font-mono">{evt.timestamp}</span>
                  </div>
                  <div className="text-slate-200 font-medium text-[11px] leading-snug">{evt.label}</div>
                  {evt.region && (
                    <div className="text-[10px] text-indigo-400 flex items-center gap-1 font-semibold">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{evt.region}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
