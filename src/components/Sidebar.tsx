'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { LANGUAGES, PhaseId, Theme } from '@/lib/data';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { state, dispatch } = useApp();
  const [langOpen, setLangOpen] = useState(false);
  const isDark = state.theme === 'dark';

  function phaseStatusIcon(phaseId: PhaseId): { icon: string; color: string } {
    const s = state.phaseStatuses[phaseId];
    if (s === 'completed') return { icon: '✓', color: 'var(--p3)' };
    if (s === 'deferred') return { icon: '⏸', color: 'var(--p1)' };
    return { icon: '●', color: phaseId === 'control' ? 'var(--p1)' : phaseId === 'connect' ? 'var(--p2)' : 'var(--p3)' };
  }

  const phases = [
    { id: 'control' as PhaseId, label: 'Control', num: 'P1', params: { phaseId: 'control' } },
    { id: 'connect' as PhaseId, label: 'Connect', num: 'P2', params: { phaseId: 'connect' } },
    { id: 'expand' as PhaseId, label: 'Expand', num: 'P3', params: { phaseId: 'expand' } },
  ];

  const toggleTheme = () => dispatch({ type: 'SET_THEME', theme: isDark ? 'light' : 'dark' });

  return (
    <>
    {/* Desktop Sidebar */}
    <aside className={`hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-[#0F111A] border-r border-slate-800 z-50 ${state.sidebarCollapsed ? '!hidden' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⛓</div>
        <div>
          <div className="sidebar-logo-text">LinguaFlow</div>
          <div className="sidebar-logo-sub">Structural Core</div>
        </div>
      </div>

      {/* Language selector */}
      <div className="lang-selector" onClick={() => setLangOpen(v => !v)}>
        <span style={{ fontSize: 18 }}>{state.currentLang.flag}</span>
        <div className="lang-selector-info">
          <div className="lang-selector-label">Target Language</div>
          <div className="lang-selector-name">{state.currentLang.name}</div>
        </div>
        <span className="lang-selector-chev">{langOpen ? '▲' : '▼'}</span>
        {langOpen && (
          <div className="lang-dropdown-menu" onClick={e => e.stopPropagation()}>
            {LANGUAGES.map(lang => (
              <div
                key={lang.code}
                className={`lang-dropdown-item${state.currentLang.code === lang.code ? ' active' : ''}`}
                onClick={() => { dispatch({ type: 'SET_LANG', lang }); setLangOpen(false); }}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                {state.currentLang.code === lang.code && <span style={{ marginLeft: 'auto', fontSize: 11 }}>✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Core nav */}
      <div className="nav-section">
        <div className="nav-section-label">Core</div>
        <div className={`nav-item${activePage === 'home' ? ' active' : ''}`} onClick={() => onNavigate('home')}>
          <span style={{ fontSize: 15 }}>⬡</span>Dashboard
        </div>
        <div className={`nav-item${activePage === 'stats' ? ' active' : ''}`} onClick={() => onNavigate('stats')}>
          <span style={{ fontSize: 15 }}>◈</span>My Progress
        </div>
      </div>

      {/* Phases nav */}
      <div className="nav-section">
        <div className="nav-section-label">Phases</div>
        {phases.map(item => {
          const { icon, color } = phaseStatusIcon(item.id);
          return (
            <div
              key={item.id}
              className={`nav-item${activePage === `phase-${item.id}` ? ' active' : ''}`}
              onClick={() => onNavigate('phase', item.params)}
            >
              <span style={{ fontSize: 11, color, fontWeight: 700, width: 14, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
              {item.label}
              <span className="nav-item-phase-num mono">{item.num}</span>
            </div>
          );
        })}
      </div>

      {/* Sectors nav */}
      <div className="nav-section">
        <div className="nav-section-label">Sectors</div>
        <div className={`nav-item${activePage === 'home' ? '' : ''}`} onClick={() => onNavigate('home')} style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          <span style={{ fontSize: 14 }}>🗺</span>
          Conversational Sectors
          <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '1px 6px' }}>↓</span>
        </div>
      </div>

      {/* Analyze nav */}
      <div className="nav-section">
        <div className="nav-section-label">Analyze</div>
        <div className={`nav-item${activePage === 'analyzer' ? ' active' : ''}`} onClick={() => onNavigate('analyzer')}>
          <span style={{ fontSize: 15, color: 'var(--analyzer)' }}>◉</span>
          Conversation Analyzer
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '8px 10px', borderRadius: 8,
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer',
            marginBottom: 8, transition: 'background .15s',
          }}
        >
          <span style={{ fontSize: 14 }}>{isDark ? '☀️' : '🌙'}</span>
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button className="collapse-btn" onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}>‹ Collapse sidebar</button>
      </div>
    </aside>

    {/* Mobile Bottom Navigation */}
    <nav className="fixed bottom-0 left-0 w-full bg-[#0F111A] border-t border-slate-800 flex justify-around p-4 z-50 md:hidden">
      <button onClick={() => onNavigate('home')} className={`flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] ${activePage === 'home' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
        <span className="text-[22px] leading-none mb-0.5">⬡</span>
        <span className="text-[10px] font-bold tracking-wide uppercase">Core</span>
      </button>
      <button onClick={() => onNavigate('reference')} className={`flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] ${activePage === 'reference' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
        <span className="text-[22px] leading-none mb-0.5">⊞</span>
        <span className="text-[10px] font-bold tracking-wide uppercase">Guide</span>
      </button>
      <button onClick={() => onNavigate('home')} className={`flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] ${activePage === 'island' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
        <span className="text-[22px] leading-none mb-0.5 opacity-80">🏝️</span>
        <span className="text-[10px] font-bold tracking-wide uppercase">Islands</span>
      </button>
      <button onClick={() => onNavigate('stats')} className={`flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] ${activePage === 'stats' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
        <span className="text-[22px] leading-none mb-0.5">◈</span>
        <span className="text-[10px] font-bold tracking-wide uppercase">Stats</span>
      </button>
    </nav>
    </>
  );
}
