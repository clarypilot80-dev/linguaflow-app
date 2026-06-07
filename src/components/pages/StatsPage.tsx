'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PHASES, CEFR_LEVELS } from '@/lib/data';

interface StatsPageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function StatsPage({ onNavigate }: StatsPageProps) {
  const { state, getMasteredTotal, getTotalBridges } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  const masteredTotal = getMasteredTotal();
  const totalBridges = getTotalBridges();
  const totalInstalled = PHASES.flatMap(p => p.bridges).filter(b => b.mastery !== 'locked').length;

  // Mock weekly data
  const weekData = [
    { day: 'Mon', drills: 4 },
    { day: 'Tue', drills: 12 },
    { day: 'Wed', drills: 3 },
    { day: 'Thu', drills: 18 },
    { day: 'Fri', drills: 9 },
    { day: 'Sat', drills: 24 },
    { day: 'Sun', drills: 2 },
  ];
  const maxDrills = Math.max(...weekData.map(d => d.drills));

  return (
    <div className="page-root">
      <div className="page-header fade-up">
        <div className="page-header-eyebrow mono">Structural Progress</div>
        <h1>My Progress</h1>
        <p>Track your bridge installation rate across the three structural phases.</p>
      </div>

      {/* Top stats */}
      <div className="stats-grid fade-up">
        {[
          { icon: '⛓', label: 'Bridges Mastered',   value: `${masteredTotal}/${totalBridges}`, color: 'var(--p2-light)' },
          { icon: '🔓', label: 'Bridges Unlocked',   value: totalInstalled,                    color: 'var(--p1-light)' },
          { icon: '◈',  label: 'Phases Active',      value: `${PHASES.filter(p => p.bridges.some(b => b.mastery !== 'locked')).length}/3`, color: 'var(--p3-light)' },
        ].map(s => (
          <div className="stat-tile" key={s.label}>
            <div className="stat-tile-icon">{s.icon}</div>
            <div className="stat-tile-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-tile-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly drills chart */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Weekly Bridge Drills</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Challenges completed per day</div>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 900, color: 'var(--p2-light)', letterSpacing: '-1px' }}>
            {weekData.reduce((a, d) => a + d.drills, 0)}
          </div>
        </div>
        <div className="bar-chart-wrap">
          {weekData.map((d, i) => (
            <div key={d.day} className="bar-chart-col">
              <div
                className="bar-chart-fill"
                style={{
                  height: `${Math.max(8, Math.round((d.drills / maxDrills) * 100))}%`,
                  background: i === 6
                    ? 'linear-gradient(180deg, var(--p3-light), var(--p3))'
                    : 'linear-gradient(180deg, var(--p2-light), var(--p2))',
                  opacity: i === 6 ? 1 : 0.6,
                }}
              />
              <span className="bar-chart-label">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Phase breakdown */}
      {state.phases.map(phase => {
        const mastered = phase.bridges.filter(b => b.mastery === 'mastered').length;
        const learning = phase.bridges.filter(b => b.mastery === 'learning').length;
        const active   = phase.bridges.filter(b => b.mastery === 'new').length;
        const locked   = phase.bridges.filter(b => b.mastery === 'locked').length;
        const pct = phase.bridges.length > 0 ? Math.round((mastered / phase.bridges.length) * 100) : 0;

        return (
          <div
            key={phase.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: 22,
              marginBottom: 14,
              cursor: 'pointer',
              transition: 'border-color .18s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = phase.color + '44')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            onClick={() => onNavigate('phase', { phaseId: phase.id })}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>{phase.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                  Phase {phase.number} · {phase.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  {phase.tagline}
                </div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 18, color: phase.color }}>
                {pct}%
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, background: 'var(--bg-progress-track)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: phase.color, borderRadius: 3, transition: 'width .6s ease' }} />
            </div>

            {/* Breakdown pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Mastered', count: mastered, color: 'var(--p3-light)', bg: 'var(--p3-dim)' },
                { label: 'Learning', count: learning, color: 'var(--p1-light)', bg: 'var(--p1-dim)' },
                { label: 'Active',   count: active,   color: 'var(--p2-light)', bg: 'var(--p2-dim)' },
                { label: 'Locked',   count: locked,   color: 'var(--text-muted)', bg: 'var(--bg-surface)' },
              ].map(s => (
                <span key={s.label} style={{
                  background: s.bg, color: s.color,
                  borderRadius: 20, padding: '3px 10px',
                  fontSize: 10, fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  textTransform: 'uppercase', letterSpacing: '.06em',
                }}>
                  {s.count} {s.label}
                </span>
              ))}
            </div>
          </div>
        );
      })}

      {/* CEFR guide */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 22, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>CEFR Reference</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          The Structural Core curriculum is designed to accelerate your progression from A0 to B2 conversational fluency.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {CEFR_LEVELS.map(l => (
            <div key={l.level} style={{
              background: l.color, color: l.textColor,
              border: `1px solid ${l.border}`,
              borderRadius: 8, padding: '10px 6px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace' }}>{l.level}</div>
              <div style={{ fontSize: 9, marginTop: 2, fontWeight: 600, opacity: .8 }}>{l.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hard reset */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-xl)', padding: 22 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>⚠ Hard Reset</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Reset all bridge ratings and mastery levels. This cannot be undone.
        </p>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: 'rgba(239,68,68,0.8)', borderRadius: 'var(--radius-sm)', padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Hard Reset Progress
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', borderRadius: 'var(--radius-sm)', padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              onClick={() => setConfirmReset(false)}
            >
              Confirm Reset
            </button>
            <button
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
