import React from 'react';
import { FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const TermsOfServiceView: React.FC = () => {
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
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Terms of Service</h1>
            <p className="text-xs text-slate-400 mt-1">Last Updated: October 2026</p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200">1. Acceptance of Terms</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            By accessing or using Tasker OS, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200">2. Description of Service</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Tasker OS provides autonomous day planning, scheduling, diary reflections, and personal cloud synchronization using Google Drive. The application runs primarily on client-side technology.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200">3. User Responsibility & Google Account</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            You are responsible for maintaining the confidentiality of your Google account credentials and for all activities that occur under your account. You agree not to misuse Google API access or attempt unauthorized actions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200">4. Intellectual Property</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            All content, journal entries, tasks, and data created by you within Tasker OS remain your exclusive property.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200">5. Limitation of Liability</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The service is provided "as is" and "as available" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages resulting from the use of the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-200">6. Contact</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            For any inquiries, contact the developer at: <a href="mailto:smnsreddy01@gmail.com" className="text-indigo-400 underline font-semibold">smnsreddy01@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
};
