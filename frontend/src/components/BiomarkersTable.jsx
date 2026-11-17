import React from 'react';
import { Activity, CheckCircle, AlertTriangle, AlertOctagon, Heart, Droplet, ArrowRight, FileCheck } from 'lucide-react';

export default function BiomarkersTable({ parsedData, onProceedToMCQs, hideProceedButton = false }) {
  const { report_type, biomarkers, ecg_findings, demographics, total_biomarkers_found } = parsedData || {};
  const biomarkerList = Object.values(biomarkers || {});

  const getStatusBadge = (status) => {
    switch (status) {
      case 'critical':
      case 'very_high':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertOctagon className="w-3 h-3 text-rose-600" />
            <span className="capitalize">{status.replace('_', ' ')}</span>
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Elevated</span>
          </span>
        );
      case 'borderline':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
            <AlertTriangle className="w-3 h-3 text-yellow-600" />
            <span>Borderline</span>
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <span>Low</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Normal</span>
          </span>
        );
    }
  };

  /**
   * Calculates position percentage (0-100%) for visual gauge meter
   */
  const calculateGaugePosition = (val, min, max, isHighWorse = true) => {
    // Range baseline extends from 0.7 * min to 1.6 * max
    const gaugeMin = min * 0.7;
    const gaugeMax = max * 1.6;
    if (gaugeMax === gaugeMin) return 50;
    const clamped = Math.max(gaugeMin, Math.min(val, gaugeMax));
    return ((clamped - gaugeMin) / (gaugeMax - gaugeMin)) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                Step 2 Complete
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {total_biomarkers_found} Biomarkers Successfully Extracted
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              {report_type}
            </h3>
          </div>

          {demographics && Object.keys(demographics).length > 0 && (
            <div className="flex items-center space-x-3 text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              {demographics.age && (
                <span>Age: <strong className="text-slate-800">{demographics.age} yrs</strong></span>
              )}
              {demographics.gender && (
                <span>Sex: <strong className="text-slate-800 capitalize">{demographics.gender}</strong></span>
              )}
            </div>
          )}
        </div>

        {/* Biomarkers Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Biomarker</th>
                <th className="py-3 px-3">Patient Value</th>
                <th className="py-3 px-3">Reference Range</th>
                <th className="py-3 px-3 min-w-[140px]">Visual Spectrum</th>
                <th className="py-3 px-3 text-right">Clinical Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {biomarkerList.map((bm) => {
                const isAbnormal = bm.status !== 'normal';
                const pos = calculateGaugePosition(bm.value, bm.reference_min, bm.reference_max);

                return (
                  <tr key={bm.key} className={`hover:bg-slate-50/80 transition-colors ${isAbnormal ? 'bg-amber-50/20' : ''}`}>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{bm.display_name}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{bm.category}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`text-base font-extrabold ${isAbnormal ? 'text-rose-600' : 'text-slate-900'}`}>
                        {bm.value}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">{bm.unit}</span>
                    </td>

                    <td className="py-3.5 px-3 text-xs text-slate-600 font-medium">
                      {bm.reference_min} – {bm.reference_max} {bm.unit}
                    </td>

                    {/* Visual Meter */}
                    <td className="py-3.5 px-3">
                      <div className="relative pt-1">
                        <div className="h-2 w-full rounded-full bg-slate-200 flex overflow-hidden">
                          <div className="w-[30%] bg-emerald-400/80" title="Normal zone" />
                          <div className="w-[25%] bg-amber-400/80" title="Borderline zone" />
                          <div className="w-[45%] bg-rose-500/80" title="High / Critical zone" />
                        </div>
                        {/* Needle indicator */}
                        <div
                          className="absolute -top-0.5 w-2 h-3 bg-slate-900 rounded-sm shadow -translate-x-1"
                          style={{ left: `${Math.min(96, Math.max(4, pos))}%` }}
                          title={`Patient value: ${bm.value}`}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      {getStatusBadge(bm.status)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ECG Summary if present */}
        {ecg_findings && ecg_findings.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 mb-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Resting Electrocardiogram (ECG) Findings</span>
            </h4>
            <div className="space-y-1.5">
              {ecg_findings.map((f, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proceed Action Button */}
        {!hideProceedButton && (
          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              Biomarkers are verified. Next, answer a few adaptive clinical follow-up questions tailored to your report findings.
            </p>

            <button
              onClick={onProceedToMCQs}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold text-sm rounded-xl shadow-md shadow-teal-500/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <span>Proceed to Adaptive MCQs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
