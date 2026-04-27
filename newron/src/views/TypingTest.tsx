import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Keyboard, RotateCcw, Activity, Timer, CheckCircle } from 'lucide-react';

const PROMPTS = [
  "Today I feel grateful for the small moments of peace that come when I take a deep breath and let go of what I cannot control.",
  "Sometimes the best thing I can do for myself is to slow down and notice the world around me without judgment.",
  "I am learning to be patient with myself because growth takes time and every step forward matters.",
  "It is okay to have difficult days. What matters is that I keep showing up for myself with kindness and compassion.",
  "My thoughts do not define me. I can observe them, acknowledge them, and choose which ones to hold onto.",
  "Taking care of my mental health is not selfish. It is necessary so I can show up fully for the people I love.",
];

interface TypingStats {
  wpm: number;
  accuracy: number;
  backspaceRate: number;
  avgPause: number;
  stressScore: number;
}

function computeStress(wpm: number, accuracy: number, backspaceRate: number, avgPause: number): number {
  let score = 0;
  if (wpm < 20) score += 25;
  else if (wpm < 30) score += 15;
  else if (wpm < 40) score += 8;
  if (accuracy < 70) score += 25;
  else if (accuracy < 85) score += 15;
  else if (accuracy < 92) score += 8;
  if (backspaceRate > 25) score += 25;
  else if (backspaceRate > 15) score += 15;
  else if (backspaceRate > 8) score += 5;
  if (avgPause > 1200) score += 20;
  else if (avgPause > 700) score += 10;
  else if (avgPause > 400) score += 5;
  return Math.max(0, Math.min(100, score));
}

export const TypingTest: React.FC<{ onStressUpdate: (score: number) => void }> = ({ onStressUpdate }) => {
  const [prompt, setPrompt] = useState('');
  const [typed, setTyped] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState<TypingStats | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const startTime = useRef(0);
  const backspaceCount = useRef(0);
  const totalKeystrokes = useRef(0);
  const pauseList = useRef<number[]>([]);
  const lastKeystroke = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pickPrompt = useCallback(() => {
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  }, []);

  useEffect(() => { pickPrompt(); }, [pickPrompt]);

  useEffect(() => {
    if (started && !finished) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
      }, 250);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, finished]);

  const reset = useCallback(() => {
    setTyped('');
    setStarted(false);
    setFinished(false);
    setStats(null);
    setElapsed(0);
    startTime.current = 0;
    backspaceCount.current = 0;
    totalKeystrokes.current = 0;
    pauseList.current = [];
    lastKeystroke.current = 0;
    pickPrompt();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [pickPrompt]);

  const finish = useCallback((typedText: string) => {
    setFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
    const totalTime = (Date.now() - startTime.current) / 1000;
    const words = typedText.trim().split(/\s+/).length;
    const wpm = totalTime > 0 ? Math.round((words / totalTime) * 60) : 0;
    let correct = 0;
    const minLen = Math.min(typedText.length, prompt.length);
    for (let i = 0; i < minLen; i++) {
      if (typedText[i] === prompt[i]) correct++;
    }
    const accuracy = prompt.length > 0 ? Math.round((correct / prompt.length) * 100) : 0;
    const bsRate = totalKeystrokes.current > 0
      ? Math.round((backspaceCount.current / totalKeystrokes.current) * 100) : 0;
    const avgPause = pauseList.current.length > 0
      ? Math.round(pauseList.current.reduce((a, b) => a + b, 0) / pauseList.current.length) : 300;
    const stressScore = computeStress(wpm, accuracy, bsRate, avgPause);
    setStats({ wpm, accuracy, backspaceRate: bsRate, avgPause, stressScore });
    onStressUpdate(stressScore);
  }, [prompt, onStressUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (finished) return;
    const now = Date.now();
    if (!started) { setStarted(true); startTime.current = now; }
    totalKeystrokes.current++;
    if (e.key === 'Backspace') backspaceCount.current++;
    if (lastKeystroke.current > 0) {
      const pause = now - lastKeystroke.current;
      if (pause > 80 && pause < 5000) {
        pauseList.current.push(pause);
        if (pauseList.current.length > 50) pauseList.current.shift();
      }
    }
    lastKeystroke.current = now;
  }, [started, finished]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (finished) return;
    const val = e.target.value;
    setTyped(val);
    if (val.length >= prompt.length) finish(val);
  }, [finished, prompt, finish]);

  const renderPrompt = () => prompt.split('').map((char, i) => {
    let color = 'var(--text-3)';
    if (i < typed.length) color = typed[i] === char ? 'var(--accent)' : '#ef4444';
    return (
      <span key={i} style={{
        color,
        borderBottom: i === typed.length ? '2px solid var(--accent)' : 'none',
        transition: 'color 0.1s ease',
      }}>{char}</span>
    );
  });

  const stressLabel = (score: number) => {
    if (score <= 20) return { text: 'Calm', color: '#10b981' };
    if (score <= 40) return { text: 'Mild', color: '#84cc16' };
    if (score <= 60) return { text: 'Moderate', color: '#f59e0b' };
    if (score <= 80) return { text: 'Elevated', color: '#f97316' };
    return { text: 'High', color: '#ef4444' };
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

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
              <Keyboard style={{ width: 18, height: 18, color: 'var(--accent)' }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>Typing Wellness Check</p>
              <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Type the prompt below — your patterns reveal stress signals</p>
            </div>
          </div>
          <button onClick={reset} className="btn-ghost"
            style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <RotateCcw style={{ width: 13, height: 13 }} /> New Prompt
          </button>
        </div>
      </div>

      {/* Timer bar */}
      {started && !finished && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 10,
          background: 'var(--surface)', border: '1px solid var(--border)',
        }}>
          <Timer style={{ width: 14, height: 14, color: 'var(--accent)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(elapsed)}
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{typed.length} / {prompt.length}</span>
          <div style={{ height: 4, flex: 1, maxWidth: 120, borderRadius: 99, background: 'var(--border-2)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99, width: `${Math.min(100, (typed.length / prompt.length) * 100)}%`,
              background: 'var(--accent)', transition: 'width 0.2s ease',
            }} />
          </div>
        </div>
      )}

      {/* Prompt + Input */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
        <div style={{
          fontSize: 15, lineHeight: 1.8, fontFamily: 'monospace',
          padding: 16, borderRadius: 12,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          marginBottom: 16, userSelect: 'none',
        }}>
          {renderPrompt()}
        </div>
        <textarea
          ref={inputRef}
          value={typed}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={finished}
          placeholder={finished ? 'Test complete!' : 'Start typing here...'}
          rows={3}
          className="input"
          style={{ fontSize: 14, fontFamily: 'monospace', resize: 'none', opacity: finished ? 0.5 : 1 }}
          aria-label="Typing test input"
          autoFocus
        />
      </div>

      {/* Results */}
      {finished && stats && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Stress score hero */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, textAlign: 'center',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 12px',
              background: `${stressLabel(stats.stressScore).color}18`,
              border: `2px solid ${stressLabel(stats.stressScore).color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: stressLabel(stats.stressScore).color }}>
                {stats.stressScore}
              </span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: stressLabel(stats.stressScore).color }}>
              {stressLabel(stats.stressScore).text} Stress
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
              Based on your typing patterns during this exercise
            </p>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Speed', value: `${stats.wpm} WPM`, icon: <Keyboard style={{ width: 14, height: 14 }} /> },
              { label: 'Accuracy', value: `${stats.accuracy}%`, icon: <CheckCircle style={{ width: 14, height: 14 }} /> },
              { label: 'Correction Rate', value: `${stats.backspaceRate}%`, icon: <Activity style={{ width: 14, height: 14 }} /> },
              { label: 'Avg Pause', value: `${stats.avgPause}ms`, icon: <Timer style={{ width: 14, height: 14 }} /> },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: 'var(--accent)' }}>
                  {s.icon}
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.label}</span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Try again */}
          <button onClick={reset} className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 0', borderRadius: 12 }}>
            <RotateCcw style={{ width: 14, height: 14 }} /> Try Again
          </button>
        </div>
      )}
    </div>
  );
};
