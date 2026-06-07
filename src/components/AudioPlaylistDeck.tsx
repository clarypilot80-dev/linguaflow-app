'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { speak, stopSpeech } from '@/lib/audioUtils';

export default function AudioPlaylistDeck() {
  const { state, dispatch, getPinnedSentences } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trackState, setTrackState] = useState<'idle' | 'french' | 'pause' | 'english'>('idle');

  const sentences = getPinnedSentences();
  const isPlaying = state.isPlaylistPlaying;
  const loopMode = state.playlistLoopMode;
  const speakEnglish = state.playlistSpeakEnglish;

  // Refs to handle async state without closures going stale
  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;
  const sentencesRef = useRef(sentences);
  sentencesRef.current = sentences;

  // Reset index if out of bounds
  useEffect(() => {
    if (currentIndex >= sentences.length && sentences.length > 0) {
      setCurrentIndex(0);
    }
    if (sentences.length === 0) {
      setExpanded(false);
    }
  }, [sentences.length, currentIndex]);

  // Main playback loop engine
  useEffect(() => {
    if (!isPlaying || sentencesRef.current.length === 0) {
      setTrackState('idle');
      stopSpeech();
      return;
    }

    let cancelled = false;

    async function playSequence() {
      while (playingRef.current && !cancelled && sentencesRef.current.length > 0) {
        const sentence = sentencesRef.current[indexRef.current];
        if (!sentence) break;

        // 1. Play French
        setTrackState('french');
        await speak(sentence.text, state.currentLang.code);
        if (!playingRef.current || cancelled) break;

        // 2. Pause 2.5s
        setTrackState('pause');
        await new Promise(r => setTimeout(r, 2500));
        if (!playingRef.current || cancelled) break;

        // 3. Play English
        setTrackState('english');
        if (state.playlistSpeakEnglish) {
          await speak(sentence.translation, 'en');
        } else {
          await new Promise(r => setTimeout(r, 2500));
        }
        if (!playingRef.current || cancelled) break;

        // 4. Advance
        if (indexRef.current < sentencesRef.current.length - 1) {
          setCurrentIndex(i => i + 1);
        } else if (state.playlistLoopMode) {
          setCurrentIndex(0);
        } else {
          dispatch({ type: 'SET_PLAYLIST_PLAYING', playing: false });
          break;
        }
      }
    }

    playSequence();

    return () => {
      cancelled = true;
      stopSpeech();
      setTrackState('idle');
    };
  }, [isPlaying, state.currentLang.code, state.playlistLoopMode, dispatch]);

  const currentSentence = sentences[currentIndex];

  if (!expanded) {
    return (
      <div 
        className="fixed bottom-[72px] md:bottom-0 left-0 md:left-64 right-0 bg-slate-800/90 backdrop-blur-md border-t border-slate-700 p-3 flex items-center justify-center text-sm font-medium z-40 text-white cursor-pointer hover:bg-slate-700 transition-colors"
        onClick={() => sentences.length > 0 && setExpanded(true)}
      >
        <span className="text-xl mr-3">🎧</span>
        <span className="truncate">
          {sentences.length === 0 ? "Audio Deck: Empty. Click 🎧 to build loop." : `${sentences.length} Phrases Ready ${isPlaying ? '▶ Playing' : ''}`}
        </span>
        {sentences.length > 0 && (
          <span className="ml-4 text-[var(--p2)] font-bold uppercase tracking-wider text-[11px]">Expand</span>
        )}
      </div>
    );
  }

  return (
    <div className="fixed z-[1000] flex flex-col overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:bottom-6 md:right-6 md:w-[320px] md:h-[400px] md:rounded-[24px] bottom-[calc(env(safe-area-inset-bottom)+96px)] left-3 right-3 max-h-[50vh] rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
      {/* Expanded View */}
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface)]">
            <div className="font-bold text-sm">Audio Deck</div>
            <button onClick={() => setExpanded(false)} className="w-10 h-10 -mr-2 flex items-center justify-center text-base bg-transparent border-none cursor-pointer">⤵</button>
          </div>

          {/* Now Playing Area */}
          <div className="p-5 text-center border-b border-[var(--border)] bg-[var(--bg-card)] shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              {trackState === 'french' && '▶ Playing Target'}
              {trackState === 'pause' && '⏳ Shadow Now'}
              {trackState === 'english' && '▶ Translation'}
              {trackState === 'idle' && 'Paused'}
            </div>
            
            <div className="text-lg font-extrabold mb-2 transition-colors duration-200 truncate px-2" style={{ color: trackState === 'french' ? 'var(--p2)' : 'var(--text-primary)' }}>
              {currentSentence?.text || 'No track'}
            </div>
            
            <div className="text-sm italic transition-colors duration-200 truncate px-2" style={{ color: trackState === 'english' ? 'var(--p1)' : 'var(--text-muted)' }}>
              {currentSentence?.translation || ''}
            </div>
          </div>

          {/* Controls */}
          <div className="px-5 py-4 flex items-center justify-around shrink-0">
            <button
              onClick={() => setCurrentIndex(i => i > 0 ? i - 1 : sentences.length - 1)}
              className="w-12 h-12 flex items-center justify-center text-xl cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >⏮</button>
            
            <button
              onClick={() => dispatch({ type: 'SET_PLAYLIST_PLAYING', playing: !isPlaying })}
              className="w-14 h-14 rounded-full bg-[var(--p2)] border-none text-white text-xl cursor-pointer flex items-center justify-center shadow-md hover:scale-105 transition-transform"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            
            <button
              onClick={() => setCurrentIndex(i => i < sentences.length - 1 ? i + 1 : 0)}
              className="w-12 h-12 flex items-center justify-center text-xl cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >⏭</button>
          </div>

          {/* Playlist Queue */}
          <div className="flex-1 overflow-y-auto p-2 bg-[var(--bg-base)]">
            {sentences.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => setCurrentIndex(idx)}
                className={`
                  px-3 py-2.5 rounded-lg cursor-pointer flex items-center justify-between mb-1
                  ${idx === currentIndex ? 'bg-[var(--bg-card)] border border-[var(--border)]' : 'border border-transparent'}
                `}
              >
                <div className={`text-[13px] whitespace-nowrap overflow-hidden text-ellipsis ${idx === currentIndex ? 'font-bold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}>
                  {s.text}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'TOGGLE_PIN_SENTENCE', sentenceId: s.id }); }}
                  className="w-8 h-8 flex items-center justify-center -mr-2 bg-transparent border-none cursor-pointer text-[var(--text-dim)] text-sm"
                >✖</button>
              </div>
            ))}
          </div>
          
          {/* Footer actions */}
          <div className="px-5 py-3 border-t border-[var(--border)] flex justify-between items-center bg-[var(--bg-surface)] shrink-0">
            <div className="flex gap-1">
              <button
                onClick={() => dispatch({ type: 'SET_PLAYLIST_LOOP_MODE', loop: !loopMode })}
                className={`w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer text-base ${loopMode ? 'opacity-100' : 'opacity-40'}`}
                title="Toggle Loop"
              >🔁</button>
              <button
                onClick={() => dispatch({ type: 'SET_PLAYLIST_SPEAK_ENGLISH', speak: !speakEnglish })}
                className={`w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer text-base ${speakEnglish ? 'opacity-100' : 'opacity-40'}`}
                title="Toggle English Translation Audio"
              >🇬🇧</button>
            </div>
            
            <button
              onClick={() => dispatch({ type: 'CLEAR_PLAYLIST' })}
              className="h-10 px-3 flex items-center justify-center bg-transparent border-none cursor-pointer text-xs text-[var(--text-muted)] font-semibold"
            >Clear All</button>
          </div>

        </div>
    </div>
  );
}
