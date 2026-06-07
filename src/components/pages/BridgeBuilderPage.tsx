'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PHASES, Bridge, BridgeDrill, PhaseId, TAG_META } from '@/lib/data';
import { speak } from '@/lib/audioUtils';

interface BridgeBuilderPageProps {
  phaseId: PhaseId;
  bridgeId?: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function BridgeBuilderPage({ phaseId, bridgeId, onNavigate }: BridgeBuilderPageProps) {
  const { state, dispatch } = useApp();
  const phase = state.phases.find(p => p.id === phaseId);

  // Pick drills: if bridgeId specified, start with that bridge's drill
  const allDrills: BridgeDrill[] = phase?.drills ?? [];
  const startIdx = bridgeId
    ? Math.max(0, allDrills.findIndex(d => d.bridgeId === bridgeId))
    : 0;

  const [drillIdx, setDrillIdx] = useState(startIdx);
  const [userInput, setUserInput] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [stars, setStars] = useState(0);
  const [recording, setRecording] = useState(false);
  const [completed, setCompleted] = useState(false);
  const renderTimeRef = useRef<number>(Date.now());

  // Reset dwell timer whenever the drill changes
  useEffect(() => {
    renderTimeRef.current = Date.now();
  }, [drillIdx]);

  const drill = allDrills[drillIdx];
  const bridge = drill ? state.phases.flatMap(p => p.bridges).find(b => b.id === drill.bridgeId) : undefined;
  const tag = bridge ? TAG_META[bridge.tag] : null;

  const handleReveal = useCallback(() => {
    const dwellMs = Date.now() - renderTimeRef.current;
    setRevealed(true);
    // Speak the bridge phrase on reveal
    if (bridge) speak(bridge.phrase, state.currentLang.code);
    if (bridge && phase) {
      dispatch({
        type: 'UPDATE_BRIDGE_TELEMETRY',
        phaseId: phase.id,
        bridgeId: bridge.id,
        dwellMs,
      });
    }
  }, [bridge, phase, dispatch, state.currentLang.code]);

  const handleRate = useCallback((s: number) => {
    setStars(s);
    if (bridge && phase) {
      dispatch({ type: 'RATE_BRIDGE', phaseId: phase.id, bridgeId: bridge.id, stars: s });
    }
  }, [bridge, phase, dispatch]);

  const handleNext = useCallback(() => {
    if (drillIdx < allDrills.length - 1) {
      setDrillIdx(i => i + 1);
      setUserInput('');
      setRevealed(false);
      setStars(0);
    } else {
      setCompleted(true);
    }
  }, [drillIdx, allDrills.length]);

  if (!phase) return null;

  if (allDrills.length === 0) {
    return (
      <div className="builder-shell">
        <div className="builder-header">
          <button className="builder-back-btn" onClick={() => onNavigate('phase', { phaseId })}>←</button>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Bridge Builder</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{phase.name}</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚧</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>More drills coming soon</div>
          <p>Additional Bridge Builder challenges for this phase are in development.</p>
          <button
            style={{ marginTop: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => onNavigate('phase', { phaseId })}
          >
            ← Back to Phase
          </button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="builder-shell" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 64, marginBottom: 20 }}>⛓</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.8px', marginBottom: 8 }}>Session Complete</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
            You have drilled all {allDrills.length} bridge challenges in {phase.name}.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              style={{ background: phase.number === 1 ? 'var(--p1-dim)' : phase.number === 2 ? 'var(--p2-dim)' : 'var(--p3-dim)', color: phase.color, border: `1px solid ${phase.color}33`, borderRadius: 'var(--radius-md)', padding: '12px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => { setDrillIdx(0); setRevealed(false); setUserInput(''); setStars(0); setCompleted(false); }}
            >
              Drill Again
            </button>
            <button
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              onClick={() => onNavigate('phase', { phaseId })}
            >
              Back to Phase
            </button>
            <button
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              onClick={() => onNavigate('home')}
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="builder-shell">
      {/* Header */}
      <div className="builder-header">
        <button className="builder-back-btn" onClick={() => onNavigate('phase', { phaseId })}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Bridge Builder</span>
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', letterSpacing: '.1em' }}>
              {drillIdx + 1} / {allDrills.length}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{phase.icon} {phase.name}</div>
        </div>
        {/* Mini progress bar */}
        <div style={{ width: 120, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((drillIdx + 1) / allDrills.length) * 100}%`, background: phase.color, borderRadius: 2, transition: 'width .4s ease' }} />
        </div>
      </div>

      <div className="builder-body">
        {/* Main drill area */}
        <div className="builder-main">
          {/* Instruction */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 5 }}>
              Challenge · {tag?.label}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Produce the correct <strong style={{ color: 'var(--text-primary)' }}>bridge phrase</strong> that logically connects these two concepts in {state.currentLang.name}.
            </div>
          </div>

          {/* Concepts */}
          <div className="builder-concepts">
            <div className="builder-concept">
              <div className="builder-concept-label">Concept A</div>
              <div className="builder-concept-text">{drill.conceptA.text}</div>
              <div className="builder-concept-translation">{drill.conceptA.translation}</div>
            </div>
            <div className="builder-gap-icon">⛓</div>
            <div className="builder-concept">
              <div className="builder-concept-label">Concept B</div>
              <div className="builder-concept-text">{drill.conceptB.text}</div>
              <div className="builder-concept-translation">{drill.conceptB.translation}</div>
            </div>
          </div>

          {/* Response area */}
          <div className="builder-response-area">
            <div className="builder-response-label">Your Bridge</div>
            <input
              className="builder-input mono"
              placeholder={`Type the ${phase.name.toLowerCase()} bridge in ${state.currentLang.name}…`}
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReveal()}
              autoFocus
            />
            <div className="builder-btn-row">
              <button className="builder-btn-reveal" onClick={handleReveal}>
                {revealed ? '✓ Revealed' : 'Reveal Bridge'}
              </button>
              <button
                className={`builder-btn-mic${recording ? ' recording' : ''}`}
                onClick={() => setRecording(v => !v)}
                title="Record pronunciation"
              >
                🎙️
              </button>
            </div>

            {/* Reveal panel */}
            {revealed && bridge && (
              <div className="builder-reveal-panel slide-right">
                <div className="builder-reveal-answer-label">
                  Bridge · {tag?.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div className="builder-reveal-phrase">{bridge.phrase}</div>
                  <button
                    className="tts-btn"
                    onClick={() => speak(bridge.phrase, state.currentLang.code)}
                    title="Listen again"
                  >
                    <span className="tts-icon">🔊</span>
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 10 }}>
                  [{bridge.phonetic}]
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>{bridge.translation}</div>
                <div className="builder-reveal-full">{drill.fullSentence}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 14 }}>{drill.fullTranslation}</div>

                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
                  Rate your recall
                </div>
                <div className="builder-stars">
                  {[1,2,3,4,5].map(n => (
                    <span
                      key={n}
                      className={`star-btn${stars >= n ? ' filled' : ''}`}
                      onClick={() => handleRate(n)}
                      style={{ fontSize: 22 }}
                    >★</span>
                  ))}
                </div>

                <button
                  className="builder-next-btn"
                  style={{
                    marginTop: 14,
                    background: phase.number === 1 ? 'var(--p1-dim)' : phase.number === 2 ? 'var(--p2-dim)' : 'var(--p3-dim)',
                    color: phase.color,
                    border: `1px solid ${phase.color}33`,
                    opacity: stars > 0 ? 1 : 0.5,
                  }}
                  disabled={stars === 0}
                  onClick={handleNext}
                >
                  {drillIdx < allDrills.length - 1 ? 'Next Challenge →' : 'Complete Session →'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — bridge context */}
        <div>
          {bridge && (
            <>
              <div className="builder-sidebar-card">
                <div className="builder-sidebar-label">Bridge Reference</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{bridge.phrase}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>[{bridge.phonetic}]</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 10 }}>{bridge.translation}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{bridge.function}</div>
              </div>

              <div className="builder-sidebar-card">
                <div className="builder-sidebar-label">Mechanical Purpose</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {phase.mechanicalPurpose}
                </div>
              </div>

              {bridge.pitfall && (
                <div className="builder-sidebar-card" style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
                  <div className="builder-sidebar-label" style={{ color: 'var(--p1-light)' }}>⚠ Street Note</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{bridge.pitfall}</div>
                </div>
              )}

              {bridge.examples[0] && (
                <div className="builder-sidebar-card">
                  <div className="builder-sidebar-label">Example in Context</div>
                  <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 6 }}>
                    {bridge.examples[0].sentence}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {bridge.examples[0].translation}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
