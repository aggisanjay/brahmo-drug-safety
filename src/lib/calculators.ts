// =============================================
// Clinical Calculators — eGFR CKD-EPI 2021 & CHA2DS2-VASc
// =============================================
import type { EGFRResult, CHA2DS2VAScResult } from './types';

/**
 * CKD-EPI 2021 eGFR Calculator (race-free equation)
 * Formula: 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^(-1.200) × 0.9938^age × (1.012 if female)
 */
export function calculateEGFR(
  creatinine: number,
  age: number,
  sex: 'M' | 'F'
): EGFRResult {
  const kappa = sex === 'F' ? 0.7 : 0.9;
  const alpha = sex === 'F' ? -0.241 : -0.302;
  const sexMultiplier = sex === 'F' ? 1.012 : 1.0;

  const scrKappaRatio = creatinine / kappa;
  const minTerm = Math.pow(Math.min(scrKappaRatio, 1), alpha);
  const maxTerm = Math.pow(Math.max(scrKappaRatio, 1), -1.200);
  const ageTerm = Math.pow(0.9938, age);

  const eGFR = 142 * minTerm * maxTerm * ageTerm * sexMultiplier;
  const rounded = Math.round(eGFR * 10) / 10;

  return {
    value: rounded,
    stage: getStage(rounded),
    interpretation: getInterpretation(rounded),
  };
}

function getStage(eGFR: number): string {
  if (eGFR >= 90) return 'G1 - Normal';
  if (eGFR >= 60) return 'G2 - Mildly decreased';
  if (eGFR >= 45) return 'G3a - Mild-moderate decrease';
  if (eGFR >= 30) return 'G3b - Moderate-severe decrease';
  if (eGFR >= 15) return 'G4 - Severely decreased';
  return 'G5 - Kidney failure';
}

function getInterpretation(eGFR: number): string {
  if (eGFR >= 90) return 'Normal kidney function';
  if (eGFR >= 60) return 'Mild loss of kidney function';
  if (eGFR >= 45) return 'Mild to moderate loss of kidney function';
  if (eGFR >= 30) return 'Moderate to severe loss of kidney function';
  if (eGFR >= 15) return 'Severe loss of kidney function';
  return 'Kidney failure — may need dialysis or transplant';
}

/**
 * CHA2DS2-VASc Score Calculator
 * C - CHF (+1), H - Hypertension (+1), A2 - Age ≥75 (+2),
 * D - Diabetes (+1), S2 - Stroke/TIA (+2), V - Vascular disease (+1),
 * A - Age 65-74 (+1), Sc - Sex category female (+1)
 */
export function calculateCHA2DS2VASc(params: {
  hasChf: boolean;
  hasHypertension: boolean;
  age: number;
  hasDiabetes: boolean;
  hasStrokeOrTia: boolean;
  hasVascularDisease: boolean;
  sex: 'M' | 'F';
}): CHA2DS2VAScResult {
  const components: { [key: string]: number } = {};

  components['CHF'] = params.hasChf ? 1 : 0;
  components['Hypertension'] = params.hasHypertension ? 1 : 0;
  components['Age ≥75'] = params.age >= 75 ? 2 : 0;
  components['Diabetes'] = params.hasDiabetes ? 1 : 0;
  components['Stroke/TIA'] = params.hasStrokeOrTia ? 2 : 0;
  components['Vascular disease'] = params.hasVascularDisease ? 1 : 0;
  components['Age 65-74'] = params.age >= 65 && params.age < 75 ? 1 : 0;
  components['Female sex'] = params.sex === 'F' ? 1 : 0;

  const score = Object.values(components).reduce((a, b) => a + b, 0);

  // Annual stroke risk per score
  const riskMap: { [key: number]: string } = {
    0: '0%', 1: '1.3%', 2: '2.2%', 3: '3.2%', 4: '4.0%',
    5: '6.7%', 6: '9.8%', 7: '9.6%', 8: '6.7%', 9: '15.2%',
  };

  const isMale = params.sex === 'M';
  const threshold = isMale ? 2 : 3;
  const needsAnticoagulation = score >= threshold;

  return {
    score,
    components,
    riskPerYear: riskMap[score] || '>15%',
    recommendation: needsAnticoagulation
      ? `CHA₂DS₂-VASc = ${score}. Stroke risk ${riskMap[score] || '>15%'}/year. Anticoagulation is STRONGLY recommended.`
      : `CHA₂DS₂-VASc = ${score}. Stroke risk ${riskMap[score] || '0%'}/year. Anticoagulation may not be required — consider patient factors.`,
  };
}
