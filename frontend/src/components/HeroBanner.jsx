import React from 'react';
import { FileUp, Cpu, HelpCircle, ShieldCheck } from 'lucide-react';

export default function HeroBanner({ currentStep }) {
  const steps = [
    { number: 1, title: '1. Upload Report', desc: 'PDF or photo of report', icon: FileUp },
    { number: 2, title: '2. Auto-Extract & Smart MCQs', desc: 'Values read + adaptive questions', icon: HelpCircle },
    { number: 3, title: '3. Clinical Risk Report', desc: 'Traffic light, diet & sleep/walk plan', icon: ShieldCheck }
  ];

  return (
    <div className="bg-gradient-to-b from-teal-900/5 via-slate-50 to-slate-50 border-b border-slate-200/60 pt-8 pb-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-100/80 border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-ping" />
          <span>Clinical Decision Support Engine</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Intelligent Medical Report Analyzer for <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-teal-600 bg-clip-text text-transparent">
            Cardiovascular & Diabetes Risk
          </span>
        </h1>
        
        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Upload any blood test, lipid profile, HbA1c, or ECG summary. CardioDiab automatically extracts clinical values, presents adaptive follow-up questions, and generates a personalized risk report with report-specific dietary guidance.
        </p>

        {/* Step Indicator Flow */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
          {steps.map((st) => {
            const Icon = st.icon;
            const isActive = currentStep === st.number;
            const isCompleted = currentStep > st.number;
            
            return (
              <div
                key={st.number}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'bg-white border-teal-500 shadow-md ring-2 ring-teal-500/20'
                    : isCompleted
                    ? 'bg-teal-50/70 border-teal-200 text-teal-900'
                    : 'bg-white/80 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : isCompleted
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isCompleted ? '✓' : st.number}
                  </div>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : isCompleted ? 'text-teal-700' : 'text-slate-400'}`} />
                </div>
                <div className="font-bold text-xs sm:text-sm text-slate-900">{st.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{st.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
