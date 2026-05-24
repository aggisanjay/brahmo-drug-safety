// =============================================
// Drug Safety Engine — Deterministic Safety Checks
// =============================================
import { supabase } from './supabase';
import { calculateEGFR, calculateCHA2DS2VASc } from './calculators';
import type {
  Drug, DrugInteraction, AllergyCrossReactivity,
  SafetyAlert, SafetyCheckResult, Patient, AlertSeverity,
} from './types';

// =============================================
// In-memory cache for performance
// =============================================
let drugCache: Drug[] | null = null;
let interactionCache: DrugInteraction[] | null = null;
let allergyCache: AllergyCrossReactivity[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadCache() {
  const now = Date.now();
  if (drugCache && interactionCache && allergyCache && now - cacheTimestamp < CACHE_TTL) {
    return;
  }

  const [drugsRes, interactionsRes, allergyRes] = await Promise.all([
    supabase.from('drugs').select('*'),
    supabase.from('drug_interactions').select('*'),
    supabase.from('allergy_cross_reactivity').select('*'),
  ]);

  if (drugsRes.error) throw new Error(`Failed to load drugs: ${drugsRes.error.message}`);
  if (interactionsRes.error) throw new Error(`Failed to load interactions: ${interactionsRes.error.message}`);
  if (allergyRes.error) throw new Error(`Failed to load allergy data: ${allergyRes.error.message}`);

  drugCache = drugsRes.data as Drug[];
  interactionCache = interactionsRes.data as DrugInteraction[];
  allergyCache = allergyRes.data as AllergyCrossReactivity[];
  cacheTimestamp = now;
}

function normalizeDrugName(name: string): string {
  return name.toLowerCase().replace(/[\s\-\_]/g, '').replace(/[^a-z0-9]/g, '');
}

function findDrug(name: string): Drug | undefined {
  if (!drugCache) return undefined;
  const normalized = normalizeDrugName(name);
  return drugCache.find(d => d.generic_name_normalized === normalized);
}

// =============================================
// CHECK 1: Drug Interactions
// =============================================
export async function checkDrugInteractions(
  newDrugName: string,
  currentMedications: string[]
): Promise<SafetyAlert[]> {
  await loadCache();
  const alerts: SafetyAlert[] = [];

  const newDrug = findDrug(newDrugName);
  if (!newDrug) {
    alerts.push({
      type: 'drug_interaction',
      severity: 'INFO',
      importance: 3,
      title: `Drug not found: ${newDrugName}`,
      details: `"${newDrugName}" is not in the database. Interaction check could not be performed.`,
      recommendation: 'Verify drug name and check interactions manually.',
      icon: 'ℹ️',
    });
    return alerts;
  }

  // Check new drug against all current medications
  for (const medName of currentMedications) {
    const currentDrug = findDrug(medName);
    if (!currentDrug) continue;

    const interaction = findInteraction(newDrug.id, currentDrug.id);
    if (interaction) {
      const severity = mapSeverity(interaction.severity);
      alerts.push({
        type: 'drug_interaction',
        severity,
        importance: getImportance(severity),
        title: `${interaction.severity}: ${newDrug.generic_name} + ${currentDrug.generic_name}`,
        details: `Mechanism: ${interaction.mechanism}. Effect: ${interaction.clinical_effect}`,
        recommendation: interaction.management,
        icon: getIcon(severity),
      });
    }
  }

  // Also check interactions between existing medications (bonus: catches existing risks)
  for (let i = 0; i < currentMedications.length; i++) {
    for (let j = i + 1; j < currentMedications.length; j++) {
      const drugA = findDrug(currentMedications[i]);
      const drugB = findDrug(currentMedications[j]);
      if (!drugA || !drugB) continue;

      const interaction = findInteraction(drugA.id, drugB.id);
      if (interaction && (interaction.severity === 'SEVERE' || interaction.severity === 'CONTRAINDICATED' || interaction.severity === 'MODERATE')) {
        alerts.push({
          type: 'drug_interaction',
          severity: mapSeverity(interaction.severity),
          importance: getImportance(mapSeverity(interaction.severity)) - 1,
          title: `EXISTING ${interaction.severity}: ${drugA.generic_name} + ${drugB.generic_name}`,
          details: `Current medication risk: ${interaction.mechanism}. ${interaction.clinical_effect}`,
          recommendation: interaction.management,
          icon: '⚠️',
        });
      }
    }
  }

  return alerts;
}

function findInteraction(drugAId: string, drugBId: string): DrugInteraction | undefined {
  if (!interactionCache) return undefined;
  return interactionCache.find(
    i => (i.drug_a_id === drugAId && i.drug_b_id === drugBId) ||
         (i.drug_a_id === drugBId && i.drug_b_id === drugAId)
  );
}

// =============================================
// CHECK 2: Allergy Conflicts
// =============================================
export async function checkAllergyConflicts(
  newDrugName: string,
  patientAllergies: { allergen: string; reaction: string; severity: string }[]
): Promise<SafetyAlert[]> {
  await loadCache();
  const alerts: SafetyAlert[] = [];

  if (!patientAllergies || patientAllergies.length === 0) return alerts;

  const newDrug = findDrug(newDrugName);
  if (!newDrug) return alerts;

  for (const allergy of patientAllergies) {
    if (allergy.allergen.toLowerCase() === 'nkda' || allergy.allergen.toLowerCase() === 'none') continue;

    // Find the allergen drug to get its class
    const allergenDrug = findDrug(allergy.allergen);
    let allergenClass = allergenDrug?.drug_class || allergy.allergen.toLowerCase().replace(/\s+/g, '_');

    // Aspirin behaves as an NSAID for allergy cross-reactivity
    if (allergy.allergen.toLowerCase() === 'aspirin') {
      allergenClass = 'nsaid';
    }

    // Direct class match
    if (newDrug.drug_class === allergenClass) {
      const isAnaphylaxis = allergy.severity === 'anaphylaxis' ||
        allergy.reaction.toLowerCase().includes('anaphylaxis');

      alerts.push({
        type: 'allergy_conflict',
        severity: 'HARD_BLOCK',
        importance: 10,
        title: `ALLERGY BLOCK: ${newDrug.generic_name} is a ${newDrug.drug_class}`,
        details: `Patient has documented ${allergy.reaction} to ${allergy.allergen}. ${newDrug.generic_name} belongs to the same drug class (${newDrug.drug_class}).${isAnaphylaxis ? ' ANAPHYLAXIS DOCUMENTED — NON-OVERRIDABLE.' : ''}`,
        recommendation: `DO NOT administer ${newDrug.generic_name}. Find an alternative from a different drug class.`,
        icon: '⛔',
      });
    }

    // Cross-reactivity check
    if (allergyCache) {
      for (const cr of allergyCache) {
        const isMatch = (cr.drug_class_a === allergenClass && cr.drug_class_b === newDrug.drug_class) ||
                        (cr.drug_class_a === newDrug.drug_class && cr.drug_class_b === allergenClass);

        if (isMatch && cr.cross_reactivity_pct < 100) { // 100% is handled by direct match
          const isAnaphylaxis = allergy.severity === 'anaphylaxis' ||
            allergy.reaction.toLowerCase().includes('anaphylaxis');

          let severity: AlertSeverity = 'INFO';
          let importance = 4;

          if (isAnaphylaxis && cr.cross_reactivity_pct > 0) {
            severity = 'SEVERE';
            importance = 8;
          } else if (cr.cross_reactivity_pct >= 2) {
            severity = 'MODERATE';
            importance = 6;
          }

          if (cr.cross_reactivity_pct === 0) {
            alerts.push({
              type: 'allergy_conflict',
              severity: 'INFO',
              importance: 2,
              title: `ALLERGY CLEARANCE: ${newDrug.generic_name} (${newDrug.drug_class}) — no cross-reactivity with ${allergy.allergen}`,
              details: cr.clinical_guidance,
              recommendation: `${newDrug.generic_name} can be used safely despite ${allergy.allergen} allergy.`,
              icon: 'ℹ️',
            });
          } else {
            alerts.push({
              type: 'allergy_conflict',
              severity,
              importance,
              title: `Cross-reactivity: ${newDrug.generic_name} (${newDrug.drug_class}) — ${cr.cross_reactivity_pct}% cross-reactivity with ${allergy.allergen}`,
              details: cr.clinical_guidance,
              recommendation: isAnaphylaxis
                ? `AVOID: Patient had documented anaphylaxis to ${allergy.allergen}. Cross-reactivity risk is unacceptable. Select alternative class.`
                : `MONITOR & PROCEED WITH CAUTION: Administer first dose under clinical supervision. Monitor closely for signs of hypersensitivity (rash, pruritus, wheezing).`,
              icon: getIcon(severity),
            });
          }
        }
      }
    }
  }

  return alerts;
}

// =============================================
// CHECK 3: Renal Dosing
// =============================================
export async function checkRenalDosing(
  newDrugName: string,
  patientEGFR: number
): Promise<SafetyAlert[]> {
  await loadCache();
  const alerts: SafetyAlert[] = [];

  const drug = findDrug(newDrugName);
  if (!drug) return alerts;

  const thresholds = drug.renal_dosing?.thresholds || [];
  if (thresholds.length === 0) {
    alerts.push({
      type: 'renal_dosing',
      severity: 'INFO',
      importance: 1,
      title: `${drug.generic_name}: No renal dose adjustment needed`,
      details: `Standard dosing appropriate at eGFR ${patientEGFR} mL/min/1.73m²`,
      recommendation: 'Use standard dosing.',
      icon: 'ℹ️',
    });
    return alerts;
  }

  // Sort thresholds from lowest to highest eGFR so we match the most specific rule first
  const sorted = [...thresholds].sort((a, b) => a.eGFR_below - b.eGFR_below);

  for (const threshold of sorted) {
    if (patientEGFR < threshold.eGFR_below) {
      let severity: AlertSeverity = 'MODERATE';
      let importance = 6;

      if (threshold.action === 'contraindicated') {
        severity = 'HARD_BLOCK';
        importance = 10;
      } else if (threshold.action === 'avoid') {
        severity = 'SEVERE';
        importance = 8;
      } else if (threshold.action === 'reduce') {
        severity = 'MODERATE';
        importance = 6;
      } else if (threshold.action === 'monitor') {
        severity = 'MINOR';
        importance = 4;
      }

      let recommendation = threshold.note;
      if (threshold.action === 'contraindicated') {
        recommendation = 'CONTRAINDICATED: Do not administer at this level of renal clearance. Discontinue or select alternative agent.';
      } else if (threshold.action === 'avoid') {
        recommendation = 'AVOID: Select alternative therapy if possible. If required, use with extreme caution and/or adjust dose.';
      } else if (threshold.action === 'reduce') {
        recommendation = 'DOSE ADJUSTMENT REQUIRED: Reduce dosage of the drug as specified by the dosing guideline.';
      } else if (threshold.action === 'monitor') {
        recommendation = 'MONITORING REQUIRED: Regular surveillance of renal function (serum creatinine, eGFR) and electrolytes is indicated.';
      } else if (threshold.action === 'increase') {
        recommendation = 'DOSE INCREASE / ADJUSTMENT: Adjust dosage upward as specified by the dosing rule with careful monitoring.';
      }

      alerts.push({
        type: 'renal_dosing',
        severity,
        importance,
        title: `Renal dosing alert: ${drug.generic_name} at eGFR ${patientEGFR}`,
        details: `${threshold.note}. Current eGFR: ${patientEGFR} mL/min/1.73m² (threshold: eGFR < ${threshold.eGFR_below}).`,
        recommendation,
        icon: getIcon(severity),
      });
    }
  }

  return alerts;
}

// =============================================
// CHECK 4: Clinical Calculators
// =============================================
export function computeScore(
  calculator: 'egfr' | 'cha2ds2vasc',
  patientData: Patient
): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];

  if (calculator === 'egfr' && patientData.labs.creatinine) {
    const result = calculateEGFR(patientData.labs.creatinine, patientData.age, patientData.sex);
    alerts.push({
      type: 'calculator',
      severity: result.value < 30 ? 'SEVERE' : result.value < 60 ? 'MODERATE' : 'INFO',
      importance: result.value < 30 ? 8 : result.value < 60 ? 5 : 2,
      title: `eGFR (CKD-EPI 2021): ${result.value} mL/min/1.73m²`,
      details: `Stage: ${result.stage}. ${result.interpretation}. Calculated from: Creatinine ${patientData.labs.creatinine} mg/dL, Age ${patientData.age}, Sex ${patientData.sex}.`,
      recommendation: result.value < 30
        ? 'Severe renal impairment. Review ALL medications for renal dosing. Avoid nephrotoxic drugs.'
        : result.value < 60
          ? 'Moderate renal impairment. Check renal dosing for all renally cleared medications.'
          : 'Normal or mildly reduced kidney function. Standard dosing for most drugs.',
      icon: result.value < 30 ? '⚠️' : 'ℹ️',
    });
  }

  if (calculator === 'cha2ds2vasc' && patientData.conditions) {
    const hasChf = patientData.conditions.some(c => c.name.toLowerCase().includes('chf') || c.name.toLowerCase().includes('heart failure'));
    const hasHtn = patientData.conditions.some(c => c.name.toLowerCase().includes('htn') || c.name.toLowerCase().includes('hypertension'));
    const hasDm = patientData.conditions.some(c => c.name.toLowerCase().includes('dm') || c.name.toLowerCase().includes('diabetes'));
    const hasStroke = patientData.conditions.some(c => c.name.toLowerCase().includes('stroke') || c.name.toLowerCase().includes('tia'));
    const hasVascular = patientData.conditions.some(c => c.name.toLowerCase().includes('vascular') || c.name.toLowerCase().includes('mi') || c.name.toLowerCase().includes('pad'));

    const result = calculateCHA2DS2VASc({
      hasChf, hasHypertension: hasHtn, age: patientData.age,
      hasDiabetes: hasDm, hasStrokeOrTia: hasStroke,
      hasVascularDisease: hasVascular, sex: patientData.sex,
    });

    alerts.push({
      type: 'calculator',
      severity: result.score >= 2 ? 'MODERATE' : 'INFO',
      importance: result.score >= 2 ? 7 : 3,
      title: `CHA₂DS₂-VASc Score: ${result.score}`,
      details: `Components: ${Object.entries(result.components).filter(([, v]) => v > 0).map(([k, v]) => `${k}: +${v}`).join(', ')}. Annual stroke risk: ${result.riskPerYear}.`,
      recommendation: result.recommendation,
      icon: result.score >= 2 ? '⚠️' : 'ℹ️',
    });
  }

  return alerts;
}

// =============================================
// MAIN: Run all safety checks
// =============================================
export async function runSafetyChecks(
  patient: Patient,
  newDrugName?: string,
  question?: string,
): Promise<SafetyCheckResult> {
  const startTime = performance.now();
  const allAlerts: SafetyAlert[] = [];
  const checksPerformed: string[] = [];

  // Compute eGFR first
  let patientEGFR = patient.labs.eGFR;
  if (patient.labs.creatinine) {
    const eGFRResult = calculateEGFR(patient.labs.creatinine, patient.age, patient.sex);
    patientEGFR = eGFRResult.value;
    const eGFRAlerts = computeScore('egfr', patient);
    allAlerts.push(...eGFRAlerts);
    checksPerformed.push('eGFR calculation');
  }

  // CHA2DS2-VASc if applicable
  if (patient.conditions && patient.conditions.some(c =>
    c.name.toLowerCase().includes('af') || c.name.toLowerCase().includes('atrial fibrillation')
  )) {
    const chadsAlerts = computeScore('cha2ds2vasc', patient);
    allAlerts.push(...chadsAlerts);
    checksPerformed.push('CHA₂DS₂-VASc calculation');
  }

  // Extract drug name from question if not provided
  const drugToCheck = newDrugName || extractDrugFromQuestion(question || '');

  if (drugToCheck) {
    // Drug interaction check
    const medNames = patient.medications.map(m => m.name);
    const interactionAlerts = await checkDrugInteractions(drugToCheck, medNames);
    allAlerts.push(...interactionAlerts);
    checksPerformed.push('Drug interaction check');

    // Allergy check
    const allergyAlerts = await checkAllergyConflicts(drugToCheck, patient.allergies.map(a => ({
      allergen: a.allergen,
      reaction: a.reaction,
      severity: a.severity,
    })));
    allAlerts.push(...allergyAlerts);
    checksPerformed.push('Allergy conflict check');

    // Renal dosing check
    if (patientEGFR !== undefined) {
      const renalAlerts = await checkRenalDosing(drugToCheck, patientEGFR);
      allAlerts.push(...renalAlerts);
      checksPerformed.push('Renal dosing check');
    }
  }

  // Also scan existing medications for renal dosing concerns
  if (patientEGFR !== undefined && patientEGFR < 60) {
    for (const med of patient.medications) {
      const renalAlerts = await checkRenalDosing(med.name, patientEGFR);
      const significantAlerts = renalAlerts.filter(a => a.severity !== 'INFO');
      allAlerts.push(...significantAlerts);
    }
    checksPerformed.push('Existing medication renal review');
  }

  // Sort alerts by importance (highest first)
  allAlerts.sort((a, b) => b.importance - a.importance);

  // Remove duplicates
  const uniqueAlerts = allAlerts.filter((alert, index, self) =>
    index === self.findIndex(a => a.title === alert.title)
  );

  const endTime = performance.now();

  return {
    alerts: uniqueAlerts,
    constraintText: generateConstraintText(uniqueAlerts),
    timestamp: new Date().toISOString(),
    checkDurationMs: Math.round(endTime - startTime),
    checksPerformed,
    dbMetrics: {
      drugsCount: drugCache ? drugCache.length : 0,
      interactionsCount: interactionCache ? interactionCache.length : 0,
      allergiesCount: allergyCache ? allergyCache.length : 0,
    }
  };
}

// =============================================
// Extract drug name from doctor's question
// =============================================
function extractDrugFromQuestion(question: string): string | null {
  if (!drugCache) return null;

  const lowerQ = question.toLowerCase();

  // Sort drugs by length descending to match longer names (e.g. Amoxicillin-Clavulanate) before shorter ones (e.g. Amoxicillin)
  const sortedDrugs = [...drugCache].sort((a, b) => b.generic_name.length - a.generic_name.length);

  for (const drug of sortedDrugs) {
    if (lowerQ.includes(drug.generic_name.toLowerCase())) {
      return drug.generic_name;
    }
  }

  return null;
}

// =============================================
// Generate constraint text for LLM system prompt
// =============================================
function generateConstraintText(alerts: SafetyAlert[]): string {
  if (alerts.length === 0) return '';

  let text = '=== DRUG SAFETY CONSTRAINTS (NON-OVERRIDABLE) ===\n';
  text += 'The following safety checks were performed by a deterministic drug safety engine.\n';
  text += 'These are FACTS from verified database lookups, NOT AI suggestions.\n';
  text += 'You MUST acknowledge and incorporate ALL of these findings in your response.\n\n';

  const hardBlocks = alerts.filter(a => a.severity === 'HARD_BLOCK');
  const severeWarnings = alerts.filter(a => a.severity === 'SEVERE');
  const moderateWarnings = alerts.filter(a => a.severity === 'MODERATE');
  const minorInfos = alerts.filter(a => a.severity === 'MINOR' || a.severity === 'INFO');

  if (hardBlocks.length > 0) {
    text += '⛔ HARD BLOCKS (DO NOT PROCEED — NON-NEGOTIABLE):\n';
    hardBlocks.forEach(a => {
      text += `  ⛔ ${a.title}\n     ${a.details}\n     Action: ${a.recommendation}\n\n`;
    });
  }

  if (severeWarnings.length > 0) {
    text += '⚠️ SEVERE WARNINGS:\n';
    severeWarnings.forEach(a => {
      text += `  ⚠️ ${a.title}\n     ${a.details}\n     Management: ${a.recommendation}\n\n`;
    });
  }

  if (moderateWarnings.length > 0) {
    text += '⚠️ MODERATE WARNINGS:\n';
    moderateWarnings.forEach(a => {
      text += `  ⚠️ ${a.title}\n     ${a.details}\n     Management: ${a.recommendation}\n\n`;
    });
  }

  if (minorInfos.length > 0) {
    text += 'ℹ️ INFORMATION:\n';
    minorInfos.forEach(a => {
      text += `  ℹ️ ${a.title}\n     ${a.details}\n\n`;
    });
  }

  text += '=== END SAFETY CONSTRAINTS ===\n';
  text += 'You MUST address each constraint in your response. For HARD BLOCKS, you must refuse the proposed action and suggest alternatives.\n';

  return text;
}

// =============================================
// Helper functions
// =============================================
function mapSeverity(dbSeverity: string): AlertSeverity {
  switch (dbSeverity) {
    case 'CONTRAINDICATED': return 'HARD_BLOCK';
    case 'SEVERE': return 'SEVERE';
    case 'MODERATE': return 'MODERATE';
    case 'MINOR': return 'MINOR';
    default: return 'INFO';
  }
}

function getImportance(severity: AlertSeverity): number {
  switch (severity) {
    case 'HARD_BLOCK': return 10;
    case 'SEVERE': return 8;
    case 'MODERATE': return 5;
    case 'MINOR': return 3;
    case 'INFO': return 1;
  }
}

function getIcon(severity: AlertSeverity): string {
  switch (severity) {
    case 'HARD_BLOCK': return '⛔';
    case 'SEVERE': return '⚠️';
    case 'MODERATE': return '⚠️';
    case 'MINOR': return 'ℹ️';
    case 'INFO': return 'ℹ️';
  }
}
