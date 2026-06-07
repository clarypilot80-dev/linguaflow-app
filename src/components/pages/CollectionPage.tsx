'use client';

import React from 'react';
import { useApp, getCollectionMasteryPct, getDialogueMasteryPct } from '@/context/AppContext';
import { Collection, Dialogue } from '@/lib/data';

interface CollectionPageProps {
  collectionId: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

function DialogueCard({ dialogue, collectionColor, onStart, isPinned, onTogglePin }: {
  dialogue: Dialogue; collectionColor: string;
  onStart: () => void;
  isPinned: (id: string) => boolean;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
}) {
  const mastery = getDialogueMasteryPct(dialogue);
  const mastered = dialogue.sentences.filter(s => s.stars >= 4).length;
  const total = dialogue.sentences.length;

  return (
    <div
      onClick={onStart}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '22px 24px',
        cursor: 'pointer',
        transition: 'box-shadow .18s, border-color .18s',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = collectionColor + '40';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: collectionColor + '12',
            border: `1px solid ${collectionColor}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>{dialogue.icon}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{dialogue.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{total} sentences</div>
          </div>
        </div>
        {mastery === 100 ? (
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--p3)', background: 'var(--p3-dim)', border: '1px solid var(--p3-border)', borderRadius: 10, padding: '3px 10px', fontFamily: 'JetBrains Mono, monospace' }}>✓ Done</span>
        ) : mastery > 0 ? (
          <span style={{ fontSize: 10, fontWeight: 700, color: collectionColor, background: collectionColor + '10', border: `1px solid ${collectionColor}22`, borderRadius: 10, padding: '3px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{mastery}%</span>
        ) : null}
      </div>

      {/* Description */}
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 16 }}>{dialogue.description}</div>

      {/* Sentence previews */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {dialogue.sentences.slice(0, 3).map(s => (
          <div key={s.id} style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${s.stars >= 4 ? 'var(--p3-border)' : 'var(--border)'}`,
            borderRadius: 8,
            padding: '7px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.text}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {s.stars >= 4 && <span style={{ fontSize: 10, color: 'var(--p3)' }}>★★★★</span>}
              <button
                onClick={(e) => onTogglePin(s.id, e)}
                style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', opacity: isPinned(s.id) ? 1 : 0.4 }}
                title="Pin to Audio Deck"
              >
                {isPinned(s.id) ? '📌' : '📍'}
              </button>
            </div>
          </div>
        ))}
        {total > 3 && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0' }}>+{total - 3} more sentences</div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--bg-progress-track)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ height: '100%', width: `${mastery}%`, background: collectionColor, borderRadius: 2, transition: 'width .4s' }} />
      </div>

      {/* CTA */}
      <button style={{
        width: '100%',
        background: collectionColor + '10',
        border: `1px solid ${collectionColor}22`,
        borderRadius: 'var(--radius-md)',
        padding: '10px',
        fontSize: 13, fontWeight: 700,
        color: collectionColor,
        cursor: 'pointer',
      }}>
        {mastery === 100 ? '↻ Review' : mastery > 0 ? `Continue — ${mastered}/${total} mastered →` : 'Start Dialogue →'}
      </button>
    </div>
  );
}

export default function CollectionPage({ collectionId, onNavigate }: CollectionPageProps) {
  const { state, dispatch } = useApp();
  const collection = state.collections.find(c => c.id === collectionId);

  if (!collection) {
    return (
      <div className="page-root" style={{ textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🗺</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: 'var(--text-primary)' }}>Collection not found</div>
        <button onClick={() => onNavigate('home')} style={{ color: 'var(--p2)', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: 'none', border: 'none' }}>← Dashboard</button>
      </div>
    );
  }

  const totalSentences = collection.dialogues.flatMap(d => d.sentences).length;
  const mastery = getCollectionMasteryPct(collection);

  return (
    <div className="page-root">
      {/* Back */}
      <button
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
        onClick={() => onNavigate('home')}
      >
        ← Dashboard
      </button>

      {/* Banner */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        marginBottom: 32,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: collection.color, borderRadius: '20px 20px 0 0' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: 4 }}>
          <div style={{ fontSize: 36, lineHeight: 1 }}>{collection.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: collection.color, fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>{collection.subtitle}</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.3px' }}>{collection.name}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 560, marginBottom: 16 }}>{collection.description}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, maxWidth: 280 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{collection.dialogues.length} dialogues · {totalSentences} sentences</span>
                  <span style={{ fontWeight: 700, color: collection.color }}>{mastery}% mastered</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-progress-track)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${mastery}%`, background: collection.color, borderRadius: 3, transition: 'width .4s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unlock notice */}
      {mastery < 80 && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 12, color: 'var(--text-secondary)',
        }}>
          <span>🔒</span>
          <span>Reach <strong>80% mastery</strong> to unlock the next collection. You're at {mastery}% — {Math.ceil(totalSentences * 0.8) - collection.dialogues.flatMap(d => d.sentences).filter(s => s.stars >= 4).length} more sentences to go.</span>
        </div>
      )}

      {/* 2-step method explainer */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        marginBottom: 28,
        display: 'flex', gap: 20, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', alignSelf: 'center', flexShrink: 0 }}>Learning Method</div>
        {[
          { step: '01', label: 'Study', desc: 'See French + Translation + Audio. Read, listen, shadow.', color: collection.color },
          { step: '02', label: 'Quiz', desc: 'French only. Recall the meaning, reveal, rate honestly.', color: collection.color },
          { step: '03', label: 'SM-2', desc: 'Algorithm schedules your next review based on your rating.', color: collection.color },
        ].map(s => (
          <div key={s.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: s.color, flexShrink: 0, paddingTop: 1 }}>{s.step}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 1 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialogue cards */}
      <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.14em', fontFamily: 'JetBrains Mono, monospace', marginBottom: 16 }}>Dialogues</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {collection.dialogues.map(dialogue => (
          <DialogueCard
            key={dialogue.id}
            dialogue={dialogue}
            collectionColor={collection.color}
            onStart={() => onNavigate('dialogue', { collectionId: collection.id, dialogueId: dialogue.id })}
            isPinned={(id) => state.audioPlaylist.includes(id)}
            onTogglePin={(id, e) => {
              e.stopPropagation();
              dispatch({ type: 'TOGGLE_PIN_SENTENCE', sentenceId: id });
            }}
          />
        ))}
      </div>
    </div>
  );
}
