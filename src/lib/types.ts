// =============================================
// Drug Safety Engine — Type Definitions
// =============================================

export interface Drug {
  id: string;
  generic_name: string;
  generic_name_normalized: string;
  drug_class: string;
  renal_dosing: {
    thresholds: RenalThreshold[];
  };
}

export interface RenalThreshold {
  eGFR_below: number;
  action: 'contraindicated' | 'avoid' | 'reduce' | 'monitor' | 'increase';
  note: string;
}

export interface DrugInteraction {
  id: string;
  drug_a_id: string;
  drug_b_id: string;
  severity: 'CONTRAINDICATED' | 'SEVERE' | 'MODERATE' | 'MINOR';
  mechanism: string;
  clinical_effect: string;
  management: string;
  drug_a_name?: string;
  drug_b_name?: string;
}

export interface AllergyCrossReactivity {
  id: string;
  drug_class_a: string;
  drug_class_b: string;
  cross_reactivity_pct: number;
  clinical_guidance: string;
}

// Patient types
export interface PatientAllergy {
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'anaphylaxis';
}

export interface PatientMedication {
  name: string;
  dose: string;
  normalized?: string;
}

export interface PatientLabs {
  creatinine?: number;
  eGFR?: number;
  potassium?: number;
  hba1c?: number;
  inr?: number;
  bnp?: number;
  troponin?: number;
  wbc?: number;
  lactate?: number;
  hemoglobin?: number;
  valproateLevel?: number;
  fev1?: number;
}

export interface PatientVitals {
  hr?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  spo2?: number;
  rr?: number;
  temp?: number;
}

export interface PatientCondition {
  name: string;
  active: boolean;
}

export interface Patient {
  id: number;
  name: string;
  age: number;
  sex: 'M' | 'F';
  weight?: number;
  isDemo: boolean;
  medications: PatientMedication[];
  allergies: PatientAllergy[];
  labs: PatientLabs;
  vitals?: PatientVitals;
  conditions?: PatientCondition[];
  notes?: string;
}

// Safety check results
export type AlertSeverity = 'HARD_BLOCK' | 'SEVERE' | 'MODERATE' | 'MINOR' | 'INFO';

export interface SafetyAlert {
  type: 'drug_interaction' | 'allergy_conflict' | 'renal_dosing' | 'calculator';
  severity: AlertSeverity;
  importance: number; // 1-10
  title: string;
  details: string;
  recommendation: string;
  icon: string;
}

export interface SafetyCheckResult {
  alerts: SafetyAlert[];
  constraintText: string;
  timestamp: string;
  checkDurationMs: number;
  checksPerformed: string[];
}

export interface CHA2DS2VAScResult {
  score: number;
  components: { [key: string]: number };
  riskPerYear: string;
  recommendation: string;
}

export interface EGFRResult {
  value: number;
  stage: string;
  interpretation: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  type: 'generic' | 'enhanced';
  safetyResult?: SafetyCheckResult;
}
