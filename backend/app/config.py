import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "CardioDiab API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL", None)
    SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY", None)
    UPLOAD_DIR: str = os.path.join(os.path.dirname(__file__), "..", "uploads")
    
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Standard Clinical Reference Ranges (ADA / AHA / ACC Guidelines)
REFERENCE_RANGES = {
    "fasting_glucose": {
        "display": "Fasting Blood Glucose",
        "unit": "mg/dL",
        "normal_min": 70.0,
        "normal_max": 99.0,
        "borderline_min": 100.0,
        "borderline_max": 125.0,
        "high_min": 126.0,
        "emergency_threshold": 300.0,
        "category": "diabetes"
    },
    "hba1c": {
        "display": "HbA1c (Glycated Hemoglobin)",
        "unit": "%",
        "normal_min": 4.0,
        "normal_max": 5.6,
        "borderline_min": 5.7,
        "borderline_max": 6.4,
        "high_min": 6.5,
        "emergency_threshold": 11.0,
        "category": "diabetes"
    },
    "total_cholesterol": {
        "display": "Total Cholesterol",
        "unit": "mg/dL",
        "normal_min": 125.0,
        "normal_max": 199.0,
        "borderline_min": 200.0,
        "borderline_max": 239.0,
        "high_min": 240.0,
        "emergency_threshold": 350.0,
        "category": "cardiovascular"
    },
    "ldl": {
        "display": "LDL (Bad) Cholesterol",
        "unit": "mg/dL",
        "normal_min": 50.0,
        "normal_max": 99.0,
        "borderline_min": 100.0,
        "borderline_max": 159.0,
        "high_min": 160.0,
        "emergency_threshold": 220.0,
        "category": "cardiovascular"
    },
    "hdl": {
        "display": "HDL (Good) Cholesterol",
        "unit": "mg/dL",
        "normal_min": 40.0,  # Below 40 is high risk for CVD
        "normal_max": 90.0,
        "borderline_min": 35.0,
        "borderline_max": 40.0,
        "high_min": 0.0,     # Inverted logic: lower HDL means higher CVD risk
        "emergency_threshold": 20.0,
        "category": "cardiovascular",
        "inverted": True
    },
    "triglycerides": {
        "display": "Triglycerides",
        "unit": "mg/dL",
        "normal_min": 50.0,
        "normal_max": 149.0,
        "borderline_min": 150.0,
        "borderline_max": 199.0,
        "high_min": 200.0,
        "emergency_threshold": 500.0,
        "category": "cardiovascular"
    },
    "systolic_bp": {
        "display": "Systolic Blood Pressure",
        "unit": "mmHg",
        "normal_min": 90.0,
        "normal_max": 120.0,
        "borderline_min": 121.0,
        "borderline_max": 139.0,
        "high_min": 140.0,
        "emergency_threshold": 180.0,
        "category": "cardiovascular"
    },
    "diastolic_bp": {
        "display": "Diastolic Blood Pressure",
        "unit": "mmHg",
        "normal_min": 60.0,
        "normal_max": 80.0,
        "borderline_min": 81.0,
        "borderline_max": 89.0,
        "high_min": 90.0,
        "emergency_threshold": 120.0,
        "category": "cardiovascular"
    },
    "creatinine": {
        "display": "Serum Creatinine",
        "unit": "mg/dL",
        "normal_min": 0.6,
        "normal_max": 1.2,
        "borderline_min": 1.3,
        "borderline_max": 1.9,
        "high_min": 2.0,
        "emergency_threshold": 3.5,
        "category": "renal_metabolic"
    },
    "heart_rate": {
        "display": "Resting Heart Rate",
        "unit": "bpm",
        "normal_min": 60.0,
        "normal_max": 100.0,
        "borderline_min": 101.0,
        "borderline_max": 115.0,
        "high_min": 116.0,
        "emergency_threshold": 140.0,
        "category": "cardiovascular"
    }
}
