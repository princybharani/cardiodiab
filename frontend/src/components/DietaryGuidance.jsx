import React, { useState } from 'react';
import { Ban, CheckCircle2, AlertTriangle, Sparkles, Droplet, Heart, Activity } from 'lucide-react';

export default function DietaryGuidance({ dietaryData }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'avoid', 'intake'
  const { foods_to_avoid, foods_to_intake, has_glycemic_issue, has_lipid_issue, has_bp_issue, is_all_normal } = dietaryData || {};

  const avoidList = foods_to_avoid || [];
  const intakeList = foods_to_intake || [];

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Personalized to Your Report</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            What to Avoid &amp; What to Intake
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            These dietary recommendations are dynamically mapped to the exact abnormal biomarkers extracted from your lab report.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 self-start sm:self-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            All Recommendations ({avoidList.length + intakeList.length})
          </button>
          <button
            onClick={() => setActiveFilter('avoid')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
              activeFilter === 'avoid' ? 'bg-rose-50 text-rose-800 shadow-sm' : 'hover:text-rose-700'
            }`}
          >
            <Ban className="w-3 h-3 text-rose-600" />
            <span>What to Avoid ({avoidList.length})</span>
          </button>
          <button
            onClick={() => setActiveFilter('intake')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
              activeFilter === 'intake' ? 'bg-emerald-50 text-emerald-800 shadow-sm' : 'hover:text-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>What to Intake ({intakeList.length})</span>
          </button>
        </div>
      </div>

      {/* Grid of Avoid and Intake */}
      <div className="space-y-6">
        {/* 1. WHAT TO AVOID */}
        {(activeFilter === 'all' || activeFilter === 'avoid') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-rose-100">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  <Ban className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-rose-950 text-base">
                  What to Avoid (Directly Based on Your Detected Biomarkers)
                </h4>
              </div>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                {avoidList.length} Triggered Restrictions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {avoidList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/30 hover:bg-rose-50/50 transition-all flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>{item.name}</span>
                      </div>
                      {item.triggered_by && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex-shrink-0">
                          {item.triggered_by}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.reason}
                    </p>
                  </div>

                  {item.examples && (
                    <div className="pt-2 border-t border-rose-100 text-[11px] text-rose-900 font-medium">
                      <strong className="text-rose-950">Specific items to cut out:</strong> {item.examples}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. WHAT TO INTAKE */}
        {(activeFilter === 'all' || activeFilter === 'intake') && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-emerald-100">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-emerald-950 text-base">
                  What to Intake (Foods to Actively Consume to Lower Detected Markers)
                </h4>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {intakeList.length} Therapeutic Recommendations
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {intakeList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/30 hover:bg-emerald-50/50 transition-all flex flex-col justify-between space-y-2.5"
                >
                  <div>
                    <div className="mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {item.target}
                      </span>
                    </div>

                    <h5 className="font-bold text-slate-900 text-sm">
                      {item.name}
                    </h5>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.benefit}
                    </p>
                  </div>

                  {item.how_to_use && (
                    <div className="pt-2 border-t border-emerald-100 text-[11px] text-emerald-900 bg-emerald-100/50 p-2 rounded-lg font-medium">
                      <strong>How to intake:</strong> {item.how_to_use}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
