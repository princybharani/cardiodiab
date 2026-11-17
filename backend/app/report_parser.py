"""
CardioDiab Medical Report Entity & Biomarker Parser
Extracts, validates, and normalizes clinical parameters from OCR/PDF text.
"""

import re
from typing import Dict, Any, List, Optional
from app.config import REFERENCE_RANGES

BIOMARKER_PATTERNS = {
    "fasting_glucose": [
        # Direct clinical remarks e.g. Fasting Plasma Glucose (164 mg/dL)
        r"(?:fasting\s*(?:plasma\s*|blood\s*)?glucose|fasting\s*blood\s*sugar|fbs|fbg)\s*(?:\([^\)]*\))?\s*[\:\-\=\(\s]+\s*([0-9]{2,3}(?:\.[0-9]+)?)\s*(?:mg\/d[lL]|mmol\/[lL])?",
        # Table rows: test name followed by observed value
        r"(?:fasting\s*(?:plasma\s*|blood\s*)?glucose)\s*\([^\)]*\)[^\n\r]*?\n(?:[^\n\r]*?\n){0,3}?\s*([0-9]{2,3}(?:\.[0-9]+)?)",
        r"(?:glucose[,\s]+fasting)\s*(?:\([^\)]*\))?\s*[\:\-\=\(\s]+\s*([0-9]{2,3}(?:\.[0-9]+)?)\s*(?:mg\/d[lL]|mmol\/[lL])?",
        r"(?:glucose\s*\(f\)|f-glucose)[\s\:\-\=]+([0-9]{2,3}(?:\.[0-9]+)?)"
    ],
    "hba1c": [
        r"(?:glycated\s*hemoglobin|glycosylated\s*hemoglobin|glycohemoglobin)\s*(?:\([^\)]*\))?\s*[\:\-\=\(\[\s]+\s*([0-9]{1,2}(?:\.[0-9]+)?)\s*(?:%|mmol\/mol)?",
        r"(?:hba1c|hb\s*a1c)\s*(?:\([^\)]*\))?\s*[\:\-\=\(\[\s]+\s*([0-9]{1,2}(?:\.[0-9]+)?)\s*(?:%|mmol\/mol)?",
        r"\bhba1c\b[^\d\n\r]{0,30}?([0-9]{1,2}(?:\.[0-9]+)?)\s*%"
    ],
    "total_cholesterol": [
        r"(?:total\s*cholesterol|serum\s*cholesterol|cholesterol[,\s]+total)\s*(?:\([^\)]*\))?\s*[\:\-\=\(\s]+\s*([0-9]{2,3}(?:\.[0-9]+)?)\s*(?:mg\/d[lL]|mmol\/[lL])?",
        r"(?:cholesterol)\s*[\:\-\=\s]+([0-9]{2,3}(?:\.[0-9]+)?)\s*mg\/d[lL]"
    ],
    "ldl": [
        r"(?<!\/)(?:direct\s*ldl(?:\s*cholesterol)?|ldl\s*(?:cholesterol)?|ldl-c|low\s*density\s*lipoprotein)\s*(?:\([^\)]*\))?\s*[\:\-\=\(\s]+\s*([0-9]{2,3}(?:\.[0-9]+)?)\s*(?:mg\/d[lL]|mmol\/[lL])?",
        r"(?:calculated\s*ldl|direct\s*ldl)[\s\:\-\=]+([0-9]{2,3}(?:\.[0-9]+)?)"
    ],
    "hdl": [
        r"(?<!non\-)(?<!non\s)(?<!\/)(?:direct\s*hdl(?:\s*cholesterol)?|hdl\s*(?:cholesterol)?|hdl-c|high\s*density\s*lipoprotein)\s*(?:\([^\)]*\))?\s*[\:\-\=\(\s]+\s*([0-9]{2,3}(?:\.[0-9]+)?)\s*(?:mg\/d[lL]|mmol\/[lL])?"
    ],
    "triglycerides": [
        r"(?:hypertriglyceridemia|serum\s*triglycerides|triglycerides|trigs|tg)\s*(?:\([^\)]*\))?\s*[\:\-\=\(\s]+\s*([0-9]{2,4}(?:\.[0-9]+)?)\s*(?:mg\/d[lL]|mmol\/[lL])?"
    ],
    "blood_pressure": [
        r"(?:blood\s*pressure|bp|b\.p\.)[\s\:\-\=]+([0-9]{2,3})\s*[\/\-]\s*([0-9]{2,3})\s*(?:mm\s*hg)?",
        r"(?:systolic\s*\/s*diastolic)[\s\:\-\=]+([0-9]{2,3})\s*[\/\-]\s*([0-9]{2,3})",
        r"\b([0-9]{2,3})\s*[\/]\s*([0-9]{2,3})\s*mm\s*hg\b"
    ],
    "systolic_bp": [
        r"(?:systolic\s*(?:bp|blood\s*pressure)?)[\s\:\-\=]+([0-9]{2,3})\s*(?:mm\s*hg)?"
    ],
    "diastolic_bp": [
        r"(?:diastolic\s*(?:bp|blood\s*pressure)?)[\s\:\-\=]+([0-9]{2,3})\s*(?:mm\s*hg)?"
    ],
    "creatinine": [
        r"(?:serum\s*creatinine|s\.creatinine|creatinine[,\s]+serum)\s*(?:\([^\)]*\))?\s*[\:\-\=\(\s]+\s*([0-9]{1,2}(?:\.[0-9]+)?)\s*(?:mg\/d[lL]|umol\/[lL])?"
    ],
    "heart_rate": [
        r"(?:heart\s*rate|pulse\s*(?:rate)?|hr)[\s\:\-\=]+([0-9]{2,3})\s*(?:bpm|beats\/min)?",
        r"\b([0-9]{2,3})\s*bpm\b"
    ],
    "bmi": [
        r"(?:body\s*mass\s*index|bmi)[\s\:\-\=]+([0-9]{1,2}(?:\.[0-9]+)?)\s*(?:kg\/m2|kg\/m²)?",
    ],
    "age": [
        r"(?:age|patient\s*age)[\s\:\-\=]+([0-9]{1,3})\s*(?:years?|yrs?|y)?",
        r"\b([0-9]{1,3})\s*(?:years?|yrs?)\s*(?:old)?"
    ],
    "gender": [
        r"(?:gender|sex)[\s\:\-\=]+(male|female|m|f)\b"
    ]
}

ECG_FINDING_PATTERNS = [
    (r"st[\s\-]elevation|st[\s\-]segment\s*elevation|stemi", "ST Segment Elevation (Critical acute ischemia alert)"),
    (r"st[\s\-]depression|st[\s\-]segment\s*depression", "ST Segment Depression (Ischemic stress marker)"),
    (r"t[\s\-]wave\s*inversion|inverted\s*t[\s\-]waves", "T-Wave Inversion (Potential myocardial ischemia)"),
    (r"sinus\s*tachycardia", "Sinus Tachycardia (Heart rate elevated > 100 bpm)"),
    (r"sinus\s*bradycardia", "Sinus Bradycardia (Heart rate slow < 60 bpm)"),
    (r"atrial\s*fibrillation|afib|a-fib", "Atrial Fibrillation (Irregular supraventricular rhythm)"),
    (r"left\s*bundle\s*branch\s*block|lbbb", "Left Bundle Branch Block (Conduction delay)"),
    (r"premature\s*ventricular\s*contractions?|pvc", "Premature Ventricular Contractions (Ectopic beats)"),
    (r"normal\s*sinus\s*rhythm|normal\s*ecg|within\s*normal\s*limits", "Normal Sinus Rhythm")
]

def classify_biomarker_status(key: str, value: float) -> str:
    """Classifies a biomarker into normal, borderline, high, very_high, or critical."""
    ref = REFERENCE_RANGES.get(key)
    if not ref:
        return "normal"
    
    # Inverted logic for HDL (higher is better, lower is dangerous)
    if ref.get("inverted"):
        if value <= ref.get("emergency_threshold", 20.0):
            return "critical"
        elif value < ref["normal_min"]:
            return "high" # High risk
        elif value <= ref.get("borderline_max", 45.0):
            return "borderline"
        else:
            return "normal"

    # Standard biomarkers (higher is worse)
    emergency_th = ref.get("emergency_threshold", float("inf"))
    if value >= emergency_th:
        return "critical"
    elif value >= ref.get("high_min", float("inf")):
        if value >= ref.get("high_min", 0) * 1.3:
            return "very_high"
        return "high"
    elif value >= ref.get("borderline_min", float("inf")):
        return "borderline"
    elif value < ref.get("normal_min", 0):
        return "low"
    else:
        return "normal"

def parse_medical_text(text: str, filename: str = "") -> Dict[str, Any]:
    """
    Parses OCR or PDF text, extracts quantitative biomarkers and ECG findings,
    classifies clinical severity, and identifies the report type strictly separating
    diabetes vs cardiovascular conditions.
    """
    clean_text = text.replace("\\", "/").replace("–", "-")
    results = {}
    found_types = set()
    
    # Blood pressure special dual matching (e.g. 130/85)
    for pattern in BIOMARKER_PATTERNS["blood_pressure"]:
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            try:
                sys_val = float(match.group(1))
                dia_val = float(match.group(2))
                if 70 <= sys_val <= 260 and 40 <= dia_val <= 160:
                    results["systolic_bp"] = {
                        "key": "systolic_bp",
                        "display_name": REFERENCE_RANGES["systolic_bp"]["display"],
                        "value": sys_val,
                        "unit": "mmHg",
                        "status": classify_biomarker_status("systolic_bp", sys_val),
                        "reference_min": REFERENCE_RANGES["systolic_bp"]["normal_min"],
                        "reference_max": REFERENCE_RANGES["systolic_bp"]["normal_max"],
                        "category": "cardiovascular"
                    }
                    results["diastolic_bp"] = {
                        "key": "diastolic_bp",
                        "display_name": REFERENCE_RANGES["diastolic_bp"]["display"],
                        "value": dia_val,
                        "unit": "mmHg",
                        "status": classify_biomarker_status("diastolic_bp", dia_val),
                        "reference_min": REFERENCE_RANGES["diastolic_bp"]["normal_min"],
                        "reference_max": REFERENCE_RANGES["diastolic_bp"]["normal_max"],
                        "category": "cardiovascular"
                    }
                    found_types.add("blood_pressure")
                    break
            except Exception:
                pass

    # Extract individual biomarkers
    for key, patterns in BIOMARKER_PATTERNS.items():
        if key in ["blood_pressure", "age", "gender"]:
            continue
        if key in results: # already extracted via dual match
            continue
            
        for pat in patterns:
            match = re.search(pat, clean_text, re.IGNORECASE)
            if match:
                try:
                    raw_val = float(match.group(1))
                    unit = match.group(2).lower() if len(match.groups()) > 1 and match.group(2) else ""
                    
                    # Unit conversion if reported in mmol/L
                    val = raw_val
                    if "mmol" in unit:
                        if key == "fasting_glucose":
                            val = round(raw_val * 18.0182, 1) # mmol/L to mg/dL
                        elif key in ["total_cholesterol", "ldl", "hdl"]:
                            val = round(raw_val * 38.67, 1)
                        elif key == "triglycerides":
                            val = round(raw_val * 88.57, 1)
                    
                    # Sanity check ranges
                    ref = REFERENCE_RANGES.get(key)
                    if ref:
                        # Reject crazy OCR artifacts
                        if key == "fasting_glucose" and not (40 <= val <= 800): continue
                        if key == "hba1c" and not (3.0 <= val <= 20.0): continue
                        if key in ["total_cholesterol", "ldl", "hdl", "triglycerides"] and not (15 <= val <= 1200): continue
                        if key == "creatinine" and not (0.2 <= val <= 25.0): continue
                        
                        results[key] = {
                            "key": key,
                            "display_name": ref["display"],
                            "value": val,
                            "unit": ref["unit"],
                            "status": classify_biomarker_status(key, val),
                            "reference_min": ref["normal_min"],
                            "reference_max": ref["normal_max"],
                            "category": ref["category"]
                        }
                        
                        if ref["category"] == "diabetes":
                            found_types.add("blood_sugar")
                        elif ref["category"] == "cardiovascular":
                            found_types.add("lipid_profile")
                        elif ref["category"] == "renal_metabolic":
                            found_types.add("kidney_panel")
                    break
                except Exception:
                    continue

    # Extract ECG Findings
    ecg_findings = []
    for pat, desc in ECG_FINDING_PATTERNS:
        if re.search(pat, clean_text, re.IGNORECASE):
            ecg_findings.append(desc)
            found_types.add("ecg")
            
    # Extract Patient Demographic Hints
    demographics = {}
    for pat in BIOMARKER_PATTERNS["age"]:
        m = re.search(pat, clean_text, re.IGNORECASE)
        if m:
            try:
                age_val = int(m.group(1))
                if 5 <= age_val <= 110:
                    demographics["age"] = age_val
                    break
            except Exception:
                pass
                
    for pat in BIOMARKER_PATTERNS["gender"]:
        m = re.search(pat, clean_text, re.IGNORECASE)
        if m:
            g = m.group(1).lower()
            demographics["gender"] = "male" if g.startswith("m") else "female"
            break

    # Determine Overall Report Type intelligently
    has_diabetes = any(k in results for k in ["fasting_glucose", "hba1c"])
    has_lipids = any(k in results for k in ["total_cholesterol", "ldl", "hdl", "triglycerides"])
    has_ecg = len(ecg_findings) > 0
    has_bp = "systolic_bp" in results or "diastolic_bp" in results

    fn_lower = filename.lower()
    text_lower = clean_text.lower()
    
    # 1. Filename explicit hints
    fn_is_diabetes = any(t in fn_lower for t in ["diabet", "glycem", "glucose", "sugar", "hba1c"])
    fn_is_cardio = any(t in fn_lower for t in ["lipid", "cholesterol", "cardio", "heart", "ecg", "hypertension"])

    # 2. Top header lines (first 10 lines)
    top_header = "\n".join(text_lower.splitlines()[:15])
    header_is_diabetes = any(t in top_header for t in [
        "comprehensive diabetes", "diabetes & glycemic", "glycemic control", 
        "glycemic profile", "blood glucose &", "diabetes mellitus"
    ])
    header_is_cardio = any(t in top_header for t in [
        "comprehensive lipid", "lipid profile", "cardiovascular health", 
        "cardiovascular panel", "electrocardiogram", "ecg report", "lipid &"
    ])

    # 3. Clinical abnormal counts
    diab_abnormal_count = sum(1 for k in ["fasting_glucose", "hba1c"] if results.get(k, {}).get("status") in ["high", "very_high", "critical"])
    cardio_abnormal_count = sum(1 for k in ["total_cholesterol", "ldl", "triglycerides", "systolic_bp"] if results.get(k, {}).get("status") in ["high", "very_high", "critical"]) + (2 if has_ecg else 0)

    # STRICT DOMAIN DECISION
    if fn_is_diabetes or header_is_diabetes:
        report_type = "Blood Glucose & Glycemic Profile"
        primary_domain = "diabetes"
    elif fn_is_cardio or header_is_cardio:
        report_type = "Electrocardiogram (ECG) Report" if has_ecg and not has_lipids else "Lipid & Cardiovascular Panel"
        primary_domain = "cardiovascular"
    elif has_diabetes and not has_lipids:
        report_type = "Blood Glucose & Glycemic Profile"
        primary_domain = "diabetes"
    elif (has_lipids or has_ecg) and not has_diabetes:
        report_type = "Lipid & Cardiovascular Panel"
        primary_domain = "cardiovascular"
    elif diab_abnormal_count > cardio_abnormal_count:
        report_type = "Blood Glucose & Glycemic Profile"
        primary_domain = "diabetes"
    elif cardio_abnormal_count > diab_abnormal_count:
        report_type = "Lipid & Cardiovascular Panel"
        primary_domain = "cardiovascular"
    elif has_diabetes:
        report_type = "Blood Glucose & Glycemic Profile"
        primary_domain = "diabetes"
    elif has_lipids or has_ecg:
        report_type = "Lipid & Cardiovascular Panel"
        primary_domain = "cardiovascular"
    elif has_bp:
        report_type = "Blood Pressure / Vitals Check"
        primary_domain = "cardiovascular"
    else:
        report_type = "General Medical Lab Report"
        primary_domain = "diabetes" if any(t in text_lower for t in ["diabetes", "glucose", "glycemic"]) else "cardiovascular"

    return {
        "report_type": report_type,
        "primary_domain": primary_domain,
        "detected_categories": list(found_types),
        "biomarkers": results,
        "ecg_findings": ecg_findings,
        "demographics": demographics,
        "total_biomarkers_found": len(results),
        "has_abnormalities": any(item["status"] in ["high", "very_high", "critical", "borderline"] for item in results.values()) or any("Normal" not in f for f in ecg_findings)
    }
