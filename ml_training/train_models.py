"""
CardioDiab Model Training & Clinical Evaluation Pipeline
Trains, evaluates, and serializes machine learning models for:
1. Diabetes & Metabolic Risk Prediction
2. Cardiovascular Disease (CVD) Risk Prediction
3. Clinical Urgency Stratification
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix, accuracy_score, f1_score

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def train_diabetes_model(df: pd.DataFrame):
    print("\n--------------------------------------------------")
    print(" 1. Training Diabetes & Metabolic Risk Model")
    print("--------------------------------------------------")
    
    features = [
        "fasting_glucose", "hba1c", "bmi", "age",
        "symptom_thirst_urination", "symptom_unexplained_weight_loss", "symptom_blurred_vision"
    ]
    X = df[features]
    y = df["diabetes_target"]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", RandomForestClassifier(
            n_estimators=150,
            max_depth=6,
            min_samples_split=5,
            random_state=42,
            class_weight="balanced"
        ))
    ])
    
    # 5-fold cross validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="accuracy")
    print(f"5-Fold CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")
    try:
        auc = roc_auc_score(y_test, y_proba, multi_class="ovr")
    except Exception:
        auc = None
    
    print(f"Test Set Accuracy: {acc:.4f}")
    print(f"Test Set F1 Score: {f1:.4f}")
    if auc:
        print(f"Test Set ROC-AUC (OVR): {auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Low Risk", "Pre-Diabetes", "Diabetes"]))
    
    # Feature importances
    importances = pipeline.named_steps["classifier"].feature_importances_
    feat_imp = sorted(zip(features, importances), key=lambda x: x[1], reverse=True)
    print("Top Predictive Biomarkers for Diabetes:")
    for feat, imp in feat_imp:
        print(f"  - {feat:30s}: {imp*100:.2f}%")
        
    model_path = os.path.join(MODELS_DIR, "diabetes_model.joblib")
    joblib.dump(pipeline, model_path)
    print(f"[+] Saved Diabetes model to {model_path}")
    
    return {
        "features": features,
        "accuracy": float(acc),
        "f1_score": float(f1),
        "roc_auc": float(auc) if auc else None,
        "cv_accuracy_mean": float(cv_scores.mean()),
        "cv_accuracy_std": float(cv_scores.std()),
        "feature_importances": {feat: float(imp) for feat, imp in feat_imp}
    }

def train_cvd_model(df: pd.DataFrame):
    print("\n--------------------------------------------------")
    print(" 2. Training Cardiovascular Disease (CVD) Risk Model")
    print("--------------------------------------------------")
    
    features = [
        "age", "gender_male", "systolic_bp", "diastolic_bp",
        "total_cholesterol", "ldl", "hdl", "triglycerides",
        "smoking", "family_history_cvd",
        "symptom_chest_pain_exertion", "symptom_sob_stairs"
    ]
    X = df[features]
    y = df["cvd_target"]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", GradientBoostingClassifier(
            n_estimators=120,
            learning_rate=0.08,
            max_depth=4,
            random_state=42
        ))
    ])
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="accuracy")
    print(f"5-Fold CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")
    try:
        auc = roc_auc_score(y_test, y_proba, multi_class="ovr")
    except Exception:
        auc = None
        
    print(f"Test Set Accuracy: {acc:.4f}")
    print(f"Test Set F1 Score: {f1:.4f}")
    if auc:
        print(f"Test Set ROC-AUC (OVR): {auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Low Risk", "Moderate Risk", "High Risk"]))
    
    importances = pipeline.named_steps["classifier"].feature_importances_
    feat_imp = sorted(zip(features, importances), key=lambda x: x[1], reverse=True)
    print("Top Predictive Biomarkers for CVD:")
    for feat, imp in feat_imp:
        print(f"  - {feat:30s}: {imp*100:.2f}%")
        
    model_path = os.path.join(MODELS_DIR, "heart_disease_model.joblib")
    joblib.dump(pipeline, model_path)
    print(f"[+] Saved CVD model to {model_path}")
    
    return {
        "features": features,
        "accuracy": float(acc),
        "f1_score": float(f1),
        "roc_auc": float(auc) if auc else None,
        "cv_accuracy_mean": float(cv_scores.mean()),
        "cv_accuracy_std": float(cv_scores.std()),
        "feature_importances": {feat: float(imp) for feat, imp in feat_imp}
    }

def main():
    print("==================================================")
    print("       CardioDiab ML Model Training Pipeline      ")
    print("==================================================")
    
    cohort_path = os.path.join(DATA_DIR, "clinical_multimarker_cohort.csv")
    if not os.path.exists(cohort_path):
        print(f"[!] {cohort_path} not found. Running fetch_dataset first...")
        from fetch_dataset import generate_full_clinical_cohort
        generate_full_clinical_cohort()
        
    df = pd.read_csv(cohort_path)
    print(f"Loaded cohort with {len(df)} patient records across {len(df.columns)} clinical features.")
    
    diabetes_meta = train_diabetes_model(df)
    cvd_meta = train_cvd_model(df)
    
    metadata = {
        "version": "1.0.0",
        "timestamp": pd.Timestamp.now().isoformat(),
        "diabetes_model": diabetes_meta,
        "cvd_model": cvd_meta,
        "normal_ranges": {
            "fasting_glucose": {"min": 70, "max": 99, "unit": "mg/dL", "label": "Fasting Blood Glucose"},
            "hba1c": {"min": 4.0, "max": 5.6, "unit": "%", "label": "HbA1c (Glycated Hemoglobin)"},
            "total_cholesterol": {"min": 120, "max": 200, "unit": "mg/dL", "label": "Total Cholesterol"},
            "ldl": {"min": 50, "max": 99, "unit": "mg/dL", "label": "LDL (Bad) Cholesterol"},
            "hdl": {"min": 40, "max": 60, "unit": "mg/dL", "label": "HDL (Good) Cholesterol"},
            "triglycerides": {"min": 50, "max": 149, "unit": "mg/dL", "label": "Triglycerides"},
            "systolic_bp": {"min": 90, "max": 120, "unit": "mmHg", "label": "Systolic Blood Pressure"},
            "diastolic_bp": {"min": 60, "max": 80, "unit": "mmHg", "label": "Diastolic Blood Pressure"},
            "creatinine": {"min": 0.6, "max": 1.2, "unit": "mg/dL", "label": "Serum Creatinine"},
            "bmi": {"min": 18.5, "max": 24.9, "unit": "kg/m²", "label": "Body Mass Index"}
        }
    }
    
    meta_path = os.path.join(MODELS_DIR, "model_metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"\n[+] Saved complete metadata and reference ranges to {meta_path}")
    print("\n[SUCCESS] Model training complete.")

if __name__ == "__main__":
    main()
