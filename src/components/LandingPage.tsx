import React from 'react';
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
  ExternalLink
} from 'lucide-react';
import { CartoonGirlClicker } from './CartoonGirlClicker';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      
      {/* Background Radial Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[70%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Modern Sticky Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
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

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#drive-vault" className="hover:text-white transition">Google Drive Vault</a>
            <a href="#ai-brain" className="hover:text-white transition">AI Second Brain</a>
            <a href="#security" className="hover:text-white transition">Security & Privacy</a>
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
              className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
        
        {/* Top Floating Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-lg shadow-indigo-500/10 mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>New: Universal Firebase Google Sign-In & Direct Drive Vault</span>
        </div>

        {/* Big Bold Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.12]">
          Master Your Time. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Own Your Data.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
          The autonomous productivity operating system for your tasks, daily schedule, thoughts, and diary. 
          Synchronized directly to your <strong>personal Google Drive</strong> with zero third-party storage.
        </p>

        {/* THE CARTOON GIRL & "GET STARTED" INTERACTION */}
        <div className="mt-4 sm:mt-6">
          <CartoonGirlClicker 
            onClick={onGetStarted}
            buttonText="Get Started with Google"
            subText="Instant 1-click Google Sign-In • Automatic Google Drive Sync • 100% Free"
          />
        </div>

        {/* Trust & Spec Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Personal Google Drive Vault</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero Third-Party Data Tracking</span>
          </div>
        </div>

      </section>

      {/* LIVE INTERACTIVE PRODUCT MOCKUP PREVIEW */}
      <section className="px-4 sm:px-8 max-w-6xl mx-auto -mt-4 pb-20 w-full">
        <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 p-2 sm:p-4 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
          {/* Top Mockup Window Header */}
          <div className="flex items-center justify-between pb-3 px-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-xs font-mono text-slate-400">tasker-os.cloud // live-workspace</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60 font-semibold">
              <Cloud className="w-3.5 h-3.5" />
              <span>Google Drive Connected</span>
            </div>
          </div>

          {/* Mockup Dashboard Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
            
            {/* Column 1: Calendar & Timeline */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Interactive Day Planner</span>
                </span>
                <span className="text-[10px] text-slate-400">Today</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-800/50 flex items-center justify-between">
                  <span className="font-medium text-indigo-200">Deep Work: Architecture Design</span>
                  <span className="text-[10px] text-indigo-400 font-mono">09:00 AM</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
                  <span>Sprint Alignment & Roadmap</span>
                  <span className="text-[10px] text-slate-400 font-mono">02:00 PM</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
                  <span>Evening Journal & Reflection</span>
                  <span className="text-[10px] text-slate-400 font-mono">07:30 PM</span>
                </div>
              </div>
            </div>

            {/* Column 2: Personal Google Drive Vault */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <FolderHeart className="w-4 h-4 text-emerald-400" />
                  <span>Google Drive Vault</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">📁 /Tasker App Data</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-200 font-medium">tasks-sync.json</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Auto-saved</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-slate-200 font-medium">diary-entries.json</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Encrypted</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-slate-200 font-medium">backup-vault.tasker</span>
                  </div>
                  <span className="text-[10px] text-emerald-400">Verified</span>
                </div>
              </div>
            </div>

            {/* Column 3: Omni-AI Second Brain */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span>Omni-AI Second Brain</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  Gemini &bull; Groq &bull; Grok
                </span>
              </div>
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs space-y-1.5">
                <span className="text-slate-400 text-[10px] block">AI Copilot Analysis:</span>
                <p className="text-purple-200 leading-relaxed text-[11px]">
                  "You have 3 high-impact tasks scheduled today. Would you like me to outline subtasks for the architecture review?"
                </p>
                <div className="flex gap-2 pt-1">
                  <span className="px-2 py-0.5 bg-purple-900/60 rounded text-[10px] text-purple-300 font-medium">Auto-prioritize</span>
                  <span className="px-2 py-0.5 bg-purple-900/60 rounded text-[10px] text-purple-300 font-medium">Summarize day</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-2">Engineered For Focus</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">Everything You Need In One Cohesive OS</h3>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Replace dozens of disconnected apps with a single, ultra-fast workspace tailored to your personal life and career.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div id="drive-vault" className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center">
              <Cloud className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Personal Google Drive Cloud Vault</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Your tasks, journals, and files are saved directly into a clean <code>Tasker App Data</code> folder in your own Google Drive. No mystery servers, no monthly storage upsells.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Full user data sovereignty</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Interactive Calendar & Workspace</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Plan by month, week, or day. Click any date to immediately launch into that day's dedicated task management, time block scheduler, and notes.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-indigo-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Instant date switching & time blocking</span>
            </div>
          </div>

          {/* Card 3 */}
          <div id="ai-brain" className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/80 text-purple-400 border border-purple-800/60 flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Omni-AI Second Brain</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Supercharged with Gemini, Groq, xAI Grok 2, and OpenAI. Analyze lengthy texts, proofread notes, and summarize your daily schedule with a single prompt.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-purple-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Multi-provider routing & live scanning</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-950/80 text-pink-400 border border-pink-800/60 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Encrypted Diary & Media Attachments</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Capture your deepest reflections with rich text editing. Attach photos with client-side canvas compression and SHA-256 deduplication for lightweight syncing.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-pink-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Smart compression & zero duplicate files</span>
            </div>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 text-amber-400 border border-amber-800/60 flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Proactive Alarms & Audio Alerts</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Never miss a critical milestone. Built-in background alarm loop with audio chimes and interactive alert dialogs to keep you punctually on track.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Audible alarms with repeat schedules</span>
            </div>
          </div>

          {/* Card 6 */}
          <div id="security" className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">AES-256 Client-Side Encryption</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Export password-protected encrypted `.taskerbackup` vaults. Migrate across devices seamlessly without exposing your unencrypted data to anyone.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Military-grade AES-GCM vault security</span>
            </div>
          </div>

        </div>

      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-slate-900/40 border-y border-slate-800/80 w-full">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          
          <div>
            <h2 className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-2">Seamless 3-Step Setup</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Get Started in Under 30 Seconds</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 relative">
              <span className="text-4xl font-extrabold text-indigo-500/30 absolute top-4 right-4">01</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm mb-4">1</div>
              <h4 className="font-bold text-base text-white mb-2">Click "Get Started"</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose either Sign In or Create Account. We use official Firebase Google Authentication for seamless identity verification.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 relative">
              <span className="text-4xl font-extrabold text-indigo-500/30 absolute top-4 right-4">02</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm mb-4">2</div>
              <h4 className="font-bold text-base text-white mb-2">Grant Drive Access</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                In a single screen, Google will ask permission to create and sync your private <code>Tasker App Data</code> vault.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 relative">
              <span className="text-4xl font-extrabold text-indigo-500/30 absolute top-4 right-4">03</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm mb-4">3</div>
              <h4 className="font-bold text-base text-white mb-2">Elevate Your Day</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instantly jump into your interactive calendar, set reminders, write notes, and leverage AI to conquer your goals.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* BOTTOM CTA BANNER WITH CARTOON GIRL */}
      <section className="py-20 px-4 sm:px-8 max-w-4xl mx-auto text-center w-full">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-900/60 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          <h3 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">
            Ready to Take Control of Your Productivity?
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto mb-6">
            Join thousands of productive thinkers who own their data on Google Drive without compromise.
          </p>

          <div className="flex flex-col items-center">
            <button
              onClick={onGetStarted}
              className="py-4 px-8 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-base rounded-2xl shadow-xl shadow-indigo-600/40 transition flex items-center gap-3 group"
            >
              <span>Continue with Google</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
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
            <span>Personal Google Drive Cloud Vault</span>
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
