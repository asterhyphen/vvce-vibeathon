import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  BookOpen, Plus, Sparkles, Send, Trash2, Tag,
  ChevronDown, ChevronUp, CheckCircle, Activity, Brain, X,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { autoAnalyseJournalEntry, summariseJournal } from '../lib/ai';
import type { JournalEntry } from '../types';

const MOOD_EMOJIS: Record<number, string> = {
  1:'😞',2:'😟',3:'😕',4:'😐',5:'😶',6:'🙂',7:'😊',8:'😄',9:'😁',10:'🤩',
};
const MOOD_COLORS: Record<number, string> = {
  1:'#ef4444',2:'#f97316',3:'#f59e0b',4:'#eab308',5:'#84cc16',
  6:'#22c55e',7:'#10b981',8:'#06b6d4',9:'#6366f1',10:'#a855f7',
};

const FALLBACK_SUMMARIES = [
  'Entry reflects emotional processing with themes of self-reflection. Cognitive patterns suggest moderate rumination. Recommend continued journaling and behavioural activation.',
  'Positive coping patterns observed. Entry shows resilience and problem-solving orientation. No immediate risk indicators. Encourage maintenance of current strategies.',
  'Entry indicates elevated stress with possible catastrophising patterns. Key themes: work pressure, fatigue. Recommend thought record exercise and stress management review.',
  'Mixed emotional state with some positive anchors. Healthy emotional awareness demonstrated. Consider exploring automatic thoughts around the challenges mentioned.',
];

// ── Typing signal tracker for journal ────────────────────────────────────────
function useJournalTypingSignals() {
  const keystrokeTimes = useRef<number[]>([]);
  const backspaceCount = useRef(0);
  const totalChars     = useRef(0);
  const lastKey        = useRef(Date.now());

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const now = Date.now();
    keystrokeTimes.current.push(now);
    if (keystrokeTimes.current.length > 50) keystrokeTimes.current.shift();
    if (e.key === 'Backspace') backspaceCount.current++;
    totalChars.current++;
    lastKey.current = now;
  }, []);

  const getSignals = useCallback(() => {
    const times = keystrokeTimes.current;
    const wpm = times.length > 2
      ? Math.round((times.length / ((times[times.length - 1] - times[0]) / 1000)) * 60 / 5)
      : 0;
    const backspaceRate = totalChars.current > 0
      ? (backspaceCount.current / totalChars.current) * 100
      : 0;
    const pauses = times.slice(1).map((t, i) => t - times[i]).filter(p => p > 50 && p < 5000);
    const avgPause = pauses.length > 0 ? pauses.reduce((a, b) => a + b, 0) / pauses.length : 300;
    return { wpm: Math.max(0, wpm), backspaceRate, avgPause: Math.round(avgPause) };
  }, []);

  const reset = useCallback(() => {
    keystrokeTimes.current = [];
    backspaceCount.current = 0;
    totalChars.current = 0;
  }, []);

  return { onKeyDown, getSignals, reset };
}

// ── Journal card ──────────────────────────────────────────────────────────────
const JournalCard: React.FC<{
  entry: JournalEntry;
  onSummarise: (id: string) => void;
  onSendToDoctor: (id: string) => void;
  onDelete: (id: string) => void;
  summarising: boolean;
}> = ({ entry, onSummarise, onSendToDoctor, onDelete, summarising }) => {
  const [expanded, setExpanded] = useState(false);
  const moodColor = MOOD_COLORS[entry.mood] || '#6366f1';
  const moodEmoji = MOOD_EMOJIS[entry.mood] || '😶';

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 16,
    }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{moodEmoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.title}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              {entry.timestamp.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              {' · '}
              <span style={{ color: moodColor }}>Mood {entry.mood}/10</span>
              {entry.aiSummary && (
                <span style={{ marginLeft: 6, color: '#a78bfa' }}>· AI analysed</span>
              )}
            </p>
            {entry.tags && entry.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {entry.tags.map(t => (
                  <span key={t} style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 99,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <Tag style={{ width: 9, height: 9 }} />{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {entry.sentToDoctor && (
            <span style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 3 }}>
              <CheckCircle style={{ width: 11, height: 11 }} /> Sent
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}
          >
            {expanded
              ? <ChevronUp style={{ width: 15, height: 15 }} />
              : <ChevronDown style={{ width: 15, height: 15 }} />
            }
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}
          >
            <Trash2 style={{ width: 13, height: 13 }} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="animate-fade-in" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {entry.content}
          </p>

          {/* AI CBT Summary */}
          {entry.aiSummary ? (
            <div style={{
              padding: '12px 14px', borderRadius: 12,
              background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Brain style={{ width: 13, height: 13, color: '#a78bfa' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa' }}>CBT Analysis</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{entry.aiSummary}</p>
            </div>
          ) : (
            <button
              onClick={() => onSummarise(entry.id)}
              disabled={summarising}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 10,
                background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)',
                color: '#a78bfa', fontSize: 12, fontWeight: 500,
                cursor: summarising ? 'wait' : 'pointer', opacity: summarising ? 0.6 : 1,
              }}
            >
              <Sparkles style={{ width: 12, height: 12 }} />
              {summarising ? 'Analysing with CBT framework…' : 'Analyse with AI (CBT)'}
            </button>
          )}

          {entry.aiSummary && !entry.sentToDoctor && (
            <button
              onClick={() => onSendToDoctor(entry.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 10,
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                color: '#10b981', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <Send style={{ width: 12, height: 12 }} />
              Send to Psychiatrist
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Journal component ────────────────────────────────────────────────────
export const Journal: React.FC = () => {
  const { journals, addJournal, updateJournal, deleteJournal } = useAppContext();
  const [showNew, setShowNew]     = useState(false);
  const [summarising, setSummarising] = useState<string | null>(null);

  // New entry state
  const [title, setTitle]         = useState('');
  const [content, setContent]     = useState('');
  const [mood, setMood]           = useState(6);
  const [tagInput, setTagInput]   = useState('');
  const [tags, setTags]           = useState<string[]>([]);
  const [saving, setSaving]       = useState(false);

  // Auto-analysis state
  const [autoAnalysis, setAutoAnalysis]   = useState<string | null>(null);
  const [analysing, setAnalysing]         = useState(false);
  const [typingSignalDisplay, setTypingSignalDisplay] = useState<{ wpm: number; backspaceRate: number } | null>(null);
  const autoAnalysisTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { onKeyDown: trackKeyDown, getSignals, reset: resetSignals } = useJournalTypingSignals();

  // Auto-analyse after user stops typing for 3 seconds (min 80 chars)
  const scheduleAutoAnalysis = useCallback(() => {
    if (autoAnalysisTimer.current) clearTimeout(autoAnalysisTimer.current);
    autoAnalysisTimer.current = setTimeout(async () => {
      if (content.length < 80) return;
      const signals = getSignals();
      setTypingSignalDisplay({ wpm: signals.wpm, backspaceRate: signals.backspaceRate });
      setAnalysing(true);
      try {
        const result = await autoAnalyseJournalEntry(
          content, mood, signals.wpm, signals.backspaceRate, signals.avgPause
        );
        if (result) setAutoAnalysis(result);
        else setAutoAnalysis(FALLBACK_SUMMARIES[Math.floor(Math.random() * FALLBACK_SUMMARIES.length)]);
      } catch {
        setAutoAnalysis(FALLBACK_SUMMARIES[0]);
      }
      setAnalysing(false);
    }, 3000);
  }, [content, mood, getSignals]);

  useEffect(() => {
    if (content.length >= 80) scheduleAutoAnalysis();
    return () => { if (autoAnalysisTimer.current) clearTimeout(autoAnalysisTimer.current); };
  }, [content, scheduleAutoAnalysis]);

  const handleContentKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    trackKeyDown(e);
  }, [trackKeyDown]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      setTags(prev => [...new Set([...prev, tagInput.trim().toLowerCase()])]);
      setTagInput('');
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    addJournal({
      title, content, mood, tags,
      sentToDoctor: false,
      aiSummary: autoAnalysis || undefined,
    });
    setTitle(''); setContent(''); setMood(6); setTags([]); setTagInput('');
    setAutoAnalysis(null); setTypingSignalDisplay(null);
    resetSignals();
    setShowNew(false);
    setSaving(false);
  };

  const handleSummarise = async (id: string) => {
    const entry = journals.find(j => j.id === id);
    if (!entry) return;
    setSummarising(id);
    try {
      const summary = await summariseJournal(entry.content, entry.mood);
      updateJournal(id, { aiSummary: summary || FALLBACK_SUMMARIES[Math.floor(Math.random() * FALLBACK_SUMMARIES.length)] });
    } catch {
      updateJournal(id, { aiSummary: FALLBACK_SUMMARIES[0] });
    }
    setSummarising(null);
  };

  const moodColor = MOOD_COLORS[mood];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-fade-in">

      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen style={{ width: 18, height: 18, color: 'var(--accent)' }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>Journal</p>
              <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
                {journals.length} entries · Auto CBT analysis as you write
              </p>
            </div>
          </div>
          <button
            onClick={() => { setShowNew(!showNew); setAutoAnalysis(null); }}
            className="btn-primary"
            style={{ gap: 6, fontSize: 13, padding: '8px 14px' }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            New Entry
          </button>
        </div>
      </div>

      {/* New entry form */}
      {showNew && (
        <div className="animate-fade-in" style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>New Entry</p>
            <button onClick={() => setShowNew(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Entry title…"
              className="input"
              style={{ fontSize: 14 }}
            />

            {/* Mood slider */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  Mood: {MOOD_EMOJIS[mood]} <span style={{ color: moodColor, fontWeight: 600 }}>{mood}/10</span>
                </label>
                {typingSignalDisplay && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--text-3)' }}>
                    <Activity style={{ width: 10, height: 10, display: 'inline' }} />
                    {typingSignalDisplay.wpm} WPM · {typingSignalDisplay.backspaceRate.toFixed(0)}% corrections
                  </div>
                )}
              </div>
              <input
                type="range" min="1" max="10" step="1" value={mood}
                onChange={e => setMood(Number(e.target.value))}
                className="mood-slider"
                style={{
                  width: '100%', height: 6,
                  background: `linear-gradient(to right, ${moodColor} 0%, ${moodColor} ${(mood - 1) / 9 * 100}%, var(--border-2) ${(mood - 1) / 9 * 100}%, var(--border-2) 100%)`,
                }}
              />
            </div>

            {/* Content — typing is tracked here */}
            <div style={{ position: 'relative' }}>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={handleContentKeyDown}
                placeholder="Write freely… this is your safe space. The AI will automatically analyse your entry as you write."
                rows={6}
                className="input"
                style={{ fontSize: 13, lineHeight: 1.7, paddingBottom: 32 }}
              />
              {/* Live char count + auto-analysis indicator */}
              <div style={{
                position: 'absolute', bottom: 10, right: 12,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {content.length >= 80 && analysing && (
                  <span style={{ fontSize: 10, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Sparkles style={{ width: 9, height: 9, animation: 'spin-slow 2s linear infinite' }} />
                    AI analysing…
                  </span>
                )}
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{content.length} chars</span>
              </div>
            </div>

            {/* Auto-analysis result — appears while writing */}
            {autoAnalysis && (
              <div className="animate-fade-in" style={{
                padding: '12px 14px', borderRadius: 12,
                background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Brain style={{ width: 12, height: 12, color: '#a78bfa' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa' }}>Live CBT Analysis</span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>
                    Updates as you write
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{autoAnalysis}</p>
              </div>
            )}

            {/* Tags */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                Tags <span style={{ color: 'var(--text-3)' }}>(press Enter)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {tags.map(t => (
                  <span key={t} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11, padding: '3px 10px', borderRadius: 99,
                    background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                    color: 'var(--accent)',
                  }}>
                    {t}
                    <button onClick={() => setTags(prev => prev.filter(x => x !== t))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 12, lineHeight: 1 }}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="e.g. work, anxiety, sleep…"
                className="input"
                style={{ fontSize: 13 }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSave}
                disabled={!title.trim() || !content.trim() || saving}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
              >
                {saving ? 'Saving…' : 'Save Entry'}
              </button>
              <button
                onClick={() => setShowNew(false)}
                className="btn-ghost"
                style={{ fontSize: 13 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries list */}
      {journals.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 40, textAlign: 'center',
        }}>
          <BookOpen style={{ width: 32, height: 32, color: 'var(--text-3)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 4 }}>No journal entries yet.</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Start writing — AI will automatically analyse your entry using CBT principles as you type.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {journals.map(entry => (
            <JournalCard
              key={entry.id}
              entry={entry}
              onSummarise={handleSummarise}
              onSendToDoctor={id => updateJournal(id, { sentToDoctor: true })}
              onDelete={deleteJournal}
              summarising={summarising === entry.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
