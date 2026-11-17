"""
CardioDiab - Intelligent Medical Report Analyzer & Risk Stratification API
FastAPI backend powering OCR extraction, smart adaptive MCQs, and clinical risk reporting.
"""

import os
import shutil
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings, REFERENCE_RANGES
from app.ocr_engine import extract_text_from_file
from app.report_parser import parse_medical_text
from app.mcq_generator import generate_adaptive_mcqs
from app.ml_service import ml_service
from app.risk_analyzer import generate_full_risk_report
from app.supabase_client import db_client

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Cardiovascular & Diabetes Risk Stratification System from Medical Lab Reports"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class AnalyzeRiskRequest(BaseModel):
    report_id: Optional[str] = None
    user_id: Optional[str] = None
    biomarkers: Dict[str, Any]
    mcq_answers: Dict[str, Any]
    demographics: Optional[Dict[str, Any]] = None
    ecg_findings: Optional[List[str]] = None

class DirectTextReportRequest(BaseModel):
    report_name: str = "Pasted Lab Report"
    text: str
    user_id: Optional[str] = None

class SupabaseConfigRequest(BaseModel):
    supabase_url: str
    supabase_key: str

# Sample benchmark reports for instant demonstration
PRESET_SAMPLE_REPORTS = [
    {
        "id": "sample-diabetic-emergency",
        "title": "Severe Hyperglycemia & Acute Metabolic Risk (Emergency)",
        "badge": "Emergency 🔴",
        "category": "Blood Glucose & Glycemic Profile",
        "text": """
LABORATORY REPORT - METABOLIC ASSESSMENT
Patient Age: 52 Years | Gender: Male
Test Conducted: Fasting Plasma Glucose & Glycated Hemoglobin (HbA1c)

INVESTIGATION                    RESULT       REFERENCE RANGE   UNIT
---------------------------------------------------------------------
Fasting Blood Glucose            320.0        70.0 - 99.0       mg/dL  [CRITICAL HIGH]
HbA1c (Glycated Hemoglobin)      11.4         4.0 - 5.6         %      [VERY HIGH]
Total Cholesterol                218.0        125.0 - 200.0     mg/dL  [HIGH]
Serum Creatinine                 1.45         0.6 - 1.2         mg/dL  [BORDERLINE HIGH]
Blood Pressure                   148/92       < 120 / < 80      mmHg   [STAGE 2 HYPERTENSION]
Heart Rate                       104          60 - 100          bpm    [TACHYCARDIA]

Physician Clinical Notes: Patient reports persistent intense thirst, unquenchable dry mouth,
and urinating 5-6 times each night for the past 2 weeks. Complains of mild mental fogginess.
"""
    },
    {
        "id": "sample-cardio-lipid",
        "title": "Atherogenic Dyslipidemia & Hypertension (Moderate/High)",
        "badge": "Moderate Risk 🟡",
        "category": "Lipid Profile & Cardiovascular Panel",
        "text": """
CARDIOVASCULAR HEALTH PANEL
Patient Age: 58 Years | Gender: Male
Lipid Profile & Resting Vitals

INVESTIGATION                    RESULT       REFERENCE RANGE   UNIT
---------------------------------------------------------------------
Total Cholesterol                268.0        125.0 - 199.0     mg/dL  [HIGH]
LDL (Bad) Cholesterol            176.0        50.0 - 99.0       mg/dL  [VERY HIGH]
HDL (Good) Cholesterol           34.0         40.0 - 90.0       mg/dL  [LOW / AT RISK]
Serum Triglycerides              245.0        50.0 - 149.0      mg/dL  [HIGH]
Fasting Blood Glucose            114.0        70.0 - 99.0       mg/dL  [PRE-DIABETIC]
Blood Pressure                   156/96       < 120 / < 80      mmHg   [STAGE 2 HYPERTENSION]
Resting Heart Rate               88           60 - 100          bpm    [NORMAL]
Resting ECG Summary              ST Segment Depression in V4-V6 leads (Ischemic strain pattern)

Clinical Notes: Patient reports noticeable tightness in mid-chest when walking uphill or briskly.
History of smoking (1 pack/day for 20 years). Strong maternal history of myocardial infarction.
"""
    },
    {
        "id": "sample-optimal-wellness",
        "title": "Healthy Metabolic & Cardiovascular Profile (Low Risk)",
        "badge": "Low Risk 🟢",
        "category": "Annual Wellness Health Panel",
        "text": """
EXECUTIVE ANNUAL HEALTH CHECK
Patient Age: 36 Years | Gender: Female

INVESTIGATION                    RESULT       REFERENCE RANGE   UNIT
---------------------------------------------------------------------
Fasting Blood Glucose            86.0         70.0 - 99.0       mg/dL  [NORMAL]
HbA1c (Glycated Hemoglobin)      5.1          4.0 - 5.6         %      [OPTIMAL]
Total Cholesterol                164.0        125.0 - 199.0     mg/dL  [NORMAL]
LDL (Bad) Cholesterol            82.0         50.0 - 99.0       mg/dL  [OPTIMAL]
HDL (Good) Cholesterol           62.0         40.0 - 90.0       mg/dL  [EXCELLENT]
Serum Triglycerides              98.0         50.0 - 149.0      mg/dL  [NORMAL]
Blood Pressure                   114/74       < 120 / < 80      mmHg   [OPTIMAL]
Serum Creatinine                 0.82         0.6 - 1.2         mg/dL  [NORMAL]
Resting ECG Summary              Normal Sinus Rhythm, normal axis, no ischemic ST changes.

Clinical Notes: Patient exercises regularly, non-smoker, no exertional chest symptoms.
"""
    },
    {
        "id": "sample-prediabetes-metabolic",
        "title": "Metabolic Syndrome & Pre-Diabetes (Moderate)",
        "badge": "Moderate Risk 🟡",
        "category": "Comprehensive Health & Metabolic Panel",
        "text": """
METABOLIC PROFILE & BIOCHEMICAL SCREEN
Patient Age: 47 Years | Gender: Female

INVESTIGATION                    RESULT       REFERENCE RANGE   UNIT
---------------------------------------------------------------------
Fasting Blood Glucose            118.0        70.0 - 99.0       mg/dL  [ELEVATED / PRE-DIABETIC]
HbA1c                            6.2          4.0 - 5.6         %      [PRE-DIABETIC]
Total Cholesterol                215.0        125.0 - 199.0     mg/dL  [BORDERLINE HIGH]
LDL Cholesterol                  138.0        50.0 - 99.0       mg/dL  [BORDERLINE ELEVATED]
HDL Cholesterol                  42.0         40.0 - 90.0       mg/dL  [ACCEPTABLE]
Triglycerides                    210.0        50.0 - 149.0      mg/dL  [HIGH]
Blood Pressure                   134/86       < 120 / < 80      mmHg   [STAGE 1 HYPERTENSION]
Serum Creatinine                 0.95         0.6 - 1.2         mg/dL  [NORMAL]

Clinical Notes: Sedentary lifestyle, high carbohydrate dietary intake, occasional fatigue.
"""
    }
]

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "ml_models": {
            "diabetes_model": ml_service.diabetes_model is not None,
            "cvd_model": ml_service.cvd_model is not None
        },
        "database": "supabase" if db_client.use_supabase else "local_json"
    }

@app.get("/api/sample-reports")
def get_sample_reports():
    """Returns preset clinical reports for one-click testing."""
    return PRESET_SAMPLE_REPORTS

@app.post("/api/upload-report")
async def upload_report(file: UploadFile = File(...), user_id: Optional[str] = Form(None)):
    """
    Accepts PDF or Image of medical report.
    Extracts text via OCR/PDF engine, parses biomarkers, and returns dynamic MCQs.
    """
    filename = file.filename or "uploaded_report"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".txt"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a PDF, PNG, JPG, or WEBP.")

    saved_path = os.path.join(settings.UPLOAD_DIR, filename)
    try:
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Extract text via multi-engine extractor
        raw_text = extract_text_from_file(saved_path, filename)
        
        # Parse medical entities
        parsed = parse_medical_text(raw_text, filename=filename)
        
        # Smart adaptive MCQs
        mcqs = generate_adaptive_mcqs(parsed)
        
        # Persist report
        report_id = db_client.save_patient_report(
            file_name=filename,
            file_type=ext.replace(".", ""),
            report_type=parsed["report_type"],
            raw_text=raw_text,
            user_id=user_id
        )
        
        # Persist extracted biomarkers
        db_client.save_biomarkers(report_id, parsed["biomarkers"])
        
        return {
            "report_id": report_id,
            "file_name": filename,
            "report_type": parsed["report_type"],
            "primary_domain": parsed.get("primary_domain", "general"),
            "detected_categories": parsed["detected_categories"],
            "biomarkers": parsed["biomarkers"],
            "ecg_findings": parsed["ecg_findings"],
            "demographics": parsed["demographics"],
            "total_biomarkers_found": parsed["total_biomarkers_found"],
            "has_abnormalities": parsed["has_abnormalities"],
            "adaptive_mcqs": mcqs,
            "raw_text_preview": raw_text[:800]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process medical report: {str(e)}")
    finally:
        # Keep uploaded files or cleanup
        pass

@app.post("/api/parse-text-report")
def parse_text_report(payload: DirectTextReportRequest):
    """Parses raw text directly (used for preset samples or manual paste)."""
    raw_text = payload.text
    parsed = parse_medical_text(raw_text, filename=payload.report_name)
    mcqs = generate_adaptive_mcqs(parsed)
    
    report_id = db_client.save_patient_report(
        file_name=payload.report_name,
        file_type="text",
        report_type=parsed["report_type"],
        raw_text=raw_text,
        user_id=payload.user_id
    )
    
    db_client.save_biomarkers(report_id, parsed["biomarkers"])
    
    return {
        "report_id": report_id,
        "file_name": payload.report_name,
        "report_type": parsed["report_type"],
        "primary_domain": parsed.get("primary_domain", "general"),
        "detected_categories": parsed["detected_categories"],
        "biomarkers": parsed["biomarkers"],
        "ecg_findings": parsed["ecg_findings"],
        "demographics": parsed["demographics"],
        "total_biomarkers_found": parsed["total_biomarkers_found"],
        "has_abnormalities": parsed["has_abnormalities"],
        "adaptive_mcqs": mcqs,
        "raw_text_preview": raw_text[:800]
    }

@app.post("/api/analyze-risk")
def analyze_risk(payload: AnalyzeRiskRequest):
    """
    Combines extracted biomarkers + user MCQ responses.
    Runs ML models & clinical triage engine to produce full risk report.
    """
    biomarkers = payload.biomarkers
    mcq_answers = payload.mcq_answers
    demographics = payload.demographics or {}
    ecg_findings = payload.ecg_findings or []
    report_id = payload.report_id or "adhoc"

    # 1. Run Machine Learning models
    ml_diabetes = ml_service.predict_diabetes_risk(biomarkers, mcq_answers, demographics)
    ml_cvd = ml_service.predict_cvd_risk(biomarkers, mcq_answers, demographics)

    # 2. Comprehensive clinical synthesis
    risk_report = generate_full_risk_report(
        biomarkers=biomarkers,
        mcq_answers=mcq_answers,
        ecg_findings=ecg_findings,
        ml_diabetes_result=ml_diabetes,
        ml_cvd_result=ml_cvd
    )

    # 3. Save MCQ responses and final assessment
    if report_id != "adhoc":
        db_client.save_mcq_responses(report_id, mcq_answers)
        assessment_id = db_client.save_risk_assessment(report_id, risk_report, user_id=payload.user_id)
        risk_report["assessment_id"] = assessment_id

    return risk_report

@app.get("/api/history")
def get_assessment_history(limit: int = 15, user_id: Optional[str] = None):
    """Returns recent assessments from Supabase / local database."""
    return db_client.get_recent_history(limit=limit, user_id=user_id)

@app.get("/api/config/supabase")
def get_supabase_config():
    """Returns current Supabase connection status."""
    return db_client.get_status()

@app.post("/api/config/supabase")
def update_supabase_config(payload: SupabaseConfigRequest):
    """Dynamically connects to user's Supabase project."""
    res = db_client.reconnect(payload.supabase_url, payload.supabase_key)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@app.get("/api/reference-ranges")
def get_reference_ranges():
    """Returns official clinical reference ranges."""
    return REFERENCE_RANGES
