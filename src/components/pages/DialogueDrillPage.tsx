'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Sentence } from '@/lib/data';
import { speak } from '@/lib/audioUtils';

interface DialogueDrillPageProps {
  collectionId: string;
  dialogueId: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

type DrillMode = 'study' | 'quiz';

// ── Sub-components ────────────────────────────────────────────────────────────

function TTSButton({ text, lang, onAudioClick, size = 'md' }: {
  text: string; lang: string;
  onAudioClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [playing, setPlaying] = useState(false);
  const dim = size === 'lg' ? 44 : size === 'md' ? 34 : 28;
  const iconSize = size === 'lg' ? 18 : size === 'md' ? 15 : 12;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaying(true);
    speak(text, lang);
    onAudioClick?.();
    setTimeout(() => setPlaying(false), 2500);
  }, [text, lang, onAudioClick]);

  return (
    <button
      onClick={handleClick}
      title="Listen to pronunciation"
      style={{
        width: dim, height: dim, borderRadius: size === 'lg' ? 12 : 8,
        background: playing ? 'rgba(37,99,235,0.1)' : 'var(--bg-surface)',
        border: `1px solid ${playing ? 'var(--p2-border)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0, fontSize: iconSize,
        transition: 'all .15s',
        animation: playing ? 'tts-pulse 0.8s ease-in-out infinite alternate' : 'none',
      }}
    >
      {playing ? '🔉' : '🔊'}
    </button>
  );
}

function StarRating({ value, onChange, disabled }: {
  value: number; onChange: (n: number) => void; disabled: boolean;
}) {
  const [hover, setHover] = useState(0);
  const labels = ['', 'Forgot', 'Hard', 'OK', 'Good', 'Perfect'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 6 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <span
            key={n}
            onMouseEnter={() => !disabled && setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => !disabled && onChange(n)}
            style={{
              fontSize: 26,
              cursor: disabled ? 'not-allowed' : 'pointer',
              color: (hover || value) >= n ? '#fbbf24' : 'var(--border-strong)',
              transition: 'color .1s, transform .1s',
              transform: !disabled && hover === n ? 'scale(1.25)' : 'scale(1)',
              userSelect: 'none',
              opacity: disabled ? 0.4 : 1,
            }}
          >★</span>
        ))}
      </div>
      {!disabled && (hover > 0 || value > 0) && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
          {labels[hover || value]}
        </div>
      )}
      {disabled && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
          Study the sentence for 2 seconds first
        </div>
      )}
    </div>
  );
}

// ── Mode Tabs ─────────────────────────────────────────────────────────────────

function ModeTabs({ mode, onSwitch }: { mode: DrillMode; onSwitch: (m: DrillMode) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 4 }}>
      {(['study', 'quiz'] as DrillMode[]).map(m => (
        <button
          key={m}
          onClick={() => onSwitch(m)}
          style={{
            flex: 1,
            padding: '7px 14px',
            borderRadius: 8,
            border: 'none',
            background: mode === m ? 'var(--bg-card)' : 'transparent',
            boxShadow: mode === m ? 'var(--shadow-card)' : 'none',
            color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: mode === m ? 700 : 500,
            cursor: 'pointer',
            transition: 'all .15s',
          }}
        >
          {m === 'study' ? '📖 Study' : '🧠 Quiz'}
        </button>
      ))}
    </div>
  );
}

// ── Study Card ────────────────────────────────────────────────────────────────

function StudyCard({ sentence, lang, collectionColor, onAudioClick, isPinned, onTogglePin }: {
  sentence: Sentence; lang: string; collectionColor: string;
  onAudioClick: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '36px 40px',
      boxShadow: 'var(--shadow-card)',
    }}>
      {/* Mode label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: collectionColor, fontFamily: 'JetBrains Mono, monospace', background: collectionColor + '10', border: `1px solid ${collectionColor}20`, padding: '3px 10px', borderRadius: 20 }}>
          Listen & Repeat
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onTogglePin}
            style={{ width: 44, height: 44, borderRadius: 12, background: isPinned ? 'var(--p2-dim)' : 'var(--bg-surface)', border: `1px solid ${isPinned ? 'var(--p2)' : 'var(--border)'}`, fontSize: 18, cursor: 'pointer', transition: 'all .15s', opacity: isPinned ? 1 : 0.6, color: isPinned ? 'var(--p2)' : 'inherit' }}
            title={isPinned ? 'Remove from Audio Deck' : 'Add to Audio Deck'}
          >
            🎧
          </button>
          <TTSButton text={sentence.text} lang={lang} onAudioClick={onAudioClick} size="lg" />
        </div>
      </div>

      {/* French text — large and central */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25, letterSpacing: '-0.4px', marginBottom: 10 }}>
          {sentence.text}
        </div>
        {sentence.phonetic && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 14 }}>
            /{sentence.phonetic}/
          </div>
        )}
      </div>

      {/* Translation — always visible in Study mode */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 6 }}>Translation</div>
        <div style={{ fontSize: 20, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
          {sentence.translation}
        </div>
      </div>

      {/* Shadow prompt */}
      <div style={{ marginTop: 20, padding: '12px 16px', background: collectionColor + '08', border: `1px solid ${collectionColor}15`, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 16 }}>🗣</span>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Shadow:</strong> Press 🔊, listen, then say the sentence aloud simultaneously with the audio. Repeat until it feels natural.
        </div>
      </div>
    </div>
  );
}

// ── Quiz Card ─────────────────────────────────────────────────────────────────

function QuizCard({ sentence, lang, collectionColor, onAudioClick, onRate, onReveal, isPinned, onTogglePin }: {
  sentence: Sentence; lang: string; collectionColor: string;
  onAudioClick: () => void;
  onRate: (stars: number) => void;
  onReveal: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [ratingEnabled, setRatingEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const renderTime = useRef(Date.now());

  // Reset when sentence changes
  useEffect(() => {
    setRevealed(false);
    setRatingEnabled(false);
    setTimeLeft(0);
    renderTime.current = Date.now();
  }, [sentence.id]);

  // 2-second anti-spam timer after reveal
  useEffect(() => {
    if (!revealed) return;
    setTimeLeft(2);
    setRatingEnabled(false);
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); setRatingEnabled(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [revealed, sentence.id]);

  const handleReveal = () => {
    if (revealed) return;
    const dwellMs = Date.now() - renderTime.current;
    onReveal();
    setRevealed(true);
  };

  const handleRate = (stars: number) => {
    if (!ratingEnabled) return;
    onRate(stars);
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '36px 40px',
      boxShadow: 'var(--shadow-card)',
    }}>
      {/* Mode label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: 'var(--p2)', fontFamily: 'JetBrains Mono, monospace', background: 'var(--p2-dim)', border: '1px solid var(--p2-border)', padding: '3px 10px', borderRadius: 20 }}>
          Active Recall
        </span>
        <div style={{ display: 'flex', gap: 8, opacity: revealed ? 1 : 0, transition: 'opacity .2s', pointerEvents: revealed ? 'auto' : 'none' }}>
          <button
            onClick={onTogglePin}
            style={{ width: 34, height: 34, borderRadius: 8, background: isPinned ? 'var(--p2-dim)' : 'var(--bg-surface)', border: `1px solid ${isPinned ? 'var(--p2)' : 'var(--border)'}`, fontSize: 14, cursor: 'pointer', transition: 'all .15s', opacity: isPinned ? 1 : 0.6, color: isPinned ? 'var(--p2)' : 'inherit' }}
            title={isPinned ? 'Remove from Audio Deck' : 'Add to Audio Deck'}
          >
            🎧
          </button>
          <TTSButton text={sentence.text} lang={lang} onAudioClick={onAudioClick} size="md" />
        </div>
      </div>

      {/* French text */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25, letterSpacing: '-0.4px', marginBottom: 10 }}>
          {sentence.text}
        </div>
        {sentence.phonetic && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>
            /{sentence.phonetic}/
          </div>
        )}
      </div>

      {/* Recall area */}
      {!revealed ? (
        <button
          onClick={handleReveal}
          style={{
            width: '100%',
            background: 'var(--p2-dim)',
            border: '1px solid var(--p2-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            fontSize: 14, fontWeight: 700,
            color: 'var(--p2)',
            cursor: 'pointer',
            transition: 'background .15s',
          }}
        >
          👁 Recall &amp; Reveal Translation
        </button>
      ) : (
        <div className="slide-right">
          {/* Translation */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 6 }}>Translation</div>
            <div style={{ fontSize: 20, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>{sentence.translation}</div>
          </div>

          {/* SM-2 next review info */}
          {sentence.nextReviewAt > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 16, display: 'flex', gap: 6 }}>
              <span>⏱</span>
              <span>
                {sentence.nextReviewAt <= Date.now()
                  ? 'Due for review now'
                  : `Next review in ${Math.ceil((sentence.nextReviewAt - Date.now()) / 86400000)}d`}
                {' · '}EF {sentence.easeFactor.toFixed(2)}
              </span>
            </div>
          )}

          {/* Rating */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 12 }}>
              {ratingEnabled ? 'How well did you recall it?' : `Rating unlocks in ${timeLeft}s…`}
            </div>
            <StarRating value={sentence.stars} onChange={handleRate} disabled={!ratingEnabled} />
          </div>

          {/* Anti-spam timer visual */}
          {!ratingEnabled && (
            <div style={{ height: 3, background: 'var(--bg-progress-track)', borderRadius: 2, overflow: 'hidden', marginTop: 12 }}>
              <div style={{
                height: '100%',
                width: `${(1 - timeLeft / 2) * 100}%`,
                background: 'var(--p2)',
                borderRadius: 2,
                transition: 'width 1s linear',
              }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DialogueDrillPage({ collectionId, dialogueId, onNavigate }: DialogueDrillPageProps) {
  const { state, dispatch } = useApp();
  const collection = state.collections.find(c => c.id === collectionId);
  const dialogue = collection?.dialogues.find(d => d.id === dialogueId);

  const [mode, setMode] = useState<DrillMode>('study');
  const [sentenceIdx, setSentenceIdx] = useState(0);

  if (!collection || !dialogue) {
    return (
      <div className="page-root" style={{ textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🗺</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: 'var(--text-primary)' }}>Dialogue not found</div>
        <button onClick={() => onNavigate('home')} style={{ color: 'var(--p2)', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: 'none', border: 'none' }}>← Dashboard</button>
      </div>
    );
  }

  const sentences = dialogue.sentences;
  const sentence = sentences[sentenceIdx];
  const mastered = sentences.filter(s => s.stars >= 4).length;
  const pct = Math.round((mastered / sentences.length) * 100);

  const handleRate = useCallback((stars: number) => {
    dispatch({ type: 'RATE_SENTENCE', collectionId, dialogueId, sentenceId: sentence.id, stars });
  }, [dispatch, collectionId, dialogueId, sentence.id]);

  const handleReveal = useCallback(() => {
    dispatch({ type: 'UPDATE_SENTENCE_TELEMETRY', collectionId, dialogueId, sentenceId: sentence.id });
  }, [dispatch, collectionId, dialogueId, sentence.id]);

  const handleAudioClick = useCallback(() => {
    dispatch({ type: 'UPDATE_SENTENCE_TELEMETRY', collectionId, dialogueId, sentenceId: sentence.id, audioClick: true });
  }, [dispatch, collectionId, dialogueId, sentence.id]);

  const handleNext = useCallback(() => {
    if (sentenceIdx < sentences.length - 1) setSentenceIdx(i => i + 1);
    else onNavigate('collection', { collectionId });
  }, [sentenceIdx, sentences.length, collectionId, onNavigate]);

  const handlePrev = useCallback(() => {
    if (sentenceIdx > 0) setSentenceIdx(i => i - 1);
  }, [sentenceIdx]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '12px 28px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: 'var(--shadow-card)',
      }}>
        <button
          onClick={() => onNavigate('collection', { collectionId })}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--text-secondary)', cursor: 'pointer' }}
        >←</button>

        <span style={{ fontSize: 18 }}>{dialogue.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{dialogue.title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {sentenceIdx + 1} / {sentences.length} · {collection.name}
          </div>
        </div>

        {/* Mode tabs */}
        <ModeTabs mode={mode} onSwitch={m => { setMode(m); setSentenceIdx(0); }} />

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
          <div style={{ flex: 1, height: 5, background: 'var(--bg-progress-track)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((sentenceIdx + 1) / sentences.length) * 100}%`, background: collection.color, borderRadius: 3, transition: 'width .4s' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{pct}% mastered</span>
        </div>
      </div>

      {/* ── Main two-column body ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', overflow: 'hidden' }}>

        {/* Left: card */}
        <div style={{ padding: '36px 40px', overflowY: 'auto' }}>
          {mode === 'study' ? (
            <StudyCard
              sentence={sentence}
              lang={state.currentLang.code}
              collectionColor={collection.color}
              onAudioClick={handleAudioClick}
              isPinned={state.audioPlaylist.includes(sentence.id)}
              onTogglePin={() => dispatch({ type: 'TOGGLE_PIN_SENTENCE', sentenceId: sentence.id })}
            />
          ) : (
            <QuizCard
              key={sentence.id}
              sentence={sentence}
              lang={state.currentLang.code}
              collectionColor={collection.color}
              onAudioClick={handleAudioClick}
              onReveal={handleReveal}
              onRate={handleRate}
              isPinned={state.audioPlaylist.includes(sentence.id)}
              onTogglePin={() => dispatch({ type: 'TOGGLE_PIN_SENTENCE', sentenceId: sentence.id })}
            />
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={handlePrev}
              disabled={sentenceIdx === 0}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '11px 20px',
                fontSize: 13, fontWeight: 600, color: sentenceIdx === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: sentenceIdx === 0 ? 'default' : 'pointer',
                boxShadow: 'var(--shadow-card)',
              }}
            >← Prev</button>

            <button
              onClick={handleNext}
              style={{
                flex: 1,
                background: collection.color + '10',
                border: `1px solid ${collection.color}20`,
                borderRadius: 'var(--radius-md)',
                padding: '11px',
                fontSize: 13, fontWeight: 700,
                color: collection.color,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              {sentenceIdx < sentences.length - 1 ? 'Next →' : 'Finish Dialogue ✓'}
            </button>
          </div>
        </div>

        {/* Right: info panel */}
        <div style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', padding: 20, overflowY: 'auto' }}>

          {/* Sentence index */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 10 }}>
              All Sentences
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {sentences.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSentenceIdx(i)}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: i === sentenceIdx ? `2px solid ${collection.color}` : '1px solid var(--border)',
                    background: s.stars >= 4 ? 'var(--p3-dim)' : s.stars >= 2 ? 'rgba(217,119,6,0.1)' : s.stars > 0 ? 'var(--p2-dim)' : 'var(--bg-surface)',
                    color: i === sentenceIdx ? collection.color : 'var(--text-muted)',
                    fontSize: 10, fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace',
                    cursor: 'pointer',
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Mastery summary */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>Dialogue Progress</div>
            <div style={{ height: 5, background: 'var(--bg-progress-track)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: collection.color, borderRadius: 3, transition: 'width .4s' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{mastered}/{sentences.length} mastered</div>
          </div>

          {/* Mode guide */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: mode === 'study' ? collection.color : 'var(--p2)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
              {mode === 'study' ? '📖 Study Mode' : '🧠 Quiz Mode'}
            </div>
            {mode === 'study' ? [
              { icon: '👁', text: 'Read the French sentence' },
              { icon: '🔊', text: 'Press play and listen carefully' },
              { icon: '🗣', text: 'Say it aloud at the same time (shadowing)' },
              { icon: '↩', text: 'Switch to Quiz when you feel ready' },
            ].map(step => (
              <div key={step.text} style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.4 }}>
                <span style={{ flexShrink: 0 }}>{step.icon}</span>{step.text}
              </div>
            )) : [
              { icon: '👁', text: 'See the French — recall the meaning' },
              { icon: '💬', text: 'Press Reveal when ready' },
              { icon: '⏱', text: 'Rate after 2 seconds (anti-spam)' },
              { icon: '⭐', text: 'Honest rating = accurate SM-2 schedule' },
            ].map(step => (
              <div key={step.text} style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.4 }}>
                <span style={{ flexShrink: 0 }}>{step.icon}</span>{step.text}
              </div>
            ))}
          </div>

          {/* Avg dwell time telemetry */}
          {sentence.hesitationDwellTime > 0 && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>Avg Recall Time</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--p2)', fontFamily: 'JetBrains Mono, monospace' }}>
                {(sentence.hesitationDwellTime / 1000).toFixed(1)}s
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom nav ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 28px',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 12, color: 'var(--text-muted)',
      }}>
        <button onClick={handlePrev} disabled={sentenceIdx === 0} style={{ background: 'none', border: 'none', fontSize: 18, color: sentenceIdx === 0 ? 'var(--text-dim)' : 'var(--text-secondary)', cursor: sentenceIdx === 0 ? 'default' : 'pointer' }}>⏮</button>
        <div>{sentenceIdx + 1} of {sentences.length}</div>
        <button onClick={handleNext} style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--text-secondary)', cursor: 'pointer' }}>⏭</button>
      </div>
    </div>
  );
}
