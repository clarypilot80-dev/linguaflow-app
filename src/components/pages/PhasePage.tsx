'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Bridge, TAG_META, PhaseId, BRIDGE_TREE } from '@/lib/data';
import { speak } from '@/lib/audioUtils';

interface PhasePageProps {
  phaseId: PhaseId;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Get the set of root nodes (bridges with no parents in the tree) */
function getRootNodeIds(phaseId: PhaseId): string[] {
  const tree = BRIDGE_TREE[phaseId] ?? {};
  const allChildren = new Set(Object.values(tree).flat());
  // In Phase 3, p3-b1 appears twice as a parent — that's intentional
  const allParents = Object.keys(tree);
  // Root = a node that's never a child
  const allBridgesInPhase = [...allParents, ...Array.from(allChildren)];
  const uniqueIds = [...new Set(allBridgesInPhase)];
  return uniqueIds.filter(id => !allChildren.has(id));
}

/** Get ordered tiers (BFS from roots) */
function buildTiers(phaseId: PhaseId, allBridgeIds: string[]): string[][] {
  const tree = BRIDGE_TREE[phaseId] ?? {};
  const roots = getRootNodeIds(phaseId);
  const seen = new Set<string>();
  const tiers: string[][] = [];
  let frontier = roots.filter(id => allBridgeIds.includes(id));
  while (frontier.length > 0) {
    tiers.push(frontier);
    frontier.forEach(id => seen.add(id));
    const next: string[] = [];
    for (const id of frontier) {
      const children = (tree[id] ?? []).filter(c => !seen.has(c) && allBridgeIds.includes(c));
      next.push(...children);
    }
    // Deduplicate and filter already-seen
    frontier = [...new Set(next)].filter(id => !seen.has(id));
  }
  // Append any orphaned nodes (not in tree at all)
  const remaining = allBridgeIds.filter(id => !seen.has(id));
  if (remaining.length > 0) tiers.push(remaining);
  return tiers;
}

/** Check if a bridge is unlocked based on parent star ratings */
function isBridgeUnlocked(bridgeId: string, phaseId: PhaseId, bridges: Bridge[]): boolean {
  const tree = BRIDGE_TREE[phaseId] ?? {};
  // Find if this bridgeId is a child of any parent
  for (const [parentId, children] of Object.entries(tree)) {
    if (children.includes(bridgeId)) {
      const parent = bridges.find(b => b.id === parentId);
      if (!parent || parent.stars < 4) return false;
    }
  }
  return true;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusActionBar({ phaseId, onNavigate }: { phaseId: PhaseId; onNavigate: (p: string, params?: Record<string, string>) => void }) {
  const { state, dispatch } = useApp();
  const status = state.phaseStatuses[phaseId];

  if (status === 'completed') {
    return (
      <div className="phase-status-bar phase-status-bar--complete">
        <span style={{ color: 'var(--p3-light)', fontWeight: 700 }}>✓ Completed</span>
        <span style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)' }}>You can still review and drill any node.</span>
        <button onClick={() => dispatch({ type: 'RESUME_PHASE', phaseId })} className="phase-status-btn">
          Mark Active
        </button>
      </div>
    );
  }
  if (status === 'deferred') {
    return (
      <div className="phase-status-bar phase-status-bar--deferred">
        <span style={{ color: 'var(--p1-light)', fontWeight: 700 }}>⏸ Deferred</span>
        <span style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)' }}>Pick up where you left off anytime.</span>
        <button onClick={() => dispatch({ type: 'RESUME_PHASE', phaseId })} className="phase-status-btn phase-status-btn--amber">
          Resume Phase
        </button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      <button
        onClick={() => { dispatch({ type: 'COMPLETE_PHASE', phaseId }); onNavigate('home'); }}
        className="phase-status-btn phase-status-btn--complete-cta"
      >
        ✓ Mark as Complete
      </button>
      <button
        onClick={() => { dispatch({ type: 'DEFER_PHASE', phaseId }); onNavigate('home'); }}
        className="phase-status-btn"
      >
        ⏸ Skip for Now
      </button>
    </div>
  );
}

function TTSButton({ text, lang }: { text: string; lang: string }) {
  const [playing, setPlaying] = useState(false);
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaying(true);
    speak(text, lang);
    setTimeout(() => setPlaying(false), 2000);
  }, [text, lang]);

  return (
    <button
      className={`tts-btn${playing ? ' tts-btn--playing' : ''}`}
      onClick={handleClick}
      title="Listen to pronunciation"
    >
      <span className="tts-icon">{playing ? '🔉' : '🔊'}</span>
    </button>
  );
}

function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="bridge-difficulty-dots">
      {[1, 2, 3].map(n => (
        <div key={n} className={`difficulty-dot${n <= level ? ' filled' : ''}`} />
      ))}
    </div>
  );
}

function MasteryBadge({ mastery }: { mastery: string }) {
  const labels: Record<string, string> = { new: 'New', learning: 'Learning', mastered: 'Mastered', locked: 'Locked' };
  return <span className={`bridge-mastery-badge mastery-${mastery}`}>{labels[mastery] ?? mastery}</span>;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="bridge-star-row">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={`star-btn${(hover || value) >= n ? ' filled' : ''}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={e => { e.stopPropagation(); onChange(n); }}
        >★</span>
      ))}
    </div>
  );
}

// ── Skill Tree Node ───────────────────────────────────────────────────────────

function SkillNode({
  bridge,
  phaseId,
  isUnlocked,
  langCode,
  onDrillClick,
  onRate,
  nodeRef,
}: {
  bridge: Bridge;
  phaseId: PhaseId;
  isUnlocked: boolean;
  langCode: string;
  onDrillClick: (b: Bridge) => void;
  onRate: (bridgeId: string, stars: number) => void;
  nodeRef?: React.Ref<HTMLDivElement>;
}) {
  const [expanded, setExpanded] = useState(false);
  const tag = TAG_META[bridge.tag];
  const locked = !isUnlocked;
  const mastered = bridge.mastery === 'mastered';

  const nodeClass = [
    'skill-node',
    locked ? 'skill-node--locked' : '',
    mastered ? 'skill-node--mastered' : '',
    expanded ? 'skill-node--expanded' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={nodeRef}
      className={nodeClass}
      onClick={() => !locked && setExpanded(v => !v)}
      data-bridge-id={bridge.id}
    >
      {/* Lock overlay */}
      {locked && (
        <div className="skill-node-lock-overlay">
          <span className="skill-node-lock-icon">🔒</span>
          <span className="skill-node-lock-label">Rate parent ★★★★ to unlock</span>
        </div>
      )}

      {/* Node header */}
      <div className="skill-node-header">
        <div className="bridge-card-tag-row">
          <span className="bridge-func-tag" style={{ background: tag.bg, color: tag.color }}>
            {tag.label}
          </span>
          <DifficultyDots level={bridge.difficulty} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!locked && (
            <TTSButton text={bridge.phrase} lang={langCode} />
          )}
          <MasteryBadge mastery={bridge.mastery} />
        </div>
      </div>

      {/* Phrase */}
      <div className="bridge-phrase">{bridge.phrase}</div>
      {bridge.phonetic && <div className="bridge-phonetic">[{bridge.phonetic}]</div>}
      <div className="bridge-translation">{bridge.translation}</div>
      <div className="bridge-function">{bridge.function}</div>

      {/* Expand chevron */}
      {!locked && (
        <div className="skill-node-expand-indicator">
          <span style={{ fontSize: 10, color: 'var(--text-muted)', transition: 'transform .2s', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
        </div>
      )}

      {/* Expanded content */}
      {expanded && !locked && (
        <div className="bridge-drill-inline slide-right">
          {bridge.examples.map((ex, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 }}>
                {ex.sentence}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {ex.translation}
              </div>
            </div>
          ))}

          {bridge.pitfall && (
            <div style={{
              background: 'rgba(245,158,11,0.07)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: 10,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--p1-light)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                ⚠ Street Note
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{bridge.pitfall}</div>
            </div>
          )}

          {/* SM-2 next review info */}
          {bridge.nextReviewAt > 0 && (
            <div style={{
              fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace',
              marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>⏱</span>
              <span>
                Next review: {bridge.nextReviewAt <= Date.now()
                  ? 'Due now'
                  : `in ${Math.ceil((bridge.nextReviewAt - Date.now()) / (1000 * 60 * 60 * 24))}d`
                }
              </span>
              <span style={{ opacity: .5 }}>· EF {bridge.easeFactor.toFixed(2)}</span>
            </div>
          )}

          <StarRating value={bridge.stars} onChange={stars => onRate(bridge.id, stars)} />
          <div style={{ display: 'flex', gap: 6, marginTop: 8, fontSize: 8, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', justifyContent: 'space-between' }}>
            {['Forgot', 'Hard', 'OK', 'Good', 'Perfect'].map(l => (
              <span key={l} style={{ flex: 1, textAlign: 'center', textTransform: 'uppercase' }}>{l}</span>
            ))}
          </div>

          <button
            style={{
              marginTop: 10, width: '100%',
              background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)', padding: '9px',
              fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer',
            }}
            onClick={e => { e.stopPropagation(); onDrillClick(bridge); }}
          >
            Open in Bridge Builder →
          </button>
        </div>
      )}
    </div>
  );
}

// ── SVG connector between two DOM nodes ──────────────────────────────────────

function TreeConnectors({
  parentRefs,
  childRefs,
  color,
}: {
  parentRefs: Map<string, HTMLDivElement>;
  childRefs: Map<string, HTMLDivElement>;
  color: string;
}) {
  const [lines, setLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number; key: string }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    const computed: typeof lines = [];
    parentRefs.forEach((parentEl, parentId) => {
      childRefs.forEach((childEl, childId) => {
        // Only draw if this child is actually a child of this parent (by prefix)
        const parentBr = parentEl.getAttribute('data-bridge-id');
        const childBr = childEl.getAttribute('data-bridge-id');
        if (!parentBr || !childBr) return;

        const pRect = parentEl.getBoundingClientRect();
        const cRect = childEl.getBoundingClientRect();

        computed.push({
          x1: pRect.left + pRect.width / 2 - rect.left,
          y1: pRect.bottom - rect.top,
          x2: cRect.left + cRect.width / 2 - rect.left,
          y2: cRect.top - rect.top,
          key: `${parentBr}-${childBr}`,
        });
      });
    });

    setLines(computed);
  });

  return (
    <div ref={containerRef} className="skill-tree-svg-layer">
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}>
        {lines.map(line => (
          <path
            key={line.key}
            d={`M ${line.x1} ${line.y1} C ${line.x1} ${(line.y1 + line.y2) / 2}, ${line.x2} ${(line.y1 + line.y2) / 2}, ${line.x2} ${line.y2}`}
            stroke={color}
            strokeWidth={1.5}
            strokeOpacity={0.3}
            fill="none"
            strokeDasharray="4 4"
          />
        ))}
      </svg>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PhasePage({ phaseId, onNavigate }: PhasePageProps) {
  const { state, dispatch } = useApp();
  const phase = state.phases.find(p => p.id === phaseId);

  if (!phase) return null;

  const bridges = phase.bridges;
  const mastered = bridges.filter(b => b.mastery === 'mastered').length;
  const pct = bridges.length > 0 ? Math.round((mastered / bridges.length) * 100) : 0;

  // Build the tier structure
  const allIds = bridges.map(b => b.id);
  const tiers = buildTiers(phaseId, allIds);

  // Refs for SVG connectors
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const setNodeRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else nodeRefs.current.delete(id);
  };

  const treeRef = useRef<HTMLDivElement>(null);

  const bannerStyle = {
    background: phase.bgGradient,
    color: '#fff',
  };

  return (
    <div className="page-root">
      {/* Back */}
      <button
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 20, fontWeight: 500 }}
        onClick={() => onNavigate('home')}
      >
        ← Dashboard
      </button>

      {/* Status action bar */}
      <StatusActionBar phaseId={phaseId} onNavigate={onNavigate} />

      {/* Banner */}
      <div className="phase-header-banner" style={bannerStyle}>
        <div className="phase-header-phase-num mono">Phase {phase.number} of 3</div>
        <div className="phase-header-name">{phase.icon} {phase.name}</div>
        <div className="phase-header-tagline">— {phase.tagline} —</div>
        <p className="phase-header-purpose">{phase.mechanicalPurpose}</p>
      </div>

      {/* Progress strip */}
      <div className="phase-progress-strip">
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
          {mastered}/{bridges.length} mastered
        </span>
        <div className="phase-progress-bar-track">
          <div
            className="phase-progress-bar-fill"
            style={{ width: `${pct}%`, background: phase.color }}
          />
        </div>
        <span className="phase-progress-label">{pct}% mastered</span>
        <button
          style={{
            background: phase.number === 1 ? 'var(--p1-dim)' : phase.number === 2 ? 'var(--p2-dim)' : 'var(--p3-dim)',
            color: phase.color,
            border: `1px solid ${phase.number === 1 ? 'var(--p1-border)' : phase.number === 2 ? 'var(--p2-border)' : 'var(--p3-border)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '7px 14px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
          onClick={() => onNavigate('builder', { phaseId })}
        >
          Drill All →
        </button>
      </div>

      {/* Legend */}
      <div className="skill-tree-legend">
        <div className="skill-tree-legend-item">
          <div className="skill-tree-legend-dot" style={{ background: 'var(--p3)', opacity: .8 }} />
          <span>Mastered (★★★★+)</span>
        </div>
        <div className="skill-tree-legend-item">
          <div className="skill-tree-legend-dot" style={{ background: 'var(--p1)', opacity: .8 }} />
          <span>Learning</span>
        </div>
        <div className="skill-tree-legend-item">
          <div className="skill-tree-legend-dot" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <span>New</span>
        </div>
        <div className="skill-tree-legend-item">
          <div className="skill-tree-legend-dot" style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)' }} />
          <span>🔒 Locked — rate parent ★★★★</span>
        </div>
        <div className="skill-tree-legend-item" style={{ marginLeft: 'auto', opacity: .5 }}>
          <svg width={16} height={10} style={{ overflow: 'visible' }}>
            <path d="M 0 5 Q 8 5 16 5" stroke={phase.color} strokeWidth={1.5} strokeDasharray="3 3" fill="none" />
          </svg>
          <span>unlock dependency</span>
        </div>
      </div>

      {/* ── Skill Tree ── */}
      <div className="skill-tree" ref={treeRef}>
        {tiers.map((tier, tierIdx) => (
          <div key={tierIdx} className="skill-tree-tier">
            {tier.map(bridgeId => {
              const bridge = bridges.find(b => b.id === bridgeId);
              if (!bridge) return null;
              const unlocked = isBridgeUnlocked(bridgeId, phaseId, bridges);
              return (
                <SkillNode
                  key={bridgeId}
                  bridge={bridge}
                  phaseId={phaseId}
                  isUnlocked={unlocked}
                  langCode={state.currentLang.code}
                  nodeRef={setNodeRef(bridgeId)}
                  onDrillClick={b => onNavigate('builder', { phaseId, bridgeId: b.id })}
                  onRate={(bridgeId, stars) => dispatch({ type: 'RATE_BRIDGE', phaseId, bridgeId, stars })}
                />
              );
            })}
          </div>
        ))}
      </div>

      {bridges.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          No bridges defined for this phase.
        </div>
      )}
    </div>
  );
}
