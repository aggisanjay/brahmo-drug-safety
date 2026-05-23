const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.endsWith('\r')) value = value.slice(0, -1);
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const DRUGS = [
  { generic_name: 'Metformin', generic_name_normalized: 'metformin', drug_class: 'biguanide', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'contraindicated', note: 'Contraindicated - risk of lactic acidosis' }, { eGFR_below: 45, action: 'reduce', note: 'Reduce dose, max 1000mg/day' }] } },
  { generic_name: 'Glimepiride', generic_name_normalized: 'glimepiride', drug_class: 'sulfonylurea', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'avoid', note: 'Avoid - prolonged hypoglycemia risk' }] } },
  { generic_name: 'Empagliflozin', generic_name_normalized: 'empagliflozin', drug_class: 'sglt2i', renal_dosing: { thresholds: [{ eGFR_below: 20, action: 'avoid', note: 'Avoid - insufficient efficacy' }] } },
  { generic_name: 'Insulin Glargine', generic_name_normalized: 'insulinglargine', drug_class: 'insulin', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'reduce', note: 'Reduce dose as eGFR declines - reduced renal clearance of insulin' }] } },
  { generic_name: 'Atorvastatin', generic_name_normalized: 'atorvastatin', drug_class: 'statin', renal_dosing: { thresholds: [] } },
  { generic_name: 'Rosuvastatin', generic_name_normalized: 'rosuvastatin', drug_class: 'statin', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'reduce', note: 'Start at 5mg, max 10mg' }] } },
  { generic_name: 'Amlodipine', generic_name_normalized: 'amlodipine', drug_class: 'ccb', renal_dosing: { thresholds: [] } },
  { generic_name: 'Telmisartan', generic_name_normalized: 'telmisartan', drug_class: 'arb', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'monitor', note: 'Monitor K+ closely in CKD, consider dose reduction' }] } },
  { generic_name: 'Ramipril', generic_name_normalized: 'ramipril', drug_class: 'ace_inhibitor', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'reduce', note: 'Reduce dose, monitor K+ and creatinine closely' }] } },
  { generic_name: 'Lisinopril', generic_name_normalized: 'lisinopril', drug_class: 'ace_inhibitor', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'reduce', note: 'Reduce dose, monitor renal function' }] } },
  { generic_name: 'Furosemide', generic_name_normalized: 'furosemide', drug_class: 'loop_diuretic', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'increase', note: 'Higher doses may be needed in CKD for adequate diuresis' }] } },
  { generic_name: 'Spironolactone', generic_name_normalized: 'spironolactone', drug_class: 'k_sparing_diuretic', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'avoid', note: 'Avoid - high risk of life-threatening hyperkalemia' }] } },
  { generic_name: 'Bisoprolol', generic_name_normalized: 'bisoprolol', drug_class: 'beta_blocker', renal_dosing: { thresholds: [] } },
  { generic_name: 'Carvedilol', generic_name_normalized: 'carvedilol', drug_class: 'beta_blocker', renal_dosing: { thresholds: [] } },
  { generic_name: 'Aspirin', generic_name_normalized: 'aspirin', drug_class: 'antiplatelet', renal_dosing: { thresholds: [] } },
  { generic_name: 'Clopidogrel', generic_name_normalized: 'clopidogrel', drug_class: 'antiplatelet', renal_dosing: { thresholds: [] } },
  { generic_name: 'Ticagrelor', generic_name_normalized: 'ticagrelor', drug_class: 'antiplatelet', renal_dosing: { thresholds: [] } },
  { generic_name: 'Warfarin', generic_name_normalized: 'warfarin', drug_class: 'vka', renal_dosing: { thresholds: [] } },
  { generic_name: 'Rivaroxaban', generic_name_normalized: 'rivaroxaban', drug_class: 'doac', renal_dosing: { thresholds: [{ eGFR_below: 15, action: 'avoid', note: 'Avoid - insufficient data' }, { eGFR_below: 50, action: 'reduce', note: 'Use 15mg OD instead of 20mg OD' }] } },
  { generic_name: 'Apixaban', generic_name_normalized: 'apixaban', drug_class: 'doac', renal_dosing: { thresholds: [{ eGFR_below: 25, action: 'reduce', note: 'Reduce to 2.5mg BD' }] } },
  { generic_name: 'Enoxaparin', generic_name_normalized: 'enoxaparin', drug_class: 'lmwh', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'reduce', note: 'Use once daily dosing, monitor anti-Xa levels' }] } },
  { generic_name: 'Amoxicillin', generic_name_normalized: 'amoxicillin', drug_class: 'penicillin', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'reduce', note: 'Reduce frequency to BD' }] } },
  { generic_name: 'Amoxicillin-Clavulanate', generic_name_normalized: 'amoxicillinclavulanate', drug_class: 'penicillin', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'reduce', note: 'Reduce frequency' }] } },
  { generic_name: 'Ampicillin', generic_name_normalized: 'ampicillin', drug_class: 'penicillin', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'reduce', note: 'Reduce frequency' }] } },
  { generic_name: 'Clarithromycin', generic_name_normalized: 'clarithromycin', drug_class: 'macrolide', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'reduce', note: 'Reduce dose by 50%' }] } },
  { generic_name: 'Azithromycin', generic_name_normalized: 'azithromycin', drug_class: 'macrolide', renal_dosing: { thresholds: [] } },
  { generic_name: 'Levofloxacin', generic_name_normalized: 'levofloxacin', drug_class: 'fluoroquinolone', renal_dosing: { thresholds: [{ eGFR_below: 50, action: 'reduce', note: 'Adjust dose based on eGFR' }] } },
  { generic_name: 'Ciprofloxacin', generic_name_normalized: 'ciprofloxacin', drug_class: 'fluoroquinolone', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'reduce', note: 'Reduce dose by 50%' }] } },
  { generic_name: 'Meropenem', generic_name_normalized: 'meropenem', drug_class: 'carbapenem', renal_dosing: { thresholds: [{ eGFR_below: 26, action: 'reduce', note: 'Reduce dose and/or extend interval' }] } },
  { generic_name: 'Ceftriaxone', generic_name_normalized: 'ceftriaxone', drug_class: 'cephalosporin_3rd', renal_dosing: { thresholds: [] } },
  { generic_name: 'Cefazolin', generic_name_normalized: 'cefazolin', drug_class: 'cephalosporin_1st', renal_dosing: { thresholds: [{ eGFR_below: 35, action: 'reduce', note: 'Reduce dose frequency' }] } },
  { generic_name: 'Nitrofurantoin', generic_name_normalized: 'nitrofurantoin', drug_class: 'nitrofuran', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'avoid', note: 'Avoid - ineffective and increased toxicity' }] } },
  { generic_name: 'Co-trimoxazole', generic_name_normalized: 'cotrimoxazole', drug_class: 'sulfonamide', renal_dosing: { thresholds: [{ eGFR_below: 15, action: 'avoid', note: 'Avoid - increased risk of hyperkalemia and bone marrow suppression' }] } },
  { generic_name: 'Gabapentin', generic_name_normalized: 'gabapentin', drug_class: 'gabapentinoid', renal_dosing: { thresholds: [{ eGFR_below: 15, action: 'reduce', note: '100mg OD or every other day' }, { eGFR_below: 30, action: 'reduce', note: '100-300mg OD' }, { eGFR_below: 60, action: 'reduce', note: 'Reduce dose by 50%' }] } },
  { generic_name: 'Pregabalin', generic_name_normalized: 'pregabalin', drug_class: 'gabapentinoid', renal_dosing: { thresholds: [{ eGFR_below: 15, action: 'reduce', note: '25-75mg OD' }, { eGFR_below: 30, action: 'reduce', note: 'Reduce by 75%' }, { eGFR_below: 60, action: 'reduce', note: 'Reduce dose' }] } },
  { generic_name: 'Escitalopram', generic_name_normalized: 'escitalopram', drug_class: 'ssri', renal_dosing: { thresholds: [] } },
  { generic_name: 'Fluoxetine', generic_name_normalized: 'fluoxetine', drug_class: 'ssri', renal_dosing: { thresholds: [] } },
  { generic_name: 'Duloxetine', generic_name_normalized: 'duloxetine', drug_class: 'snri', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'avoid', note: 'Avoid - increased active metabolites' }] } },
  { generic_name: 'Tramadol', generic_name_normalized: 'tramadol', drug_class: 'opioid', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'reduce', note: 'Reduce dose, extend interval to 12-hourly, max 200mg/day' }] } },
  { generic_name: 'Morphine', generic_name_normalized: 'morphine', drug_class: 'opioid', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'reduce', note: 'Reduce dose - active metabolite (M6G) accumulates causing prolonged sedation and respiratory depression' }] } },
  { generic_name: 'Fentanyl', generic_name_normalized: 'fentanyl', drug_class: 'opioid', renal_dosing: { thresholds: [] } },
  { generic_name: 'Paracetamol', generic_name_normalized: 'paracetamol', drug_class: 'analgesic', renal_dosing: { thresholds: [] } },
  { generic_name: 'Diclofenac', generic_name_normalized: 'diclofenac', drug_class: 'nsaid', renal_dosing: { thresholds: [{ eGFR_below: 60, action: 'avoid', note: 'Avoid in CKD - risk of further renal deterioration, fluid retention, hyperkalemia' }, { eGFR_below: 30, action: 'contraindicated', note: 'Contraindicated in severe CKD' }] } },
  { generic_name: 'Ibuprofen', generic_name_normalized: 'ibuprofen', drug_class: 'nsaid', renal_dosing: { thresholds: [{ eGFR_below: 60, action: 'avoid', note: 'Avoid in CKD - nephrotoxic' }, { eGFR_below: 30, action: 'contraindicated', note: 'Contraindicated' }] } },
  { generic_name: 'Pantoprazole', generic_name_normalized: 'pantoprazole', drug_class: 'ppi', renal_dosing: { thresholds: [] } },
  { generic_name: 'Omeprazole', generic_name_normalized: 'omeprazole', drug_class: 'ppi', renal_dosing: { thresholds: [] } },
  { generic_name: 'Tamsulosin', generic_name_normalized: 'tamsulosin', drug_class: 'alpha_blocker', renal_dosing: { thresholds: [] } },
  { generic_name: 'Digoxin', generic_name_normalized: 'digoxin', drug_class: 'cardiac_glycoside', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'reduce', note: 'Reduce dose, monitor levels closely. Target 0.5-0.8ng/mL' }] } },
  { generic_name: 'Phenytoin', generic_name_normalized: 'phenytoin', drug_class: 'anticonvulsant', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'monitor', note: 'Complex pharmacokinetics in CKD - monitor free levels, adjust for albumin' }] } },
  { generic_name: 'Sodium Valproate', generic_name_normalized: 'sodiumvalproate', drug_class: 'anticonvulsant', renal_dosing: { thresholds: [] } },
  
  // 6 MISSING DRUGS FOR SCENARIOS
  { generic_name: 'Penicillin V', generic_name_normalized: 'penicillinv', drug_class: 'penicillin', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'reduce', note: 'Reduce dose/frequency in severe CKD' }] } },
  { generic_name: 'Carbamazepine', generic_name_normalized: 'carbamazepine', drug_class: 'anticonvulsant', renal_dosing: { thresholds: [{ eGFR_below: 30, action: 'monitor', note: 'Monitor levels closely' }] } },
  { generic_name: 'Amiodarone', generic_name_normalized: 'amiodarone', drug_class: 'antiarrhythmic', renal_dosing: { thresholds: [] } },
  { generic_name: 'Metoclopramide', generic_name_normalized: 'metoclopramide', drug_class: 'antiemetic', renal_dosing: { thresholds: [] } },
  { generic_name: 'Montelukast', generic_name_normalized: 'montelukast', drug_class: 'leukotriene_receptor_antagonist', renal_dosing: { thresholds: [] } },
  { generic_name: 'Fluticasone', generic_name_normalized: 'fluticasone', drug_class: 'inhaled_corticosteroid', renal_dosing: { thresholds: [] } },
];

const INTERACTIONS = [
  { drug_a: 'clarithromycin', drug_b: 'atorvastatin', severity: 'SEVERE', mechanism: 'CYP3A4 inhibition by clarithromycin', clinical_effect: 'Statin levels increase 4-5x, risk of rhabdomyolysis', management: 'AVOID combination. Use azithromycin instead. Hold statin during course.' },
  { drug_a: 'clarithromycin', drug_b: 'rosuvastatin', severity: 'MODERATE', mechanism: 'Weak CYP3A4 interaction', clinical_effect: 'Modest increase in statin levels', management: 'Monitor for myopathy symptoms. Consider temporary statin dose reduction.' },
  { drug_a: 'clarithromycin', drug_b: 'amlodipine', severity: 'MODERATE', mechanism: 'CYP3A4 inhibition', clinical_effect: 'Increased amlodipine levels causing excessive hypotension', management: 'Monitor blood pressure closely. Consider dose reduction of amlodipine.' },
  { drug_a: 'clarithromycin', drug_b: 'warfarin', severity: 'SEVERE', mechanism: 'CYP inhibition increasing warfarin effect', clinical_effect: 'Significantly increased INR, high bleeding risk', management: 'Monitor INR daily during co-administration. Consider azithromycin alternative.' },
  { drug_a: 'ciprofloxacin', drug_b: 'warfarin', severity: 'MODERATE', mechanism: 'CYP1A2 inhibition', clinical_effect: 'Increased INR and bleeding risk', management: 'Monitor INR closely during co-administration.' },
  { drug_a: 'fluoxetine', drug_b: 'tramadol', severity: 'SEVERE', mechanism: 'Combined serotonergic activity + CYP2D6 inhibition', clinical_effect: 'Serotonin syndrome: hyperthermia, myoclonus, potentially fatal', management: 'AVOID combination. Use alternative analgesic or antidepressant.' },
  { drug_a: 'escitalopram', drug_b: 'tramadol', severity: 'MODERATE', mechanism: 'Additive serotonergic effect', clinical_effect: 'Risk of serotonin syndrome', management: 'Monitor closely for signs of serotonin syndrome. Use lowest effective doses.' },
  { drug_a: 'diclofenac', drug_b: 'telmisartan', severity: 'SEVERE', mechanism: 'NSAID + ARB nephrotoxic combination', clinical_effect: 'Acute kidney injury, hyperkalemia, especially in dehydrated/elderly', management: 'AVOID combination. Use paracetamol for pain.' },
  { drug_a: 'diclofenac', drug_b: 'ramipril', severity: 'SEVERE', mechanism: 'NSAID + ACE inhibitor nephrotoxic combination', clinical_effect: 'Acute kidney injury, hyperkalemia, reduced antihypertensive effect', management: 'AVOID combination. Use paracetamol for pain.' },
  { drug_a: 'ibuprofen', drug_b: 'aspirin', severity: 'MODERATE', mechanism: 'Competitive COX-1 binding', clinical_effect: 'Ibuprofen blocks aspirin COX-1 binding, reducing cardioprotection', management: 'Take aspirin 30min before ibuprofen. Consider alternative analgesic.' },
  { drug_a: 'warfarin', drug_b: 'aspirin', severity: 'SEVERE', mechanism: 'Additive anticoagulant and antiplatelet effects', clinical_effect: 'Significantly increased risk of major hemorrhage (GI bleed)', management: 'Avoid unless specifically indicated. Ensure PPI cover. Monitor INR.' },
  { drug_a: 'spironolactone', drug_b: 'ramipril', severity: 'MODERATE', mechanism: 'Both increase potassium retention', clinical_effect: 'Life-threatening hyperkalemia, risk of cardiac arrest', management: 'Monitor K+ within 1 week of starting, then regularly.' },
  { drug_a: 'spironolactone', drug_b: 'telmisartan', severity: 'MODERATE', mechanism: 'Both increase potassium retention', clinical_effect: 'Hyperkalemia risk', management: 'Monitor K+ closely. Avoid if baseline K+ elevated.' },
  { drug_a: 'digoxin', drug_b: 'clarithromycin', severity: 'SEVERE', mechanism: 'Reduced P-glycoprotein clearance of digoxin', clinical_effect: 'Digoxin toxicity: nausea, visual changes, arrhythmias', management: 'Monitor digoxin levels. Reduce digoxin dose by 50%. Use azithromycin.' },
  { drug_a: 'metformin', drug_b: 'furosemide', severity: 'MINOR', mechanism: 'Furosemide may increase lactate production', clinical_effect: 'Slightly increased risk of lactic acidosis in renal impairment', management: 'Monitor renal function. Ensure adequate hydration.' },
  { drug_a: 'phenytoin', drug_b: 'sodiumvalproate', severity: 'MODERATE', mechanism: 'Complex bidirectional metabolism alteration', clinical_effect: 'Unpredictable changes in levels of both drugs', management: 'Monitor levels of both drugs. Adjust doses based on clinical response.' },
  { drug_a: 'duloxetine', drug_b: 'tramadol', severity: 'SEVERE', mechanism: 'Combined serotonergic activity', clinical_effect: 'Serotonin syndrome risk: potentially fatal', management: 'AVOID combination. Use alternative analgesic or antidepressant.' },
  { drug_a: 'clopidogrel', drug_b: 'omeprazole', severity: 'MODERATE', mechanism: 'CYP2C19 inhibition reduces clopidogrel activation', clinical_effect: 'Reduced antiplatelet effect, increased CV risk', management: 'Use pantoprazole instead (minimal CYP2C19 effect). Avoid omeprazole.' },
  { drug_a: 'clopidogrel', drug_b: 'pantoprazole', severity: 'MINOR', mechanism: 'Weak CYP2C19 interaction', clinical_effect: 'Minimal clinical effect', management: 'Pantoprazole is the preferred PPI. No dose adjustment needed.' },
  { drug_a: 'rivaroxaban', drug_b: 'clarithromycin', severity: 'SEVERE', mechanism: 'Dual P-gp and CYP3A4 inhibition', clinical_effect: 'Significantly increased rivaroxaban levels, major bleeding risk', management: 'AVOID combination. Use azithromycin. Monitor for bleeding.' },
  { drug_a: 'apixaban', drug_b: 'clarithromycin', severity: 'MODERATE', mechanism: 'P-gp and CYP3A4 inhibition', clinical_effect: 'Increased apixaban levels, increased bleeding risk', management: 'Monitor for bleeding. Consider apixaban dose reduction.' },
  { drug_a: 'amlodipine', drug_b: 'atorvastatin', severity: 'MODERATE', mechanism: 'CYP3A4 interaction', clinical_effect: 'Modest increase in statin levels', management: 'Limit simvastatin to 20mg with amlodipine. Atorvastatin generally safe.' },
  { drug_a: 'cotrimoxazole', drug_b: 'metformin', severity: 'SEVERE', mechanism: 'Antifolate effect, bone marrow suppression', clinical_effect: 'Pancytopenia, severe myelosuppression', management: 'Monitor FBC closely. Consider alternative antibiotic.' },
  { drug_a: 'clarithromycin', drug_b: 'phenytoin', severity: 'SEVERE', mechanism: 'CYP3A4 inhibition of phenytoin metabolism', clinical_effect: 'Risk of phenytoin toxicity: ataxia, nystagmus, seizures', management: 'Monitor phenytoin levels. Use azithromycin alternative.' },
  { drug_a: 'ciprofloxacin', drug_b: 'phenytoin', severity: 'SEVERE', mechanism: 'CYP1A2 inhibition', clinical_effect: 'Risk of drug toxicity or altered phenytoin levels', management: 'AVOID combination. Use alternative antibiotic. Monitor levels.' },
  { drug_a: 'diclofenac', drug_b: 'lisinopril', severity: 'SEVERE', mechanism: 'NSAID + ACE inhibitor nephrotoxic combination', clinical_effect: 'Acute kidney injury, hyperkalemia, reduced antihypertensive effect', management: 'AVOID combination. Use paracetamol for pain.' },
  { drug_a: 'ibuprofen', drug_b: 'telmisartan', severity: 'SEVERE', mechanism: 'NSAID + ARB nephrotoxic combination', clinical_effect: 'Acute kidney injury, hyperkalemia', management: 'AVOID combination. Use paracetamol for pain. Monitor renal function.' },
  { drug_a: 'morphine', drug_b: 'escitalopram', severity: 'MINOR', mechanism: 'Additive CNS depression', clinical_effect: 'Increased sedation and respiratory depression risk', management: 'Monitor sedation levels. Use lowest effective opioid dose.' },
  { drug_a: 'pregabalin', drug_b: 'morphine', severity: 'MODERATE', mechanism: 'Additive CNS and respiratory depressant effects', clinical_effect: 'Excessive sedation, respiratory depression, potentially fatal', management: 'Reduce opioid dose by 25-50% when adding pregabalin. Monitor breathing.' },
  { drug_a: 'diclofenac', drug_b: 'digoxin', severity: 'SEVERE', mechanism: 'Reduced renal clearance of digoxin + direct nephrotoxicity', clinical_effect: 'Digoxin toxicity and acute kidney injury', management: 'AVOID combination. Use paracetamol. Monitor digoxin levels.' },

  // NEW SCENARIO INTERACTIONS
  { drug_a: 'amiodarone', drug_b: 'warfarin', severity: 'SEVERE', mechanism: 'CYP2C9 inhibition by amiodarone', clinical_effect: 'Significantly increased warfarin levels, elevated INR, bleeding risk', management: 'Monitor INR closely. Reduce warfarin dose by 30-50% when starting amiodarone.' },
  { drug_a: 'amiodarone', drug_b: 'bisoprolol', severity: 'MODERATE', mechanism: 'Additive negative chronotropic effects', clinical_effect: 'Risk of bradycardia, sinus arrest, or heart block', management: 'Monitor heart rate and ECG closely. Adjust doses as needed.' },
  { drug_a: 'clarithromycin', drug_b: 'carbamazepine', severity: 'SEVERE', mechanism: 'CYP3A4 inhibition of carbamazepine metabolism by clarithromycin', clinical_effect: 'Risk of anticonvulsant toxicity: ataxia, nystagmus, seizures', management: 'AVOID combination. Use azithromycin. Monitor carbamazepine levels closely.' }
];

const CROSS_REACTIVITY = [
  { drug_class_a: 'penicillin', drug_class_b: 'penicillin', cross_reactivity_pct: 100, clinical_guidance: 'DIRECT MATCH - Same drug class. Absolute contraindication regardless of reaction severity.' },
  { drug_class_a: 'penicillin', drug_class_b: 'cephalosporin_1st', cross_reactivity_pct: 2, clinical_guidance: 'Low cross-reactivity (1-2%). AVOID if history of anaphylaxis to penicillin. Use with caution if mild reaction only.' },
  { drug_class_a: 'penicillin', drug_class_b: 'cephalosporin_3rd', cross_reactivity_pct: 0.5, clinical_guidance: 'Very low cross-reactivity (<0.5%). Generally safe to use. Exercise caution if severe anaphylaxis history.' },
  { drug_class_a: 'penicillin', drug_class_b: 'carbapenem', cross_reactivity_pct: 1, clinical_guidance: 'Low cross-reactivity (<1%). Generally safe. Monitor first dose in patients with severe penicillin anaphylaxis.' },
  { drug_class_a: 'sulfonamide', drug_class_b: 'sulfonamide', cross_reactivity_pct: 100, clinical_guidance: 'DIRECT MATCH - Same drug class. Avoid all sulfonamide antibiotics.' },
  { drug_class_a: 'ace_inhibitor', drug_class_b: 'ace_inhibitor', cross_reactivity_pct: 100, clinical_guidance: 'DIRECT MATCH - Class-wide angioedema risk. Contraindicated if angioedema with any ACE inhibitor.' },
  { drug_class_a: 'ace_inhibitor', drug_class_b: 'arb', cross_reactivity_pct: 0, clinical_guidance: 'ARBs are SAFE alternative to ACE inhibitors. Different mechanism. No cross-reactivity for angioedema.' },
  { drug_class_a: 'nsaid', drug_class_b: 'nsaid', cross_reactivity_pct: 100, clinical_guidance: 'Cross-reactivity between NSAIDs is common, especially in aspirin-exacerbated respiratory disease. Avoid ALL NSAIDs if aspirin allergy with bronchospasm.' }
];

async function seed() {
  console.log("Starting database seed...");
  
  // 1. Delete all existing data to prevent unique constraints violations
  await supabase.from('drug_interactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('drugs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('allergy_cross_reactivity').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Cleared existing data.");

  // 2. Insert Drugs
  const { data: insertedDrugs, error: drugErr } = await supabase.from('drugs').insert(DRUGS).select();
  if (drugErr) {
    console.error("Error inserting drugs:", drugErr);
    process.exit(1);
  }
  console.log(`Successfully inserted ${insertedDrugs.length} drugs.`);

  // Create a map of generic_name_normalized -> id
  const drugIdMap = {};
  insertedDrugs.forEach(d => {
    drugIdMap[d.generic_name_normalized] = d.id;
  });

  // 3. Prepare and Insert Interactions
  const preparedInteractions = [];
  for (const inter of INTERACTIONS) {
    const aId = drugIdMap[inter.drug_a];
    const bId = drugIdMap[inter.drug_b];
    if (!aId || !bId) {
      console.warn(`Could not find drug IDs for interaction: ${inter.drug_a} + ${inter.drug_b}`);
      continue;
    }
    preparedInteractions.push({
      drug_a_id: aId,
      drug_b_id: bId,
      severity: inter.severity,
      mechanism: inter.mechanism,
      clinical_effect: inter.clinical_effect,
      management: inter.management
    });
  }

  const { data: insertedInteractions, error: interErr } = await supabase.from('drug_interactions').insert(preparedInteractions).select();
  if (interErr) {
    console.error("Error inserting interactions:", interErr);
    process.exit(1);
  }
  console.log(`Successfully inserted ${insertedInteractions.length} drug interactions.`);

  // 4. Insert Allergy Cross-Reactivity
  const { data: insertedAllergies, error: allergyErr } = await supabase.from('allergy_cross_reactivity').insert(CROSS_REACTIVITY).select();
  if (allergyErr) {
    console.error("Error inserting cross-reactivity:", allergyErr);
    process.exit(1);
  }
  console.log(`Successfully inserted ${insertedAllergies.length} cross-reactivity entries.`);
  
  console.log("Database successfully seeded!");
}

seed();
