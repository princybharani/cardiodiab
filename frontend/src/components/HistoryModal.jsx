import React from 'react';
import { X, Clock, FileText, ChevronRight, Activity, Database } from 'lucide-react';

export default function HistoryModal({ isOpen, onClose, historyList, onSelectHistoryItem }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Saved Patient Assessments
              </h3>
              <p className="text-xs text-slate-500">
                Audited clinical records stored in Supabase / Local database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
          {(!historyList || historyList.length === 0) ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No previous assessments saved yet. Complete an analysis to see historical records here.
            </div>
          ) : (
            historyList.map((item, idx) => {
              const isRed = item.urgency_level === 'emergency';
              const isYellow = item.urgency_level === 'moderate';

              return (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/20 transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isRed
                            ? 'bg-rose-100 text-rose-800'
                            : isYellow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.urgency_level?.toUpperCase()}
                      </span>
                      <span className="font-bold text-slate-900">
                        {item.file_name || 'Medical Report'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-3">
                      <span>{item.report_type || 'Health Panel'}</span>
                      <span>•</span>
                      <span>{item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-[11px] text-slate-600 font-semibold">
                      Diab: {item.diabetes_risk_score}% | CVD: {item.cvd_risk_score}%
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
