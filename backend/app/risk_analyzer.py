"""
CardioDiab Clinical Risk Engine & Evidence-Based Lifestyle Synthesizer
Generates:
1. Urgency Traffic Light (Low 🟢, Moderate 🟡, Emergency 🔴)
2. Plain-language clinical explanations
3. Report-Specific Tailored Dietary Guidance:
   - What to Avoid (specifically triggered by abnormal biomarkers in the report)
   - What to Intake (targeted foods and nutrients to directly improve detected abnormalities)
4. Sleep & Physical Activity Prescription:
   - Exactly how much sleep is MANDATORY and why for their condition
   - Explicit decision on whether the person should WORKOUT or WALK for some time
5. Follow-up medical diagnostic tests
6. Formal Medical Disclaimer
"""

from typing import Dict, Any, List

def compute_urgency_triage(biomarkers: Dict[str, Any], mcq_answers: Dict[str, Any], ecg_findings: List[str]) -> Dict[str, Any]:
    """
    Evaluates acute red flags vs chronic moderate risk vs low risk baseline.
    Returns urgency_level, urgency_color, explanation, and reason list.
    """
    red_flags = []
    moderate_flags = []
    
    # 1. Acute Cardiovascular Emergency Checks
    sys_bp = biomarkers.get("systolic_bp", {}).get("value", 0)
    dia_bp = biomarkers.get("diastolic_bp", {}).get("value", 0)
    
    if sys_bp >= 180 or dia_bp >= 120:
        red_flags.append(f"Hypertensive Crisis alert: Blood pressure is dangerously elevated at {int(sys_bp)}/{int(dia_bp)} mmHg.")
    
    has_exertion_chest_pain = mcq_answers.get("chest_pain", {}).get("is_positive", False)
    if has_exertion_chest_pain and (sys_bp >= 150 or biomarkers.get("ldl", {}).get("value", 0) >= 160 or biomarkers.get("total_cholesterol", {}).get("value", 0) >= 240):
        red_flags.append("Anginal warning: Active chest tightness/pain on exertion combined with elevated blood pressure or lipid values.")
        
    for finding in ecg_findings:
        if "ST Segment Elevation" in finding or "critical" in finding.lower():
            red_flags.append(f"Acute ECG abnormality: {finding}")
        elif "ST Segment Depression" in finding or "T-Wave Inversion" in finding:
            moderate_flags.append(f"ECG ischemic strain pattern detected: {finding}")

    # 2. Acute Glycemic Emergency Checks
    glucose = biomarkers.get("fasting_glucose", {}).get("value", 0)
    hba1c = biomarkers.get("hba1c", {}).get("value", 0)
    has_thirst = mcq_answers.get("thirst", {}).get("is_positive", False) or mcq_answers.get("thirst_urination", {}).get("is_positive", False)
    has_weight_loss = mcq_answers.get("weight_loss", {}).get("is_positive", False)
    
    if glucose >= 300:
        if has_thirst or has_weight_loss:
            red_flags.append(f"Severe Hyperglycemic Risk: Blood glucose is critically elevated at {glucose} mg/dL alongside active dehydration/weight loss symptoms.")
        else:
            red_flags.append(f"Severely elevated blood glucose ({glucose} mg/dL) posing acute metabolic decompensation risk.")
            
    # 3. Renal Emergency Checks
    creatinine = biomarkers.get("creatinine", {}).get("value", 0)
    if creatinine >= 3.5:
        red_flags.append(f"Marked Renal Impairment Alert: Serum creatinine is critically high at {creatinine} mg/dL.")
    elif creatinine >= 1.4:
        moderate_flags.append(f"Elevated serum creatinine ({creatinine} mg/dL) suggests reduced kidney filtration.")

    # 4. Moderate Flags (Chronic Risk Factors)
    if 100 <= glucose < 300:
        if glucose >= 126:
            moderate_flags.append(f"Fasting blood glucose ({glucose} mg/dL) is in the diabetic threshold (normal is under 100 mg/dL).")
        else:
            moderate_flags.append(f"Fasting blood glucose ({glucose} mg/dL) indicates pre-diabetes (impaired fasting glucose).")
            
    if hba1c >= 5.7:
        if hba1c >= 6.5:
            moderate_flags.append(f"HbA1c level of {hba1c}% indicates persistent clinical hyperglycemia over the past 90 days.")
        else:
            moderate_flags.append(f"HbA1c level of {hba1c}% falls in the pre-diabetic range (5.7% - 6.4%).")
            
    ldl = biomarkers.get("ldl", {}).get("value", 0)
    if ldl >= 130:
        moderate_flags.append(f"LDL 'bad' cholesterol ({ldl} mg/dL) is elevated above optimal cardioprotective targets.")
        
    trig = biomarkers.get("triglycerides", {}).get("value", 0)
    if trig >= 180:
        moderate_flags.append(f"Triglycerides ({trig} mg/dL) are significantly elevated, which promotes arterial atheroma.")
        
    hdl = biomarkers.get("hdl", {}).get("value", 999)
    if 0 < hdl < 40:
        moderate_flags.append(f"HDL 'protective' cholesterol ({hdl} mg/dL) is low, reducing vascular protection.")
        
    if 130 <= sys_bp < 180 or 85 <= dia_bp < 120:
        moderate_flags.append(f"Blood pressure ({int(sys_bp)}/{int(dia_bp)} mmHg) reflects Stage 1 or Stage 2 Hypertension.")
        
    if mcq_answers.get("smoking", {}).get("is_positive", False):
        moderate_flags.append("Active tobacco smoking significantly multiplies the risk of arterial plaque rupture.")
        
    if mcq_answers.get("family_history", {}).get("is_positive", False):
        moderate_flags.append("First-degree family history of cardiovascular disease elevates your baseline genetic susceptibility.")
        
    if mcq_answers.get("breathlessness_stairs", {}).get("is_positive", False):
        moderate_flags.append("Exertional shortness of breath when climbing stairs indicates reduced cardiopulmonary reserve.")

    # Triage decision logic
    if red_flags:
        return {
            "urgency_level": "emergency",
            "urgency_color": "red",
            "urgency_icon": "🔴",
            "urgency_title": "Emergency Medical Evaluation Needed",
            "timeframe": "Immediate (Seek Urgent Care / Emergency Room Now)",
            "urgency_explanation": (
                "Critical biomarker levels or acute warning signs detected that require immediate clinical evaluation. "
                + " ".join(red_flags)
            ),
            "reasons": red_flags + moderate_flags
        }
    elif moderate_flags:
        return {
            "urgency_level": "moderate",
            "urgency_color": "yellow",
            "urgency_icon": "🟡",
            "urgency_title": "Moderate Clinical Risk - Medical Consultation Recommended",
            "timeframe": "Schedule an in-person doctor appointment within 2 to 4 weeks",
            "urgency_explanation": (
                "Your lab parameters and symptoms show early to moderate markers of metabolic or cardiovascular strain. "
                "Targeted dietary adjustments and proactive medical review can reverse or halt disease progression before complications arise. "
                + " ".join(moderate_flags[:3])
            ),
            "reasons": moderate_flags
        }
    else:
        return {
            "urgency_level": "low",
            "urgency_color": "green",
            "urgency_icon": "🟢",
            "urgency_title": "Low Risk - Biomarkers Within Healthy Limits",
            "timeframe": "Maintain current healthy habits & routine annual checkup",
            "urgency_explanation": (
                "Your extracted lab values, lipid panel, blood sugar indicators, and questionnaire responses show low risk "
                "for overt diabetes and cardiovascular disease. Continuing balanced nutrition, regular aerobic activity, "
                "and restorative sleep will keep your metabolic and vascular health optimal."
            ),
            "reasons": ["All measured biomarkers fall within recommended target reference ranges."]
        }

def build_dietary_guidance(biomarkers: Dict[str, Any], urgency: str) -> Dict[str, Any]:
    """
    Dynamically synthesizes report-specific dietary recommendations:
    - Exactly WHAT TO AVOID based on the specific elevated biomarkers found
    - Exactly WHAT TO INTAKE tailored to improve those specific abnormal markers
    """
    glucose_val = biomarkers.get("fasting_glucose", {}).get("value", 0)
    hba1c_val = biomarkers.get("hba1c", {}).get("value", 0)
    ldl_val = biomarkers.get("ldl", {}).get("value", 0)
    chol_val = biomarkers.get("total_cholesterol", {}).get("value", 0)
    trig_val = biomarkers.get("triglycerides", {}).get("value", 0)
    sys_bp = biomarkers.get("systolic_bp", {}).get("value", 0)
    dia_bp = biomarkers.get("diastolic_bp", {}).get("value", 0)
    creatinine_val = biomarkers.get("creatinine", {}).get("value", 0)

    has_glycemic_issue = glucose_val >= 100 or hba1c_val >= 5.7
    has_lipid_issue = ldl_val >= 100 or chol_val >= 200 or trig_val >= 150
    has_bp_issue = sys_bp >= 130 or dia_bp >= 85
    has_kidney_issue = creatinine_val >= 1.3

    is_all_normal = not (has_glycemic_issue or has_lipid_issue or has_bp_issue or has_kidney_issue)

    # 1. SPECIFIC FOODS TO AVOID (Report-Driven)
    foods_to_avoid = []

    # Blood Sugar Triggers
    if has_glycemic_issue:
        trigger_label = f"Fasting Glucose {glucose_val} mg/dL" if glucose_val >= 100 else f"HbA1c {hba1c_val}%"
        foods_to_avoid.append({
            "name": "Sugary drinks & sodas",
            "triggered_by": trigger_label,
            "badge": "Blood Sugar Spike",
            "category": "diabetes",
            "reason": f"Liquid simple sugars bypass digestion and cause rapid glucose spikes directly elevating your {trigger_label}.",
            "examples": "Colas, packaged sweetened teas, energy drinks, syrups, sweetened lemonade"
        })
        foods_to_avoid.append({
            "name": "Refined flour (Maida / White bread / Bakery items)",
            "triggered_by": trigger_label,
            "badge": "High Glycemic Index",
            "category": "diabetes",
            "reason": "Stripped of intact fiber; instantly hydrolyzes to simple glucose in your upper intestine.",
            "examples": "White sandwich bread, pastries, pizza bases, cookies, naan made of refined flour"
        })
        foods_to_avoid.append({
            "name": "White rice in large portions",
            "triggered_by": trigger_label,
            "badge": "High Starch Load",
            "category": "diabetes",
            "reason": "Large starch volumes overwhelm beta-cell insulin secretory capacity. Replace with smaller portions of brown rice or quinoa.",
            "examples": "Polished white rice bowls, instant white rice, puffed rice snacks"
        })
        foods_to_avoid.append({
            "name": "Sweets & confectionery",
            "triggered_by": trigger_label,
            "badge": "Insulin Resistance",
            "category": "diabetes",
            "reason": "High glycemic load paired with saturated fat induces muscle and hepatic insulin resistance.",
            "examples": "Cakes, donuts, candy, gulab jamun, halwa, ice cream"
        })
        foods_to_avoid.append({
            "name": "Packaged commercial fruit juices",
            "triggered_by": trigger_label,
            "badge": "Fructose Surge",
            "category": "diabetes",
            "reason": "Concentrated liquid fructose lacks protective cellular pulp, directly increasing liver fat synthesis.",
            "examples": "Boxed orange juice, apple juice concentrates, sweetened fruit cocktails"
        })

    # Lipid Profile Triggers
    if has_lipid_issue:
        lipid_trigger = f"LDL {ldl_val} mg/dL" if ldl_val >= 100 else (f"Triglycerides {trig_val} mg/dL" if trig_val >= 150 else f"Total Chol {chol_val} mg/dL")
        foods_to_avoid.append({
            "name": "Deep-fried foods",
            "triggered_by": lipid_trigger,
            "badge": "Atherogenic Peroxides",
            "category": "cardiovascular",
            "reason": f"Repeatedly heated vegetable oils generate reactive lipid peroxides that oxidize your elevated {lipid_trigger}.",
            "examples": "French fries, fried chicken, samosas, pakoras, potato chips, doughnuts"
        })
        foods_to_avoid.append({
            "name": "Trans fats & partially hydrogenated oils",
            "triggered_by": lipid_trigger,
            "badge": "Endothelial Damage",
            "category": "cardiovascular",
            "reason": "The most dangerous atherogenic fat: increases small dense LDL particles while decreasing protective HDL.",
            "examples": "Commercial margarine, shortening, packaged baked goods, frostings"
        })
        foods_to_avoid.append({
            "name": "High-saturated-fat items & butter",
            "triggered_by": lipid_trigger,
            "badge": "Elevates LDL",
            "category": "cardiovascular",
            "reason": "Downregulates hepatic LDL receptor clearance, leaving excess LDL circulating in your arteries.",
            "examples": "Butter, palm oil, heavy whipped cream, fatty cuts of red meat, excess ghee"
        })

    # Blood Pressure Triggers
    if has_bp_issue:
        bp_trigger = f"Blood Pressure {int(sys_bp)}/{int(dia_bp)} mmHg"
        foods_to_avoid.append({
            "name": "Excess sodium / Table salt",
            "triggered_by": bp_trigger,
            "badge": "Vascular Resistance",
            "category": "cardiovascular",
            "reason": f"Excess sodium increases plasma intravascular volume, exacerbating your elevated {bp_trigger}.",
            "examples": "Salted snacks, soy sauce, canned salted soups, pickles, commercial seasoning cubes (limit sodium to < 2,000 mg/day)"
        })
        foods_to_avoid.append({
            "name": "Processed meats",
            "triggered_by": bp_trigger,
            "badge": "Sodium & Nitrates",
            "category": "cardiovascular",
            "reason": "Contains heavy sodium preservatives and nitrates that impair endothelial nitric oxide-mediated vasodilation.",
            "examples": "Sausages, bacon, hot dogs, salami, pepperoni, cured ham"
        })

    # If completely normal baseline
    if is_all_normal:
        foods_to_avoid.append({
            "name": "Ultra-processed junk food & excess added sugars",
            "triggered_by": "Preventative Maintenance",
            "badge": "Longevity Protection",
            "category": "preventative",
            "reason": "Your report is currently in healthy target ranges. Avoiding ultra-processed foods ensures your markers stay normal long-term.",
            "examples": "Fast foods, soda, excessive refined snacks, trans-fat fried items"
        })

    # 2. SPECIFIC FOODS TO INTAKE (Report-Driven Target Nutrition)
    foods_to_intake = []

    if has_glycemic_issue:
        foods_to_intake.append({
            "name": "Bitter Gourd (Karela) & Fenugreek (Methi) Seeds",
            "target": f"Lowers Fasting Glucose ({glucose_val} mg/dL)",
            "benefit": "Contains active compounds charantin and 4-hydroxyisoleucine that stimulate glucose uptake by peripheral cells.",
            "how_to_use": "Soak 1 tsp methi seeds overnight in water and drink upon waking, or include stir-fried bitter gourd weekly."
        })
        foods_to_intake.append({
            "name": "Steel-cut Oats, Barley & Psyllium Husk",
            "target": f"Reduces HbA1c ({hba1c_val}%) and Glycemic Spikes",
            "benefit": "Abundant in beta-glucan soluble viscous fiber which forms a gelatinous mesh in the intestines, slowing carbohydrate transit.",
            "how_to_use": "Eat a morning bowl of rolled/steel-cut oats topped with chia seeds, or take 1 tsp psyllium husk with water before meals."
        })
        foods_to_intake.append({
            "name": "Non-starchy Cruciferous Vegetables (Broccoli, Spinach, Methi leaves)",
            "target": "Improves Insulin Receptor Sensitivity",
            "benefit": "Extremely low glycemic load, high magnesium content, and rich in alpha-lipoic acid for metabolic cellular protection.",
            "how_to_use": "Fill 50% of your lunch and dinner plate with steamed, sauteed, or fresh greens."
        })

    if has_lipid_issue:
        foods_to_intake.append({
            "name": "Omega-3 Fatty Fish (Salmon, Mackerel, Sardines) or Algal DHA",
            "target": f"Reduces Triglycerides ({trig_val} mg/dL) & Plaque Risk",
            "benefit": "EPA and DHA actively downregulate liver VLDL synthesis, lowering high serum triglycerides by 20-30%.",
            "how_to_use": "Consume 2 servings of fatty fish weekly, or 1,000 mg algae-based EPA/DHA supplement if vegetarian."
        })
        foods_to_intake.append({
            "name": "Raw Walnuts, Almonds & Ground Flaxseeds",
            "target": f"Reduces LDL Oxidation ({ldl_val} mg/dL) & Boosts HDL",
            "benefit": "Rich in alpha-linolenic acid (plant omega-3), vitamin E, and phytosterols that competitively inhibit intestinal cholesterol absorption.",
            "how_to_use": "A handful (30 grams) of unsalted mixed walnuts and almonds as an afternoon snack."
        })
        foods_to_intake.append({
            "name": "Crushed Raw Garlic & Extra Virgin Olive Oil",
            "target": "Cleanses Arterial Endothelium",
            "benefit": "Allicin in fresh garlic and oleocanthal in extra virgin olive oil reduce vascular inflammation and inhibit HMG-CoA reductase.",
            "how_to_use": "Drizzle 1-2 tbsp cold extra virgin olive oil over salads or cooked vegetables; consume 1 small crushed garlic clove daily."
        })

    if has_bp_issue:
        foods_to_intake.append({
            "name": "Fresh Beetroot & Beetroot Juice",
            "target": f"Dilates Arteries & Lowers Blood Pressure ({int(sys_bp)}/{int(dia_bp)})",
            "benefit": "Packed with dietary inorganic nitrates that your body converts into nitric oxide (NO), relaxing vascular smooth muscle.",
            "how_to_use": "Drink 150-200 mL of fresh beetroot juice or eat 1 steamed beetroot in salads 3-4 times weekly."
        })
        foods_to_intake.append({
            "name": "Potassium-Rich Foods (Avocados, Spinach, Bananas, Coconut Water)",
            "target": "Flushes Out Excess Sodium & Relaxes Arteries",
            "benefit": "Potassium blunts the hypertensive vascular effects of sodium by stimulating renal sodium excretion.",
            "how_to_use": "Include 1/2 avocado or a large bowl of steamed spinach daily."
        })
        foods_to_intake.append({
            "name": "Unsalted Pumpkin & Chia Seeds",
            "target": "Magnesium for Vascular Smooth Muscle Relaxation",
            "benefit": "Magnesium regulates cellular calcium ion channels in arterial walls, preventing chronic vasospasm.",
            "how_to_use": "Sprinkle 1-2 tbsp pumpkin seeds onto yogurt, oats, or salads daily."
        })

    if is_all_normal:
        foods_to_intake.append({
            "name": "Mediterranean Whole Food Plate (Legumes, Berries, Nuts, Olive Oil)",
            "target": "Preserves Optimal Biomarkers & Cardio-Metabolic Health",
            "benefit": "Provides continuous polyphenols, micronutrients, and dietary fiber to keep glucose and lipids in the ideal zone.",
            "how_to_use": "Maintain varied colorful whole foods across all meals."
        })

    # Backward compatibility mappings for test suite
    diabetes_limits = [f for f in foods_to_avoid if f.get("category") == "diabetes"]
    if not diabetes_limits:
        diabetes_limits = [
            {"name": "Sugary drinks & soda", "reason": "Rapidly absorbed simple sugars.", "examples": "Cola, sweetened tea"},
            {"name": "Refined flour (Maida / White bread)", "reason": "Rapidly converts to glucose.", "examples": "White bread, pastries"},
            {"name": "White rice in large portions", "reason": "High glycemic index starch.", "examples": "White rice bowls"},
            {"name": "Sweets & confectionery", "reason": "High glycemic load.", "examples": "Cakes, donuts"},
            {"name": "Packaged fruit juices", "reason": "Concentrated fructose.", "examples": "Boxed juices"}
        ]

    heart_limits = [f for f in foods_to_avoid if f.get("category") == "cardiovascular"]
    if not heart_limits:
        heart_limits = [
            {"name": "Deep-fried foods", "reason": "Oxidized oils cause vascular stress.", "examples": "Fries, chips"},
            {"name": "Trans fats & partially hydrogenated oils", "reason": "Directly elevates atherogenic LDL.", "examples": "Margarine, shortening"},
            {"name": "Excess sodium / table salt", "reason": "Expands intravascular volume.", "examples": "Salted snacks, canned soups"},
            {"name": "Processed meats", "reason": "High in nitrates and sodium.", "examples": "Sausages, bacon"},
            {"name": "High-saturated-fat items", "reason": "Downregulates hepatic LDL receptors.", "examples": "Butter, palm oil"}
        ]

    foods_to_favor_groups = [
        {
            "category": "Whole Grains & High-Fiber Options",
            "items": ["Rolled oats", "Quinoa", "Barley", "Brown rice", "Psyllium husk", "Chia seeds"],
            "benefits": "Soluble beta-glucan fiber flattens postprandial glucose curves and binds intestinal bile acids."
        },
        {
            "category": "Legumes, Pulses & Plant Proteins",
            "items": ["Lentils (dal)", "Chickpeas", "Black beans", "Edamame", "Kidney beans"],
            "benefits": "Low glycemic index, rich in prebiotic resistant starch for healthy gut microbiome signaling."
        },
        {
            "category": "Cardio-Protective Fats & Omega-3s",
            "items": ["Walnuts", "Almonds", "Salmon / Mackerel", "Extra virgin olive oil", "Flaxseeds"],
            "benefits": "ALA and EPA/DHA reduce serum triglycerides, prevent LDL oxidation, and support arterial compliance."
        },
        {
            "category": "Nitrate & Potassium-Rich Vegetables",
            "items": ["Beetroot", "Spinach", "Broccoli", "Kale", "Methi (fenugreek)", "Avocado"],
            "benefits": "Boosts endothelial nitric oxide synthesis, promoting natural arterial vasodilation and lower BP."
        }
    ]

    return {
        "has_glycemic_issue": has_glycemic_issue,
        "has_lipid_issue": has_lipid_issue,
        "has_bp_issue": has_bp_issue,
        "is_all_normal": is_all_normal,
        "foods_to_avoid": foods_to_avoid,
        "foods_to_intake": foods_to_intake,
        "diabetes_guidance": {
            "active_priority": "High" if has_glycemic_issue else "Preventative",
            "title": "Blood Sugar & Glycemic Control Nutrition",
            "foods_to_limit": diabetes_limits,
            "portion_strategy": "The Diabetes Plate Method: 1/2 non-starchy vegetables, 1/4 lean protein, 1/4 low-GI complex carbs."
        },
        "heart_guidance": {
            "active_priority": "High" if has_lipid_issue or has_bp_issue else "Preventative",
            "title": "Cardiovascular & Lipid Optimization Nutrition",
            "foods_to_limit": heart_limits,
            "salt_recommendation": "Target < 5g total salt (< 2,000mg elemental sodium) daily; flavor meals with garlic, turmeric, lemon, and fresh herbs."
        },
        "foods_to_favor": foods_to_favor_groups
    }

def build_lifestyle_advice(biomarkers: Dict[str, Any], mcq_answers: Dict[str, Any]) -> Dict[str, Any]:
    """
    Produces clear, direct answers to:
    1. Mandatory Sleep Requirement: Exactly how much sleep is mandatory and why for their condition
    2. Physical Activity Decision: Should the person workout or walk for some time?
    """
    sys_bp = biomarkers.get("systolic_bp", {}).get("value", 120)
    dia_bp = biomarkers.get("diastolic_bp", {}).get("value", 80)
    glucose_val = biomarkers.get("fasting_glucose", {}).get("value", 90)
    ldl_val = biomarkers.get("ldl", {}).get("value", 95)
    has_exertion_pain = mcq_answers.get("chest_pain", {}).get("is_positive", False)
    has_sob_stairs = mcq_answers.get("breathlessness_stairs", {}).get("is_positive", False)

    # 1. SLEEP PRESCRIPTION: Exactly how much sleep is mandatory & why
    is_diabetic_risk = glucose_val >= 100 or biomarkers.get("hba1c", {}).get("value", 0) >= 5.7
    is_cardio_risk = sys_bp >= 130 or dia_bp >= 85 or ldl_val >= 130 or has_exertion_pain

    mandatory_hours = "7 to 8 Hours"
    
    if is_diabetic_risk and is_cardio_risk:
        sleep_why = (
            "Getting 7 to 8 hours of uninterrupted sleep every night is strictly mandatory for you. "
            "Sleeping less than 7 hours causes overnight surges in cortisol and growth hormone, which increases cellular "
            "insulin resistance (raising morning fasting blood glucose by 15-20%) and prevents natural nocturnal blood pressure "
            "dipping, keeping your blood pressure elevated through the day."
        )
    elif is_diabetic_risk:
        sleep_why = (
            "7 to 8 hours of nightly sleep is mandatory for blood sugar control. Research demonstrates that sleeping under 6 hours "
            "significantly impairs peripheral glucose disposal, blunts pancreatic insulin secretion, and spikes next-day carbohydrate cravings."
        )
    elif is_cardio_risk:
        sleep_why = (
            "7 to 8 hours of restorative sleep is mandatory for cardiovascular protection. Inadequate sleep elevates nocturnal sympathetic "
            "nerve activity, prevents blood pressure dipping, and doubles arterial endothelial inflammation."
        )
    else:
        sleep_why = (
            "7 to 8 hours of nightly sleep is mandatory to maintain your current healthy metabolic baseline, cellular mitochondrial repair, "
            "and circadian hormonal rhythm."
        )

    # 2. PHYSICAL ACTIVITY DECISION: Should the person WORKOUT or WALK for some time?
    # Clinical triage logic:
    # If BP is Stage 2 (>=150) OR active chest discomfort OR severe urgency -> WALK ONLY (Workouts dangerous)
    # If moderate risk (pre-diabetes, mild lipid elevation without chest pain) -> BOTH (Brisk walk daily + light workout)
    # If low risk / normal -> BOTH (Full workouts & daily walks)
    if has_exertion_pain or sys_bp >= 150 or dia_bp >= 95 or has_sob_stairs:
        activity_decision = "WALK ONLY (Avoid Heavy Workouts)"
        activity_color = "rose"
        activity_badge = "Safety Restriction: Walk Only"
        workout_allowed = False
        activity_explanation = (
            "Recommendation: You should WALK for some time, but strictly AVOID heavy workouts, weightlifting, or intense cardio right now. "
            f"Because of your elevated blood pressure ({int(sys_bp)}/{int(dia_bp)} mmHg) or exertional chest symptoms, strenuous exercise can cause "
            "dangerous sudden spikes in arterial blood pressure and strain coronary perfusion. Walking is safe, effective, and therapeutic."
        )
        daily_walking_plan = (
            "Walk for 20 to 30 minutes daily at a gentle-to-brisk conversational pace. "
            "Take 10 to 15 minute gentle strolls within 30 minutes after lunch and dinner — this flushes glucose into muscle tissue without straining your heart."
        )
        workout_instructions = (
            "Do NOT do heavy gym workouts, heavy squats, deadlifts, sprinting, or high-intensity interval training (HIIT) until you have been cleared by a physician with a formal stress test (TMT/ECG)."
        )
    elif is_diabetic_risk or is_cardio_risk:
        activity_decision = "BOTH (Daily Brisk Walk + Moderate Light Workout)"
        activity_color = "amber"
        activity_badge = "Both Recommended: Walk + Light Workout"
        workout_allowed = True
        activity_explanation = (
            "Recommendation: You should do BOTH daily walking and light-to-moderate workouts! "
            "Brisk walking activates immediate post-meal glucose disposal, while light resistance workouts build metabolically active muscle that burns glucose and lowers triglycerides around the clock."
        )
        daily_walking_plan = (
            "Walk for 30 minutes daily (brisk pace). A 15-minute walk right after your biggest meal of the day reduces postprandial glucose peaks by up to 30%."
        )
        workout_instructions = (
            "Workout 2 to 3 times per week: Light-to-moderate resistance exercises (bodyweight squats, wall push-ups, resistance bands, or light dumbbells). Keep heart rate within moderate bounds (60-70% of max)."
        )
    else:
        activity_decision = "FULL WORKOUT & DAILY WALKING RECOMMENDED"
        activity_color = "emerald"
        activity_badge = "Cleared for Full Workouts & Walking"
        workout_allowed = True
        activity_explanation = (
            "Recommendation: You are cleared for both full gym workouts and daily walking! "
            "Maintaining regular aerobic and strength workouts keeps your cardiovascular endurance high and preserves lean muscle mass."
        )
        daily_walking_plan = (
            "Aim for 8,000 to 10,000 steps daily (approx. 30-40 minutes of walking)."
        )
        workout_instructions = (
            "Engage in 150 minutes of moderate-to-vigorous workouts weekly: swimming, cycling, running, or progressive resistance weight training."
        )

    return {
        "sleep": {
            "title": "Mandatory Sleep Requirement",
            "mandatory_hours": mandatory_hours,
            "target": f"{mandatory_hours} of continuous sleep",
            "why_mandatory": sleep_why,
            "is_mandatory": True,
            "key_steps": [
                f"Strictly prioritize {mandatory_hours} of continuous sleep each night.",
                "Maintain a fixed sleep and wake time every day to keep metabolic cortisol rhythms stable.",
                "Turn off all mobile/tablet screens at least 60 minutes before bedtime.",
                "If you snore heavily or wake up unrefreshed, get screened for Obstructive Sleep Apnea (OSA) which directly drives resistant hypertension."
            ]
        },
        "physical_activity": {
            "title": "Physical Activity Prescription (Workout vs. Walk)",
            "decision": activity_decision,
            "activity_color": activity_color,
            "activity_badge": activity_badge,
            "workout_allowed": workout_allowed,
            "explanation": activity_explanation,
            "daily_walking_plan": daily_walking_plan,
            "workout_instructions": workout_instructions
        },
        # Backward compatibility with existing components and test suite
        "exercise": {
            "title": activity_decision,
            "caution": activity_explanation,
            "aerobic": daily_walking_plan,
            "resistance": workout_instructions,
            "post_meal_walks": "10-15 minute walk after meals strongly reduces glucose excursions."
        },
        "stress": {
            "title": "Stress & Cortisol Balance",
            "mechanism": "Psychological stress triggers epinephrine and cortisol surges, increasing blood sugar and constricting vascular walls.",
            "techniques": [
                "4-7-8 Diaphragmatic Breathing: 5 minutes twice daily to trigger parasympathetic vagal recovery.",
                "20-minute daily daytime outdoor exposure to lower sympathetic nerve activity."
            ]
        }
    }

def build_follow_up_tests(biomarkers: Dict[str, Any], mcq_answers: Dict[str, Any]) -> List[Dict[str, str]]:
    """Suggests clinical tests the user should discuss with their doctor."""
    tests = []
    
    glucose = biomarkers.get("fasting_glucose", {}).get("value", 0)
    hba1c = biomarkers.get("hba1c", {}).get("value", 0)
    if glucose >= 100 or hba1c >= 5.7:
        tests.append({
            "test_name": "Repeat HbA1c & Fasting Plasma Glucose in 3 Months",
            "reason": "Evaluates 90-day glycemic trend and confirms response to dietary and lifestyle changes.",
            "specialist": "Endocrinologist or Primary Care Physician"
        })
        tests.append({
            "test_name": "Oral Glucose Tolerance Test (OGTT) or Fasting Insulin",
            "reason": "Assesses dynamic beta-cell insulin secretory capacity and HOMA-IR insulin resistance index.",
            "specialist": "Endocrinologist"
        })
        tests.append({
            "test_name": "Urine Microalbumin-to-Creatinine Ratio (uACR)",
            "reason": "Early sensitive detector of glomerular microvascular leak before standard kidney markers change.",
            "specialist": "Nephrologist / Primary Physician"
        })

    ldl = biomarkers.get("ldl", {}).get("value", 0)
    sys_bp = biomarkers.get("systolic_bp", {}).get("value", 0)
    has_chest = mcq_answers.get("chest_pain", {}).get("is_positive", False)
    
    if ldl >= 130 or sys_bp >= 130 or has_chest:
        tests.append({
            "test_name": "Comprehensive Fasting Lipid Profile Recheck in 8-12 Weeks",
            "reason": "Monitors changes in LDL-C, non-HDL-C, and Triglycerides after dietary interventions or statin therapy.",
            "specialist": "Cardiologist or Primary Care Physician"
        })
        tests.append({
            "test_name": "12-Lead Resting Electrocardiogram (ECG) & Treadmill Stress Test (TMT)",
            "reason": "Assesses electrical conduction, ischemic ST-T changes, and exercise capacity under controlled cardiac monitoring.",
            "specialist": "Cardiologist"
        })
        tests.append({
            "test_name": "High-Sensitivity C-Reactive Protein (hs-CRP) & Lipoprotein(a)",
            "reason": "Advanced cardiovascular biomarkers measuring systemic arterial inflammation and independent genetic atheroma risk.",
            "specialist": "Cardiologist"
        })

    if not tests:
        tests.append({
            "test_name": "Annual Wellness Metabolic Panel & Fasting Lipids",
            "reason": "Routine preventative check to track baseline trends over time.",
            "specialist": "Primary Care Physician"
        })
        tests.append({
            "test_name": "Routine Blood Pressure & BMI Monitoring",
            "reason": "Early detection of silent vascular resistance changes.",
            "specialist": "Primary Care Physician"
        })

    return tests

def generate_full_risk_report(
    biomarkers: Dict[str, Any],
    mcq_answers: Dict[str, Any],
    ecg_findings: List[str],
    ml_diabetes_result: Dict[str, Any],
    ml_cvd_result: Dict[str, Any]
) -> Dict[str, Any]:
    """Generates the comprehensive clinical risk report."""
    urgency = compute_urgency_triage(biomarkers, mcq_answers, ecg_findings)
    diet = build_dietary_guidance(biomarkers, urgency["urgency_level"])
    lifestyle = build_lifestyle_advice(biomarkers, mcq_answers)
    follow_up = build_follow_up_tests(biomarkers, mcq_answers)

    disclaimer = (
        "IMPORTANT MEDICAL DISCLAIMER: This risk report is generated by an artificial intelligence and clinical "
        "decision support system for informational, lifestyle, and educational purposes only. It DOES NOT constitute "
        "a medical diagnosis, clinical prognosis, or direct prescription. Clinical symptoms must always be evaluated "
        "by a qualified licensed physician or healthcare specialist. If you are experiencing chest pain, severe "
        "shortness of breath, confusion, extreme dizziness, or sudden weakness, please call emergency services "
        "(such as 911, 999, 112, or your local emergency department) immediately."
    )

    return {
        "urgency": urgency,
        "diabetes_assessment": {
            "risk_score_pct": ml_diabetes_result.get("risk_score_pct", 15.0),
            "risk_label": ml_diabetes_result.get("label", "Low Risk"),
            "probabilities": ml_diabetes_result.get("probabilities", {})
        },
        "cardiovascular_assessment": {
            "risk_score_pct": ml_cvd_result.get("risk_score_pct", 15.0),
            "risk_label": ml_cvd_result.get("label", "Low Risk"),
            "probabilities": ml_cvd_result.get("probabilities", {})
        },
        "dietary_guidance": diet,
        "lifestyle_advice": lifestyle,
        "follow_up_tests": follow_up,
        "medical_disclaimer": disclaimer
    }
