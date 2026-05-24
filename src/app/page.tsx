'use client';
import { useState, useEffect } from 'react';
import PatientCard from '@/components/PatientCard';
import SafetyAlerts from '@/components/SafetyAlerts';
import ResponseComparison from '@/components/ResponseComparison';
import { patients } from '@/lib/patients';
import type { Patient, SafetyCheckResult } from '@/lib/types';
import Image from 'next/image';
import {
  ShieldCheckIcon,
  ShieldXIcon,
  AlertTriangleIcon,
  PillIcon,
  InfoIcon,
  BeakerIcon,
  StethoscopeIcon,
  BrainIcon,
  SearchIcon,
  LightningIcon,
  UserAvatar,
} from '@/components/icons';

interface QueryTemplate {
  iconType: 'med' | 'block' | 'warning' | 'calc' | 'lab' | 'check';
  label: string;
  text: string;
}

const DEMO_QUESTIONS: Record<number, string> = {
  1: 'Can I prescribe Amoxicillin-Clavulanate for this patient\'s UTI?',
  3: 'Can I add Clarithromycin 500mg for this patient\'s pneumonia?',
  7: 'Adding Gabapentin 300mg TDS for neuropathic pain',
  8: 'Does this patient still need anticoagulation?',
};

const PATIENT_TEMPLATES: Record<number, QueryTemplate[]> = {
  1: [
    { iconType: 'med', label: 'Check Amox-Clav for UTI', text: 'Can I prescribe Amoxicillin-Clavulanate for this patient\'s UTI?' },
    { iconType: 'block', label: 'Check Penicillin Allergy V', text: 'Can I prescribe Penicillin V 500mg for a dental infection?' }
  ],
  2: [
    { iconType: 'check', label: 'Verify Enoxaparin dosing', text: 'Can I increase Enoxaparin to 80mg BD for DVT treatment?' },
    { iconType: 'warning', label: 'Check Ibuprofen interaction', text: 'Can I prescribe Ibuprofen 400mg TDS for post-op pain?' }
  ],
  3: [
    { iconType: 'med', label: 'Add Clarithromycin for Pneumonia', text: 'Can I add Clarithromycin 500mg for this patient\'s pneumonia?' },
    { iconType: 'warning', label: 'Check Diclofenac with Ramipril', text: 'Is it safe to continue Diclofenac PRN with their current medications?' }
  ],
  4: [
    { iconType: 'calc', label: 'Add Carbamazepine', text: 'Can I add Carbamazepine for seizure control?' },
    { iconType: 'check', label: 'Valproate Pediatric Check', text: 'Is the Sodium Valproate 200mg BD dose appropriate for a 20kg child?' }
  ],
  5: [
    { iconType: 'block', label: 'Check Ramipril in CKD 5', text: 'Can I prescribe Ramipril 2.5mg OD for hypertension?' },
    { iconType: 'lab', label: 'Check Metformin safety', text: 'Is Metformin safe to add for glycemic control in this patient?' }
  ],
  6: [
    { iconType: 'warning', label: 'Switch to Lisinopril', text: 'Can I switch Methyldopa to Lisinopril 10mg OD?' },
    { iconType: 'block', label: 'Ibuprofen in 3rd trimester', text: 'Can I give Ibuprofen 400mg for headaches?' }
  ],
  7: [
    { iconType: 'calc', label: 'Gabapentin 300mg TDS Dosing', text: 'Adding Gabapentin 300mg TDS for neuropathic pain' },
    { iconType: 'lab', label: 'Verify Meropenem renal clearance', text: 'Is Meropenem 1g IV TDS dose appropriate for this renal function?' }
  ],
  8: [
    { iconType: 'calc', label: 'CHA₂DS₂-VASc Anticoagulation Check', text: 'Does this patient still need anticoagulation?' },
    { iconType: 'med', label: 'Add Amiodarone to AF meds', text: 'Can I add Amiodarone 200mg OD for AF rate control?' }
  ],
  9: [
    { iconType: 'warning', label: 'Metoclopramide Dystonia warning', text: 'Can I prescribe Metoclopramide 10mg TDS for gastroparesis?' },
    { iconType: 'med', label: 'Duloxetine + Pregabalin Safety', text: 'Is the combination of Pregabalin and Duloxetine safe?' }
  ],
  10: [
    { iconType: 'warning', label: 'Aspirin-Induced Asthma risk', text: 'Can I give Aspirin 300mg for fever?' },
    { iconType: 'check', label: 'Montelukast + Fluticasone check', text: 'Is it safe to continue Montelukast with Fluticasone?' }
  ]
};

function TemplateIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'med':
      return <PillIcon className={className} size={14} style={{ color: 'var(--accent-blue)' }} />;
    case 'block':
      return <ShieldXIcon className={className} size={14} style={{ color: 'var(--danger-red)' }} />;
    case 'warning':
      return <AlertTriangleIcon className={className} size={14} style={{ color: 'var(--warning-amber)' }} />;
    case 'calc':
      return <LightningIcon className={className} size={14} style={{ color: 'var(--accent-purple)' }} />;
    case 'lab':
      return <BeakerIcon className={className} size={14} style={{ color: 'var(--accent-cyan)' }} />;
    case 'check':
      return <StethoscopeIcon className={className} size={14} style={{ color: 'var(--accent-emerald)' }} />;
    default:
      return <InfoIcon className={className} size={14} style={{ color: 'var(--info-blue)' }} />;
  }
}

export default function Home() {
  const [selectedPatient, setSelectedPatient] = useState<Patient>(patients[0]);
  const [question, setQuestion] = useState(DEMO_QUESTIONS[1] || '');
  const [safetyResult, setSafetyResult] = useState<SafetyCheckResult | null>(null);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [genericResponse, setGenericResponse] = useState<string | null>(null);
  const [enhancedResponse, setEnhancedResponse] = useState<string | null>(null);
  const [genericLoading, setGenericLoading] = useState(false);
  const [enhancedLoading, setEnhancedLoading] = useState(false);
  const [genericModel, setGenericModel] = useState('');
  const [enhancedModel, setEnhancedModel] = useState('');

  const handleSafetyCheck = async (patientToCheck = selectedPatient, questionToCheck = question): Promise<SafetyCheckResult | null> => {
    setSafetyLoading(true);
    try {
      const res = await fetch('/api/safety-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient: patientToCheck, question: questionToCheck }),
      });
      const data = await res.json();
      setSafetyResult(data);
      return data;
    } catch (err) {
      console.error('Safety check error:', err);
      return null;
    } finally {
      setSafetyLoading(false);
    }
  };

  // Trigger initial safety check on mount
  useEffect(() => {
    handleSafetyCheck(patients[0], DEMO_QUESTIONS[1] || '');
  }, []);

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setSafetyResult(null);
    setGenericResponse(null);
    setEnhancedResponse(null);
    setGenericModel('');
    setEnhancedModel('');
    const newQuestion = DEMO_QUESTIONS[patient.id] || PATIENT_TEMPLATES[patient.id]?.[0]?.text || '';
    setQuestion(newQuestion);

    // Automatically trigger safety check for this patient and question
    if (newQuestion.trim()) {
      setSafetyLoading(true);
      try {
        const res = await fetch('/api/safety-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient, question: newQuestion }),
        });
        const data = await res.json();
        setSafetyResult(data);
      } catch (err) {
        console.error('Auto safety check error:', err);
      } finally {
        setSafetyLoading(false);
      }
    }
  };

  const handleTemplateClick = async (text: string) => {
    setQuestion(text);
    setSafetyLoading(true);
    try {
      const res = await fetch('/api/safety-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient: selectedPatient, question: text }),
      });
      const data = await res.json();
      setSafetyResult(data);
    } catch (err) {
      console.error('Template safety check error:', err);
    } finally {
      setSafetyLoading(false);
    }
  };

  const handleGenericAsk = async () => {
    if (!question.trim()) return;
    setGenericLoading(true);
    setGenericResponse(null);
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient: selectedPatient, question, mode: 'generic' }),
      });
      const data = await res.json();
      if (data.error) {
        setGenericResponse(`Error: ${data.error}`);
      } else {
        setGenericResponse(data.content);
        setGenericModel(data.model);
      }
    } catch (err) {
      setGenericResponse(`Error: ${err instanceof Error ? err.message : 'Request failed'}`);
    } finally {
      setGenericLoading(false);
    }
  };

  const handleEnhancedAsk = async () => {
    if (!question.trim()) return;
    setEnhancedLoading(true);
    setEnhancedResponse(null);

    // Run safety checks first
    let safety = safetyResult;
    if (!safety) {
      safety = await handleSafetyCheck();
    }

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: selectedPatient,
          question,
          constraintText: safety?.constraintText || '',
          mode: 'enhanced',
        }),
      });
      const data = await res.json();
      if (data.error) {
        setEnhancedResponse(`Error: ${data.error}`);
      } else {
        setEnhancedResponse(data.content);
        setEnhancedModel(data.model);
      }
    } catch (err) {
      setEnhancedResponse(`Error: ${err instanceof Error ? err.message : 'Request failed'}`);
    } finally {
      setEnhancedLoading(false);
    }
  };

  const handleBothAsk = async () => {
    handleGenericAsk();
    handleEnhancedAsk();
  };

  return (
    <div className="app-container">
      {/* Background ambient glows */}
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>
      <div className="ambient-glow-3"></div>

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-icon" style={{ overflow: 'hidden', position: 'relative' }}>
              <Image 
                src="/brahmo_logo.png" 
                alt="Brahmo Logo" 
                fill
                sizes="44px"
                style={{ objectFit: 'cover', borderRadius: 'inherit' }} 
              />
            </div>
            <div>
              <h1>Brahmo Safety Shield</h1>
              <p className="header-subtitle">Clinical Guardrails & Deterministic AI Safety Verification Layer</p>
            </div>
          </div>
          <div className="header-status-panel">
            <div className="status-pill">
              <div className="status-dot"></div>
              <span>Engine Status: Online</span>
            </div>
            <div className="status-pill">
              <div className="status-dot blue"></div>
              <span>Clinical DB: Connected</span>
            </div>
            <span className="header-badge">Clinical Copilot v1.2</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Patient Selector */}
        <section className="patient-selector-section">
          <h2>Active Patient Profiles</h2>
          <div className="patient-selector-grid">
            {patients.map(p => {
              // Determine risk level based on clinical identifiers
              const isHighRisk = p.labs.troponin && p.labs.troponin > 0.1 || p.labs.eGFR && p.labs.eGFR <= 30 || p.vitals?.bp_systolic && p.vitals.bp_systolic < 90;
              const isMedRisk = p.labs.eGFR && p.labs.eGFR < 60 || p.labs.potassium && p.labs.potassium > 5.0 || p.labs.creatinine && p.labs.creatinine > 1.5 || p.allergies.some(a => a.severity === 'severe');
              const riskClass = isHighRisk ? 'high-risk' : isMedRisk ? 'med-risk' : 'low-risk';
              
              let scenarioLabel = 'Stable';
              if (p.id === 1) scenarioLabel = 'ACS + Pen Allergy';
              if (p.id === 3) scenarioLabel = 'Polypharmacy';
              if (p.id === 7) scenarioLabel = 'ICU Sepsis';
              if (p.id === 8) scenarioLabel = 'AF + Heart Fail';
              if (p.id === 5) scenarioLabel = 'CKD Stage 5';
              if (p.id === 6) scenarioLabel = 'Pregnancy HTN';
              if (p.id === 4) scenarioLabel = 'Pediatric Valproate';
              if (p.id === 10) scenarioLabel = 'Pediatric Asthma';

              return (
                <button
                  key={p.id}
                  className={`patient-select-card ${selectedPatient.id === p.id ? 'selected' : ''} ${p.isDemo ? 'is-demo' : ''} ${riskClass}`}
                  onClick={() => handlePatientSelect(p)}
                >
                  <div className="patient-avatar" style={{ border: 'none', background: 'none' }}>
                    <UserAvatar sex={p.sex} size={40} />
                    <div className="patient-avatar-ring"></div>
                  </div>
                  <div className="patient-card-info">
                    <div className="patient-select-name">{p.name.split(' — ')[0]}</div>
                    <div className="patient-select-meta">
                      <span className="patient-select-dem">{p.age}{p.sex}</span>
                      <span className="patient-select-scenario">{scenarioLabel}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="main-grid">
          {/* Left Column: Patient EHR Info & Safety Dashboard */}
          <div className="left-column">
            <PatientCard patient={selectedPatient} />
            <SafetyAlerts result={safetyResult} loading={safetyLoading} />
          </div>

          {/* Right Column: Doctor's Workspace & AI Comparison */}
          <div className="right-column">
            {/* Question Input */}
            <div className="question-section">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StethoscopeIcon size={20} style={{ color: 'var(--accent-cyan)' }} />
                <span>Clinical Decision Support Console</span>
              </h2>
              <div className="question-input-wrapper">
                <textarea
                  className="question-input"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Query clinical recommendations or enter prescribing instructions..."
                  rows={3}
                />
              </div>

              {/* Suggested Clinical Templates */}
              <div className="templates-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <InfoIcon size={14} style={{ color: 'var(--accent-cyan)' }} />
                <span>Clinical Verification Scenarios</span>
              </div>
              <div className="templates-list">
                {(PATIENT_TEMPLATES[selectedPatient.id] || []).map((t, idx) => (
                  <button
                    key={idx}
                    className="template-btn"
                    onClick={() => handleTemplateClick(t.text)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <TemplateIcon type={t.iconType} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="button-row">
                <button
                  className="btn btn-safety"
                  onClick={() => handleSafetyCheck()}
                  disabled={!question.trim() || safetyLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <SearchIcon size={16} />
                  <span>Analyze Clinical Safety</span>
                </button>
                <button
                  className="btn btn-generic"
                  onClick={handleGenericAsk}
                  disabled={!question.trim() || genericLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <BrainIcon size={16} />
                  <span>Query Standard AI</span>
                </button>
                <button
                  className="btn btn-enhanced"
                  onClick={handleEnhancedAsk}
                  disabled={!question.trim() || enhancedLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <ShieldCheckIcon size={16} />
                  <span>Query Safety-Shielded AI</span>
                </button>
                <button
                  className="btn btn-compare"
                  onClick={handleBothAsk}
                  disabled={!question.trim() || genericLoading || enhancedLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <LightningIcon size={16} />
                  <span>Generate Safety Audit</span>
                </button>
              </div>
            </div>

            {/* Response Comparison Split Workspace */}
            <ResponseComparison
              genericResponse={genericResponse}
              enhancedResponse={enhancedResponse}
              genericLoading={genericLoading}
              enhancedLoading={enhancedLoading}
              genericModel={genericModel}
              enhancedModel={enhancedModel}
            />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className="footer-left" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>© {new Date().getFullYear()} Brahmo. Clinical Decision Support System.</span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div className="status-dot" style={{ width: '6px', height: '6px', animation: 'pulse-dot 2s infinite', background: 'var(--accent-emerald)', borderRadius: '50%' }}></div>
              <span>Safety Engine Active</span>
            </div>
          </div>
          <div className="footer-right" style={{ display: 'flex', gap: '20px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span>Verified DB: 50 Drugs • 30 Interactions • 8 Cross-Reactions</span>
            <span>CKD-EPI 2021 & CHA₂DS₂-VASc Calculators</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
