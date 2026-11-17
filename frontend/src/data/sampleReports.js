/**
 * Pre-configured Clinical Benchmark Reports for CardioDiab
 * Embedded client-side so presets are immediately available even before network handshake.
 */

export const PRESET_SAMPLE_REPORTS = [
  {
    id: "sample-diabetic-emergency",
    title: "Severe Hyperglycemia & Acute Metabolic Risk (Emergency)",
    badge: "Emergency 🔴",
    category: "Blood Glucose & Glycemic Profile",
    primary_domain: "diabetes",
    text: `LABORATORY REPORT - METABOLIC ASSESSMENT
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

Physician Clinical Notes: Patient reports persistent intense thirst, unquenchable dry mouth.
Complains of mild mental fogginess and severe fatigue.`
  },
  {
    id: "sample-cardio-lipid",
    title: "Atherogenic Dyslipidemia & Hypertension (Moderate/High)",
    badge: "Moderate Risk 🟡",
    category: "Lipid Profile & Cardiovascular Panel",
    primary_domain: "cardiovascular",
    text: `CARDIOVASCULAR HEALTH PANEL
Patient Age: 58 Years | Gender: Male
Lipid Profile & Resting Vitals

INVESTIGATION                    RESULT       REFERENCE RANGE   UNIT
---------------------------------------------------------------------
Total Cholesterol                268.0        125.0 - 199.0     mg/dL  [HIGH]
LDL (Bad) Cholesterol            176.0        50.0 - 99.0       mg/dL  [VERY HIGH]
HDL (Good) Cholesterol           34.0         40.0 - 90.0       mg/dL  [LOW / AT RISK]
Serum Triglycerides              245.0        50.0 - 149.0      mg/dL  [HIGH]
Blood Pressure                   156/96       < 120 / < 80      mmHg   [STAGE 2 HYPERTENSION]
Resting Heart Rate               88           60 - 100          bpm    [NORMAL]
Resting ECG Summary              ST Segment Depression in V4-V6 leads (Ischemic strain pattern)

Clinical Notes: Patient reports noticeable tightness in mid-chest when walking uphill or briskly.
History of smoking (1 pack/day for 20 years). Strong maternal history of myocardial infarction.`
  },
  {
    id: "sample-optimal-wellness",
    title: "Healthy Metabolic & Cardiovascular Profile (Low Risk)",
    badge: "Low Risk 🟢",
    category: "Annual Wellness Health Panel",
    primary_domain: "general",
    text: `EXECUTIVE ANNUAL HEALTH CHECK
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

Clinical Notes: Patient exercises regularly, non-smoker, no exertional chest symptoms.`
  },
  {
    id: "sample-prediabetes-metabolic",
    title: "Metabolic Syndrome & Pre-Diabetes (Moderate)",
    badge: "Moderate Risk 🟡",
    category: "Comprehensive Health & Metabolic Panel",
    primary_domain: "comprehensive",
    text: `METABOLIC PROFILE & BIOCHEMICAL SCREEN
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

Clinical Notes: Sedentary lifestyle, high carbohydrate dietary intake, occasional fatigue.`
  }
];
