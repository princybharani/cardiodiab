import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Image, AlertTriangle, ArrowRight, CheckCircle2, Sparkles, Edit3 } from 'lucide-react';

export default function UploadSection({ onFileUpload, onSelectSample, onParseText, isProcessing, sampleReports }) {
  const [dragActive, setDragActive] = useState(false);
  const [showTextPaste, setShowTextPaste] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [pastedTitle, setPastedTitle] = useState('My Medical Report');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handlePasteSubmit = (e) => {
    e.preventDefault();
    if (!pastedText.trim()) return;
    onParseText(pastedTitle || 'Pasted Lab Report', pastedText);
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-teal-500 bg-teal-50/60 scale-[1.01]'
            : 'border-slate-300 hover:border-teal-400 bg-white hover:bg-slate-50/70 shadow-sm'
        } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto text-teal-600 mb-4 shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-slate-800">
            Upload your Medical Lab Report
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            Drag & drop your <strong>PDF</strong> document or report <strong>photo / scan (PNG, JPG)</strong> here, or browse from your device.
          </p>

          <div className="mt-4 inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
            <span>Supports: Blood sugar, HbA1c, Lipid panels, BP & ECG summaries</span>
          </div>

          {isProcessing && (
            <div className="mt-6 flex items-center justify-center space-x-2 text-teal-700 font-semibold text-sm">
              <svg className="animate-spin h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Extracting biomarkers & running OCR...</span>
            </div>
          )}
        </div>
      </div>

      {/* Alternative options: Sample reports and manual paste */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Or Test Instantly with Verified Clinical Presets</span>
            </h4>
            <p className="text-xs text-slate-500">
              Select one of our four realistic clinical scenarios to test the extraction and risk engine immediately.
            </p>
          </div>

          <button
            onClick={() => setShowTextPaste(!showTextPaste)}
            className="text-xs font-semibold text-slate-600 hover:text-teal-700 flex items-center space-x-1 transition-colors self-start sm:self-auto"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{showTextPaste ? 'Hide Direct Paste' : 'Paste Raw Text Manually'}</span>
          </button>
        </div>

        {/* Preset Sample Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {sampleReports && sampleReports.map((sample) => {
            const isRed = sample.badge.includes('Emergency') || sample.badge.includes('🔴');
            const isYellow = sample.badge.includes('Moderate') || sample.badge.includes('🟡');
            const isGreen = sample.badge.includes('Low') || sample.badge.includes('🟢');

            return (
              <div
                key={sample.id}
                onClick={() => onSelectSample(sample)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isRed
                          ? 'bg-rose-100 text-rose-800'
                          : isYellow
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {sample.badge}
                    </span>
                    <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 group-hover:text-teal-900 line-clamp-2">
                    {sample.title}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {sample.category}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-teal-700 group-hover:text-teal-800">
                  <span>Load scenario</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Manual Text Paste Modal / Box */}
        {showTextPaste && (
          <form onSubmit={handlePasteSubmit} className="mt-6 pt-6 border-t border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Report Name / Patient Reference"
                value={pastedTitle}
                onChange={(e) => setPastedTitle(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-300 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={!pastedText.trim() || isProcessing}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                Analyze Pasted Text
              </button>
            </div>
            <textarea
              rows={6}
              placeholder="Paste lab report lines here (e.g. Fasting Glucose: 165 mg/dL, HbA1c: 8.2%, Total Cholesterol: 240 mg/dL, BP: 140/90 mmHg...)"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </form>
        )}
      </div>
    </div>
  );
}
