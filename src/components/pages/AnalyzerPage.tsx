'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DEMO_SESSION, ConversationSession } from '@/lib/data';

interface AnalyzerPageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

type AnalysisTab = 'transcript' | 'bridges' | 'pacing';

export default function AnalyzerPage({ onNavigate }: AnalyzerPageProps) {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<AnalysisTab>('transcript');
  const [activeSession] = useState<ConversationSession>(DEMO_SESSION);
  const [isDragging, setIsDragging] = useState(false);

  const session = activeSession;

  return (
    <div className="page-root">
      <div className="page-header fade-up">
        <div className="page-header-eyebrow mono">Power Feature · AI Analysis</div>
        <h1>Conversation Analyzer</h1>
        <p>
          Upload or record a real-world interaction. The AI will transcribe it,
          identify missed bridge opportunities, and grade your structural fluency.
        </p>
      </div>

      {/* Upload zone */}
      <div
        className={`upload-zone fade-up`}
        style={{ borderColor: isDragging ? 'rgba(139,92,246,0.7)' : undefined }}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); }}
      >
        <div className="upload-zone-icon">◉</div>
        <div className="upload-zone-title">Drop audio or video here</div>
        <div className="upload-zone-sub" style={{ marginBottom: 16 }}>MP3, MP4, M4A, WAV — or record directly in browser</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={{
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.35)',
            color: '#a78bfa',
            borderRadius: 'var(--radius-md)',
            padding: '10px 20px',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            📁 Browse Files
          </button>
          <button style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
            borderRadius: 'var(--radius-md)',
            padding: '10px 20px',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            🎙️ Record Now
          </button>
        </div>
      </div>

      {/* Demo result label */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '14px 18px',
      }}>
        <div style={{ fontSize: 18 }}>☕</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{session.title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {session.location} · {session.duration}s · Analyzed {new Date(session.analyzedAt).toLocaleDateString()}
          </div>
        </div>
        <span style={{
          background: 'rgba(16,185,129,0.12)',
          color: 'var(--p3-light)',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 20, padding: '4px 12px',
          fontSize: 10, fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase',
        }}>Demo Result</span>
      </div>

      {/* Summary bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24,
      }}>
        {[
          { label: 'Bridge Misses', value: session.bridgeMisses.length, color: 'var(--p1-light)', bg: 'var(--p1-dim)', icon: '⚠' },
          { label: 'Pacing Score',  value: `${session.pacingScore}/100`,  color: 'var(--p2-light)', bg: 'var(--p2-dim)', icon: '⏱' },
          { label: 'Pronunciation Notes', value: session.pronunciationNotes.length, color: 'var(--p3-light)', bg: 'var(--p3-dim)', icon: '🎙️' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 24, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Analysis tabs */}
      <div className="analysis-tabs">
        {([['transcript','Transcript'],['bridges','Bridge Grading'],['pacing','Pacing & Pronunciation']] as [AnalysisTab,string][]).map(([id,label]) => (
          <button
            key={id}
            className={`analysis-tab${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Transcript tab */}
      {activeTab === 'transcript' && (
        <div className="fade-up">
          {session.transcript.map(line => (
            <div key={line.id} className="transcript-line">
              <div className={`transcript-speaker ${line.speaker}`}>
                {line.speaker === 'user' ? state.currentLang.name.slice(0,2).toUpperCase() : 'NAT'}
              </div>
              <div>
                <div className="transcript-text">{line.text}</div>
                {line.translation && <div className="transcript-translation">{line.translation}</div>}
                {line.missedBridgeId && (
                  <div
                    className="transcript-miss-flag"
                    onClick={() => setActiveTab('bridges')}
                  >
                    ⚠ Missed bridge opportunity → see grading
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bridge grading tab */}
      {activeTab === 'bridges' && (
        <div className="fade-up">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
              {session.bridgeMisses.length} Missed Bridge Opportunities
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              These are moments where a Phase 1, 2, or 3 bridge would have elevated your conversational fluency or maintained your control of the interaction.
            </p>
          </div>

          {session.bridgeMisses.map(miss => {
            const bridge = miss.suggestedBridge;
            return (
              <div key={miss.id} className="bridge-miss-card">
                <div className="bridge-miss-top">
                  <span style={{ fontSize: 16 }}>⚠</span>
                  <span className="bridge-miss-label">Missed Opportunity</span>
                </div>
                <div className="bridge-miss-desc">{miss.description}</div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 6 }}>
                    Suggested Bridge
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)', marginBottom: 3 }}>{bridge.phrase}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{bridge.translation}</div>
                </div>

                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--p3-light)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 6 }}>
                  Improved Response
                </div>
                <div className="bridge-miss-improved">{miss.improvedSentence}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pacing tab */}
      {activeTab === 'pacing' && (
        <div className="fade-up">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Pacing Score</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
              <div className="pacing-score-num" style={{
                color: session.pacingScore >= 75 ? 'var(--p3-light)' : session.pacingScore >= 50 ? 'var(--p1-light)' : '#ef4444',
              }}>
                {session.pacingScore}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{
                    height: '100%',
                    width: `${session.pacingScore}%`,
                    background: session.pacingScore >= 75 ? 'var(--p3)' : session.pacingScore >= 50 ? 'var(--p1)' : '#ef4444',
                    borderRadius: 4,
                    transition: 'width .8s ease',
                  }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {session.pacingScore >= 75 ? 'Good pacing — natural conversational rhythm.' :
                   session.pacingScore >= 50 ? 'Moderate — some hesitation affecting flow.' :
                   'Needs work — significant pauses disrupting interaction.'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Pronunciation Notes</div>
            {session.pronunciationNotes.map((note, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '12px 0',
                borderBottom: i < session.pronunciationNotes.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🎙️</span>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
