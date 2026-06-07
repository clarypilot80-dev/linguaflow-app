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
    <div className="flex h-screen w-full bg-[#0F111A] overflow-hidden text-slate-200">
      <Sidebar activePage={sidebarActive} onNavigate={navigate} />
      
      {state.sidebarCollapsed && (
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="hidden md:flex fixed left-4 top-4 z-[200] bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-md w-9 h-9 items-center justify-center text-[16px] text-[var(--text-secondary)] shadow-md cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors"
        >☰</button>
      )}
      
      <div className="flex-1 h-full overflow-y-auto relative pb-24">
        {renderPage()}
      </div>
      
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
