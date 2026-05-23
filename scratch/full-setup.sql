-- 1. DISABLE ROW LEVEL SECURITY (RLS) FOR THE DEMO APP
ALTER TABLE IF EXISTS drugs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS drug_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS allergy_cross_reactivity DISABLE ROW LEVEL SECURITY;

-- 2. CLEAR ALL EXISTING DATA
TRUNCATE TABLE drug_interactions CASCADE;
TRUNCATE TABLE drugs CASCADE;
TRUNCATE TABLE allergy_cross_reactivity CASCADE;

-- 3. INSERT ALL 56 DRUGS (50 STANDARD + 6 SCENARIO DRUGS)
INSERT INTO drugs (generic_name, generic_name_normalized, drug_class, renal_dosing) VALUES
('Metformin', 'metformin', 'biguanide', '{"thresholds":[{"eGFR_below":30,"action":"contraindicated","note":"Contraindicated - risk of lactic acidosis"},{"eGFR_below":45,"action":"reduce","note":"Reduce dose, max 1000mg/day"}]}'),
('Glimepiride', 'glimepiride', 'sulfonylurea', '{"thresholds":[{"eGFR_below":30,"action":"avoid","note":"Avoid - prolonged hypoglycemia risk"}]}'),
('Empagliflozin', 'empagliflozin', 'sglt2i', '{"thresholds":[{"eGFR_below":20,"action":"avoid","note":"Avoid - insufficient efficacy"}]}'),
('Insulin Glargine', 'insulinglargine', 'insulin', '{"thresholds":[{"eGFR_below":30,"action":"reduce","note":"Reduce dose as eGFR declines - reduced renal clearance of insulin"}]}'),
('Atorvastatin', 'atorvastatin', 'statin', '{"thresholds":[]}'),
('Rosuvastatin', 'rosuvastatin', 'statin', '{"thresholds":[{"eGFR_below":30,"action":"reduce","note":"Start at 5mg, max 10mg"}]}'),
('Amlodipine', 'amlodipine', 'ccb', '{"thresholds":[]}'),
('Telmisartan', 'telmisartan', 'arb', '{"thresholds":[{"eGFR_below":30,"action":"monitor","note":"Monitor K+ closely in CKD, consider dose reduction"}]}'),
('Ramipril', 'ramipril', 'ace_inhibitor', '{"thresholds":[{"eGFR_below":30,"action":"reduce","note":"Reduce dose, monitor K+ and creatinine closely"}]}'),
('Lisinopril', 'lisinopril', 'ace_inhibitor', '{"thresholds":[{"eGFR_below":30,"action":"reduce","note":"Reduce dose, monitor renal function"}]}'),
('Furosemide', 'furosemide', 'loop_diuretic', '{"thresholds":[{"eGFR_below":30,"action":"increase","note":"Higher doses may be needed in CKD for adequate diuresis"}]}'),
('Spironolactone', 'spironolactone', 'k_sparing_diuretic', '{"thresholds":[{"eGFR_below":30,"action":"avoid","note":"Avoid - high risk of life-threatening hyperkalemia"}]}'),
('Bisoprolol', 'bisoprolol', 'beta_blocker', '{"thresholds":[]}'),
('Carvedilol', 'carvedilol', 'beta_blocker', '{"thresholds":[]}'),
('Aspirin', 'aspirin', 'antiplatelet', '{"thresholds":[]}'),
('Clopidogrel', 'clopidogrel', 'antiplatelet', '{"thresholds":[]}'),
('Ticagrelor', 'ticagrelor', 'antiplatelet', '{"thresholds":[]}'),
('Warfarin', 'warfarin', 'vka', '{"thresholds":[]}'),
('Rivaroxaban', 'rivaroxaban', 'doac', '{"thresholds":[{"eGFR_below":15,"action":"avoid","note":"Avoid - insufficient data"},{"eGFR_below":50,"action":"reduce","note":"Use 15mg OD instead of 20mg OD"}]}'),
('Apixaban', 'apixaban', 'doac', '{"thresholds":[{"eGFR_below":25,"action":"reduce","note":"Reduce to 2.5mg BD"}]}'),
('Enoxaparin', 'enoxaparin', 'lmwh', '{"thresholds":[{"eGFR_below":30,"action":"reduce","note":"Use once daily dosing, monitor anti-Xa levels"}]}'),
('Amoxicillin', 'amoxicillin', 'penicillin', '{"thresholds":[{"eGFR_below":30,"action":"reduce","note":"Reduce frequency to BD"}]}'),
('Amoxicillin-Clavulanate', 'amoxicillinclavulanate', 'penicillin', '{"thresholds":[{"eGFR_below":30,"action":"reduce","note":"Reduce frequency"}]}'),
('Ampicillin', 'ampicillin', 'penicillin', '{"thresholds":[{"eGFR_below":30,"action":"reduce","note":"Reduce frequency"}]}'),
('Clarithromycin', 'clarithromycin', 'macrolide', '{"thresholds":[{"eGFR_below":30,"action":"reduce","note":"Reduce dose by 50%"}]}'),
('Azithromycin', 'azithromycin', 'macrolide', '{"thresholds":[]}'),
('Levofloxacin', 'levofloxacin', 'fluoroquinolone', '{"thresholds":[{"eGFR_below":50,"action":"reduce","note":"Adjust dose based on eGFR"}]}'),
('Ciprofloxacin', 'ciprofloxacin', 'fluoroquinolone', '{"thresholds":[{"eGFR_below":30,"action":"reduce","note":"Reduce dose by 50%"}]}'),
('Meropenem', 'meropenem', 'carbapenem', '{"thresholds":[{"eGFR_below":26,"action":"reduce","note":"Reduce dose and/or extend interval"}]}'),
('Ceftriaxone', 'ceftriaxone', 'cephalosporin_3rd', '{"thresholds":[]}'),
('Cefazolin', 'cefazolin', 'cephalosporin_1st', '{"thresholds":[{"eGFR_below":35,"action":"reduce","note":"Reduce dose frequency"}]}'),
('Nitrofurantoin', 'nitrofurantoin', 'nitrofuran', '{"thresholds":[{"eGFR_below":30,"action":"avoid","note":"Avoid - ineffective and increased toxicity"}]}'),
('Co-trimoxazole', 'cotrimoxazole', 'sulfonamide', '{"thresholds":[{"eGFR_below":15,"action":"avoid","note":"Avoid - increased risk of hyperkalemia and bone marrow suppression"}]}'),
('Gabapentin', 'gabapentin', 'gabapentinoid', '{"thresholds":[{"eGFR_below":15,"action":"reduce","note":"100mg OD or every other day"},{"eGFR_below":30,"action":"reduce","note":"100-300mg OD"},{"eGFR_below":60,"action":"reduce","note":"Reduce dose by 50%"}]}'),
('Pregabalin', 'pregabalin', 'gabapentinoid', '{"thresholds":[{"eGFR_below":15,"action":"reduce","note":"25-75mg OD"},{"eGFR_below":30,"action":"reduce","note":"Reduce by 75%"},{"eGFR_below":60,"action":"reduce","note":"Reduce dose"}]}'),
('Escitalopram', 'escitalopram', 'ssri', '{"thresholds":[]}'),
('Fluoxetine', 'fluoxetine', 'ssri', '{"thresholds":[]}'),
('Duloxetine', 'duloxetine', 'snri', '{"thresholds":[{"eGFR_below":30,"action":"avoid","note":"Avoid - increased active metabolites"}]}'),
('Tramadol', 'tramadol', 'opioid', '{"thresholds":[{"eGFR_below":30,"action":"reduce","note":"Reduce dose, extend interval to 12-hourly, max 200mg/day"}]}'),
('Morphine', 'morphine', 'opioid', '{"thresholds":[{"eGFR_below":30,"action":"reduce","note":"Reduce dose - active metabolite (M6G) accumulates causing prolonged sedation and respiratory depression"}]}'),
('Fentanyl', 'fentanyl', 'opioid', '{"thresholds":[]}'),
('Paracetamol', 'paracetamol', 'analgesic', '{"thresholds":[]}'),
('Diclofenac', 'diclofenac', 'nsaid', '{"thresholds":[{"eGFR_below":60,"action":"avoid","note":"Avoid in CKD - risk of further renal deterioration, fluid retention, hyperkalemia"},{"eGFR_below":30,"action":"contraindicated","note":"Contraindicated in severe CKD"}]}'),
('Ibuprofen', 'ibuprofen', 'nsaid', '{"thresholds":[{"eGFR_below":60,"action":"avoid","note":"Avoid in CKD - nephrotoxic"},{"eGFR_below":30,"action":"contraindicated","note":"Contraindicated"}]}'),
('Pantoprazole', 'pantoprazole', 'ppi', '{"thresholds":[]}'),
('Omeprazole', 'omeprazole', 'ppi', '{"thresholds":[]}'),
('Tamsulosin', 'tamsulosin', 'alpha_blocker', '{"thresholds":[]}'),
('Digoxin', 'digoxin', 'cardiac_glycoside', '{"thresholds":[{"eGFR_below":30,"action":"reduce","note":"Reduce dose, monitor levels closely. Target 0.5-0.8ng/mL"}]}'),
('Phenytoin', 'phenytoin', 'anticonvulsant', '{"thresholds":[{"eGFR_below":30,"action":"monitor","note":"Complex pharmacokinetics in CKD - monitor free levels, adjust for albumin"}]}'),
('Sodium Valproate', 'sodiumvalproate', 'anticonvulsant', '{"thresholds":[]}'),

-- 6 MISSING DRUGS SEEDED MANUALLY
('Penicillin V', 'penicillinv', 'penicillin', '{"thresholds":[{"eGFR_below":30,"action":"reduce","note":"Reduce dose/frequency in severe CKD"}]}'),
('Carbamazepine', 'carbamazepine', 'anticonvulsant', '{"thresholds":[{"eGFR_below":30,"action":"monitor","note":"Monitor levels closely"}]}'),
('Amiodarone', 'amiodarone', 'antiarrhythmic', '{"thresholds":[]}'),
('Metoclopramide', 'metoclopramide', 'antiemetic', '{"thresholds":[]}'),
('Montelukast', 'montelukast', 'leukotriene_receptor_antagonist', '{"thresholds":[]}'),
('Fluticasone', 'fluticasone', 'inhaled_corticosteroid', '{"thresholds":[]}');

-- 4. INSERT DRUG INTERACTIONS
INSERT INTO drug_interactions (drug_a_id, drug_b_id, severity, mechanism, clinical_effect, management) VALUES
((SELECT id FROM drugs WHERE generic_name_normalized='clarithromycin'), (SELECT id FROM drugs WHERE generic_name_normalized='atorvastatin'), 'SEVERE', 'CYP3A4 inhibition by clarithromycin', 'Statin levels increase 4-5x, risk of rhabdomyolysis', 'AVOID combination. Use azithromycin instead (minimal CYP3A4 effect). If unavoidable, hold statin during antibiotic course.'),
((SELECT id FROM drugs WHERE generic_name_normalized='clarithromycin'), (SELECT id FROM drugs WHERE generic_name_normalized='rosuvastatin'), 'MODERATE', 'Weak CYP3A4 interaction', 'Modest increase in statin levels', 'Monitor for myopathy symptoms. Consider temporary statin dose reduction.'),
((SELECT id FROM drugs WHERE generic_name_normalized='clarithromycin'), (SELECT id FROM drugs WHERE generic_name_normalized='amlodipine'), 'MODERATE', 'CYP3A4 inhibition', 'Increased amlodipine levels causing excessive hypotension', 'Monitor blood pressure closely. Consider dose reduction of amlodipine.'),
((SELECT id FROM drugs WHERE generic_name_normalized='clarithromycin'), (SELECT id FROM drugs WHERE generic_name_normalized='warfarin'), 'SEVERE', 'CYP inhibition increasing warfarin effect', 'Significantly increased INR, high bleeding risk', 'Monitor INR daily during co-administration. Consider azithromycin alternative. Reduce warfarin dose preemptively.'),
((SELECT id FROM drugs WHERE generic_name_normalized='ciprofloxacin'), (SELECT id FROM drugs WHERE generic_name_normalized='warfarin'), 'MODERATE', 'CYP1A2 inhibition', 'Increased INR and bleeding risk', 'Monitor INR closely during co-administration. Adjust warfarin dose as needed.'),
((SELECT id FROM drugs WHERE generic_name_normalized='fluoxetine'), (SELECT id FROM drugs WHERE generic_name_normalized='tramadol'), 'SEVERE', 'Combined serotonergic activity + CYP2D6 inhibition', 'Serotonin syndrome: hyperthermia, rigidity, myoclonus, potentially fatal', 'AVOID combination. Use alternative analgesic (paracetamol, low-dose morphine with monitoring) or alternative antidepressant.'),
((SELECT id FROM drugs WHERE generic_name_normalized='escitalopram'), (SELECT id FROM drugs WHERE generic_name_normalized='tramadol'), 'MODERATE', 'Additive serotonergic effect', 'Risk of serotonin syndrome', 'Monitor closely for signs of serotonin syndrome. Use lowest effective doses. Consider alternative analgesic.'),
((SELECT id FROM drugs WHERE generic_name_normalized='diclofenac'), (SELECT id FROM drugs WHERE generic_name_normalized='telmisartan'), 'SEVERE', 'NSAID + ARB nephrotoxic combination (part of triple whammy with diuretics)', 'Acute kidney injury, hyperkalemia, especially in dehydrated or elderly patients', 'AVOID combination. Use paracetamol for pain. If NSAID essential, use lowest dose for shortest duration with renal monitoring.'),
((SELECT id FROM drugs WHERE generic_name_normalized='diclofenac'), (SELECT id FROM drugs WHERE generic_name_normalized='ramipril'), 'SEVERE', 'NSAID + ACE inhibitor nephrotoxic combination', 'Acute kidney injury, hyperkalemia, reduced antihypertensive effect', 'AVOID combination. Use paracetamol for pain. Monitor renal function if unavoidable.'),
((SELECT id FROM drugs WHERE generic_name_normalized='ibuprofen'), (SELECT id FROM drugs WHERE generic_name_normalized='aspirin'), 'MODERATE', 'Competitive COX-1 binding', 'Ibuprofen blocks aspirin access to COX-1, reducing antiplatelet effect', 'Take aspirin 30min before ibuprofen. Consider alternative analgesic. Monitor for cardiovascular events.'),
((SELECT id FROM drugs WHERE generic_name_normalized='warfarin'), (SELECT id FROM drugs WHERE generic_name_normalized='aspirin'), 'SEVERE', 'Additive anticoagulant and antiplatelet effects', 'Significantly increased risk of major hemorrhage, especially GI bleeding', 'Avoid unless specifically indicated (e.g., mechanical valve). Ensure PPI cover. Monitor INR closely.'),
((SELECT id FROM drugs WHERE generic_name_normalized='spironolactone'), (SELECT id FROM drugs WHERE generic_name_normalized='ramipril'), 'MODERATE', 'Both increase potassium retention', 'Life-threatening hyperkalemia, risk of cardiac arrest', 'Monitor K+ within 1 week of starting, then regularly. Avoid if K+ >5.0. Reduce doses if K+ 4.5-5.0.'),
((SELECT id FROM drugs WHERE generic_name_normalized='spironolactone'), (SELECT id FROM drugs WHERE generic_name_normalized='telmisartan'), 'MODERATE', 'Both increase potassium retention', 'Hyperkalemia risk', 'Monitor K+ closely. Avoid if baseline K+ elevated.'),
((SELECT id FROM drugs WHERE generic_name_normalized='digoxin'), (SELECT id FROM drugs WHERE generic_name_normalized='clarithromycin'), 'SEVERE', 'Reduced P-glycoprotein clearance of digoxin', 'Digoxin toxicity: nausea, visual changes, arrhythmias', 'Monitor digoxin levels. Reduce digoxin dose by 50%. Use azithromycin as alternative.'),
((SELECT id FROM drugs WHERE generic_name_normalized='metformin'), (SELECT id FROM drugs WHERE generic_name_normalized='furosemide'), 'MINOR', 'Furosemide may increase lactate production', 'Slightly increased risk of lactic acidosis, especially in renal impairment', 'Monitor renal function. Ensure adequate hydration.'),
((SELECT id FROM drugs WHERE generic_name_normalized='phenytoin'), (SELECT id FROM drugs WHERE generic_name_normalized='sodiumvalproate'), 'MODERATE', 'Complex bidirectional metabolism alteration', 'Unpredictable changes in levels of both drugs', 'Monitor levels of both drugs. Adjust doses based on clinical response and drug levels.'),
((SELECT id FROM drugs WHERE generic_name_normalized='duloxetine'), (SELECT id FROM drugs WHERE generic_name_normalized='tramadol'), 'SEVERE', 'Combined serotonergic activity', 'Serotonin syndrome risk: potentially fatal', 'AVOID combination. Use alternative analgesic or alternative antidepressant.'),
((SELECT id FROM drugs WHERE generic_name_normalized='clopidogrel'), (SELECT id FROM drugs WHERE generic_name_normalized='omeprazole'), 'MODERATE', 'CYP2C19 inhibition reduces clopidogrel activation', 'Reduced antiplatelet effect, increased cardiovascular event risk', 'Use pantoprazole instead (minimal CYP2C19 effect). Avoid omeprazole with clopidogrel.'),
((SELECT id FROM drugs WHERE generic_name_normalized='clopidogrel'), (SELECT id FROM drugs WHERE generic_name_normalized='pantoprazole'), 'MINOR', 'Weak CYP2C19 interaction', 'Minimal clinical effect - pantoprazole is preferred PPI with clopidogrel', 'Pantoprazole is the preferred PPI. No dose adjustment needed.'),
((SELECT id FROM drugs WHERE generic_name_normalized='rivaroxaban'), (SELECT id FROM drugs WHERE generic_name_normalized='clarithromycin'), 'SEVERE', 'Dual P-gp and CYP3A4 inhibition', 'Significantly increased rivaroxaban levels, major bleeding risk', 'AVOID combination. Use azithromycin. If unavoidable, consider dose reduction and monitor for bleeding.'),
((SELECT id FROM drugs WHERE generic_name_normalized='apixaban'), (SELECT id FROM drugs WHERE generic_name_normalized='clarithromycin'), 'MODERATE', 'P-gp and CYP3A4 inhibition', 'Increased apixaban levels, increased bleeding risk', 'Monitor for bleeding. Consider apixaban dose reduction. Use azithromycin if possible.'),
((SELECT id FROM drugs WHERE generic_name_normalized='amlodipine'), (SELECT id FROM drugs WHERE generic_name_normalized='atorvastatin'), 'MODERATE', 'CYP3A4 interaction (note: simvastatin more affected)', 'Modest increase in statin levels', 'Limit simvastatin to 20mg with amlodipine. Atorvastatin generally safe but monitor.'),
((SELECT id FROM drugs WHERE generic_name_normalized='cotrimoxazole'), (SELECT id FROM drugs WHERE generic_name_normalized='metformin'), 'SEVERE', 'Antifolate effect, bone marrow suppression', 'Pancytopenia, severe myelosuppression', 'Monitor FBC closely. Consider alternative antibiotic. Avoid prolonged courses.'),
((SELECT id FROM drugs WHERE generic_name_normalized='clarithromycin'), (SELECT id FROM drugs WHERE generic_name_normalized='phenytoin'), 'SEVERE', 'CYP3A4 inhibition of carbamazepine-like anticonvulsant metabolism', 'Risk of anticonvulsant toxicity: ataxia, nystagmus, seizures', 'Monitor anticonvulsant levels. Use azithromycin alternative.'),
((SELECT id FROM drugs WHERE generic_name_normalized='ciprofloxacin'), (SELECT id FROM drugs WHERE generic_name_normalized='phenytoin'), 'SEVERE', 'CYP1A2 inhibition', 'Risk of theophylline-like toxicity: seizures, cardiac arrhythmias', 'AVOID combination. Use alternative antibiotic. Monitor drug levels.'),
((SELECT id FROM drugs WHERE generic_name_normalized='diclofenac'), (SELECT id FROM drugs WHERE generic_name_normalized='lisinopril'), 'SEVERE', 'NSAID + ACE inhibitor nephrotoxic combination', 'Acute kidney injury, hyperkalemia, reduced antihypertensive effect', 'AVOID combination. Use paracetamol for pain.'),
((SELECT id FROM drugs WHERE generic_name_normalized='ibuprofen'), (SELECT id FROM drugs WHERE generic_name_normalized='telmisartan'), 'SEVERE', 'NSAID + ARB nephrotoxic combination (triple whammy risk)', 'Acute kidney injury, hyperkalemia', 'AVOID combination. Use paracetamol for pain. Monitor renal function.'),
((SELECT id FROM drugs WHERE generic_name_normalized='morphine'), (SELECT id FROM drugs WHERE generic_name_normalized='escitalopram'), 'MINOR', 'Additive CNS depression', 'Increased sedation and respiratory depression risk', 'Monitor sedation levels. Use lowest effective opioid dose.'),
((SELECT id FROM drugs WHERE generic_name_normalized='pregabalin'), (SELECT id FROM drugs WHERE generic_name_normalized='morphine'), 'MODERATE', 'Additive CNS and respiratory depressant effects', 'Excessive sedation, respiratory depression, potentially fatal', 'Reduce opioid dose by 25-50% when adding pregabalin. Monitor respiratory rate.'),
((SELECT id FROM drugs WHERE generic_name_normalized='diclofenac'), (SELECT id FROM drugs WHERE generic_name_normalized='digoxin'), 'SEVERE', 'Reduced renal clearance of digoxin + direct nephrotoxicity', 'Digoxin toxicity and acute kidney injury', 'AVOID combination. Use paracetamol. Monitor digoxin levels if unavoidable.'),

-- NEW DRUG SCENARIO INTERACTIONS SEEDED MANUALLY
((SELECT id FROM drugs WHERE generic_name_normalized='amiodarone'), (SELECT id FROM drugs WHERE generic_name_normalized='warfarin'), 'SEVERE', 'CYP2C9 inhibition by amiodarone', 'Significantly increased warfarin levels, elevated INR, bleeding risk', 'Monitor INR closely. Reduce warfarin dose by 30-50% when starting amiodarone.'),
((SELECT id FROM drugs WHERE generic_name_normalized='amiodarone'), (SELECT id FROM drugs WHERE generic_name_normalized='bisoprolol'), 'MODERATE', 'Additive negative chronotropic effects', 'Risk of bradycardia, sinus arrest, or heart block', 'Monitor heart rate and ECG closely. Adjust doses as needed.'),
((SELECT id FROM drugs WHERE generic_name_normalized='clarithromycin'), (SELECT id FROM drugs WHERE generic_name_normalized='carbamazepine'), 'SEVERE', 'CYP3A4 inhibition of carbamazepine metabolism by clarithromycin', 'Risk of anticonvulsant toxicity: ataxia, nystagmus, seizures', 'AVOID combination. Use azithromycin. Monitor carbamazepine levels closely.');

-- 5. INSERT ALLERGY CROSS-REACTIVITY RULES
INSERT INTO allergy_cross_reactivity (drug_class_a, drug_class_b, cross_reactivity_pct, clinical_guidance) VALUES
('penicillin', 'penicillin', 100, 'DIRECT MATCH - Same drug class. Absolute contraindication regardless of reaction severity.'),
('penicillin', 'cephalosporin_1st', 2, 'Low cross-reactivity (1-2%). AVOID if history of anaphylaxis to penicillin. Use with caution if mild reaction only.'),
('penicillin', 'cephalosporin_3rd', 0.5, 'Very low cross-reactivity (<0.5%). Generally safe to use. Exercise caution if severe anaphylaxis history.'),
('penicillin', 'carbapenem', 1, 'Low cross-reactivity (<1%). Generally safe. Monitor first dose in patients with severe penicillin anaphylaxis.'),
('sulfonamide', 'sulfonamide', 100, 'DIRECT MATCH - Same drug class. Avoid all sulfonamide antibiotics.'),
('ace_inhibitor', 'ace_inhibitor', 100, 'DIRECT MATCH - Class-wide angioedema risk. Contraindicated if angioedema with any ACE inhibitor.'),
('ace_inhibitor', 'arb', 0, 'ARBs are SAFE alternative to ACE inhibitors. Different mechanism. No cross-reactivity for angioedema.'),
('nsaid', 'nsaid', 100, 'Cross-reactivity between NSAIDs is common, especially in aspirin-exacerbated respiratory disease. Avoid ALL NSAIDs if aspirin allergy with bronchospasm.');
