import React from 'react';
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const PrivacyPolicyView: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-12 max-w-4xl mx-auto font-sans">
      <div className="mb-8">
        <a 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tasker
        </a>
      </div>

      <div className="space-y-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Privacy Policy</h1>
            <p className="text-xs text-slate-400 mt-1">Last Updated: October 2026</p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200">1. Overview</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Tasker OS ("we", "our", or "the application") is committed to protecting your privacy. This Privacy Policy explains how our application accesses, collects, uses, and safeguards information when you use our productivity platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200">2. Google API Data & Permissions</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Tasker OS integrates with Google APIs using the Google OAuth 2.0 protocol. We request the following minimal scopes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 ml-2">
            <li>
              <strong>Profile & Email (`openid`, `profile`, `email`)</strong>: Used solely to identify your account session and display your avatar/email.
            </li>
            <li>
              <strong>Google Drive File Scope (`https://www.googleapis.com/auth/drive.file`)</strong>: Used exclusively to create and manage the application's private storage folder (<code>📁 Tasker App Data</code>) in your personal Google Drive. We only read, write, and delete files created specifically by Tasker OS (such as your tasks, diary entries, and backups). We cannot and do not access any of your other private Google Drive files.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200">3. Data Sharing & Third-Party Disclosure</h2>
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-sm text-emerald-200 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">No Sale or Sharing of Personal Data</span>
              Tasker OS does NOT sell, rent, trade, or transfer your personal data or Google account information to any third parties or advertising networks. All data belongs 100% to you and stays stored directly in your personal Google Drive and local device storage.
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200">4. Local AI & Air-Gapped Privacy</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            When you use the Local AI feature, neural tensor calculations execute 100% on-device utilizing WebGPU. No diary text, prompts, or personal memories are transmitted to external AI servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200">5. Data Retention & Deletion</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            You retain full control over your data. You may delete any tasks, media files, or your entire cloud vault at any time directly through the application settings or by deleting the <code>📁 Tasker App Data</code> folder in your Google Drive.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200">6. Contact Information</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            If you have questions regarding this Privacy Policy or your data, please contact the developer at: <a href="mailto:smnsreddy01@gmail.com" className="text-indigo-400 underline font-semibold">smnsreddy01@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
};
