import React from 'react';
import { ShieldAlert, AlertCircle } from 'lucide-react';

export default function DisclaimerBanner({ text }) {
  const disclaimerText = text || (
    "IMPORTANT MEDICAL DISCLAIMER: CardioDiab is an artificial intelligence-powered health analytics tool designed solely for informational, screening, and educational purposes. It DOES NOT provide medical diagnoses, treatment advice, or formal clinical prescriptions. Always seek the advice of a board-certified physician or qualified healthcare provider with any questions you may have regarding a medical condition. If you suspect an emergency (e.g. chest pain, sudden numbness, extreme shortness of breath, severe confusion), contact your local emergency services (such as 911, 999, 112) or go to the nearest emergency department immediately."
  );

  return (
    <div className="rounded-2xl p-5 bg-slate-100 border border-slate-300 text-slate-700 text-xs shadow-xs">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-xl bg-slate-200 text-slate-700 flex-shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
            Clinical Transparency &amp; Non-Diagnostic Disclaimer
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {disclaimerText}
          </p>
        </div>
      </div>
    </div>
  );
}
