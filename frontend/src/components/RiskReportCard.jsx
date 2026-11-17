import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle, Clock, ShieldAlert, Heart, Droplet, Info } from 'lucide-react';

export default function RiskReportCard({ reportData }) {
  const { urgency, diabetes_assessment, cardiovascular_assessment } = reportData;

  const isEmergency = urgency?.urgency_level === 'emergency';
  const isModerate = urgency?.urgency_level === 'moderate';
  const isLow = urgency?.urgency_level === 'low';

  const getUrgencyTheme = () => {
    if (isEmergency) {
      return {
        bg: 'bg-rose-50 border-rose-200',
        badge: 'bg-rose-600 text-white',
        titleColor: 'text-rose-950',
        lightBg: 'bg-rose-100/70',
        textColor: 'text-rose-900',
        icon: AlertOctagon,
        iconColor: 'text-rose-600',
        indicator: '🔴 Emergency Urgency'
      };
    } else if (isModerate) {
      return {
        bg: 'bg-amber-50/80 border-amber-200',
        badge: 'bg-amber-500 text-slate-900',
        titleColor: 'text-amber-950',
        lightBg: 'bg-amber-100/60',
        textColor: 'text-amber-900',
        icon: AlertTriangle,
        iconColor: 'text-amber-600',
        indicator: '🟡 Moderate Risk'
      };
    } else {
      return {
        bg: 'bg-emerald-50/80 border-emerald-200',
        badge: 'bg-emerald-600 text-white',
        titleColor: 'text-emerald-950',
        lightBg: 'bg-emerald-100/60',
        textColor: 'text-emerald-900',
        icon: CheckCircle,
        iconColor: 'text-emerald-600',
        indicator: '🟢 Low Risk'
      };
    }
  };

  const theme = getUrgencyTheme();
  const Icon = theme.icon;

  return (
    <div className="space-y-6">
      {/* Big Traffic-Light Urgency Banner */}
      <div className={`rounded-2xl p-6 sm:p-8 border shadow-sm transition-all ${theme.bg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className={`p-3.5 rounded-2xl bg-white shadow-sm border border-slate-200/60 flex-shrink-0 ${theme.iconColor}`}>
              <Icon className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${theme.badge}`}>
                  {theme.indicator}
                </span>
                <span className="flex items-center space-x-1 text-xs font-semibold text-slate-600">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{urgency?.timeframe}</span>
                </span>
              </div>

              <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.titleColor}`}>
                {urgency?.urgency_title}
              </h2>
            </div>
          </div>

          {/* Quick Urgency Legend Pill */}
          <div className="flex items-center space-x-2 bg-white/90 p-2.5 rounded-xl border border-slate-200/80 text-xs shadow-sm self-start lg:self-center">
            <div className="text-[11px] font-bold text-slate-500 mr-1">Triage Scale:</div>
            <span className={`px-2 py-0.5 rounded font-bold ${isLow ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>
              🟢 Low
            </span>
            <span className={`px-2 py-0.5 rounded font-bold ${isModerate ? 'bg-amber-400 text-slate-900' : 'text-slate-400'}`}>
              🟡 Moderate
            </span>
            <span className={`px-2 py-0.5 rounded font-bold ${isEmergency ? 'bg-rose-600 text-white animate-pulse' : 'text-slate-400'}`}>
              🔴 Emergency
            </span>
          </div>
        </div>

        {/* Plain Language Explanation of Why */}
        <div className="mt-6 pt-5 border-t border-slate-200/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5 mb-2">
            <Info className="w-4 h-4 text-slate-500" />
            <span>Why this urgency level was assigned (Plain-Language Explanation)</span>
          </h4>
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
            {urgency?.urgency_explanation}
          </p>
        </div>

        {/* Specific Flag Reasons */}
        {urgency?.reasons && urgency.reasons.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {urgency.reasons.map((r, i) => (
              <div key={i} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-700">
                <span className="text-slate-400 font-bold">•</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Condition Risk Breakdown Cards (Diabetes & CVD ML predictions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diabetes Assessment Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <Droplet className="w-4 h-4 fill-amber-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Diabetes & Metabolic Risk
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Random Forest Multi-Biomarker Model
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {diabetes_assessment?.risk_label}
              </span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs font-semibold text-slate-600">Calculated Risk Index:</span>
                <span className="text-2xl font-black text-slate-900">
                  {diabetes_assessment?.risk_score_pct}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600"
                  style={{ width: `${Math.min(100, Math.max(8, diabetes_assessment?.risk_score_pct || 0))}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                <span>Normal (&lt;30%)</span>
                <span>Pre-Diabetes (30-65%)</span>
                <span>Overt Diabetes (&gt;65%)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
            Evaluates fasting blood glucose levels, HbA1c 3-month glycemic exposure, BMI, and osmotic polyuria/polydipsia symptoms.
          </div>
        </div>

        {/* Cardiovascular Assessment Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                  <Heart className="w-4 h-4 fill-rose-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Cardiovascular Disease Risk
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Gradient Boosting Lipid & Vitals Engine
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                {cardiovascular_assessment?.risk_label}
              </span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs font-semibold text-slate-600">Atherogenic Risk Index:</span>
                <span className="text-2xl font-black text-slate-900">
                  {cardiovascular_assessment?.risk_score_pct}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600"
                  style={{ width: `${Math.min(100, Math.max(8, cardiovascular_assessment?.risk_score_pct || 0))}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                <span>Low Risk (&lt;10%)</span>
                <span>Borderline (10-20%)</span>
                <span>High Risk (&gt;20%)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
            Derived from atherogenic lipid ratios (LDL, HDL, Triglycerides), systolic & diastolic blood pressure, exertion symptoms, and family history.
          </div>
        </div>
      </div>
    </div>
  );
}
