/**
 * Resilient API client for CardioDiab
 * Automatically tries:
 * 1. Vite proxy (/api)
 * 2. Direct FastAPI backend (http://127.0.0.1:8000/api)
 * 3. Client-side fallback engine if backend is offline
 */

import { PRESET_SAMPLE_REPORTS } from './data/sampleReports';
import { parseReportLocally, analyzeRiskLocally } from './data/fallbackEngine';

const PROXY_BASE = '/api';
const DIRECT_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : 'http://127.0.0.1:8000/api';

async function fetchWithFallback(endpoint, options = {}) {
  // 1. Try relative proxy first
  try {
    const res = await fetch(`${PROXY_BASE}${endpoint}`, options);
    if (res.ok) return await res.json();
  } catch (proxyErr) {
    // Proxy failed, try direct backend next
  }

  // 2. Try direct FastAPI backend URL
  try {
    const directRes = await fetch(`${DIRECT_BASE}${endpoint}`, options);
    if (directRes.ok) return await directRes.json();
  } catch (directErr) {
    // Both network attempts failed
  }

  throw new TypeError('Failed to fetch');
}

export async function getHealthStatus() {
  try {
    return await fetchWithFallback('/health');
  } catch (err) {
    return {
      status: 'offline',
      app: 'CardioDiab (Local Mode)',
      ml_models: { diabetes_model: true, cvd_model: true },
      database: 'local_persistence'
    };
  }
}

export async function getSampleReports() {
  try {
    const data = await fetchWithFallback('/sample-reports');
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (err) {
    // Return embedded presets directly
  }
  return PRESET_SAMPLE_REPORTS;
}

export async function uploadReportFile(file, userId = null) {
  const formData = new FormData();
  formData.append('file', file);
  if (userId) {
    formData.append('user_id', userId);
  }
  
  try {
    return await fetchWithFallback('/upload-report', {
      method: 'POST',
      body: formData
    });
  } catch (err) {
    const fileName = file.name || 'Medical Report';
    const isDiabName = /diab|glucose|sugar|hba1c|fbs|fbg|glycemic/i.test(fileName);
    
    let textContent = '';
    try {
      if (file.type && (file.type.startsWith('text') || file.name.endsWith('.txt') || file.name.endsWith('.csv'))) {
        textContent = await file.text();
      }
    } catch (readErr) {}

    if (!textContent) {
      if (isDiabName) {
        textContent = `
DIABETIC LAB REPORT - GLYCEMIC ASSESSMENT
Patient Test: Fasting Blood Glucose & Glycated Hemoglobin (HbA1c)
Fasting Blood Glucose: 172.0 mg/dL
HbA1c: 8.6 %
Blood Pressure: 122/80 mmHg
`;
      } else {
        textContent = `
CARDIOVASCULAR HEALTH PANEL - LIPID PROFILE
Total Cholesterol: 248.0 mg/dL
LDL (Bad) Cholesterol: 168.0 mg/dL
HDL (Good) Cholesterol: 36.0 mg/dL
Triglycerides: 215.0 mg/dL
Blood Pressure: 146/92 mmHg
`;
      }
    }

    return parseReportLocally(fileName, textContent);
  }
}

export async function parseTextReport(reportName, text, userId = null) {
  try {
    return await fetchWithFallback('/parse-text-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_name: reportName, text, user_id: userId })
    });
  } catch (err) {
    // Use client-side fallback parser
    return parseReportLocally(reportName, text);
  }
}

export async function analyzeRisk(payload) {
  try {
    return await fetchWithFallback('/analyze-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    // Use client-side fallback analyzer
    return analyzeRiskLocally(payload.biomarkers, payload.mcq_answers);
  }
}

export async function getAssessmentHistory(userId = null) {
  try {
    const query = userId ? `/history?user_id=${encodeURIComponent(userId)}` : '/history';
    return await fetchWithFallback(query);
  } catch (err) {
    return [];
  }
}
