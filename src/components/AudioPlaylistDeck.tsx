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

  if (sentences.length === 0) return null;

  const currentSentence = sentences[currentIndex];

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      width: expanded ? 320 : 64,
      height: expanded ? 400 : 64,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: expanded ? 24 : 32,
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Minimized View */}
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          style={{ width: '100%', height: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}
        >
          {isPlaying ? (trackState === 'pause' ? '⏳' : '🔊') : '🎵'}
        </button>
      ) : (
        /* Expanded View */
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Audio Deck</div>
            <button onClick={() => setExpanded(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>⤵</button>
          </div>

          {/* Now Playing Area */}
          <div style={{ padding: 20, textAlign: 'center', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: 8 }}>
              {trackState === 'french' && '▶ Playing Target'}
              {trackState === 'pause' && '⏳ Shadow Now'}
              {trackState === 'english' && '▶ Translation'}
              {trackState === 'idle' && 'Paused'}
            </div>
            
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: trackState === 'french' ? 'var(--p2)' : 'var(--text-primary)', transition: 'color .2s' }}>
              {currentSentence?.text || 'No track'}
            </div>
            
            <div style={{ fontSize: 14, color: trackState === 'english' ? 'var(--p1)' : 'var(--text-muted)', fontStyle: 'italic', transition: 'color .2s' }}>
              {currentSentence?.translation || ''}
            </div>
          </div>

          {/* Controls */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <button
              onClick={() => setCurrentIndex(i => i > 0 ? i - 1 : sentences.length - 1)}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-secondary)' }}
            >⏮</button>
            
            <button
              onClick={() => dispatch({ type: 'SET_PLAYLIST_PLAYING', playing: !isPlaying })}
              style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--p2)', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            
            <button
              onClick={() => setCurrentIndex(i => i < sentences.length - 1 ? i + 1 : 0)}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-secondary)' }}
            >⏭</button>
          </div>

          {/* Playlist Queue */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 8, background: 'var(--bg-base)' }}>
            {sentences.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  background: idx === currentIndex ? 'var(--bg-card)' : 'transparent',
                  border: idx === currentIndex ? '1px solid var(--border)' : '1px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 4
                }}
              >
                <div style={{ fontSize: 13, fontWeight: idx === currentIndex ? 700 : 500, color: idx === currentIndex ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.text}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'TOGGLE_PIN_SENTENCE', sentenceId: s.id }); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 14 }}
                >✖</button>
              </div>
            ))}
          </div>
          
          {/* Footer actions */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => dispatch({ type: 'SET_PLAYLIST_LOOP_MODE', loop: !loopMode })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: loopMode ? 1 : 0.4 }}
                title="Toggle Loop"
              >🔁</button>
              <button
                onClick={() => dispatch({ type: 'SET_PLAYLIST_SPEAK_ENGLISH', speak: !speakEnglish })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: speakEnglish ? 1 : 0.4 }}
                title="Toggle English Translation Audio"
              >🇬🇧</button>
            </div>
            
            <button
              onClick={() => dispatch({ type: 'CLEAR_PLAYLIST' })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}
            >Clear All</button>
          </div>

        </div>
      )}
    </div>
  );
}
