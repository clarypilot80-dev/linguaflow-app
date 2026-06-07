'use client';

import React from 'react';
import { useApp, getCollectionMasteryPct, isCollectionUnlocked } from '@/context/AppContext';
import { PHASES, Phase, PhaseId, PhaseStatus } from '@/lib/data';

interface HomePageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const ALL_HOME_DRILLS = PHASES.flatMap(phase => phase.drills.map(d => ({ ...d, phase })));

function PhaseStrip({ phase, status, onNavigate, onDefer, onResume }: {
  phase: Phase; status: PhaseStatus;
  onNavigate: (p: string, params?: Record<string, string>) => void;
  onDefer: (id: PhaseId) => void;
  onResume: (id: PhaseId) => void;
}) {
  const mastered = phase.bridges.filter(b => b.mastery === 'mastered').length;
  const total = phase.bridges.length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const isDeferred = status === 'deferred';
  const isCompleted = status === 'completed';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${isCompleted ? 'rgba(5,150,105,0.2)' : isDeferred ? 'rgba(217,119,6,0.15)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center',
      gap: 16,
      boxShadow: 'var(--shadow-card)',
      transition: 'box-shadow .2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${phase.color}12`,
          border: `1px solid ${phase.color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
          opacity: isDeferred ? 0.5 : 1,
        }}>{phase.icon}</div>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>Phase {phase.number}</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: isDeferred ? 'var(--text-muted)' : 'var(--text-primary)' }}>{phase.name}</div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: isCompleted ? 'var(--p3)' : isDeferred ? 'var(--p1)' : phase.color, fontWeight: 700 }}>
            {isCompleted ? '✓ Complete' : isDeferred ? '⏸ Deferred' : '● Active'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{mastered}/{total} mastered</span>
        </div>
        <div style={{ height: 4, background: 'var(--bg-progress-track)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: isCompleted ? 'var(--p3)' : isDeferred ? 'var(--p1)' : phase.color, borderRadius: 2, transition: 'width .6s ease' }} />
        </div>
        {phase.id === 'expand' && (
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 5, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '.1em' }}>Optional — never blocks progression</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {isDeferred ? (
          <button onClick={() => onResume(phase.id)} style={{ background: 'var(--p1-dim)', border: '1px solid var(--p1-border)', color: 'var(--p1)', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Resume</button>
        ) : isCompleted ? (
          <button onClick={() => onNavigate('phase', { phaseId: phase.id })} style={{ background: 'var(--p3-dim)', border: '1px solid var(--p3-border)', color: 'var(--p3)', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Review</button>
        ) : (
          <>
            <button onClick={() => onNavigate('phase', { phaseId: phase.id })} style={{ background: `${phase.color}12`, border: `1px solid ${phase.color}22`, color: phase.color, borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Continue →</button>
            <button onClick={() => onDefer(phase.id)} title="Save for later" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 8, padding: '7px 10px', fontSize: 11, cursor: 'pointer' }}>⏸</button>
          </>
        )}
      </div>
    </div>
  );
}

function CollectionCard({ collection, index, mastery, unlocked, onNavigate }: {
  collection: any; index: number; mastery: number; unlocked: boolean;
  onNavigate: (p: string, params?: Record<string, string>) => void;
}) {
  const totalSentences = collection.dialogues.flatMap((d: any) => d.sentences).length;
  const masteredCount = collection.dialogues.flatMap((d: any) => d.sentences).filter((s: any) => s.stars >= 4).length;

  return (
    <div
      onClick={() => unlocked && onNavigate('collection', { collectionId: collection.id })}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${unlocked ? 'var(--border)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: '22px 24px',
        cursor: unlocked ? 'pointer' : 'default',
        opacity: unlocked ? 1 : 0.5,
        transition: 'all .2s',
        minWidth: 240, flex: '0 0 auto',
        boxShadow: 'var(--shadow-card)',
        position: 'relative' as const,
        overflow: 'hidden',
      }}
      onMouseEnter={e => { if (unlocked) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)'; }}
    >
      {/* Color accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: unlocked ? collection.color : 'var(--border)', borderRadius: '20px 20px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, marginTop: 6 }}>
        <span style={{ fontSize: 28 }}>{collection.icon}</span>
        {!unlocked ? (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '2px 8px' }}>🔒 80% to unlock</span>
        ) : mastery === 100 ? (
          <span style={{ fontSize: 10, color: 'var(--p3)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, background: 'var(--p3-dim)', border: '1px solid var(--p3-border)', borderRadius: 10, padding: '2px 8px' }}>✓ Complete</span>
        ) : null}
      </div>

      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.12em', color: collection.color, fontFamily: 'JetBrains Mono, monospace', marginBottom: 3 }}>{collection.subtitle}</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 5 }}>{collection.name}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>{collection.description.slice(0, 80)}…</div>

      {unlocked && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>{collection.dialogues.length} dialogues · {totalSentences} sentences</span>
            <span style={{ fontWeight: 700, color: collection.color }}>{mastery}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-progress-track)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${mastery}%`, background: collection.color, borderRadius: 2, transition: 'width .4s' }} />
          </div>
        </>
      )}
    </div>
  );
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { state, dispatch } = useApp();

  return (
    <div className="page-root">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 6 }}>LinguaFlow</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: 8 }}>Your Learning Hub</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 560 }}>Structural conversation mechanics + high-frequency vocabulary — the fastest path to real spoken fluency.</p>
      </div>

      {/* ── Structural Core ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.14em', fontFamily: 'JetBrains Mono, monospace' }}>Structural Core</h2>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Phases can be skipped — they never block vocabulary access</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {state.phases.map(phase => (
            <PhaseStrip
              key={phase.id}
              phase={phase}
              status={state.phaseStatuses[phase.id]}
              onNavigate={onNavigate}
              onDefer={id => dispatch({ type: 'DEFER_PHASE', phaseId: id })}
              onResume={id => dispatch({ type: 'RESUME_PHASE', phaseId: id })}
            />
          ))}
        </div>
      </div>

      {/* ── Conversational Sectors ──────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.14em', fontFamily: 'JetBrains Mono, monospace' }}>Conversational Sectors</h2>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Deck 2 unlocks at 80% mastery of Deck 1</span>
        </div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
          {state.collections.map((col, idx) => (
            <CollectionCard
              key={col.id}
              collection={col}
              index={idx}
              mastery={getCollectionMasteryPct(col)}
              unlocked={isCollectionUnlocked(state.collections, idx)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>

      {/* ── Analyzer CTA ────────────────────────────────────────────────── */}
      <div className="analyzer-cta fade-up fade-up-d3" onClick={() => onNavigate('analyzer')} style={{ marginBottom: 0 }}>
        <div className="analyzer-icon-wrap">◉</div>
        <div>
          <div className="analyzer-title">Real-World Conversation Analyzer</div>
          <div className="analyzer-sub">Upload a real interaction. AI identifies missed bridges and grades your structural fluency.</div>
        </div>
        <div className="analyzer-arrow">→</div>
      </div>
    </div>
  );
}
