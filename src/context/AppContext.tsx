'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import {
  LANGUAGES, PHASES, COLLECTIONS, calculateSM2,
  Language, Phase, Bridge, PhaseId, PhaseStatus, MasteryLevel,
  Collection, Dialogue, Sentence, DEMO_SESSION, ConversationSession, Theme,
} from '@/lib/data';

// ── State ─────────────────────────────────────────────────────────────────────

export interface AppState {
  theme: Theme;
  currentLang: Language;
  phases: Phase[];
  phaseStatuses: Record<PhaseId, PhaseStatus>;
  collections: Collection[];
  sidebarCollapsed: boolean;
  analyzedSessions: ConversationSession[];
  audioPlaylist: string[];
  isPlaylistPlaying: boolean;
  playlistLoopMode: boolean;
  playlistSpeakEnglish: boolean;
  _version: number;
}

const STORAGE_KEY = 'linguaflow-v4';
const SCHEMA_VERSION = 4;

function initialPhaseStatuses(): Record<PhaseId, PhaseStatus> {
  return { control: 'active', connect: 'active', expand: 'active' };
}

const FRESH_STATE: AppState = {
  theme: 'light',
  currentLang: LANGUAGES[0],
  phases: PHASES,
  phaseStatuses: initialPhaseStatuses(),
  collections: COLLECTIONS,
  sidebarCollapsed: false,
  analyzedSessions: [DEMO_SESSION],
  audioPlaylist: [],
  isPlaylistPlaying: false,
  playlistLoopMode: true,
  playlistSpeakEnglish: true,
  _version: SCHEMA_VERSION,
};

// ── LocalStorage persistence ──────────────────────────────────────────────────

function loadState(): AppState {
  if (typeof window === 'undefined') return FRESH_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return FRESH_STATE;
    const parsed: AppState = JSON.parse(raw);
    if (parsed._version !== SCHEMA_VERSION) return FRESH_STATE;
    return parsed;
  } catch {
    return FRESH_STATE;
  }
}

function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'SET_LANG'; lang: Language }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'DEFER_PHASE'; phaseId: PhaseId }
  | { type: 'RESUME_PHASE'; phaseId: PhaseId }
  | { type: 'COMPLETE_PHASE'; phaseId: PhaseId }
  | { type: 'RATE_BRIDGE'; phaseId: PhaseId; bridgeId: string; stars: number }
  | { type: 'SET_MASTERY'; phaseId: PhaseId; bridgeId: string; mastery: MasteryLevel }
  | { type: 'RATE_SENTENCE'; collectionId: string; dialogueId: string; sentenceId: string; stars: number }
  | { type: 'UPDATE_BRIDGE_TELEMETRY'; phaseId: PhaseId; bridgeId: string; dwellMs?: number; audioClick?: boolean }
  | { type: 'UPDATE_SENTENCE_TELEMETRY'; collectionId: string; dialogueId: string; sentenceId: string; dwellMs?: number; audioClick?: boolean }
  | { type: 'ADD_SESSION'; session: ConversationSession }
  | { type: 'TOGGLE_PIN_SENTENCE'; sentenceId: string }
  | { type: 'SET_PLAYLIST_PLAYING'; playing: boolean }
  | { type: 'SET_PLAYLIST_LOOP_MODE'; loop: boolean }
  | { type: 'SET_PLAYLIST_SPEAK_ENGLISH'; speak: boolean }
  | { type: 'CLEAR_PLAYLIST' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function updateBridge(phases: Phase[], phaseId: PhaseId, bridgeId: string, updater: (b: Bridge) => Bridge): Phase[] {
  return phases.map(p => p.id === phaseId ? { ...p, bridges: p.bridges.map(b => b.id === bridgeId ? updater(b) : b) } : p);
}

function updateSentence(
  collections: Collection[],
  collectionId: string,
  dialogueId: string,
  sentenceId: string,
  updater: (s: Sentence) => Sentence
): Collection[] {
  return collections.map(col =>
    col.id !== collectionId ? col : {
      ...col,
      dialogues: col.dialogues.map(dial =>
        dial.id !== dialogueId ? dial : {
          ...dial,
          sentences: dial.sentences.map(s => s.id === sentenceId ? updater(s) : s),
        }
      ),
    }
  );
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.theme };

    case 'SET_LANG':
      return { ...state, currentLang: action.lang };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    case 'DEFER_PHASE':
      return { ...state, phaseStatuses: { ...state.phaseStatuses, [action.phaseId]: 'deferred' } };

    case 'RESUME_PHASE':
      return { ...state, phaseStatuses: { ...state.phaseStatuses, [action.phaseId]: 'active' } };

    case 'COMPLETE_PHASE':
      return { ...state, phaseStatuses: { ...state.phaseStatuses, [action.phaseId]: 'completed' } };

    case 'RATE_BRIDGE': {
      const newMastery: MasteryLevel = action.stars >= 4 ? 'mastered' : action.stars >= 2 ? 'learning' : 'new';
      return {
        ...state,
        phases: updateBridge(state.phases, action.phaseId, action.bridgeId, b => ({
          ...b, stars: action.stars, mastery: newMastery,
          ...calculateSM2(action.stars as 1|2|3|4|5, { repetitions: b.repetitions, interval: b.interval, easeFactor: b.easeFactor, nextReviewAt: b.nextReviewAt }),
        })),
      };
    }

    case 'SET_MASTERY':
      return { ...state, phases: updateBridge(state.phases, action.phaseId, action.bridgeId, b => ({ ...b, mastery: action.mastery })) };

    case 'RATE_SENTENCE':
      return {
        ...state,
        collections: updateSentence(state.collections, action.collectionId, action.dialogueId, action.sentenceId, s => ({
          ...s,
          stars: action.stars,
          ...calculateSM2(action.stars as 1|2|3|4|5, { repetitions: s.repetitions, interval: s.interval, easeFactor: s.easeFactor, nextReviewAt: s.nextReviewAt }),
        })),
      };

    case 'UPDATE_BRIDGE_TELEMETRY':
      return {
        ...state,
        phases: updateBridge(state.phases, action.phaseId, action.bridgeId, b => ({
          ...b,
          audioClickCount: action.audioClick ? b.audioClickCount + 1 : b.audioClickCount,
          hesitationDwellTime: action.dwellMs != null
            ? (b.hesitationDwellTime === 0 ? action.dwellMs : Math.round((b.hesitationDwellTime + action.dwellMs) / 2))
            : b.hesitationDwellTime,
        })),
      };

    case 'UPDATE_SENTENCE_TELEMETRY':
      return {
        ...state,
        collections: updateSentence(state.collections, action.collectionId, action.dialogueId, action.sentenceId, s => ({
          ...s,
          audioClickCount: action.audioClick ? s.audioClickCount + 1 : s.audioClickCount,
          hesitationDwellTime: action.dwellMs != null
            ? (s.hesitationDwellTime === 0 ? action.dwellMs : Math.round((s.hesitationDwellTime + action.dwellMs) / 2))
            : s.hesitationDwellTime,
        })),
      };

    case 'ADD_SESSION':
      return { ...state, analyzedSessions: [action.session, ...state.analyzedSessions] };

    case 'TOGGLE_PIN_SENTENCE': {
      const exists = state.audioPlaylist.includes(action.sentenceId);
      return {
        ...state,
        audioPlaylist: exists
          ? state.audioPlaylist.filter(id => id !== action.sentenceId)
          : [...state.audioPlaylist, action.sentenceId],
      };
    }

    case 'SET_PLAYLIST_PLAYING':
      return { ...state, isPlaylistPlaying: action.playing };

    case 'SET_PLAYLIST_LOOP_MODE':
      return { ...state, playlistLoopMode: action.loop };

    case 'SET_PLAYLIST_SPEAK_ENGLISH':
      return { ...state, playlistSpeakEnglish: action.speak };

    case 'CLEAR_PLAYLIST':
      return { ...state, audioPlaylist: [], isPlaylistPlaying: false };

    default:
      return state;
  }
}

// ── Mastery helpers ───────────────────────────────────────────────────────────

export function getCollectionMasteryPct(collection: Collection): number {
  const all = collection.dialogues.flatMap(d => d.sentences);
  if (all.length === 0) return 0;
  return Math.round((all.filter(s => s.stars >= 4).length / all.length) * 100);
}

export function isCollectionUnlocked(collections: Collection[], index: number): boolean {
  if (index === 0) return true;
  return getCollectionMasteryPct(collections[index - 1]) >= 80;
}

export function getDialogueMasteryPct(dialogue: Dialogue): number {
  if (dialogue.sentences.length === 0) return 0;
  return Math.round((dialogue.sentences.filter(s => s.stars >= 4).length / dialogue.sentences.length) * 100);
}

// ── Context ───────────────────────────────────────────────────────────────────

interface ContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  getPhase: (phaseId: PhaseId) => Phase | undefined;
  getBridge: (phaseId: PhaseId, bridgeId: string) => Bridge | undefined;
  getMasteredCount: (phaseId: PhaseId) => number;
  getTotalBridges: () => number;
  getMasteredTotal: () => number;
  getCollection: (id: string) => Collection | undefined;
  getDialogue: (collectionId: string, dialogueId: string) => Dialogue | undefined;
  getDueBridges: () => Bridge[];
  getPinnedSentences: () => Sentence[];
}

const Ctx = createContext<ContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // Persist on every state change
  useEffect(() => { saveState(state); }, [state]);

  // Apply theme to <html> data-theme attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', state.theme);
    }
  }, [state.theme]);

  const getPhase = (phaseId: PhaseId) => state.phases.find(p => p.id === phaseId);
  const getBridge = (phaseId: PhaseId, bridgeId: string) => state.phases.find(p => p.id === phaseId)?.bridges.find(b => b.id === bridgeId);
  const getMasteredCount = (phaseId: PhaseId) => state.phases.find(p => p.id === phaseId)?.bridges.filter(b => b.mastery === 'mastered').length ?? 0;
  const getTotalBridges = () => state.phases.reduce((a, p) => a + p.bridges.length, 0);
  const getMasteredTotal = () => state.phases.flatMap(p => p.bridges).filter(b => b.mastery === 'mastered').length;
  const getCollection = (id: string) => state.collections.find(c => c.id === id);
  const getDialogue = (collectionId: string, dialogueId: string) =>
    state.collections.find(c => c.id === collectionId)?.dialogues.find(d => d.id === dialogueId);
  const getDueBridges = () => {
    const now = Date.now();
    return state.phases.flatMap(p => p.bridges.filter(b => b.mastery !== 'locked' && (b.nextReviewAt === 0 || b.nextReviewAt <= now)));
  };
  const getPinnedSentences = () => {
    const allSentences = state.collections.flatMap(c => c.dialogues.flatMap(d => d.sentences));
    return (state.audioPlaylist || []).map(id => allSentences.find(s => s.id === id)).filter((s): s is Sentence => s !== undefined);
  };

  return (
    <Ctx.Provider value={{ state, dispatch, getPhase, getBridge, getMasteredCount, getTotalBridges, getMasteredTotal, getCollection, getDialogue, getDueBridges, getPinnedSentences }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
