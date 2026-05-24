'use client';
import { useState } from 'react';
import type { SafetyCheckResult, SafetyAlert, AlertSeverity } from '@/lib/types';
import {
  SearchIcon,
  ShieldIcon,
  ShieldCheckIcon,
  ShieldXIcon,
  ShieldAlertIcon,
  AlertTriangleIcon,
  InfoIcon,
  ClockIcon,
  PillIcon,
  BeakerIcon,
  ActivityIcon,
} from './icons';

interface SafetyAlertsProps {
  result: SafetyCheckResult | null;
  loading: boolean;
}

function ChevronIcon({ size = 16, className, ...props }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function getAlertTypeLabel(type: string): string {
  switch (type) {
    case 'allergy_conflict': return 'Allergy Check';
    case 'drug_interaction': return 'Drug Interaction';
    case 'renal_dosing': return 'Renal Dosing';
    case 'calculator': return 'Clinical Score';
    default: return 'Clinical Check';
  }
}

interface SeverityBadgeInfo {
  label: string;
  badgeClass: string;
  iconColor: string;
}

function getSeverityInfo(severity: AlertSeverity): SeverityBadgeInfo {
  switch (severity) {
    case 'HARD_BLOCK':
      return { label: 'Contraindicated', badgeClass: 'severity-block', iconColor: 'var(--danger-red)' };
    case 'SEVERE':
      return { label: 'Severe Risk', badgeClass: 'severity-severe', iconColor: 'var(--warning-amber)' };
    case 'MODERATE':
      return { label: 'Moderate Warning', badgeClass: 'severity-moderate', iconColor: 'var(--warning-amber)' };
    case 'MINOR':
      return { label: 'Monitoring Advised', badgeClass: 'severity-info', iconColor: 'var(--accent-blue)' };
    default:
      return { label: 'Clinical Note', badgeClass: 'severity-info', iconColor: 'var(--text-secondary)' };
  }
}

function getAlertIcon(type: string, severity: AlertSeverity) {
  if (severity === 'HARD_BLOCK') return ShieldXIcon;
  switch (type) {
    case 'allergy_conflict':
      return ShieldAlertIcon;
    case 'drug_interaction':
      return PillIcon;
    case 'renal_dosing':
      return BeakerIcon;
    case 'calculator':
      return ActivityIcon;
    default:
      return InfoIcon;
  }
}

function renderStructuredDetails(alert: SafetyAlert) {
  const details = alert.details;

  if (alert.type === 'drug_interaction') {
    // Expected format: "Mechanism: [mechanism]. Effect: [effect]" or "Current medication risk: [mechanism]. [effect]"
    let mechanism = '';
    let effect = '';
    
    if (details.includes('Mechanism:') && details.includes('Effect:')) {
      const parts = details.split('Effect:');
      mechanism = parts[0].replace('Mechanism:', '').trim();
      effect = parts[1].trim();
    } else if (details.includes('Current medication risk:')) {
      const parts = details.split('.');
      mechanism = parts[0].replace('Current medication risk:', '').trim();
      effect = parts.slice(1).join('.').trim();
    } else {
      mechanism = details;
    }

    return (
      <div className="alert-details-grid">
        <span className="alert-details-label">Mechanism</span>
        <span className="alert-details-value">{mechanism}</span>
        {effect && (
          <>
            <span className="alert-details-label">Clinical Effect</span>
            <span className="alert-details-value" style={{ fontWeight: 600 }}>{effect}</span>
          </>
        )}
      </div>
    );
  }

  if (alert.type === 'allergy_conflict') {
    // Expected format: "Patient has documented [reaction] to [allergen]. [drug] belongs to the same drug class ([class])."
    const sentences = details.split('.').map(s => s.trim()).filter(Boolean);
    const trigger = sentences[0] || details;
    const drugClass = sentences[1] || '';

    return (
      <div className="alert-details-grid">
        <span className="alert-details-label">Reaction Record</span>
        <span className="alert-details-value">{trigger}</span>
        {drugClass && (
          <>
            <span className="alert-details-label">Class Analysis</span>
            <span className="alert-details-value" style={{ fontWeight: 600 }}>{drugClass}</span>
          </>
        )}
      </div>
    );
  }

  if (alert.type === 'renal_dosing') {
    // Expected format: "[Note]. Current eGFR: [value] (threshold: eGFR < [threshold])"
    let rule = '';
    let egfrVal = '';
    
    if (details.includes('Current eGFR:')) {
      const parts = details.split('Current eGFR:');
      rule = parts[0].trim();
      egfrVal = 'Current eGFR: ' + parts[1].trim();
    } else {
      rule = details;
    }

    return (
      <div className="alert-details-grid">
        <span className="alert-details-label">Dosing Guideline</span>
        <span className="alert-details-value">{rule}</span>
        {egfrVal && (
          <>
            <span className="alert-details-label">Clearance Metric</span>
            <span className="alert-details-value" style={{ fontWeight: 600 }}>{egfrVal}</span>
          </>
        )}
      </div>
    );
  }

  // Fallback for calculators / info
  return (
    <div className="alert-details-grid">
      <span className="alert-details-label">Observation</span>
      <span className="alert-details-value">{details}</span>
    </div>
  );
}

export default function SafetyAlerts({ result, loading }: SafetyAlertsProps) {
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({
    'allergy_conflict-0': true, // Expand first allergy check by default
    'drug_interaction-0': true, // Expand first drug interaction by default
    'renal_dosing-0': true, // Expand first renal dosing check by default
  });

  const toggleAlert = (id: string) => {
    setExpandedAlerts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="safety-panel">
        <div className="safety-header">
          <h3>
            <SearchIcon className="inline-icon animate-pulse" size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span>Safety Verification Running...</span>
          </h3>
        </div>
        <div className="safety-loading">
          <div className="ecg-loader">
            <svg viewBox="0 0 140 40" style={{ width: '100%', height: '100%' }}>
              <path
                className="ecg-line"
                d="M0,20 L30,20 L33,12 L36,28 L39,20 L50,20 L54,3 L58,37 L62,20 L75,20 L79,15 L83,25 L87,20 L140,20"
              />
            </svg>
          </div>
          <span>Performing deterministic clinical safety verification checks...</span>
        </div>
      </div>
    );
  }

  if (!result || !result.alerts) {
    return (
      <div className="safety-panel safety-empty">
        <div className="safety-header">
          <h3>
            <ShieldIcon className="inline-icon" size={16} style={{ color: 'var(--accent-emerald)' }} />
            <span>Clinical Verification Log</span>
          </h3>
        </div>
        {result && !result.alerts ? (
          <p className="safety-placeholder" style={{ color: 'var(--danger-red)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <AlertTriangleIcon size={16} style={{ color: 'var(--danger-red)' }} />
            <span>Safety engine database connection issue. Please check system variables.</span>
          </p>
        ) : (
          <p className="safety-placeholder">Run a clinical check to execute safety verification</p>
        )}
      </div>
    );
  }

  const hardBlocks = result.alerts.filter(a => a.severity === 'HARD_BLOCK');
  const severeAlerts = result.alerts.filter(a => a.severity === 'SEVERE');
  const moderateAlerts = result.alerts.filter(a => a.severity === 'MODERATE');
  const minorAlerts = result.alerts.filter(a => a.severity === 'MINOR' || a.severity === 'INFO');

  const totalAlerts = result.alerts.length;

  return (
    <div className="safety-panel">
      <div className="safety-header">
        <h3>
          <ShieldIcon className="inline-icon" size={16} style={{ color: 'var(--accent-emerald)' }} />
          <span>Safety Verification Log</span>
        </h3>
        <div className="safety-meta">
          <span className="safety-timing" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ClockIcon size={12} style={{ color: 'var(--accent-emerald)' }} />
            <span>{result.checkDurationMs}ms</span>
          </span>
          <span className="safety-count">
            {hardBlocks.length > 0 && <span className="count-badge count-block">{hardBlocks.length} Block</span>}
            {severeAlerts.length > 0 && <span className="count-badge count-severe">{severeAlerts.length} Severe</span>}
            {moderateAlerts.length > 0 && <span className="count-badge count-moderate">{moderateAlerts.length} Mod</span>}
            {minorAlerts.length > 0 && <span className="count-badge count-minor">{minorAlerts.length} Info</span>}
          </span>
        </div>
      </div>

      <div className="checks-grid">
        {(result.checksPerformed || []).map((check, i) => (
          <div key={i} className="check-status-card">
            <div className="check-status-dot"></div>
            <span>{check}</span>
          </div>
        ))}
      </div>

      <div className="alerts-container">
        {totalAlerts === 0 ? (
          <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent-emerald)', fontSize: '13px', fontWeight: 600 }}>
            <ShieldCheckIcon size={18} style={{ color: 'var(--accent-emerald)' }} />
            <span>Safety Shield Verified — No interactions, allergy cross-reactions, or renal conflicts found.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {result.alerts.map((alert, i) => {
              const alertId = `${alert.type}-${i}`;
              const isCalculator = alert.type === 'calculator';
              const isExpanded = isCalculator || !!expandedAlerts[alertId];
              const typeLabel = getAlertTypeLabel(alert.type);
              const severityInfo = getSeverityInfo(alert.severity);
              const IconComponent = getAlertIcon(alert.type, alert.severity);

              return (
                <div
                  key={alertId}
                  className={`alert-card alert-${alert.severity === 'HARD_BLOCK' ? 'block' : alert.severity.toLowerCase()}`}
                  onClick={() => {
                    if (!isCalculator) {
                      toggleAlert(alertId);
                    }
                  }}
                  style={{ cursor: isCalculator ? 'default' : 'pointer' }}
                >
                  <div className="alert-header-row">
                    <div className="alert-title-group">
                      <IconComponent size={18} style={{ color: severityInfo.iconColor, flexShrink: 0, marginTop: '2px' }} />
                      <div className="alert-title-content">
                        <div className="alert-meta-row">
                          <span className="alert-type-badge">{typeLabel}</span>
                          <span className={`alert-severity-pill ${severityInfo.badgeClass}`}>
                            {severityInfo.label}
                          </span>
                        </div>
                        <span className="alert-title-text">
                          {alert.title}
                        </span>
                      </div>
                    </div>
                    {!isCalculator && (
                      <button className={`alert-expand-btn ${isExpanded ? 'expanded' : ''}`} type="button">
                        <ChevronIcon size={14} />
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="alert-details-panel" onClick={e => e.stopPropagation()}>
                      {renderStructuredDetails(alert)}

                      {alert.recommendation && (
                        <div className="alert-info-row" style={{ marginBottom: 0 }}>
                          <span className="alert-info-label">Resolution / Action Plan</span>
                          <div className={`alert-action-box ${alert.severity === 'HARD_BLOCK' ? 'block' : alert.severity === 'SEVERE' ? 'severe' : alert.severity === 'MODERATE' ? 'moderate' : 'info'}`}>
                            <p className="alert-info-content" style={{ fontWeight: 600 }}>
                              {alert.recommendation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
