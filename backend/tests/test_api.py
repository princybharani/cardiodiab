"""
Unit & Integration Tests for CardioDiab Backend
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import (
    health_check, get_sample_reports, parse_text_report, analyze_risk,
    DirectTextReportRequest, AnalyzeRiskRequest
)
from app.report_parser import parse_medical_text, classify_biomarker_status
from app.mcq_generator import generate_adaptive_mcqs
from app.risk_analyzer import compute_urgency_triage, build_dietary_guidance

def test_health_check_function():
    data = health_check()
    assert data["status"] == "healthy"
    assert data["ml_models"]["diabetes_model"] is True
    assert data["ml_models"]["cvd_model"] is True

def test_sample_reports_endpoint():
    samples = get_sample_reports()
    assert len(samples) >= 4
    assert any("Diabetic" in s["title"] or "Glucose" in s["category"] for s in samples)
    assert any("Lipid" in s["title"] or "Lipid" in s["category"] for s in samples)

def test_biomarker_text_parsing():
    sample_text = """
    PATIENT REPORT
    Fasting Blood Glucose: 168 mg/dL
    HbA1c: 8.5 %
    Total Cholesterol: 242 mg/dL
    LDL Cholesterol: 165 mg/dL
    HDL Cholesterol: 38 mg/dL
    Triglycerides: 210 mg/dL
    Blood Pressure: 155/95 mmHg
    Serum Creatinine: 1.1 mg/dL
    """
    parsed = parse_medical_text(sample_text)
    bio = parsed["biomarkers"]
    
    assert "fasting_glucose" in bio
    assert bio["fasting_glucose"]["value"] == 168.0
    assert bio["fasting_glucose"]["status"] in ["high", "very_high"]
    
    assert "hba1c" in bio
    assert bio["hba1c"]["value"] == 8.5
    assert bio["hba1c"]["status"] in ["high", "very_high"]
    
    assert "ldl" in bio
    assert bio["ldl"]["value"] == 165.0
    
    assert "systolic_bp" in bio
    assert bio["systolic_bp"]["value"] == 155.0
    assert "diastolic_bp" in bio
    assert bio["diastolic_bp"]["value"] == 95.0

def test_adaptive_mcq_generation_for_diabetes():
    parsed = {
        "report_type": "Blood Glucose & Glycemic Profile",
        "primary_domain": "diabetes",
        "detected_categories": ["blood_sugar"],
        "biomarkers": {"fasting_glucose": {"value": 160.0}},
        "has_abnormalities": True
    }
    mcqs = generate_adaptive_mcqs(parsed)
    question_texts = [q["question"] for q in mcqs]
    
    # Must contain thirst (without urination)
    assert any("thirst" in q.lower() for q in question_texts)
    assert not any("urination" in q.lower() for q in question_texts)
    assert any("weight loss" in q.lower() for q in question_texts)
    assert any("blurred vision" in q.lower() for q in question_texts)
    # Must NOT ask heart questions on a diabetes report
    assert not any("chest pain" in q.lower() for q in question_texts)
    assert not any("smoke" in q.lower() for q in question_texts)

def test_adaptive_mcq_generation_for_lipids():
    parsed = {
        "report_type": "Lipid & Cardiovascular Panel",
        "primary_domain": "cardiovascular",
        "detected_categories": ["lipid_profile"],
        "biomarkers": {"ldl": {"value": 175.0}},
        "has_abnormalities": True
    }
    mcqs = generate_adaptive_mcqs(parsed)
    question_texts = [q["question"] for q in mcqs]
    
    # Must ask heart questions
    assert any("chest pain" in q.lower() or "tightness" in q.lower() for q in question_texts)
    assert any("family history" in q.lower() for q in question_texts)
    assert any("smoke" in q.lower() for q in question_texts)
    # Must NOT ask diabetes questions on a heart report
    assert not any("thirst" in q.lower() for q in question_texts)
    assert not any("weight loss" in q.lower() for q in question_texts)

def test_adaptive_mcq_generation_for_bp():
    parsed = {
        "detected_categories": ["blood_pressure"],
        "biomarkers": {"systolic_bp": {"value": 155.0}, "diastolic_bp": {"value": 95.0}},
        "has_abnormalities": True
    }
    mcqs = generate_adaptive_mcqs(parsed)
    question_texts = [q["question"] for q in mcqs]
    
    assert any("stairs" in q.lower() or "breathlessness" in q.lower() for q in question_texts)
    assert any("dizziness" in q.lower() or "palpitations" in q.lower() for q in question_texts)

def test_emergency_triage_triggers():
    biomarkers = {
        "systolic_bp": {"value": 195.0},
        "diastolic_bp": {"value": 125.0}
    }
    triage = compute_urgency_triage(biomarkers, {}, [])
    assert triage["urgency_level"] == "emergency"
    assert triage["urgency_color"] == "red"
    
    biomarkers_diab = {
        "fasting_glucose": {"value": 340.0}
    }
    mcq_ans = {
        "thirst_urination": {"is_positive": True}
    }
    triage_diab = compute_urgency_triage(biomarkers_diab, mcq_ans, [])
    assert triage_diab["urgency_level"] == "emergency"

def test_full_analysis_logic():
    req = AnalyzeRiskRequest(
        report_id="test-run",
        biomarkers={
            "fasting_glucose": {"value": 172.0, "unit": "mg/dL", "status": "high"},
            "hba1c": {"value": 8.4, "unit": "%", "status": "high"},
            "ldl": {"value": 162.0, "unit": "mg/dL", "status": "high"},
            "systolic_bp": {"value": 142.0, "unit": "mmHg", "status": "high"}
        },
        mcq_answers={
            "thirst_urination": {"is_positive": True, "selected_text": "Yes, frequent"},
            "chest_pain": {"is_positive": False, "selected_text": "No chest discomfort"},
            "smoking": {"is_positive": False, "selected_text": "Never smoked"}
        },
        demographics={"age": 54, "gender": "male"}
    )
    
    res = analyze_risk(req)
    assert "urgency" in res
    assert "diabetes_assessment" in res
    assert "cardiovascular_assessment" in res
    assert "dietary_guidance" in res
    assert "lifestyle_advice" in res
    assert "follow_up_tests" in res
    assert "medical_disclaimer" in res
    
    diet = res["dietary_guidance"]
    assert "diabetes_guidance" in diet
    assert "heart_guidance" in diet
    assert "foods_to_favor" in diet
    
    diab_limits = [item["name"] for item in diet["diabetes_guidance"]["foods_to_limit"]]
    assert any("Sugary" in name for name in diab_limits)
    assert any("Refined" in name for name in diab_limits)
    assert any("rice" in name.lower() for name in diab_limits)
    
    heart_limits = [item["name"] for item in diet["heart_guidance"]["foods_to_limit"]]
    assert any("fried" in name.lower() for name in heart_limits)
    assert any("Trans" in name for name in heart_limits)
    assert any("salt" in name.lower() or "sodium" in name.lower() for name in heart_limits)
    assert any("Processed" in name for name in heart_limits)
