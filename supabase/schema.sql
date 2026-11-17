-- ====================================================================
-- CardioDiab Database Schema (PostgreSQL / Supabase)
-- With Built-in Supabase Auth (auth.users) integration
-- ====================================================================

-- 1. Table for uploaded medical reports
CREATE TABLE IF NOT EXISTS patient_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    report_type VARCHAR(100), -- 'Blood Glucose & Glycemic Profile', 'Lipid & Cardiovascular Panel', etc.
    raw_extracted_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Table for individual extracted clinical biomarkers
CREATE TABLE IF NOT EXISTS extracted_biomarkers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES patient_reports(id) ON DELETE CASCADE,
    biomarker_key VARCHAR(100) NOT NULL, -- e.g. 'fasting_glucose', 'hba1c', 'ldl', etc.
    display_name VARCHAR(150) NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'normal', 'borderline', 'high', 'very_high', 'critical'
    reference_min NUMERIC(10, 2),
    reference_max NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Table for adaptive MCQ responses
CREATE TABLE IF NOT EXISTS mcq_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES patient_reports(id) ON DELETE CASCADE,
    question_key VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    selected_option VARCHAR(255) NOT NULL,
    is_positive BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Table for final clinical risk assessments and recommendations
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    report_id UUID REFERENCES patient_reports(id) ON DELETE CASCADE,
    urgency_level VARCHAR(50) NOT NULL, -- 'low', 'moderate', 'emergency'
    urgency_color VARCHAR(20) NOT NULL, -- 'green', 'yellow', 'red'
    urgency_title VARCHAR(255) NOT NULL,
    urgency_explanation TEXT NOT NULL,
    diabetes_risk_score NUMERIC(5, 2), -- 0 - 100%
    diabetes_risk_label VARCHAR(100),
    cvd_risk_score NUMERIC(5, 2), -- 0 - 100%
    cvd_risk_label VARCHAR(100),
    dietary_guidance JSONB,
    lifestyle_recommendations JSONB,
    follow_up_tests JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_patient_reports_user_id ON patient_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON risk_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_biomarkers_report_id ON extracted_biomarkers(report_id);
CREATE INDEX IF NOT EXISTS idx_mcqs_report_id ON mcq_responses(report_id);
CREATE INDEX IF NOT EXISTS idx_assessments_report_id ON risk_assessments(report_id);
CREATE INDEX IF NOT EXISTS idx_patient_reports_created ON patient_reports(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE patient_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_biomarkers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

-- Anonymous/Public access policies (covers both authenticated and unauthenticated scans)
CREATE POLICY "Allow public select on patient_reports" ON patient_reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert on patient_reports" ON patient_reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on extracted_biomarkers" ON extracted_biomarkers FOR SELECT USING (true);
CREATE POLICY "Allow public insert on extracted_biomarkers" ON extracted_biomarkers FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on mcq_responses" ON mcq_responses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on mcq_responses" ON mcq_responses FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on risk_assessments" ON risk_assessments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on risk_assessments" ON risk_assessments FOR INSERT WITH CHECK (true);
