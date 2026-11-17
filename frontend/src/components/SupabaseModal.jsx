import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { getStoredSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig, testSupabaseConnection } from '../supabaseClient';

export default function SupabaseModal({ isOpen, onClose, onConfigSaved }) {
  if (!isOpen) return null;

  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    setUrl(cfg.url || '');
    setKey(cfg.key || '');
    setTestResult(null);
  }, [isOpen]);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url.trim(), key.trim());
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsTesting(true);
    const test = await testSupabaseConnection(url.trim(), key.trim());
    if (!test.success && !test.message.includes('schema.sql')) {
      setTestResult(test);
      setIsTesting(false);
      return;
    }
    await saveSupabaseConfig(url.trim(), key.trim());
    setTestResult({ success: true, message: 'Saved and connected to Supabase successfully!' });
    setIsTesting(false);
    setTimeout(() => {
      if (onConfigSaved) onConfigSaved();
      onClose();
    }, 800);
  };

  const handleDisconnect = async () => {
    await clearSupabaseConfig();
    setUrl('');
    setKey('');
    setTestResult({ success: true, message: 'Disconnected from Supabase. Reverted to local persistence.' });
    if (onConfigSaved) onConfigSaved();
  };

  const copySchemaSql = () => {
    const sql = `-- CardioDiab Supabase Schema
CREATE TABLE IF NOT EXISTS patient_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    report_type VARCHAR(100),
    raw_extracted_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS extracted_biomarkers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES patient_reports(id) ON DELETE CASCADE,
    biomarker_key VARCHAR(100) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    reference_min NUMERIC(10, 2),
    reference_max NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS mcq_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES patient_reports(id) ON DELETE CASCADE,
    question_key VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    selected_option VARCHAR(255) NOT NULL,
    is_positive BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    report_id UUID REFERENCES patient_reports(id) ON DELETE CASCADE,
    urgency_level VARCHAR(50) NOT NULL,
    urgency_color VARCHAR(20) NOT NULL,
    urgency_title VARCHAR(255) NOT NULL,
    urgency_explanation TEXT NOT NULL,
    diabetes_risk_score NUMERIC(5, 2),
    diabetes_risk_label VARCHAR(100),
    cvd_risk_score NUMERIC(5, 2),
    cvd_risk_label VARCHAR(100),
    dietary_guidance JSONB,
    lifestyle_recommendations JSONB,
    follow_up_tests JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE patient_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_biomarkers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on patient_reports" ON patient_reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert on patient_reports" ON patient_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on extracted_biomarkers" ON extracted_biomarkers FOR SELECT USING (true);
CREATE POLICY "Allow public insert on extracted_biomarkers" ON extracted_biomarkers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on mcq_responses" ON mcq_responses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on mcq_responses" ON mcq_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on risk_assessments" ON risk_assessments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on risk_assessments" ON risk_assessments FOR INSERT WITH CHECK (true);
`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Connect Supabase Database</h3>
                <p className="text-xs text-emerald-100">PostgreSQL cloud storage & Supabase Auth</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {testResult && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs flex items-start space-x-2 border ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              )}
              <span className="font-medium">{testResult.message}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Found in: Project Settings &rarr; API &rarr; Project URL
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supabase anon / public API Key
              </label>
              <input
                type="password"
                required
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Found in: Project Settings &rarr; API &rarr; Project API keys (anon, public)
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting || !url || !key}
                className="flex-1 py-2 px-3 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />}
                <span>Test Connection</span>
              </button>

              <button
                type="submit"
                disabled={isTesting || !url || !key}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <span>Save & Connect</span>
              </button>
            </div>
          </form>

          {/* Setup Help & Schema Copy */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span className="font-semibold text-slate-700">Database Schema (Tables)</span>
              <button
                type="button"
                onClick={copySchemaSql}
                className="text-teal-700 hover:text-teal-800 font-medium flex items-center space-x-1 bg-teal-50 px-2 py-0.5 rounded"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Paste into your Supabase project's <strong>SQL Editor</strong> and click Run.
            </p>

            <div className="mt-3 flex items-center justify-between pt-2">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-700 hover:underline flex items-center space-x-1 font-medium"
              >
                <span>Open Supabase Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {url && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-[11px] text-rose-600 hover:underline font-medium"
                >
                  Disconnect Supabase
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
