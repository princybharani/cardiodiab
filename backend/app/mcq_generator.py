"""
CardioDiab Smart Adaptive MCQ Generator
Dynamically generates clinical follow-up questions tailored to the exact
biomarkers, abnormalities, and report type extracted from the medical report.
"""

from typing import Dict, Any, List

MCQ_BANK = {
    "blood_sugar": [
        {
            "id": "thirst",
            "category": "diabetes",
            "biomarker_trigger": ["fasting_glucose", "hba1c"],
            "question": "Do you experience excessive or unquenchable thirst?",
            "subtext": "Persistent dry mouth, feeling constantly parched, or drinking unusually high amounts of water throughout the day (polydipsia).",
            "options": [
                {"id": "none", "text": "No, normal thirst levels", "is_positive": False, "weight": 0},
                {"id": "occasional", "text": "Occasionally or when active / dehydrated", "is_positive": False, "weight": 1},
                {"id": "frequent", "text": "Yes, persistent extreme thirst and dry mouth", "is_positive": True, "weight": 3}
            ]
        },
        {
            "id": "weight_loss",
            "category": "diabetes",
            "biomarker_trigger": ["fasting_glucose", "hba1c"],
            "question": "Have you experienced sudden unexplained weight loss?",
            "subtext": "Losing weight rapidly despite eating normally or having an increased appetite.",
            "options": [
                {"id": "none", "text": "No, weight has been stable", "is_positive": False, "weight": 0},
                {"id": "mild", "text": "Slight fluctuation (+/- 1-2 kg)", "is_positive": False, "weight": 0},
                {"id": "yes", "text": "Yes, noticeable unintended weight drop", "is_positive": True, "weight": 3}
            ]
        },
        {
            "id": "blurred_vision",
            "category": "diabetes",
            "biomarker_trigger": ["fasting_glucose", "hba1c"],
            "question": "Do you experience blurred vision or slow-healing cuts?",
            "subtext": "High blood glucose causes osmotic lens swelling and impaired tissue healing.",
            "options": [
                {"id": "none", "text": "No vision blur or healing issues", "is_positive": False, "weight": 0},
                {"id": "occasional", "text": "Occasional eye strain or tiredness", "is_positive": False, "weight": 1},
                {"id": "yes", "text": "Yes, frequent blurred vision or slow-healing skin cuts", "is_positive": True, "weight": 2}
            ]
        }
    ],
    "lipid_profile": [
        {
            "id": "chest_pain",
            "category": "cardiovascular",
            "biomarker_trigger": ["ldl", "total_cholesterol", "triglycerides", "systolic_bp"],
            "question": "Do you experience chest pain or tightness on exertion?",
            "subtext": "Discomfort, pressure, heaviness, or squeezing sensation across chest when walking briskly or climbing stairs.",
            "options": [
                {"id": "none", "text": "No chest discomfort during physical effort", "is_positive": False, "weight": 0},
                {"id": "mild", "text": "Mild brief tightness that resolves promptly with rest", "is_positive": True, "weight": 2},
                {"id": "yes", "text": "Yes, noticeable tightness, aching, or pressure radiating to arm/neck", "is_positive": True, "weight": 4}
            ]
        },
        {
            "id": "family_history",
            "category": "cardiovascular",
            "biomarker_trigger": ["ldl", "total_cholesterol", "triglycerides", "hdl"],
            "question": "Is there a family history of early heart disease?",
            "subtext": "Parents or siblings diagnosed with heart attack, angina, or bypass before age 55 (men) or 65 (women).",
            "options": [
                {"id": "none", "text": "No known family history", "is_positive": False, "weight": 0},
                {"id": "distant", "text": "Extended family relatives (grandparents, uncles)", "is_positive": False, "weight": 1},
                {"id": "immediate", "text": "Yes, first-degree relative (parent or sibling)", "is_positive": True, "weight": 2}
            ]
        },
        {
            "id": "smoking",
            "category": "cardiovascular",
            "biomarker_trigger": ["ldl", "total_cholesterol", "systolic_bp"],
            "question": "Do you currently smoke or use tobacco products?",
            "subtext": "Cigarettes, cigars, vape, or chewing tobacco significantly accelerate arterial plaque formation.",
            "options": [
                {"id": "never", "text": "Never smoked / Non-smoker", "is_positive": False, "weight": 0},
                {"id": "former", "text": "Former smoker (quit over 1 year ago)", "is_positive": False, "weight": 1},
                {"id": "current", "text": "Current smoker or tobacco user", "is_positive": True, "weight": 3}
            ]
        }
    ],
    "bp_or_ecg": [
        {
            "id": "breathlessness_stairs",
            "category": "cardiovascular",
            "biomarker_trigger": ["systolic_bp", "diastolic_bp", "heart_rate"],
            "question": "Do you experience breathlessness while climbing stairs?",
            "subtext": "Shortness of breath out of proportion to exertion, or needing to pause after 1 flight of stairs.",
            "options": [
                {"id": "none", "text": "No, normal exercise tolerance", "is_positive": False, "weight": 0},
                {"id": "moderate", "text": "Mild breathlessness with heavy exertion", "is_positive": False, "weight": 1},
                {"id": "severe", "text": "Yes, breathless climbing just 1 flight or walking flat surfaces", "is_positive": True, "weight": 3}
            ]
        },
        {
            "id": "dizziness_palpitations",
            "category": "cardiovascular",
            "biomarker_trigger": ["systolic_bp", "diastolic_bp", "heart_rate"],
            "question": "Do you experience dizziness or palpitations?",
            "subtext": "Fluttering heart, rapid pounding, skipped beats, or lightheadedness when standing up.",
            "options": [
                {"id": "none", "text": "No palpitations or dizziness", "is_positive": False, "weight": 0},
                {"id": "rare", "text": "Rarely when dehydrated or sleep deprived", "is_positive": False, "weight": 1},
                {"id": "frequent", "text": "Yes, frequent heart fluttering, racing pulse, or dizzy spells", "is_positive": True, "weight": 3}
            ]
        }
    ]
}

def generate_adaptive_mcqs(parsed_report: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Selects the most relevant smart MCQs strictly based on the report type:
    - If user uploads a DIABETES report -> Asks ONLY diabetes questions (thirst, weight loss, blurred vision)
    - If user uploads a HEART / CARDIOVASCULAR report -> Asks ONLY heart questions (chest pain, family history, smoking, stair breathlessness, palpitations)
    - If user uploads a comprehensive checkup with both -> Asks prioritized set
    """
    primary_domain = parsed_report.get("primary_domain", "")
    report_type = parsed_report.get("report_type", "")
    categories = set(parsed_report.get("detected_categories", []))
    biomarkers = parsed_report.get("biomarkers", {})
    
    # 1. DIABETES REPORT (Strict Isolation)
    if primary_domain == "diabetes" or "Blood Glucose" in report_type or "Glycemic" in report_type:
        return list(MCQ_BANK["blood_sugar"])
        
    # 2. HEART / CARDIOVASCULAR REPORT (Strict Isolation)
    if primary_domain == "cardiovascular" or "Lipid" in report_type or "Cardiovascular" in report_type or "ECG" in report_type or "Blood Pressure" in report_type:
        cardio_mcqs = list(MCQ_BANK["lipid_profile"])
        # If ECG or BP abnormalities are present, add stairs breathlessness and palpitations
        for q in MCQ_BANK["bp_or_ecg"]:
            cardio_mcqs.append(q)
        return cardio_mcqs

    # 3. COMPREHENSIVE / MIXED PANEL (Both are present and relevant)
    if primary_domain == "comprehensive":
        combined = []
        # Add high-yield diabetes questions
        combined.append(MCQ_BANK["blood_sugar"][0]) # Thirst
        combined.append(MCQ_BANK["blood_sugar"][1]) # Weight loss
        # Add high-yield heart questions
        combined.append(MCQ_BANK["lipid_profile"][0]) # Chest pain on exertion
        combined.append(MCQ_BANK["lipid_profile"][2]) # Smoking
        combined.append(MCQ_BANK["bp_or_ecg"][0])     # Breathlessness stairs
        return combined

    # 4. Fallback based on specific detected biomarkers
    has_diabetes_biomarker = "blood_sugar" in categories or any(k in biomarkers for k in ["fasting_glucose", "hba1c"])
    has_lipid_biomarker = "lipid_profile" in categories or any(k in biomarkers for k in ["total_cholesterol", "ldl", "triglycerides", "hdl"])
    has_bp_ecg = "bp_or_ecg" in categories or "blood_pressure" in categories or "ecg" in categories
    
    if has_diabetes_biomarker and not (has_lipid_biomarker or has_bp_ecg):
        return list(MCQ_BANK["blood_sugar"])
    elif (has_lipid_biomarker or has_bp_ecg) and not has_diabetes_biomarker:
        cardio_mcqs = list(MCQ_BANK["lipid_profile"])
        for q in MCQ_BANK["bp_or_ecg"]:
            cardio_mcqs.append(q)
        return cardio_mcqs
    elif has_diabetes_biomarker:
        return list(MCQ_BANK["blood_sugar"])
    else:
        return list(MCQ_BANK["lipid_profile"])
