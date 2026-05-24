'use client';
import type { Patient } from '@/lib/types';
import { calculateEGFR } from '@/lib/calculators';
import {
  PillIcon,
  AlertTriangleIcon,
  BeakerIcon,
  ActivityIcon,
  StethoscopeIcon,
  FileTextIcon,
} from './icons';

interface PatientCardProps {
  patient: Patient;
}

function getLabStatus(label: string, value: number) {
  const lbl = label.toLowerCase();
  if (lbl.includes('egfr')) {
    if (value < 30) return { status: 'critical', pct: Math.max(10, (value / 90) * 100) };
    if (value < 60) return { status: 'warning', pct: (value / 90) * 100 };
    return { status: 'safe', pct: Math.min(100, (value / 90) * 100) };
  }
  if (lbl.includes('creatinine')) {
    if (value > 2.0) return { status: 'critical', pct: Math.min(100, (value / 3.0) * 100) };
    if (value > 1.2) return { status: 'warning', pct: (value / 3.0) * 100 };
    return { status: 'safe', pct: (value / 3.0) * 100 };
  }
  if (lbl.includes('potassium') || lbl.includes('k+')) {
    if (value > 5.5 || value < 3.0) return { status: 'critical', pct: (value / 7.0) * 100 };
    if (value > 5.0 || value < 3.5) return { status: 'warning', pct: (value / 7.0) * 100 };
    return { status: 'safe', pct: (value / 7.0) * 100 };
  }
  if (lbl.includes('hba1c')) {
    if (value > 7.0) return { status: 'critical', pct: (value / 12) * 100 };
    if (value > 5.7) return { status: 'warning', pct: (value / 12) * 100 };
    return { status: 'safe', pct: (value / 12) * 100 };
  }
  if (lbl.includes('bnp')) {
    if (value > 400) return { status: 'critical', pct: 100 };
    if (value > 100) return { status: 'warning', pct: 60 };
    return { status: 'safe', pct: 30 };
  }
  if (lbl.includes('wbc')) {
    if (value > 15 || value < 3.0) return { status: 'critical', pct: Math.min(100, (value / 25) * 100) };
    if (value > 11 || value < 4.0) return { status: 'warning', pct: (value / 25) * 100 };
    return { status: 'safe', pct: (value / 25) * 100 };
  }
  if (lbl.includes('lactate')) {
    if (value > 4.0) return { status: 'critical', pct: Math.min(100, (value / 6.0) * 100) };
    if (value > 2.0) return { status: 'warning', pct: (value / 6.0) * 100 };
    return { status: 'safe', pct: (value / 6.0) * 100 };
  }
  if (lbl.includes('hb') || lbl.includes('hemoglobin')) {
    if (value < 10) return { status: 'critical', pct: (value / 16) * 100 };
    if (value < 12) return { status: 'warning', pct: (value / 16) * 100 };
    return { status: 'safe', pct: (value / 16) * 100 };
  }
  if (lbl.includes('troponin')) {
    if (value > 0.1) return { status: 'critical', pct: 100 };
    if (value > 0.04) return { status: 'warning', pct: 60 };
    return { status: 'safe', pct: 20 };
  }
  return { status: 'safe', pct: 50 };
}

function getVitalStatus(label: string, value: number) {
  const lbl = label.toLowerCase();
  if (lbl.includes('hr') || lbl.includes('heart rate')) {
    if (value > 115 || value < 50) return { status: 'critical', pct: Math.min(100, (value / 150) * 100) };
    if (value > 100 || value < 60) return { status: 'warning', pct: (value / 150) * 100 };
    return { status: 'safe', pct: (value / 150) * 100 };
  }
  if (lbl.includes('spo2') || lbl.includes('oxygen')) {
    if (value < 90) return { status: 'critical', pct: value };
    if (value < 94) return { status: 'warning', pct: value };
    return { status: 'safe', pct: value };
  }
  if (lbl.includes('temp')) {
    if (value > 38.5) return { status: 'critical', pct: Math.min(100, ((value - 35) / 6) * 100) };
    if (value > 37.8) return { status: 'warning', pct: ((value - 35) / 6) * 100 };
    return { status: 'safe', pct: ((value - 35) / 6) * 100 };
  }
  return { status: 'safe', pct: 50 };
}

export default function PatientCard({ patient }: PatientCardProps) {
  
  const renderLab = (label: string, value: number | undefined, unit: string = '') => {
    if (value === undefined) return null;
    const { status, pct } = getLabStatus(label, value);
    const statusClass = status === 'critical' ? 'lab-critical' : status === 'warning' ? 'lab-abnormal' : '';
    const barClass = status === 'critical' ? 'critical' : status === 'warning' ? 'warning' : 'safe';
    return (
      <div className="lab-item" key={label}>
        <div className="lab-meta-row">
          <span className="lab-label">{label}</span>
        </div>
        <span className={`lab-value ${statusClass}`}>{value} <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{unit}</span></span>
        <div className="lab-bar-container">
          <div className={`lab-bar-fill ${barClass}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  const renderVital = (label: string, value: number | undefined, unit: string = '') => {
    if (value === undefined) return null;
    const { status, pct } = getVitalStatus(label, value);
    const statusClass = status === 'critical' ? 'lab-critical' : status === 'warning' ? 'lab-abnormal' : '';
    const barClass = status === 'critical' ? 'critical' : status === 'warning' ? 'warning' : 'safe';
    return (
      <div className="lab-item" key={label}>
        <div className="lab-meta-row">
          <span className="lab-label">{label}</span>
        </div>
        <span className={`lab-value ${statusClass}`}>{value} <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{unit}</span></span>
        <div className="lab-bar-container">
          <div className={`lab-bar-fill ${barClass}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  const renderBP = (systolic: number | undefined, diastolic: number | undefined) => {
    if (systolic === undefined || diastolic === undefined) return null;
    const isCritical = systolic < 90 || systolic > 160;
    const isWarning = systolic < 100 || systolic > 140;
    const statusClass = isCritical ? 'lab-critical' : isWarning ? 'lab-abnormal' : '';
    const barClass = isCritical ? 'critical' : isWarning ? 'warning' : 'safe';
    const pct = Math.min(100, (systolic / 200) * 100);
    return (
      <div className="lab-item" key="bp">
        <div className="lab-meta-row">
          <span className="lab-label">Blood Pressure</span>
        </div>
        <span className={`lab-value ${statusClass}`}>{systolic}/{diastolic} <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>mmHg</span></span>
        <div className="lab-bar-container">
          <div className={`lab-bar-fill ${barClass}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="patient-card">
      <div className="patient-card-header">
        <div style={{ 
          fontSize: '10px', 
          fontWeight: 800, 
          color: 'var(--accent-cyan)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.08em', 
          marginBottom: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px' 
        }}>
          <FileTextIcon size={12} style={{ color: 'var(--accent-cyan)' }} />
          <span>EHR Patient Record</span>
        </div>
        <div className="patient-name-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{patient.name.split(' — ')[0]}</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>
              {patient.name.split(' — ')[1] || 'General Presentation'}
            </p>
          </div>
          <div className="patient-demographics" style={{ marginTop: 0 }}>
            <span className="demo-tag">{patient.age}{patient.sex}</span>
            {patient.weight && <span className="demo-tag weight">{patient.weight} kg</span>}
          </div>
        </div>
      </div>

      <div className="patient-sections">
        {/* Medications */}
        <div className="patient-section">
          <h4>
            <PillIcon className="inline-icon" size={14} style={{ color: 'var(--accent-blue)' }} />
            <span>Current Medications ({patient.medications.length})</span>
          </h4>
          <div className="med-list">
            {patient.medications.map((med, i) => (
              <span key={i} className="med-chip">
                {med.name} <span className="med-dose">{med.dose}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div className="patient-section">
          <h4>
            <AlertTriangleIcon className="inline-icon" size={14} style={{ color: 'var(--danger-red)' }} />
            <span>Documented Allergies</span>
          </h4>
          <div className="allergy-list">
            {patient.allergies.map((a, i) => {
              const isAnaphylaxis = a.severity === 'anaphylaxis';
              const isSevere = a.severity === 'severe';
              const allergyClass = isAnaphylaxis ? 'allergy-critical' : isSevere ? 'allergy-severe' : 'allergy-mild';
              const severityText = isAnaphylaxis ? 'Anaphylaxis' : isSevere ? 'Severe' : 'Mild';

              return (
                <span key={i} className={`allergy-chip ${allergyClass}`}>
                  <span>{a.allergen} ({a.reaction})</span>
                  <span className="allergy-severity-pill">{severityText}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Labs */}
        <div className="patient-section">
          <h4>
            <BeakerIcon className="inline-icon" size={14} style={{ color: 'var(--accent-cyan)' }} />
            <span>Laboratory Results</span>
          </h4>
          <div className="lab-grid">
            {renderLab('Serum Creatinine', patient.labs.creatinine, 'mg/dL')}
            {renderLab(
              'eGFR (CKD-EPI)', 
              patient.labs.creatinine 
                ? calculateEGFR(patient.labs.creatinine, patient.age, patient.sex).value 
                : patient.labs.eGFR, 
              'mL/min'
            )}
            {renderLab('Potassium (K+)', patient.labs.potassium, 'mEq/L')}
            {renderLab('HbA1c', patient.labs.hba1c, '%')}
            {renderLab('INR (Ratio)', patient.labs.inr)}
            {renderLab('BNP (Natriuretic)', patient.labs.bnp, 'pg/mL')}
            {renderLab('White Blood Cell Count', patient.labs.wbc, 'k/μL')}
            {renderLab('Blood Lactate', patient.labs.lactate, 'mmol/L')}
            {renderLab('Hemoglobin (Hb)', patient.labs.hemoglobin, 'g/dL')}
            {renderLab('Cardiac Troponin I', patient.labs.troponin, 'ng/mL')}
          </div>
        </div>

        {/* Vitals */}
        {patient.vitals && (
          <div className="patient-section">
            <h4>
              <ActivityIcon className="inline-icon" size={14} style={{ color: 'var(--accent-emerald)' }} />
              <span>Clinical Vitals</span>
            </h4>
            <div className="lab-grid">
              {renderVital('Heart Rate (HR)', patient.vitals.hr, 'bpm')}
              {renderBP(patient.vitals.bp_systolic, patient.vitals.bp_diastolic)}
              {renderVital('Oxygen Saturation (SpO₂)', patient.vitals.spo2, '%')}
              {renderVital('Body Temp', patient.vitals.temp, '°C')}
            </div>
          </div>
        )}

        {/* Conditions */}
        {patient.conditions && patient.conditions.length > 0 && (
          <div className="patient-section">
            <h4>
              <StethoscopeIcon className="inline-icon" size={14} style={{ color: 'var(--accent-purple)' }} />
              <span>Diagnosis & Active Conditions</span>
            </h4>
            <div className="med-list">
              {patient.conditions.filter(c => c.active).map((c, i) => (
                <span key={i} className="condition-chip">{c.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {patient.notes && (
          <div className="patient-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '4px' }}>
            <h4>
              <FileTextIcon className="inline-icon" size={14} style={{ color: 'var(--text-secondary)' }} />
              <span>Clinical Scenario Brief</span>
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.5' }}>
              &ldquo;{patient.notes}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
