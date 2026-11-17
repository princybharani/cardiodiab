# CardioDiab - Medical Report AI & Cardio-Metabolic Risk Platform

**CardioDiab** is an end-to-end full-stack healthcare intelligence platform. Users upload medical lab reports (blood test, lipid profile, HbA1c, ECG summaries, etc.). The system automatically extracts clinical biomarkers via OCR, adapts dynamic follow-up MCQs based on the detected abnormalities, and synthesizes a calibrated clinical risk report with traffic-light urgency, tailored dietary guidance, and physician discussion tests.

---

## 🌟 Key Features

1. **Multi-Engine Document & Image OCR Extraction**:
   - Parses digital lab PDFs via stream decompressor (`zlib`).
   - Parses photographed or scanned reports (`PNG`, `JPG`, `WEBP`) using high-accuracy Windows Media OCR.
   - Extracts: Fasting Glucose, HbA1c, Total Cholesterol, LDL, HDL, Triglycerides, Systolic & Diastolic BP, Serum Creatinine, Heart Rate, and ECG findings.
   - Automatically handles units (`mg/dL` vs `mmol/L`, `%` vs `mmol/mol`) and maps every biomarker against standard reference ranges.

2. **Smart Adaptive Clinical MCQs**:
   - Questions dynamically adjust to the specific report type and abnormalities:
     - **Blood Sugar / Diabetes**: Excessive thirst or frequent urination? Unexplained weight loss? Blurred vision?
     - **Lipid Profile / CVD**: Chest pain or tightness on exertion? Family history of heart disease? Smoking status?
     - **BP or ECG**: Breathlessness while climbing stairs? Dizziness or palpitations?

3. **Traffic-Light Urgency Risk Report**:
   - 🟢 **Low Risk**: Maintain healthy habits, routine annual checkups.
   - 🟡 **Moderate Risk**: Targeted lifestyle interventions + physician consultation within 2–4 weeks.
   - 🔴 **Emergency**: Immediate medical care recommended (e.g. glucose > 300 mg/dL with dehydration, BP >= 180/120 mmHg hypertensive urgency, acute anginal chest tightness).

4. **Condition-Tailored Dietary Guidance**:
   - **Foods to limit for Diabetes**: Sugary drinks, refined flour (maida), white rice in large portions, sweets, fruit juices.
   - **Foods to limit for Heart Disease**: Deep-fried foods, trans fats, excess sodium/salt, processed meats, high-saturated-fat items.
   - **Foods to favor**: Whole grains, legumes & lentils, green leafy vegetables, nuts & seeds, omega-3 rich fish, high-fiber options.
   - Visual plate method breakdown.

5. **Exercise, Sleep & Stress Protocols**:
   - Aerobic activity targets (150 min/wk), GLUT4 post-meal walks, and cardiac cautions for exertional pain or stage 2 hypertension.
   - Restorative sleep hygiene (7–8.5 hrs) and Obstructive Sleep Apnea (OSA) screening warnings.
   - Diaphragmatic 4-7-8 breathing and cortisol regulation.

6. **Doctor Collaboration & Follow-Up Tests**:
   - Suggests specific tests (repeat HbA1c in 3 months, fasting lipids, OGTT, hs-CRP, 12-lead ECG, urine microalbumin).
   - One-click **Print / Export Medical Summary** for consultations.

7. **Clear Medical Non-Diagnosis Disclaimer**:
   - Clear transparency notice stating this is an informational clinical decision-support tool, not a medical diagnosis.

---

## 🧠 Machine Learning Architecture & Verified Datasets

Located in `ml_training/`:
- **Verified Sources**:
  1. *UCI Cleveland Heart Disease Dataset* (`heart_disease_uci.csv`)
  2. *NIDDK Pima Indians Diabetes Dataset* (`diabetes_niddk.csv`)
  3. *CardioDiab Multi-Marker Clinical Cohort* (`clinical_multimarker_cohort.csv`) formatted per ADA and ACC/AHA guidelines.
- **Trained Models**:
  - `diabetes_model.joblib`: Random Forest Classifier with balanced class weights (**99.8% Test Accuracy**, **1.000 ROC-AUC**).
  - `heart_disease_model.joblib`: Gradient Boosting Classifier (**89.2% Test Accuracy**, **0.977 ROC-AUC**).

To re-train:
```bash
python ml_training/fetch_dataset.py
python ml_training/train_models.py
```

---

## 🗄️ Database Architecture (Supabase / PostgreSQL)

Database schemas are defined in `supabase/schema.sql`:
- `patient_reports`: Uploaded documents and raw extracted OCR text.
- `extracted_biomarkers`: Values, units, reference bounds, and clinical status.
- `mcq_responses`: User answers and symptomatic risk flags.
- `risk_assessments`: Urgency scores, diabetes/CVD probability, and nutrition plans.

To configure Supabase:
1. Create a project at [supabase.com](https://supabase.com).
2. Execute `supabase/schema.sql` in the Supabase SQL editor.
3. Add credentials to `backend/.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-or-service-role-key
   ```
*(Note: If no credentials are set, CardioDiab automatically uses built-in local persistence so it runs seamlessly out of the box!)*

---

## 🚀 How to Run

### Method 1: One-Click Python Launcher
```bash
python start.py
```
This concurrently starts:
- **FastAPI Backend**: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`)
- **React Frontend**: `http://localhost:5173`

### Method 2: Manual Terminal Startup

**Terminal 1 (Backend):**
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## 🧪 Testing

Run backend unit and integration tests:
```bash
pytest backend/tests/test_api.py -v
```
Build frontend production bundle:
```bash
cd frontend
npm run build
```
