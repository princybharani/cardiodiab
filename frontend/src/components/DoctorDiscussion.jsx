import React from 'react';
import { Stethoscope, FileText, Printer, Share2, HelpCircle } from 'lucide-react';

export default function DoctorDiscussion({ followUpTests, onPrint }) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-1">
            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
            <span>Physician Collaboration Guide</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Recommended Follow-Up Diagnostic Tests
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Take these specific medical tests and questions to your next clinical consultation.
          </p>
        </div>

        <button
          onClick={onPrint}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-sm self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save Medical Summary</span>
        </button>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {followUpTests && followUpTests.map((test, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded inline-block mb-1.5 border border-teal-100">
                {test.specialist}
              </div>
              <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                {test.test_name}
              </h5>
            </div>
            <p className="text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-200/60 leading-relaxed">
              <strong>Rationale:</strong> {test.reason}
            </p>
          </div>
        ))}
      </div>

      {/* Key questions for your doctor */}
      <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-teal-950 space-y-2">
        <h5 className="font-bold flex items-center space-x-1.5 text-teal-900">
          <HelpCircle className="w-4 h-4 text-teal-700" />
          <span>Suggested Questions to Ask Your Physician:</span>
        </h5>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
          <li>"Do my lipid particle numbers (LDL-C or ApoB) warrant medical statin therapy or dietary trial first?"</li>
          <li>"Should we perform an ambulatory 24-hour blood pressure monitor or home BP diary?"</li>
          <li>"What is my target fasting glucose and HbA1c goal over the next 3 to 6 months?"</li>
        </ul>
      </div>
    </div>
  );
}
