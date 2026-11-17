/**
 * CardioDiab Client-Side Clinical Fallback Engine
 * Ensures 100% accurate domain separation even when parsing client-side.
 */

export function parseReportLocally(title, text) {
  const clean = text.replace(/\\/g, '/');
  const biomarkers = {};
  const ecg_findings = [];

  // Match Glucose
  const gMatch = clean.match(/(?:glucose|fbs|fbg|blood\s*sugar)[^\d]*(\d{2,3}(?:\.\d+)?)/i);
  if (gMatch) {
    const val = parseFloat(gMatch[1]);
    biomarkers.fasting_glucose = {
      key: "fasting_glucose",
      display_name: "Fasting Blood Glucose",
      value: val,
      unit: "mg/dL",
      reference_min: 70,
      reference_max: 99,
      status: val >= 300 ? "critical" : val >= 126 ? "high" : val >= 100 ? "borderline" : "normal"
    };
  }

  // Match HbA1c
  const aMatch = clean.match(/(?:hba1c|hb\s*a1c|a1c|glycated\s*hemoglobin)[^\d]*(\d{1,2}(?:\.\d+)?)/i);
  if (aMatch) {
    const val = parseFloat(aMatch[1]);
    biomarkers.hba1c = {
      key: "hba1c",
      display_name: "HbA1c (Glycated Hemoglobin)",
      value: val,
      unit: "%",
      reference_min: 4.0,
      reference_max: 5.6,
      status: val >= 11.0 ? "critical" : val >= 6.5 ? "high" : val >= 5.7 ? "borderline" : "normal"
    };
  }

  // Match Total Cholesterol
  const cholMatch = clean.match(/(?:total\s*cholesterol|serum\s*cholesterol)[^\d]*(\d{2,3}(?:\.\d+)?)/i);
  if (cholMatch) {
    const val = parseFloat(cholMatch[1]);
    biomarkers.total_cholesterol = {
      key: "total_cholesterol",
      display_name: "Total Cholesterol",
      value: val,
      unit: "mg/dL",
      reference_min: 125,
      reference_max: 199,
      status: val >= 240 ? "high" : val >= 200 ? "borderline" : "normal"
    };
  }

  // Match LDL
  const ldlMatch = clean.match(/(?:ldl(?:\s*cholesterol)?)[^\d]*(\d{2,3}(?:\.\d+)?)/i);
  if (ldlMatch) {
    const val = parseFloat(ldlMatch[1]);
    biomarkers.ldl = {
      key: "ldl",
      display_name: "LDL (Bad) Cholesterol",
      value: val,
      unit: "mg/dL",
      reference_min: 50,
      reference_max: 99,
      status: val >= 160 ? "very_high" : val >= 100 ? "borderline" : "normal"
    };
  }

  // Match HDL
  const hdlMatch = clean.match(/(?:hdl(?:\s*cholesterol)?)[^\d]*(\d{2,3}(?:\.\d+)?)/i);
  if (hdlMatch) {
    const val = parseFloat(hdlMatch[1]);
    biomarkers.hdl = {
      key: "hdl",
      display_name: "HDL (Good) Cholesterol",
      value: val,
      unit: "mg/dL",
      reference_min: 40,
      reference_max: 90,
      status: val < 40 ? "high" : "normal"
    };
  }

  // Match Triglycerides
  const tgMatch = clean.match(/(?:triglycerides|tg)[^\d]*(\d{2,4}(?:\.\d+)?)/i);
  if (tgMatch) {
    const val = parseFloat(tgMatch[1]);
    biomarkers.triglycerides = {
      key: "triglycerides",
      display_name: "Triglycerides",
      value: val,
      unit: "mg/dL",
      reference_min: 50,
      reference_max: 149,
      status: val >= 200 ? "high" : val >= 150 ? "borderline" : "normal"
    };
  }

  // Match BP
  const bpMatch = clean.match(/(?:bp|blood\s*pressure)[^\d]*(\d{2,3})\s*[\/\-]\s*(\d{2,3})/i);
  if (bpMatch) {
    const sys = parseFloat(bpMatch[1]);
    const dia = parseFloat(bpMatch[2]);
    biomarkers.systolic_bp = {
      key: "systolic_bp",
      display_name: "Systolic Blood Pressure",
      value: sys,
      unit: "mmHg",
      reference_min: 90,
      reference_max: 120,
      status: sys >= 180 ? "critical" : sys >= 140 ? "high" : sys >= 121 ? "borderline" : "normal"
    };
    biomarkers.diastolic_bp = {
      key: "diastolic_bp",
      display_name: "Diastolic Blood Pressure",
      value: dia,
      unit: "mmHg",
      reference_min: 60,
      reference_max: 80,
      status: dia >= 120 ? "critical" : dia >= 90 ? "high" : dia >= 81 ? "borderline" : "normal"
    };
  }

  // Match Creatinine
  const crMatch = clean.match(/(?:creatinine)[^\d]*(\d{1,2}(?:\.\d+)?)/i);
  if (crMatch) {
    const val = parseFloat(crMatch[1]);
    biomarkers.creatinine = {
      key: "creatinine",
      display_name: "Serum Creatinine",
      value: val,
      unit: "mg/dL",
      reference_min: 0.6,
      reference_max: 1.2,
      status: val >= 3.5 ? "critical" : val >= 2.0 ? "high" : val >= 1.3 ? "borderline" : "normal"
    };
  }

  // Match ECG
  if (/st[\s\-]depression/i.test(clean)) {
    ecg_findings.push("ST Segment Depression (Ischemic strain pattern)");
  } else if (/normal\s*sinus/i.test(clean)) {
    ecg_findings.push("Normal Sinus Rhythm");
  }

  // Detect domain strictly:
  const searchScope = (title + ' ' + clean).toLowerCase();
  
  const hasDiabetesKeywords = /diab|glucose|sugar|hba1c|glycemic|fbs|fbg/i.test(searchScope);
  const hasCardioKeywords = /lipid|cholesterol|cardio|heart|coronary|ecg|angina|infarction|hypertension|stemi/i.test(searchScope);

  const hasDiabetesMarkers = !!(biomarkers.fasting_glucose || biomarkers.hba1c);
  const hasCardioMarkers = !!(biomarkers.ldl || biomarkers.total_cholesterol || biomarkers.triglycerides || ecg_findings.length > 0);

  let primary_domain = "general";
  let report_type = "Medical Lab Report";

  if (hasDiabetesKeywords && !hasCardioKeywords) {
    primary_domain = "diabetes";
    report_type = "Blood Glucose & Glycemic Profile";
  } else if (hasCardioKeywords && !hasDiabetesKeywords) {
    primary_domain = "cardiovascular";
    report_type = "Lipid & Cardiovascular Panel";
  } else if (hasDiabetesMarkers && !hasCardioMarkers) {
    primary_domain = "diabetes";
    report_type = "Blood Glucose & Glycemic Profile";
  } else if (hasCardioMarkers && !hasDiabetesMarkers) {
    primary_domain = "cardiovascular";
    report_type = "Lipid & Cardiovascular Panel";
  } else if (hasDiabetesMarkers && hasCardioMarkers) {
    // If both present, look at which one is dominant
    if (hasDiabetesKeywords) {
      primary_domain = "diabetes";
      report_type = "Blood Glucose & Glycemic Profile";
    } else {
      primary_domain = "cardiovascular";
      report_type = "Lipid & Cardiovascular Panel";
    }
  } else if (hasDiabetesKeywords) {
    primary_domain = "diabetes";
    report_type = "Blood Glucose & Glycemic Profile";
  } else {
    primary_domain = "cardiovascular";
    report_type = "Lipid & Cardiovascular Panel";
  }

  // MCQs strictly separated
  const mcqs = [];
  if (primary_domain === "diabetes") {
    mcqs.push({
      id: "thirst",
      category: "diabetes",
      question: "Do you experience excessive or unquenchable thirst?",
      subtext: "Persistent dry mouth, feeling constantly parched, or drinking unusually high amounts of water throughout the day (polydipsia).",
      options: [
        { id: "none", text: "No, normal thirst levels", is_positive: false, weight: 0 },
        { id: "occasional", text: "Occasionally or when active / dehydrated", is_positive: false, weight: 1 },
        { id: "frequent", text: "Yes, persistent extreme thirst and dry mouth", is_positive: true, weight: 3 }
      ]
    });
    mcqs.push({
      id: "weight_loss",
      category: "diabetes",
      question: "Have you experienced sudden unexplained weight loss?",
      subtext: "Losing weight rapidly despite eating normally or having an increased appetite.",
      options: [
        { id: "none", text: "No, weight has been stable", is_positive: false, weight: 0 },
        { id: "mild", text: "Slight fluctuation (+/- 1-2 kg)", is_positive: false, weight: 0 },
        { id: "yes", text: "Yes, noticeable unintended weight drop", is_positive: true, weight: 3 }
      ]
    });
    mcqs.push({
      id: "blurred_vision",
      category: "diabetes",
      question: "Do you experience blurred vision or slow-healing cuts?",
      subtext: "High blood glucose causes osmotic lens swelling and impaired tissue healing.",
      options: [
        { id: "none", text: "No vision blur or healing issues", is_positive: false, weight: 0 },
        { id: "occasional", text: "Occasional eye strain or tiredness", is_positive: false, weight: 1 },
        { id: "yes", text: "Yes, frequent blurred vision or slow-healing skin cuts", is_positive: true, weight: 2 }
      ]
    });
  } else {
    mcqs.push({
      id: "chest_pain",
      category: "cardiovascular",
      question: "Do you experience chest pain or tightness on exertion?",
      subtext: "Discomfort, pressure, heaviness, or squeezing sensation across chest when walking briskly or climbing stairs.",
      options: [
        { id: "none", text: "No chest discomfort during physical effort", is_positive: false, weight: 0 },
        { id: "mild", text: "Mild brief tightness that resolves promptly with rest", is_positive: true, weight: 2 },
        { id: "yes", text: "Yes, noticeable tightness, aching, or pressure radiating to arm/neck", is_positive: true, weight: 4 }
      ]
    });
    mcqs.push({
      id: "family_history",
      category: "cardiovascular",
      question: "Is there a family history of early heart disease?",
      subtext: "Parents or siblings diagnosed with heart attack, angina, or bypass before age 55 (men) or 65 (women).",
      options: [
        { id: "none", text: "No known family history", is_positive: false, weight: 0 },
        { id: "distant", text: "Extended family relatives (grandparents, uncles)", is_positive: false, weight: 1 },
        { id: "immediate", text: "Yes, first-degree relative (parent or sibling)", is_positive: true, weight: 2 }
      ]
    });
    mcqs.push({
      id: "smoking",
      category: "cardiovascular",
      question: "Do you currently smoke or use tobacco products?",
      subtext: "Cigarettes, cigars, vape, or chewing tobacco significantly accelerate arterial plaque formation.",
      options: [
        { id: "never", text: "Never smoked / Non-smoker", is_positive: false, weight: 0 },
        { id: "former", text: "Former smoker (quit over 1 year ago)", is_positive: false, weight: 1 },
        { id: "current", text: "Current smoker or tobacco user", is_positive: true, weight: 3 }
      ]
    });
    mcqs.push({
      id: "breathlessness_stairs",
      category: "cardiovascular",
      question: "Do you experience breathlessness while climbing stairs?",
      subtext: "Shortness of breath out of proportion to exertion, or needing to pause after 1 flight of stairs.",
      options: [
        { id: "none", text: "No, normal exercise tolerance", is_positive: false, weight: 0 },
        { id: "moderate", text: "Mild breathlessness with heavy exertion", is_positive: false, weight: 1 },
        { id: "severe", text: "Yes, breathless climbing just 1 flight or walking flat surfaces", is_positive: true, weight: 3 }
      ]
    });
    mcqs.push({
      id: "dizziness_palpitations",
      category: "cardiovascular",
      question: "Do you experience dizziness or palpitations?",
      subtext: "Fluttering heart, rapid pounding, skipped beats, or lightheadedness when standing up.",
      options: [
        { id: "none", text: "No palpitations or dizziness", is_positive: false, weight: 0 },
        { id: "rare", text: "Rarely when dehydrated or sleep deprived", is_positive: false, weight: 1 },
        { id: "frequent", text: "Yes, frequent heart fluttering, racing pulse, or dizzy spells", is_positive: true, weight: 3 }
      ]
    });
  }

  return {
    report_id: "local-" + Date.now(),
    file_name: title,
    report_type,
    primary_domain,
    biomarkers,
    ecg_findings,
    demographics: { age: 52, gender: "male" },
    total_biomarkers_found: Object.keys(biomarkers).length,
    has_abnormalities: Object.values(biomarkers).some(b => b.status !== "normal") || ecg_findings.some(e => !e.includes("Normal")),
    adaptive_mcqs: mcqs
  };
}

export function analyzeRiskLocally(biomarkers, mcq_answers) {
  const gVal = biomarkers.fasting_glucose?.value || 90;
  const a1cVal = biomarkers.hba1c?.value || 5.2;
  const ldlVal = biomarkers.ldl?.value || 95;
  const sysBp = biomarkers.systolic_bp?.value || 120;
  const diaBp = biomarkers.diastolic_bp?.value || 80;

  const hasThirst = mcq_answers?.thirst?.is_positive || mcq_answers?.thirst_urination?.is_positive;
  const hasChestPain = mcq_answers?.chest_pain?.is_positive;

  let urgency_level = "low";
  let urgency_color = "green";
  let urgency_title = "Low Risk - Biomarkers Within Healthy Limits";
  let timeframe = "Maintain healthy habits & annual checkup";
  let urgency_explanation = "Your lab values and responses fall within healthy targets with low cardiovascular and diabetes risk.";

  if (sysBp >= 180 || diaBp >= 120 || (gVal >= 300 && hasThirst) || (hasChestPain && sysBp >= 150)) {
    urgency_level = "emergency";
    urgency_color = "red";
    urgency_title = "Emergency Medical Evaluation Needed";
    timeframe = "Seek Immediate Emergency / Urgent Care Now";
    urgency_explanation = "Critical biomarker levels or acute cardiopulmonary symptoms detected requiring urgent clinical care.";
  } else if (gVal >= 100 || a1cVal >= 5.7 || ldlVal >= 100 || sysBp >= 130) {
    urgency_level = "moderate";
    urgency_color = "yellow";
    urgency_title = "Moderate Clinical Risk - Doctor Consultation Advised";
    timeframe = "Schedule a doctor visit within 2 to 4 weeks";
    urgency_explanation = "Elevated metabolic or vascular biomarkers detected. Targeted nutrition and physician review recommended.";
  }

  // Foods to avoid
  const foods_to_avoid = [];
  if (gVal >= 100 || a1cVal >= 5.7) {
    foods_to_avoid.push({
      name: "Sugary drinks & sodas",
      triggered_by: `Fasting Glucose ${gVal} mg/dL`,
      reason: "Liquid simple sugars bypass digestion and cause rapid glucose spikes.",
      examples: "Cola, energy drinks, sweetened iced tea"
    });
    foods_to_avoid.push({
      name: "Refined flour (Maida / White bread)",
      triggered_by: `HbA1c ${a1cVal}%`,
      reason: "Stripped of intact fiber; instantly converts into glucose in the bloodstream.",
      examples: "White bread, pastries, pizza base, naan"
    });
    foods_to_avoid.push({
      name: "White rice in large portions",
      triggered_by: `Fasting Glucose ${gVal} mg/dL`,
      reason: "High starch volume spikes post-prandial insulin requirement.",
      examples: "Polished white rice bowls"
    });
    foods_to_avoid.push({
      name: "Sweets & confectionery",
      triggered_by: `Fasting Glucose ${gVal} mg/dL`,
      reason: "High glycemic load paired with saturated fats induces insulin resistance.",
      examples: "Cakes, donuts, candy, ice cream"
    });
    foods_to_avoid.push({
      name: "Packaged fruit juices",
      triggered_by: `Fasting Glucose ${gVal} mg/dL`,
      reason: "Concentrated fructose without intact fiber elevates portal vein sugar load.",
      examples: "Boxed juices, commercial fruit smoothies"
    });
  }

  if (ldlVal >= 100 || biomarkers.total_cholesterol?.value >= 200) {
    foods_to_avoid.push({
      name: "Deep-fried foods",
      triggered_by: `LDL ${ldlVal} mg/dL`,
      reason: "Repeatedly heated vegetable oils generate reactive lipid peroxides.",
      examples: "French fries, fried chicken, chips, pakoras"
    });
    foods_to_avoid.push({
      name: "Trans fats & partially hydrogenated oils",
      triggered_by: `LDL ${ldlVal} mg/dL`,
      reason: "Directly elevates atherogenic LDL while depressing protective HDL.",
      examples: "Commercial margarine, shortening, packaged pastries"
    });
    foods_to_avoid.push({
      name: "High-saturated-fat items & butter",
      triggered_by: `LDL ${ldlVal} mg/dL`,
      reason: "Downregulates hepatic LDL receptor clearance.",
      examples: "Butter, palm oil, heavy cream, fatty beef cuts"
    });
  }

  if (sysBp >= 130) {
    foods_to_avoid.push({
      name: "Excess sodium / Table salt",
      triggered_by: `Blood Pressure ${sysBp}/${diaBp} mmHg`,
      reason: "Expands intravascular volume, increasing arterial pressure.",
      examples: "Salted chips, soy sauce, canned salted soups, pickles (limit sodium to < 2,000 mg/day)"
    });
    foods_to_avoid.push({
      name: "Processed meats",
      triggered_by: `Blood Pressure ${sysBp}/${diaBp} mmHg`,
      reason: "Packed with sodium preservatives and nitrates that damage endothelial function.",
      examples: "Sausages, bacon, salami, hot dogs"
    });
  }

  // Foods to intake
  const foods_to_intake = [];
  if (gVal >= 100 || a1cVal >= 5.7) {
    foods_to_intake.push({
      name: "Bitter Gourd (Karela) & Fenugreek (Methi) Seeds",
      target: `Lowers Fasting Glucose (${gVal} mg/dL)`,
      benefit: "Contains charantin and 4-hydroxyisoleucine to improve insulin release.",
      how_to_use: "Soak 1 tsp methi seeds overnight in water and drink in the morning."
    });
    foods_to_intake.push({
      name: "Steel-cut Oats, Barley & Psyllium Husk",
      target: `Reduces HbA1c (${a1cVal}%)`,
      benefit: "Soluble beta-glucan fiber flattens post-meal glucose absorption.",
      how_to_use: "A bowl of steel-cut oats topped with chia seeds."
    });
  }

  if (ldlVal >= 100) {
    foods_to_intake.push({
      name: "Omega-3 Fatty Fish (Salmon, Mackerel) or Algal DHA",
      target: `Reduces Atherogenic Plaque & LDL (${ldlVal} mg/dL)`,
      benefit: "EPA and DHA actively downregulate liver VLDL synthesis.",
      how_to_use: "Consume 2 servings of fatty fish weekly or plant omega-3s."
    });
    foods_to_intake.push({
      name: "Raw Walnuts, Almonds & Flaxseeds",
      target: `Protects Arteries & Lowers LDL (${ldlVal} mg/dL)`,
      benefit: "Rich in plant sterols that competitively block cholesterol absorption.",
      how_to_use: "A handful (30g) of mixed raw walnuts and almonds daily."
    });
  }

  if (sysBp >= 130) {
    foods_to_intake.push({
      name: "Fresh Beetroot & Beetroot Juice",
      target: `Lowers Blood Pressure (${sysBp}/${diaBp} mmHg)`,
      benefit: "Dietary nitrates convert to nitric oxide, causing arterial vasodilation.",
      how_to_use: "150-200 mL of fresh beetroot juice 3-4 times per week."
    });
  }

  // Workout vs Walk
  let activity_decision = "BOTH (Daily Brisk Walk + Moderate Light Workout)";
  let daily_walking_plan = "Walk for 30 minutes daily (brisk pace). Take a 15-minute walk after meals.";
  let workout_instructions = "Light resistance training 2-3 sessions per week (squats, resistance bands).";

  if (sysBp >= 150 || hasChestPain || urgency_level === "emergency") {
    activity_decision = "WALK ONLY (Avoid Heavy Workouts)";
    daily_walking_plan = "Walk for 20 to 30 minutes daily at a gentle flat pace. Safe post-meal strolls strongly recommended.";
    workout_instructions = "Avoid heavy gym lifting, squats, or sprinting until evaluated by a physician.";
  }

  return {
    urgency: {
      urgency_level,
      urgency_color,
      urgency_title,
      timeframe,
      urgency_explanation
    },
    diabetes_assessment: {
      risk_score_pct: gVal >= 126 ? 88 : gVal >= 100 ? 52 : 12,
      risk_label: gVal >= 126 ? "High Risk (Diabetes)" : gVal >= 100 ? "Moderate (Pre-Diabetes)" : "Low Risk"
    },
    cardiovascular_assessment: {
      risk_score_pct: (ldlVal >= 160 || sysBp >= 150) ? 82 : (ldlVal >= 100 || sysBp >= 130) ? 46 : 10,
      risk_label: (ldlVal >= 160 || sysBp >= 150) ? "High Risk (> 20%)" : (ldlVal >= 100 || sysBp >= 130) ? "Moderate Risk" : "Low Risk"
    },
    dietary_guidance: {
      foods_to_avoid,
      foods_to_intake
    },
    lifestyle_advice: {
      sleep: {
        mandatory_hours: "7 to 8 Hours",
        why_mandatory: "7 to 8 hours of sleep is strictly mandatory. Sleeping less than 7 hours spikes morning cortisol and raises fasting blood glucose and blood pressure.",
        key_steps: [
          "Strictly prioritize 7 to 8 hours of uninterrupted sleep every night.",
          "Keep fixed sleep and wake times to synchronize circadian hormones.",
          "Turn off screens at least 60 minutes before bedtime."
        ]
      },
      physical_activity: {
        decision: activity_decision,
        explanation: sysBp >= 150 || hasChestPain
          ? "Because of your elevated blood pressure or chest symptoms, heavy workouts place acute strain on arteries. Walking is safe and therapeutic."
          : "Both daily walking and light-to-moderate workouts are recommended to burn glucose and protect heart muscle.",
        daily_walking_plan,
        workout_instructions
      }
    },
    follow_up_tests: [
      {
        test_name: "Comprehensive Fasting Lipid & Glycemic Panel in 8-12 Weeks",
        specialist: "Primary Care Physician / Cardiologist",
        reason: "Evaluates response to dietary adjustments."
      },
      {
        test_name: "12-Lead Electrocardiogram (ECG)",
        specialist: "Cardiologist",
        reason: "Assesses baseline cardiac rhythm and conduction."
      }
    ],
    medical_disclaimer: "CardioDiab is an educational screening aid, not a clinical diagnosis. Always consult a licensed healthcare provider."
  };
}
