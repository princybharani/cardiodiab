import React, { useState } from 'react';
import { HelpCircle, Check, ArrowRight, Sparkles, Activity, ChevronDown, ChevronUp, AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-react';
import BiomarkersTable from './BiomarkersTable';

export default function AdaptiveMCQModal({ parsedData, onComplete, isAnalyzing }) {
  const [answers, setAnswers] = useState({});
  const [showFullTable, setShowFullTable] = useState(false);

  const mcqs = parsedData?.adaptive_mcqs || [];
  const biomarkers = parsedData?.biomarkers || {};
  const biomarkerList = Object.values(biomarkers);

  const handleSelectOption = (questionId, questionText, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        question_text: questionText,
        option_id: option.id,
        selected_text: option.text,
        is_positive: option.is_positive,
        weight: option.weight
      }
    }));
  };

  const answeredCount = Object.keys(answers).length;
  const totalCount = mcqs.length;
  const isAllAnswered = answeredCount >= totalCount && totalCount > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAllAnswered) return;
    onComplete(answers);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. AUTO-EXTRACTED BIOMARKERS SUMMARY BANNER */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Report Automatically Extracted</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              {parsedData?.report_type || 'Medical Report'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identified {parsedData?.total_biomarkers_found || biomarkerList.length} clinical parameters from your uploaded document.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFullTable(!showFullTable)}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <span>{showFullTable ? 'Hide Range Gauges' : 'View Visual Range Gauges'}</span>
            {showFullTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Quick Biomarker Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {biomarkerList.map((bm) => {
            const isAbnormal = bm.status !== 'normal';
            return (
              <div
                key={bm.key}
                className={`p-2.5 rounded-xl border text-xs transition-all ${
                  isAbnormal
                    ? 'bg-rose-50/40 border-rose-200 text-rose-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="text-[11px] text-slate-500 truncate font-medium">
                  {bm.display_name}
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-base font-extrabold ${isAbnormal ? 'text-rose-600' : 'text-slate-900'}`}>
                    {bm.value} <span className="text-[10px] font-normal text-slate-500">{bm.unit}</span>
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded capitalize ${
                    bm.status === 'critical' || bm.status === 'very_high'
                      ? 'bg-rose-200 text-rose-900'
                      : bm.status === 'high'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {bm.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapsible Full Table Spectrum */}
        {showFullTable && (
          <div className="pt-3 border-t border-slate-100">
            <BiomarkersTable parsedData={parsedData} onProceedToMCQs={() => {}} hideProceedButton={true} />
          </div>
        )}
      </div>

      {/* 2. ADAPTIVE MCQs FORM */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Smart Follow-up Questionnaire</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Questions Adapted to What Was Found in Your Report
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Please answer these quick clinical symptom questions to calculate your personalized risk, dietary protocol, and activity guidance.
            </p>
          </div>

          {/* Progress Tracker */}
          <div className="text-right flex-shrink-0">
            <div className="text-xs font-semibold text-slate-500">Progress</div>
            <div className="text-sm font-bold text-teal-700">
              {answeredCount} of {totalCount} Answered
            </div>
            <div className="w-28 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-teal-600 transition-all duration-300"
                style={{ width: `${totalCount ? (answeredCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mcqs.map((q, idx) => {
            const selected = answers[q.id];
            const isDiabetes = q.category === 'diabetes';

            return (
              <div
                key={q.id}
                className={`p-5 rounded-xl border transition-all ${
                  selected
                    ? 'bg-white border-teal-300 shadow-sm'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isDiabetes ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isDiabetes ? 'Blood Sugar Follow-up' : 'Cardiovascular Follow-up'}
                    </span>
                  </div>

                  {selected && (
                    <span className="flex items-center space-x-1 text-xs font-bold text-teal-600">
                      <Check className="w-4 h-4" />
                      <span>Answered</span>
                    </span>
                  )}
                </div>

                <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                  {q.question}
                </h4>
                {q.subtext && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {q.subtext}
                  </p>
                )}

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
                  {q.options.map((opt) => {
                    const isChecked = selected?.option_id === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleSelectOption(q.id, q.question, opt)}
                        className={`flex items-start p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'border-teal-600 bg-teal-50 text-teal-900 font-semibold ring-1 ring-teal-600'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt.id}
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 text-teal-600 focus:ring-teal-500 mr-2"
                        />
                        <span>{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              {!isAllAnswered ? (
                <span className="text-amber-600 font-semibold">
                  Please answer all {totalCount} questions above to proceed to your risk report.
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">
                  All questions answered! Click below to synthesize your personalized clinical report.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!isAllAnswered || isAnalyzing}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-rose-600 via-rose-500 to-teal-600 hover:from-rose-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-500/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Calculating Risk & Recommendations...</span>
                </>
              ) : (
                <>
                  <span>Generate Full Risk &amp; Dietary Report</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
