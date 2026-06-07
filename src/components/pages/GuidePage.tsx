'use client';

import React, { useState } from 'react';
import { PHASES } from '@/lib/data';

interface PhaseReferencePageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

// Repurposed as Phase Reference — explains the three structural phases in depth
export default function PhaseReferencePage({ onNavigate }: PhaseReferencePageProps) {
  const [openPhaseId, setOpenPhaseId] = useState<string>('control');

  return (
    <div className="page-root">
      <div className="page-header fade-up">
        <div className="page-header-eyebrow mono">Structural Reference</div>
        <h1>The Conversational Architecture</h1>
        <p>
          The three phases are the structural load-bearing columns of fluent conversation.
          Master them in order — each phase enables the next.
        </p>
      </div>

      {/* Phase detail cards */}
      {PHASES.map((phase, i) => (
        <div
          key={phase.id}
          style={{
            background: 'var(--bg-card)',
            border: openPhaseId === phase.id
              ? `1px solid ${phase.color}44`
              : '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            marginBottom: 14,
            transition: 'border-color .2s',
          }}
          className={`fade-up fade-up-d${i}`}
        >
          {/* Header (always visible) */}
          <div
            style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
            onClick={() => setOpenPhaseId(openPhaseId === phase.id ? '' : phase.id)}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: phase.number === 1 ? 'var(--p1-dim)' : phase.number === 2 ? 'var(--p2-dim)' : 'var(--p3-dim)',
              border: `1px solid ${phase.color}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              {phase.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.15em', color: phase.color,
                  background: phase.number === 1 ? 'var(--p1-dim)' : phase.number === 2 ? 'var(--p2-dim)' : 'var(--p3-dim)',
                  padding: '2px 7px', borderRadius: 10,
                }}>
                  Phase {phase.number}
                </span>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{phase.name}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                — {phase.tagline} —
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 14, transition: 'transform .2s', transform: openPhaseId === phase.id ? 'rotate(180deg)' : 'none' }}>▼</span>
          </div>

          {/* Expanded body */}
          {openPhaseId === phase.id && (
            <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--border)' }}>
              <div style={{ paddingTop: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
                  Mechanical Purpose
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {phase.mechanicalPurpose}
                </p>
              </div>

              {/* Bridge list */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 12 }}>
                  All Bridges in this Phase ({phase.bridges.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {phase.bridges.map(bridge => (
                    <div key={bridge.id} style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      opacity: bridge.mastery === 'locked' ? 0.45 : 1,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
                          {bridge.phrase}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>
                          [{bridge.phonetic}]
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          {bridge.translation}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        {[1,2,3].map(n => (
                          <div key={n} style={{ width: 5, height: 5, borderRadius: '50%', background: n <= bridge.difficulty ? phase.color : 'var(--bg-progress-track)' }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button
                style={{
                  background: phase.number === 1 ? 'var(--p1-dim)' : phase.number === 2 ? 'var(--p2-dim)' : 'var(--p3-dim)',
                  color: phase.color,
                  border: `1px solid ${phase.color}33`,
                  borderRadius: 'var(--radius-md)',
                  padding: '11px 22px',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
                onClick={() => onNavigate('phase', { phaseId: phase.id })}
              >
                Open Phase {phase.number} Drill Room →
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
