'use client';

import React, { useState, useCallback } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { PhaseId } from '@/lib/data';
import Sidebar from '@/components/Sidebar';
import HomePage from '@/components/pages/HomePage';
import PhasePage from '@/components/pages/PhasePage';
import BridgeBuilderPage from '@/components/pages/BridgeBuilderPage';
import AnalyzerPage from '@/components/pages/AnalyzerPage';
import StatsPage from '@/components/pages/StatsPage';
import GuidePage from '@/components/pages/GuidePage';
import CollectionPage from '@/components/pages/CollectionPage';
import DialogueDrillPage from '@/components/pages/DialogueDrillPage';
import AudioPlaylistDeck from '@/components/AudioPlaylistDeck';

type PageId =
  | 'home'
  | 'phase'
  | 'builder'
  | 'analyzer'
  | 'stats'
  | 'reference'
  | 'collection'
  | 'dialogue';

function AppShell() {
  const { state, dispatch } = useApp();
  const [page, setPage] = useState<PageId>('home');
  const [params, setParams] = useState<Record<string, string>>({});

  const navigate = useCallback((newPage: string, newParams?: Record<string, string>) => {
    setPage(newPage as PageId);
    setParams(newParams ?? {});
  }, []);

  const sidebarActive =
    page === 'phase' || page === 'builder'
      ? `phase-${params.phaseId}`
      : page;

  const renderPage = () => {
    switch (page) {
      case 'home':       return <HomePage onNavigate={navigate} />;
      case 'phase':      return <PhasePage phaseId={(params.phaseId as PhaseId) ?? 'control'} onNavigate={navigate} />;
      case 'builder':    return <BridgeBuilderPage phaseId={(params.phaseId as PhaseId) ?? 'control'} bridgeId={params.bridgeId} onNavigate={navigate} />;
      case 'analyzer':   return <AnalyzerPage onNavigate={navigate} />;
      case 'stats':      return <StatsPage onNavigate={navigate} />;
      case 'reference':  return <GuidePage onNavigate={navigate} />;
      case 'collection': return <CollectionPage collectionId={params.collectionId ?? 'phase-1-engine'} onNavigate={navigate} />;
      case 'dialogue':   return <DialogueDrillPage collectionId={params.collectionId ?? 'phase-1-engine'} dialogueId={params.dialogueId ?? 'dial-state-possession'} onNavigate={navigate} />;
      default:           return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <div className="app-shell">
      {!state.sidebarCollapsed && (
        <Sidebar activePage={sidebarActive} onNavigate={navigate} />
      )}
      {state.sidebarCollapsed && (
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          style={{
            position: 'fixed', left: 14, top: 16, zIndex: 200,
            background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: 'var(--text-secondary)', cursor: 'pointer',
            boxShadow: 'var(--shadow-card)',
          }}
        >☰</button>
      )}
      <div className="main-content">{renderPage()}</div>
      <AudioPlaylistDeck />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
