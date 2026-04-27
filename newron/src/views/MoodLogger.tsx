import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Smile, TrendingUp, Calendar, Brain, Send, Bot, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getActiveProvider, CBT_MOCK_MOOD_QUESTIONS, aiChat, CBT_MOOD_ASSESSMENT_SYSTEM } from '../lib/ai';
import { useAuth } from '../context/AuthContext';
import type { MoodEntry } from '../types';

const MOOD_CONFIG: Record<number, { label: string; color: string; bg: string; emoji: string }> = {
  1:  { label: 'Terrible',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   emoji: '😣' },
  2:  { label: 'Very Bad',  color: '#f97316', bg: 'rgba(249,115,22,0.12)',  emoji: '😢' },
  3:  { label: 'Bad',       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  emoji: '😞' },
  4:  { label: 'Low',       color: '#eab308', bg: 'rgba(234,179,8,0.12)',   emoji: '😔' },
  5:  { label: 'Neutral',   color: '#84cc16', bg: 'rgba(132,204,22,0.12)',  emoji: '😐' },
  6:  { label: 'Okay',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   emoji: '🙂' },
  7:  { label: 'Good',      color: '#10b981', bg: 'rgba(16,185,129,0.12)',  emoji: '😊' },
  8:  { label: 'Great',     color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   emoji: '😄' },
  9:  { label: 'Excellent', color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  emoji: '🤩' },
  10: { label: 'Amazing',   color: '#a855f7', bg: 'rgba(168,85,247,0.12)',  emoji: '🥳' },
};

interface AssessmentMessage {
  role: 'ai' | 'user';
  content: string;
}

const MoodHistoryItem: React.FC<{ entry: MoodEntry }> = ({ entry }) => {
  const cfg = MOOD_CONFIG[entry.value];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }} className="animate-fade-in">
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: cfg.bg, color: cfg.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700,
      }}>
        {entry.value}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: cfg.color }}>{cfg.label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {entry.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            {' '}
            {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {entry.note && (
          <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.note}
          </p>
        )}
      </div>
    </div>
  );
};

export const MoodLogger: React.FC = () => {
  const { moodLog, addMood } = useAppContext();
  const { user } = useAuth();
  const userName = user?.name?.split(' ')[0] || 'there';

  // Quick log mode
  const [sliderValue, setSliderValue] = useState(7);
  const [note, setNote]               = useState('');
  const [saved, setSaved]             = useState(false);

  // AI assessment mode
  const [mode, setMode]               = useState<'quick' | 'assessment'>('quick');
  const [messages, setMessages]       = useState<AssessmentMessage[]>([]);
  const [input, setInput]             = useState('');
  const [isThinking, setIsThinking]   = useState(false);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [assessmentDone, setAssessmentDone] = useState(false);
  const [detectedMood, setDetectedMood] = useState<number | null>(null);
  const [aiProvider, setAiProvider]   = useState<'ollama' | 'gemini' | 'mock'>('mock');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const cfg = MOOD_CONFIG[sliderValue];

  useEffect(() => {
    getActiveProvider().then(setAiProvider);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  // Start AI assessment
  const startAssessment = useCallback(() => {
    setMode('assessment');
    setMessages([{
      role: 'ai',
      content: `Hi ${userName}! I'd like to do a quick mood check-in with you. I'll ask a few questions to understand how you're really feeling. There are no right or wrong answers.\n\nHow has your day been so far?`,
    }]);
    setQuestionIdx(1);
    setAssessmentDone(false);
    setDetectedMood(null);
  }, [userName]);

  // Send message in assessment
  const sendAssessmentMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isThinking) return;

    const userMsg: AssessmentMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Try to detect mood rating from user's message
    const ratingMatch = text.match(/\b([1-9]|10)\b/);
    if (ratingMatch && questionIdx >= 5) {
      const rating = parseInt(ratingMatch[1]);
      if (rating >= 1 && rating <= 10) setDetectedMood(rating);
    }

    const isLastQuestion = questionIdx >= CBT_MOCK_MOOD_QUESTIONS.length;

    try {
      const history = messages.map(m => ({
        role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
        content: m.content,
      }));

      let aiResponse: string;

      if (aiProvider !== 'mock') {
        const system = CBT_MOOD_ASSESSMENT_SYSTEM(userName);
        const ctx = history.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
        const { text: resp } = await aiChat(
          system + (ctx ? `\n\nConversation so far:\n${ctx}` : ''),
          text
        );
        aiResponse = resp || CBT_MOCK_MOOD_QUESTIONS[Math.min(questionIdx, CBT_MOCK_MOOD_QUESTIONS.length - 1)];
      } else {
        // Mock: cycle through CBT questions
        if (isLastQuestion) {
          aiResponse = `Thank you for sharing all of that, ${userName}. Based on what you've told me, it sounds like you're experiencing some ${detectedMood && detectedMood <= 4 ? 'significant challenges' : detectedMood && detectedMood <= 6 ? 'moderate stress' : 'manageable feelings'}. One CBT technique that might help right now is to notice any all-or-nothing thinking and try to find a more balanced perspective. Would you like to log this mood?`;
          setAssessmentDone(true);
        } else {
          aiResponse = CBT_MOCK_MOOD_QUESTIONS[Math.min(questionIdx, CBT_MOCK_MOOD_QUESTIONS.length - 1)];
        }
      }

      // Check if AI response contains a mood rating suggestion
      if (isLastQuestion || aiResponse.toLowerCase().includes('log') || aiResponse.toLowerCase().includes('rate')) {
        setAssessmentDone(true);
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setQuestionIdx(prev => prev + 1);
    } catch {
      const fallback = CBT_MOCK_MOOD_QUESTIONS[Math.min(questionIdx, CBT_MOCK_MOOD_QUESTIONS.length - 1)];
      setMessages(prev => [...prev, { role: 'ai', content: fallback }]);
      setQuestionIdx(prev => prev + 1);
    }

    setIsThinking(false);
  }, [input, isThinking, messages, questionIdx, aiProvider, userName, detectedMood]);

  const handleQuickLog = () => {
    addMood(sliderValue, note.trim() || undefined);
    setNote('');
    setSaved(true);
    if ('vibrate' in navigator) navigator.vibrate([30, 20, 30]);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogFromAssessment = (moodValue: number) => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    addMood(moodValue, lastUserMsg?.content?.slice(0, 100));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Stats
  const recentMoods = moodLog.slice(0, 7);
  const avgMood = recentMoods.length
    ? recentMoods.reduce((s, e) => s + e.value, 0) / recentMoods.length
    : 0;
  const avgCfg = MOOD_CONFIG[Math.round(avgMood)] || MOOD_CONFIG[5];
  const last7 = [...moodLog].slice(0, 7).reverse();

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
              <Smile style={{ width: 18, height: 18, color: 'var(--accent)' }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>Mood Logger</p>
              <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Quick log or AI-guided CBT check-in</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 10, padding: 3, border: '1px solid var(--border)' }}>
            {(['quick', 'assessment'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); if (m === 'assessment') startAssessment(); }}
                style={{
                  padding: '5px 12px', borderRadius: 8, border: 'none',
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  color: mode === m ? 'var(--accent-text)' : 'var(--text-2)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease',
                }}>
                {m === 'quick' ? 'Quick' : 'AI Check-in'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick log mode */}
      {mode === 'quick' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          {/* Emoji display */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '20px 0', borderRadius: 12, marginBottom: 20,
            background: cfg.bg, transition: 'background 0.3s ease',
          }}>
            <span style={{ fontSize: 48, marginBottom: 8 }}>{cfg.emoji}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
            <span style={{ fontSize: 28, fontWeight: 700, color: cfg.color, marginTop: 4 }}>
              {sliderValue}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-3)' }}>/10</span>
            </span>
          </div>

          {/* Slider */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="range" min="1" max="10" step="1" value={sliderValue}
              onChange={e => {
                setSliderValue(Number(e.target.value));
                if ('vibrate' in navigator) navigator.vibrate(8);
              }}
              className="mood-slider"
              aria-label="Mood rating"
              style={{
                width: '100%', height: 8,
                background: `linear-gradient(to right, ${cfg.color} 0%, ${cfg.color} ${(sliderValue - 1) / 9 * 100}%, var(--border-2) ${(sliderValue - 1) / 9 * 100}%, var(--border-2) 100%)`,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <span key={n} style={{
                  fontSize: 11, transition: 'all 0.15s ease',
                  color: n === sliderValue ? cfg.color : 'var(--text-3)',
                  fontWeight: n === sliderValue ? 700 : 400,
                }}>
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
              Note <span style={{ color: 'var(--text-3)' }}>(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What's contributing to this feeling?"
              rows={2}
              className="input"
              style={{ fontSize: 13 }}
            />
          </div>

          <button
            onClick={handleQuickLog}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
              background: saved ? '#10b981' : `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color}88)`,
              color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            {saved ? '✓ Mood Logged!' : `Log Mood — ${cfg.label}`}
          </button>

          <button
            onClick={startAssessment}
            style={{
              width: '100%', marginTop: 10, padding: '10px 0', borderRadius: 12,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-2)', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)';
              (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
            }}
          >
            <Brain style={{ width: 14, height: 14 }} />
            Or try AI-guided CBT check-in
          </button>
        </div>
      )}

      {/* AI Assessment mode */}
      {mode === 'assessment' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Assessment header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot style={{ width: 14, height: 14, color: 'var(--accent)' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>CBT Mood Assessment</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                AI-guided · {aiProvider === 'mock' ? 'CBT-structured questions' : `${aiProvider} · live`}
              </p>
            </div>
            <button
              onClick={() => { setMode('quick'); }}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--text-3)', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <RefreshCw style={{ width: 12, height: 12 }} /> Reset
            </button>
          </div>

          {/* Messages */}
          <div style={{ padding: 16, maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} className="animate-fade-in" style={{
                display: 'flex', alignItems: 'flex-end', gap: 8,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'ai' ? 'var(--accent-dim)' : 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {msg.role === 'ai'
                    ? <Bot style={{ width: 12, height: 12, color: 'var(--accent)' }} />
                    : <Smile style={{ width: 12, height: 12, color: 'var(--text-2)' }} />
                  }
                </div>
                <div
                  className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
                  style={{ maxWidth: '78%', padding: '9px 13px' }}
                >
                  <p style={{
                    fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-1)',
                  }}>
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {isThinking && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bot style={{ width: 12, height: 12, color: 'var(--accent)' }} />
                </div>
                <div className="chat-bubble-ai" style={{ padding: '9px 13px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
                        animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Log mood buttons — shown when assessment is done */}
          {assessmentDone && (
            <div className="animate-fade-in" style={{
              padding: '12px 16px', borderTop: '1px solid var(--border)',
              background: 'var(--surface-2)',
            }}>
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>
                Log your mood based on this check-in:
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => {
                  const c = MOOD_CONFIG[v];
                  return (
                    <button
                      key={v}
                      onClick={() => handleLogFromAssessment(v)}
                      style={{
                        width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)',
                        background: detectedMood === v ? c.bg : 'var(--surface)',
                        color: c.color, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        outline: detectedMood === v ? `2px solid ${c.color}` : 'none',
                      }}
                      title={c.label}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
              {saved && (
                <p className="animate-fade-in" style={{ fontSize: 12, color: '#10b981', marginTop: 8 }}>
                  ✓ Mood logged successfully!
                </p>
              )}
            </div>
          )}

          {/* Input */}
          {!assessmentDone && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendAssessmentMessage(); }}
                  placeholder="Type your answer…"
                  className="input"
                  style={{ fontSize: 13, flex: 1 }}
                />
                <button
                  onClick={sendAssessmentMessage}
                  disabled={!input.trim() || isThinking}
                  style={{
                    width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0,
                    background: input.trim() && !isThinking ? 'var(--accent)' : 'var(--surface-2)',
                    color: input.trim() && !isThinking ? 'var(--accent-text)' : 'var(--text-3)',
                    cursor: input.trim() && !isThinking ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Send style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <TrendingUp style={{ width: 14, height: 14, color: 'var(--accent)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>7-Day Average</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{avgCfg.emoji}</span>
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, color: avgCfg.color }}>{avgMood.toFixed(1)}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{avgCfg.label}</p>
            </div>
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Calendar style={{ width: 14, height: 14, color: 'var(--accent)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Total Entries</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-1)' }}>{moodLog.length}</p>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>mood logs</p>
        </div>
      </div>

      {/* Trend bars */}
      {last7.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 12 }}>Recent Trend</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
            {last7.map((entry, i) => {
              const c = MOOD_CONFIG[entry.value];
              return (
                <div key={entry.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    height: `${(entry.value / 10) * 100}%`,
                    background: c.color, opacity: 0.65 + i * 0.05,
                    minHeight: 4, transition: 'height 0.5s ease',
                  }} />
                  <span style={{ fontSize: 10, color: c.color, fontWeight: 600 }}>{entry.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 12 }}>History</p>
        {moodLog.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>
            No entries yet. Log your first mood above.
          </p>
        ) : (
          moodLog.slice(0, 10).map(entry => (
            <MoodHistoryItem key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
};
