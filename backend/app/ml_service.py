"""
CardioDiab ML Inference Service
Loads serialized Scikit-learn models and performs calibrated risk predictions.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "ml_training", "models")

class MLService:
    def __init__(self):
        self.diabetes_model = None
        self.cvd_model = None
        self.metadata = {}
        self._load_models()

    def _load_models(self):
        try:
            diab_path = os.path.join(MODELS_DIR, "diabetes_model.joblib")
            cvd_path = os.path.join(MODELS_DIR, "heart_disease_model.joblib")
            if os.path.exists(diab_path):
                self.diabetes_model = joblib.load(diab_path)
                print(f"[+] Loaded Diabetes ML Model from {diab_path}")
            if os.path.exists(cvd_path):
                self.cvd_model = joblib.load(cvd_path)
                print(f"[+] Loaded CVD ML Model from {cvd_path}")
        except Exception as e:
            print(f"[!] Warning loading ML models: {e}")

    def predict_diabetes_risk(self, biomarkers: Dict[str, Any], mcq_answers: Dict[str, Any], demographics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Features needed:
        fasting_glucose, hba1c, bmi, age, symptom_thirst_urination, symptom_unexplained_weight_loss, symptom_blurred_vision
        """
        # Extract features with clinical imputation defaults
        glucose = biomarkers.get("fasting_glucose", {}).get("value", 95.0)
        hba1c = biomarkers.get("hba1c", {}).get("value", None)
        if hba1c is None:
            # Estimate from glucose if absent
            hba1c = round((glucose + 46.7) / 28.7, 1)
            
        bmi = biomarkers.get("bmi", {}).get("value", 25.5)
        age = demographics.get("age", 45.0)
        
        # Symptoms from MCQs (supports both 'thirst' and legacy 'thirst_urination')
        s_thirst = 1 if (mcq_answers.get("thirst", {}).get("is_positive") or mcq_answers.get("thirst_urination", {}).get("is_positive")) else 0
        s_weight = 1 if mcq_answers.get("weight_loss", {}).get("is_positive") else 0
        s_vision = 1 if mcq_answers.get("blurred_vision", {}).get("is_positive") else 0
        
        if self.diabetes_model:
            try:
                features = [
                    "fasting_glucose", "hba1c", "bmi", "age",
                    "symptom_thirst_urination", "symptom_unexplained_weight_loss", "symptom_blurred_vision"
                ]
                input_df = pd.DataFrame([{
                    "fasting_glucose": glucose,
                    "hba1c": hba1c,
                    "bmi": bmi,
                    "age": age,
                    "symptom_thirst_urination": s_thirst,
                    "symptom_unexplained_weight_loss": s_weight,
                    "symptom_blurred_vision": s_vision
                }])[features]
                
                probas = self.diabetes_model.predict_proba(input_df)[0]
                pred_class = int(np.argmax(probas))
                
                # probas: [P(Low), P(Prediabetes), P(Diabetes)]
                # Diabetes risk percentage: weighted sum or P(prediab)*0.5 + P(diab)*1.0
                risk_pct = round(float(probas[1] * 45 + probas[2] * 100), 1)
                
                labels = ["Low Risk", "Moderate Risk (Pre-Diabetes)", "High Risk (Diabetes)"]
                return {
                    "risk_score_pct": min(100.0, max(0.0, risk_pct)),
                    "predicted_class": pred_class,
                    "label": labels[pred_class],
                    "probabilities": {
                        "low": round(float(probas[0]), 3),
                        "prediabetes": round(float(probas[1]), 3),
                        "diabetes": round(float(probas[2]), 3)
                    }
                }
            except Exception as e:
                print(f"[!] Error in ML diabetes prediction: {e}")

        # Heuristic clinical fallback if model not loaded
        if glucose >= 126 or hba1c >= 6.5 or (glucose > 110 and s_thirst):
            return {"risk_score_pct": 88.0, "predicted_class": 2, "label": "High Risk (Diabetes)"}
        elif glucose >= 100 or hba1c >= 5.7:
            return {"risk_score_pct": 48.0, "predicted_class": 1, "label": "Moderate Risk (Pre-Diabetes)"}
        else:
            return {"risk_score_pct": 12.0, "predicted_class": 0, "label": "Low Risk"}

    def predict_cvd_risk(self, biomarkers: Dict[str, Any], mcq_answers: Dict[str, Any], demographics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Features needed:
        age, gender_male, systolic_bp, diastolic_bp, total_cholesterol, ldl, hdl, triglycerides,
        smoking, family_history_cvd, symptom_chest_pain_exertion, symptom_sob_stairs
        """
        age = demographics.get("age", 50.0)
        gender = demographics.get("gender", "male")
        gender_male = 1 if gender == "male" else 0
        
        sys_bp = biomarkers.get("systolic_bp", {}).get("value", 122.0)
        dia_bp = biomarkers.get("diastolic_bp", {}).get("value", 78.0)
        tot_chol = biomarkers.get("total_cholesterol", {}).get("value", 185.0)
        ldl = biomarkers.get("ldl", {}).get("value", 110.0)
        hdl = biomarkers.get("hdl", {}).get("value", 48.0)
        trig = biomarkers.get("triglycerides", {}).get("value", 130.0)
        
        smoking = 1 if mcq_answers.get("smoking", {}).get("is_positive") else 0
        fam_hx = 1 if mcq_answers.get("family_history", {}).get("is_positive") else 0
        s_chest = 1 if mcq_answers.get("chest_pain", {}).get("is_positive") else 0
        s_sob = 1 if mcq_answers.get("breathlessness_stairs", {}).get("is_positive") else 0
        
        if self.cvd_model:
            try:
                features = [
                    "age", "gender_male", "systolic_bp", "diastolic_bp",
                    "total_cholesterol", "ldl", "hdl", "triglycerides",
                    "smoking", "family_history_cvd",
                    "symptom_chest_pain_exertion", "symptom_sob_stairs"
                ]
                input_df = pd.DataFrame([{
                    "age": age,
                    "gender_male": gender_male,
                    "systolic_bp": sys_bp,
                    "diastolic_bp": dia_bp,
                    "total_cholesterol": tot_chol,
                    "ldl": ldl,
                    "hdl": hdl,
                    "triglycerides": trig,
                    "smoking": smoking,
                    "family_history_cvd": fam_hx,
                    "symptom_chest_pain_exertion": s_chest,
                    "symptom_sob_stairs": s_sob
                }])[features]
                
                probas = self.cvd_model.predict_proba(input_df)[0]
                pred_class = int(np.argmax(probas))
                
                risk_pct = round(float(probas[1] * 40 + probas[2] * 90), 1)
                labels = ["Low Risk (< 10%)", "Moderate Risk (10 - 20%)", "High Cardiovascular Risk (> 20%)"]
                
                return {
                    "risk_score_pct": min(100.0, max(0.0, risk_pct)),
                    "predicted_class": pred_class,
                    "label": labels[pred_class],
                    "probabilities": {
                        "low": round(float(probas[0]), 3),
                        "moderate": round(float(probas[1]), 3),
                        "high": round(float(probas[2]), 3)
                    }
                }
            except Exception as e:
                print(f"[!] Error in ML CVD prediction: {e}")

        # Heuristic Framingham-like fallback
        if s_chest or sys_bp >= 160 or ldl >= 160 or (tot_chol >= 240 and smoking):
            return {"risk_score_pct": 78.0, "predicted_class": 2, "label": "High Cardiovascular Risk"}
        elif sys_bp >= 135 or ldl >= 130 or smoking or fam_hx:
            return {"risk_score_pct": 42.0, "predicted_class": 1, "label": "Moderate Risk"}
        else:
            return {"risk_score_pct": 10.0, "predicted_class": 0, "label": "Low Risk"}

ml_service = MLService()
