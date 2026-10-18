import React, { useState } from 'react';
import { 
  CheckSquare, 
  Cloud, 
  Sparkles, 
  Calendar, 
  Lock, 
  ShieldCheck, 
  Bell, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
  FolderHeart,
  Brain,
  Layers,
  ChevronRight,
  ExternalLink,
  Shield,
  Clock,
  Image as ImageIcon,
  Key,
  HardDrive,
  Users,
  Check
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  const [activeFeatureTab, setActiveFeatureTab] = useState<'drive' | 'calendar' | 'ai' | 'diary'>('drive');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      
      {/* Background Radial Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[1100px] h-[550px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[35%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[65%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Modern Sticky Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">Tasker</span>
              <span className="text-[11px] uppercase tracking-wider text-indigo-400 font-bold ml-1.5 px-2 py-0.5 bg-indigo-950/90 rounded border border-indigo-800/60">
                OS
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a href="#overview" className="hover:text-white transition">Overview</a>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#comparison" className="hover:text-white transition">Why Tasker</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={onSignIn}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-900 rounded-xl transition"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section id="overview" className="relative pt-16 sm:pt-24 pb-16 sm:pb-24 px-4 sm:px-8 max-w-6xl mx-auto text-center flex flex-col items-center">
        
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-lg shadow-indigo-500/10 mb-6">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>The Autonomous Productivity OS & Personal Cloud Vault</span>
        </div>

        {/* Big Impact Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl leading-[1.12]">
          Organize Your Life. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Store In Your Own Google Drive.
          </span>
        </h1>

        {/* Clear, Engaging Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl leading-relaxed">
          Tasker OS combines interactive calendar scheduling, smart task management, encrypted journaling, 
          and AI intelligence into one cohesive workstation. All your data is saved straight into 
          your personal Google Drive — <strong>never stored on third-party servers</strong>.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto flex-1 py-4 px-8 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] text-white font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 border border-indigo-400/30 flex items-center justify-center gap-3 transition group"
          >
            <span>Launch Tasker OS</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onSignIn}
            className="w-full sm:w-auto py-4 px-6 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-sm font-semibold rounded-2xl border border-slate-800 transition flex items-center justify-center gap-2"
          >
            <span>Sign In to Vault</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>100% Free to Use</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Personal Google Drive Storage</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero Third-Party Tracking</span>
          </div>
        </div>

      </section>

      {/* INTERACTIVE FEATURE SHOWCASE WITH TABS */}
      <section className="px-4 sm:px-8 max-w-6xl mx-auto pb-24 w-full">
        
        {/* Interactive Tab Switcher */}
        <div className="p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 max-w-2xl mx-auto flex items-center gap-1 mb-8 shadow-xl">
          <button
            onClick={() => setActiveFeatureTab('drive')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeFeatureTab === 'drive'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span>Drive Vault</span>
          </button>

          <button
            onClick={() => setActiveFeatureTab('calendar')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeFeatureTab === 'calendar'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-300" />
            <span>Calendar</span>
          </button>

          <button
            onClick={() => setActiveFeatureTab('ai')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeFeatureTab === 'ai'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-4 h-4 text-purple-300" />
            <span>AI Brain</span>
          </button>

          <button
            onClick={() => setActiveFeatureTab('diary')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeFeatureTab === 'diary'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-pink-300" />
            <span>Diary</span>
          </button>
        </div>

        {/* Feature Interactive Card Content */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          
          {activeFeatureTab === 'drive' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-4 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Personal Google Drive Cloud Vault</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Your Data Stays With You. In Your Drive.
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Unlike conventional productivity apps that keep your files on their servers, Tasker OS writes directly to a visible folder in your personal Google Drive called:
                </p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-emerald-400 text-xs flex items-center justify-between">
                  <span>📁 Google Drive &gt; Tasker App Data</span>
                  <span className="text-slate-500 text-[10px]">Auto-Synced</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Never pay subscription storage fees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Access tasks and backup files in standard, human-readable JSON</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Complete privacy: No tracking, no ads, no telemetry</span>
                  </li>
                </ul>
              </div>

              {/* Visual Diagram Box */}
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    <span>Cloud Sync Architecture</span>
                  </span>
                  <span className="text-emerald-400 font-mono">Live Sync</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                      <span className="text-slate-200 font-mono">tasks-sync.json</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">Synced</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-pink-400" />
                      <span className="text-slate-200 font-mono">diary-entries.json</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">Synced</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      <span className="text-slate-200 font-mono">attachments/</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Deduplicated</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'calendar' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-4 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-xs font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Interactive Calendar & Day Workspace</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Effortless Time-Blocking & Daily Focus
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Start every morning with clarity. Tasker OS presents your month, week, and day at a glance. Click any date on the calendar to open that day's dedicated task board and schedule.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Quick day-stepper to review past notes or plan future sprints</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Category tags, priorities, checklist subtasks, and progress indicators</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Instant full-text global search across all dates</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white block">Day Planner Preview</span>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Sprint Alignment & Standup</span>
                      <span className="text-[10px] text-indigo-300">High Priority &bull; Work</span>
                    </div>
                    <span className="text-[11px] font-mono text-indigo-400">09:30 AM</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-200 block">Deep Work Session: Architecture</span>
                      <span className="text-[10px] text-slate-400">Focus Block</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">02:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'ai' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-4 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800 text-purple-300 text-xs font-semibold">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Omni-AI Second Brain</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Multi-Model Intelligence On Demand
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Connect leading language models including Google Gemini, Groq (Llama 3), xAI Grok 2, and OpenAI. Analyze long notes, draft agendas, and summarize your daily progress with zero friction.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Dynamic model scanner that automatically finds active models</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Built-in semantic question analysis & proofreading engine</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Encrypted AI keys stored directly in your Google Drive</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white">Omni-AI Assistant</span>
                  <span className="text-[10px] bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded font-mono">Gemini 1.5 Flash</span>
                </div>
                <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl text-xs space-y-2">
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    "I analyzed your tasks for today. You have 3 critical deadlines before 3 PM. Would you like me to reschedule non-urgent tasks to tomorrow?"
                  </p>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-purple-900/60 rounded text-[10px] text-purple-300 font-medium">Auto-Optimize</span>
                    <span className="px-2 py-0.5 bg-purple-900/60 rounded text-[10px] text-purple-300 font-medium">Generate Summary</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'diary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in">
              <div className="space-y-4 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-950/80 border border-pink-800 text-pink-300 text-xs font-semibold">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Encrypted Daily Journal</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Private Journaling with Media Uploads
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Capture your thoughts, ideas, and memories. Features a clean rich text editor with lightweight client-side photo compression and SHA-256 deduplication to prevent bloated backups.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />
                    <span>Client-side canvas image thumbnail compression</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />
                    <span>Automatic SHA-256 deduplication saves Google Drive storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />
                    <span>AES-256-GCM encryption for complete confidentiality</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white block">Journal Entry Preview</span>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>Today &bull; 08:45 PM</span>
                    <span className="text-pink-400">Reflective</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed italic">
                    "Shipped the new architecture milestone today. The team alignment felt natural and the focus time block really helped clear distractions..."
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </section>

      {/* WHY TASKER OS COMPARISON SECTION */}
      <section id="comparison" className="py-20 px-4 sm:px-8 bg-slate-900/40 border-y border-slate-800/80 w-full">
        <div className="max-w-5xl mx-auto space-y-12 text-center">
          
          <div>
            <h2 className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-2">The Difference</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">Why Productive Minds Choose Tasker OS</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            
            {/* Traditional Apps */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block">
                Traditional Productivity SaaS
              </span>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold text-base leading-none">✕</span>
                  <span>Your notes and tasks sit on their closed servers</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold text-base leading-none">✕</span>
                  <span>High monthly subscriptions for storage you already have</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold text-base leading-none">✕</span>
                  <span>Proprietary database formats make export painful</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold text-base leading-none">✕</span>
                  <span>Data tracking, tracking cookies, and user analytics</span>
                </li>
              </ul>
            </div>

            {/* Tasker OS */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-indigo-950/40 to-slate-950 border border-indigo-600/50 space-y-4 shadow-xl shadow-indigo-600/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
                  Tasker OS Experience
                </span>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 text-[10px] font-bold rounded border border-emerald-800">
                  Recommended
                </span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Stored 100% in your personal Google Drive (`📁 Tasker App Data`)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Free forever using your existing Google Cloud storage</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Standard open JSON formats & instant AES-256 backup downloads</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Complete privacy: Zero tracking, zero telemetry, client-side only</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* HOW IT WORKS 3-STEP FLOW */}
      <section id="how-it-works" className="py-20 px-4 sm:px-8 max-w-5xl mx-auto w-full text-center space-y-12">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-2">Simple Setup</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">Up and Running in 30 Seconds</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
              1
            </div>
            <h4 className="font-bold text-base text-white">Sign In with Google</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use your regular Google or Gmail account. One click verifies your identity without messy passwords.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
              2
            </div>
            <h4 className="font-bold text-base text-white">Connect Your Cloud Vault</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tasker OS creates a dedicated <code>Tasker App Data</code> folder in your Drive to sync notes, tasks, and media.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
              3
            </div>
            <h4 className="font-bold text-base text-white">Achieve Peak Focus</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plan your day, write your reflections, schedule alarms, and leverage AI models to elevate your productivity.
            </p>
          </div>

        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="py-20 px-4 sm:px-8 max-w-4xl mx-auto text-center w-full">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-900/70 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Take Control of Your Daily Life?
          </h3>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Experience the peace of mind of owning your data on Google Drive with a world-class productivity operating system.
          </p>

          <div className="flex flex-col items-center pt-2">
            <button
              onClick={onGetStarted}
              className="py-4 px-9 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base rounded-2xl shadow-xl shadow-indigo-600/40 transition flex items-center gap-3 group"
            >
              <span>Get Started with Google</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-[11px] text-slate-500 mt-3 font-medium">
              Free • Private • No Credit Card Required
            </span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-8 px-4 sm:px-8 border-t border-slate-900 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">T</div>
            <span className="font-bold text-slate-300">Tasker OS</span>
            <span>&bull;</span>
            <span>Autonomous Daily Productivity & Personal Google Drive Vault</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="/privacy" target="_blank" rel="noreferrer" className="hover:text-slate-300 underline">Privacy Policy</a>
            <a href="/terms" target="_blank" rel="noreferrer" className="hover:text-slate-300 underline">Terms of Service</a>
            <a href="https://github.com/Srinu-ui-cpu/p1tasker" target="_blank" rel="noreferrer" className="hover:text-slate-300 underline flex items-center gap-1">
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};
