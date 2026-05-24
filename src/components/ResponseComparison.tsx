'use client';
import React, { useState } from 'react';
import type { SafetyCheckResult } from '@/lib/types';
import {
  BrainIcon,
  ShieldIcon,
  CopyIcon,
  SearchIcon,
  CheckIcon,
  CrossIcon,
  AlertTriangleIcon,
  ShieldCheckIcon,
} from './icons';

interface ResponseComparisonProps {
  genericResponse: string | null;
  enhancedResponse: string | null;
  genericLoading: boolean;
  enhancedLoading: boolean;
  genericModel: string;
  enhancedModel: string;
  safetyResult?: SafetyCheckResult | null;
}

function renderMarkdown(text: string | null) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = (key: string) => {
    if (listType === 'ul') {
      elements.push(<ul key={key} className="md-ul">{currentList}</ul>);
    } else if (listType === 'ol') {
      elements.push(<ol key={key} className="md-ol">{currentList}</ol>);
    }
    currentList = [];
    listType = null;
  };

  const parseInline = (inlineText: string): React.ReactNode[] => {
    // Splitting by bold syntax (**bold**)
    const parts = inlineText.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index}>{part}</strong>;
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check if horizontal rule
    if (line === '---' || line === '***') {
      flushList(`list-${i}`);
      elements.push(<hr key={i} className="md-hr" />);
      continue;
    }

    // Check if heading
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList(`list-${i}`);
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const HeadingTag = `h${Math.min(level + 1, 6)}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      elements.push(
        <HeadingTag key={i} className={`md-h${level}`}>
          {parseInline(content)}
        </HeadingTag>
      );
      continue;
    }

    // Check if bullet point
    const bulletMatch = line.match(/^[\-\*]\s+(.*)$/);
    if (bulletMatch) {
      if (listType !== 'ul') {
        flushList(`list-${i}`);
        listType = 'ul';
      }
      currentList.push(<li key={`li-${i}`}>{parseInline(bulletMatch[1])}</li>);
      continue;
    }

    // Check if numbered list item
    const numberMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberMatch) {
      if (listType !== 'ol') {
        flushList(`list-${i}`);
        listType = 'ol';
      }
      currentList.push(<li key={`li-${i}`}>{parseInline(numberMatch[2])}</li>);
      continue;
    }

    // If it's an empty line
    if (!line) {
      flushList(`list-${i}`);
      continue;
    }

    // Check for line continuation in list
    if (listType) {
      if (rawLine.startsWith('  ') || rawLine.startsWith('\t')) {
        if (currentList.length > 0) {
          const lastIdx = currentList.length - 1;
          const prevItem = currentList[lastIdx] as React.ReactElement<{ children?: React.ReactNode }>;
          currentList[lastIdx] = (
            <li key={prevItem.key}>
              {prevItem.props.children}
              <br />
              {parseInline(line)}
            </li>
          );
          continue;
        }
      }
    }

    flushList(`list-${i}`);
    elements.push(<p key={i}>{parseInline(line)}</p>);
  }

  flushList(`list-end`);
  return elements;
}

export default function ResponseComparison({
  genericResponse,
  enhancedResponse,
  genericLoading,
  enhancedLoading,
  genericModel,
  enhancedModel,
  safetyResult,
}: ResponseComparisonProps) {
  const [copiedGeneric, setCopiedGeneric] = useState(false);
  const [copiedEnhanced, setCopiedEnhanced] = useState(false);
  const [expandedCard, setExpandedCard] = useState<'generic' | 'enhanced' | null>(null);

  const criticalAlerts = safetyResult?.alerts?.filter(
    a => a.severity === 'HARD_BLOCK' || a.severity === 'SEVERE'
  ) || [];

  const handleCopyGeneric = () => {
    if (genericResponse) {
      navigator.clipboard.writeText(genericResponse);
      setCopiedGeneric(true);
      setTimeout(() => setCopiedGeneric(false), 2000);
    }
  };

  const handleCopyEnhanced = () => {
    if (enhancedResponse) {
      navigator.clipboard.writeText(enhancedResponse);
      setCopiedEnhanced(true);
      setTimeout(() => setCopiedEnhanced(false), 2000);
    }
  };

  return (
    <div className="comparison-container">
      {/* Generic AI Response */}
      <div className="response-card response-generic">
        <div className="response-header response-header-generic">
          <div className="response-title-area">
            <div className="response-title">
              <BrainIcon className="inline-icon" size={16} style={{ color: 'var(--danger-red)' }} />
              <h3>Generic Clinical LLM</h3>
            </div>
            <span className="response-subtitle">Baseline standard reasoning - no safety boundaries</span>
            {genericModel && <span className="model-badge" style={{ marginTop: '6px' }}>{genericModel}</span>}
          </div>
          <div className="response-card-actions">
            {genericResponse && (
              <>
                <button className="card-action-btn" onClick={handleCopyGeneric} title="Copy response">
                  {copiedGeneric ? <CheckIcon size={14} style={{ color: 'var(--accent-emerald)' }} /> : <CopyIcon size={14} />}
                </button>
                <button className="card-action-btn" onClick={() => setExpandedCard('generic')} title="View Fullscreen">
                  <SearchIcon size={14} />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="response-body">
          {genericLoading ? (
            <div className="response-loading">
              <div className="shimmer-block" style={{ width: '90%' }}></div>
              <div className="shimmer-block" style={{ width: '75%' }}></div>
              <div className="shimmer-block" style={{ width: '85%' }}></div>
              <div className="shimmer-block" style={{ width: '50%' }}></div>
              <p style={{ marginTop: '16px' }}>Generating prompt response...</p>
            </div>
          ) : genericResponse ? (
            <div className="response-content">
              {renderMarkdown(genericResponse)}
            </div>
          ) : (
            <p className="response-placeholder">Submit clinical query to evaluate standard AI response</p>
          )}
        </div>
        {genericResponse && (
          <div className="response-footer response-footer-danger" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <AlertTriangleIcon size={14} style={{ color: 'var(--danger-red)', marginTop: '2px', flexShrink: 0 }} />
            <span>Attention: This clinical response is unshielded. Standard LLMs can hallucinate dosage metrics, miss critical interactions, or overlook patient allergies.</span>
          </div>
        )}
      </div>

      {/* Enhanced AI Response */}
      <div className="response-card response-enhanced">
        <div className="response-header response-header-enhanced">
          <div className="response-title-area">
            <div className="response-title">
              <ShieldIcon className="inline-icon" size={16} style={{ color: 'var(--accent-emerald)' }} />
              <h3>Safety-Enhanced AI</h3>
            </div>
            <span className="response-subtitle">Deterministic safety verification constraints applied</span>
            {enhancedModel && <span className="model-badge" style={{ marginTop: '6px' }}>{enhancedModel}</span>}
          </div>
          <div className="response-card-actions">
            {enhancedResponse && (
              <>
                <button className="card-action-btn" onClick={handleCopyEnhanced} title="Copy response">
                  {copiedEnhanced ? <CheckIcon size={14} style={{ color: 'var(--accent-emerald)' }} /> : <CopyIcon size={14} />}
                </button>
                <button className="card-action-btn" onClick={() => setExpandedCard('enhanced')} title="View Fullscreen">
                  <SearchIcon size={14} />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="response-body">
          {enhancedLoading ? (
            <div className="response-loading">
              <div className="shimmer-block" style={{ width: '95%' }}></div>
              <div className="shimmer-block" style={{ width: '80%' }}></div>
              <div className="shimmer-block" style={{ width: '90%' }}></div>
              <div className="shimmer-block" style={{ width: '60%' }}></div>
              <p style={{ marginTop: '16px' }}>Running safety checks + generating response...</p>
            </div>
          ) : enhancedResponse ? (
            <div className="response-content">
              {criticalAlerts.map((alert, idx) => {
                const isBlock = alert.severity === 'HARD_BLOCK';
                
                // Parse the title to get the main drug/subject and reason
                let drugNamePart = '';
                if (alert.title.includes(':')) {
                  const parts = alert.title.split(':');
                  const typePart = parts[0].trim();
                  const restPart = parts[1].trim();
                  if (typePart.toUpperCase().includes('ALLERGY') || typePart.toUpperCase().includes('BLOCK')) {
                    drugNamePart = restPart.split(/\s+is\s+/i)[0].trim().toUpperCase();
                  } else {
                    drugNamePart = restPart.toUpperCase();
                  }
                } else {
                  drugNamePart = alert.title.toUpperCase();
                }

                const reason = alert.details;
                const action = alert.recommendation;

                return (
                  <div 
                    key={idx} 
                    className={`critical-safety-banner ${isBlock ? 'banner-block' : 'banner-severe'}`}
                    style={{
                      marginBottom: '20px',
                      borderRadius: '8px',
                      border: '1px solid ' + (isBlock ? '#fee2e2' : '#ffedd5'),
                      borderLeft: '5px solid ' + (isBlock ? '#ef4444' : '#f97316'),
                      background: isBlock ? '#fef2f2' : '#fff7ed',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)',
                      padding: '16px 20px',
                      fontFamily: 'inherit',
                    }}
                  >
                    {/* Header */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '10px',
                      borderBottom: '1px solid ' + (isBlock ? '#fee2e2' : '#ffedd5'),
                      paddingBottom: '8px'
                    }}>
                      <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                        {isBlock ? '⛔' : '⚠️'}
                      </span>
                      <span style={{
                        fontWeight: 900,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: isBlock ? '#dc2626' : '#ea580c'
                      }}>
                        {isBlock ? 'HARD BLOCK' : 'SEVERE WARNING'}
                      </span>
                    </div>

                    {/* Drug Name / Substance */}
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 800, 
                      color: '#111827', 
                      marginBottom: '14px',
                      letterSpacing: '-0.01em'
                    }}>
                      {drugNamePart}
                    </div>

                    {/* Information Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <div style={{ 
                          fontSize: '10px', 
                          fontWeight: 700, 
                          color: isBlock ? '#991b1b' : '#9a3412', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.05em',
                          marginBottom: '2px'
                        }}>
                          Reason:
                        </div>
                        <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.45' }}>
                          {reason}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ 
                            fontSize: '10px', 
                            fontWeight: 700, 
                            color: isBlock ? '#991b1b' : '#9a3412', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em',
                            marginBottom: '2px'
                          }}>
                            Severity:
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                            Importance {alert.importance}
                          </div>
                        </div>

                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ 
                            fontSize: '10px', 
                            fontWeight: 700, 
                            color: isBlock ? '#991b1b' : '#9a3412', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em',
                            marginBottom: '2px'
                          }}>
                            Action:
                          </div>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: 700, 
                            color: isBlock ? '#b91c1c' : '#c2410c' 
                          }}>
                            {action}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {renderMarkdown(enhancedResponse)}
            </div>
          ) : (
            <p className="response-placeholder">Submit clinical query to evaluate safety-enhanced response</p>
          )}
        </div>
        {enhancedResponse && (
          <div className="response-footer response-footer-safe" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <ShieldCheckIcon size={14} style={{ color: 'var(--accent-emerald)', marginTop: '2px', flexShrink: 0 }} />
            <span>Shielded Response: This output has been verified against active clinical databases for drug interactions, documented allergies, and renal clearance limits.</span>
          </div>
        )}
      </div>

      {/* Fullscreen Modal Overlay */}
      {expandedCard && (
        <div className="fullscreen-overlay" onClick={() => setExpandedCard(null)}>
          <div className="fullscreen-modal" onClick={e => e.stopPropagation()}>
            <div className="fullscreen-header">
              <h3>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  {expandedCard === 'generic' ? (
                    <>
                      <BrainIcon size={18} style={{ color: 'var(--danger-red)' }} />
                      <span>Generic Clinical LLM Response</span>
                    </>
                  ) : (
                    <>
                      <ShieldIcon size={18} style={{ color: 'var(--accent-emerald)' }} />
                      <span>Safety-Enhanced LLM Response</span>
                    </>
                  )}
                </span>
              </h3>
              <button className="close-btn" onClick={() => setExpandedCard(null)}>
                <CrossIcon size={18} />
              </button>
            </div>
            <div className="fullscreen-body response-content">
              {renderMarkdown(expandedCard === 'generic' ? genericResponse : enhancedResponse)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
