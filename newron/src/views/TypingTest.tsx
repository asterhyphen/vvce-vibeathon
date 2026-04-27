import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Keyboard, RefreshCw, Zap, Target, AlertTriangle, Brain, TrendingUp, Play, CheckCircle } from 'lucide-react';
import { analyseTypingStress } from '../lib/ai';

// ── Prompts ───────────────────────────────────────────────────────────────────
const PROMPTS = [
  "The quick brown fox jumps over the lazy dog near the riverbank at dawn.",
  "Breathing slowly and deeply can calm the nervous system within seconds.",
  "Every small step forward is still progress, no matter how it feels.",
  "The mind is like water — when it is turbulent it is difficult to see clearly.",
  "Rest is not a reward for finishing work. It is part of doing the work well.",
  "You do not have to be perfect to deserve care and kindness from yourself.",
  "Stress is not the enemy. How we respond to it shapes everything that follows.",
  "Focus on what you can control and release what you cannot. That is enough.",
  "The present moment is the only place where life actually happens right now.",
  "Small consistent actions compound into meaningful change over time always.",
];

// ── Stress level from typing metrics ─────────────────────────────────────────
interface TypingResult {
  wpm: number;
  accuracy: number;
  errorCount: number;
  errorRate: number;
  avgPause: number;        // ms between keystrokes
  hesitationCount: number; // pauses > 800ms
  backspaceCount: number;
  duration: number;        // seconds
  stressScore: number;     // 0–100
  stressLabel: string;
  stressColor: string;
}

function calcStress(wpm: number, accuracy: number, errorRate: number, avgPause: number, hesitations: number): number {
  let stress = 0;

  // Low WPM relative to normal (avg ~40 WPM) → stress
  if (wpm < 15)      stress += 30;
  else if (wpm < 25) stress += 20;
  else if (wpm < 35) stress += 10;
  else if (wpm > 70) stress += 5; // rushing also signals stress

  // Low accuracy → cognitive load
  if (accuracy < 70)      stress += 30;
  else if (accuracy < 80) stress += 20;
  else if (accuracy < 90) stress += 10;
  else if (accuracy < 95) stress += 5;

  // High error rate
  if (errorRate > 20)      stress += 20;
  else if (errorRate > 10) stress += 10;
  else if (errorRate > 5)  stress += 5;

  // Long pauses → hesitation / anxiety
  if (avgPause > 1200)     stress += 20;
  else if (avgPause > 700) stress += 12;
  else if (avgPause > 400) stress += 5;

  // Hesitation count
  stress += Math.min(20, hesitations * 4);

  return Math.max(0, Math.min(100, stress));
}

function stressLabel(score: number): { label: string; color: string; emoji: string } {
  if (score >= 65) return { label: 'High Stress',    color: '#ef4444', emoji: '😰' };
  if (score >= 40) return { label: 'Moderate Stress', color: '#f59e0b', emoji: '😟' };
  if (score >= 20) return { label: 'Mild Tension',   color: '#84cc16', emoji: '🙂' };
  return              { label: 'Relaxed',            color: '#10b981', emoji: '😌' };
}

// ── Char state ────────────────────────────────────────────────────────────────
type CharState = 'pending' | 'correct' | 'wrong' | 'extra';

interface CharData {
  char: string;
  state: CharState;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const TypingTest: React.FC<{ onStressUpdate?: (score: number) => void }> = ({ onStressUpdate }) => {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [promptIdx, setPromptIdx] = useState(0);
  const [chars, setChars] = useState<CharData[]>([]);
  const [cursor, setCursor] = useState(0);
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<TypingResult | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [history, setHistory] = useState<TypingResult[]>([]);

  const keystrokeTimes = useRef<number[]>([]);
  const backspaceCount = useRef(0);
  const hesitationCount = useRef(0);
  const lastKeyTime = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const prompt = PROMPTS[promptIdx];

  // Init chars when prompt changes
  useEffect(() => {
    setChars(prompt.split('').map(c => ({ char: c, state: 'pending' })));
    setCursor(0);
    setInput('');
    keystrokeTimes.current = [];
    backspaceCount.current = 0;
    hesitationCount.current = 0;
    lastKeyTime.current = null;
  }, [prompt]);

  // Timer
  useEffect(() => {
    if (phase === 'running') {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - (startTime ?? Date.now()));
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, startTime]);

  const startTest = useCallback(() => {
    const idx = Math.floor(Math.random() * PROMPTS.length);
    setPromptIdx(idx);
    setPhase('running');
    setStartTime(Date.now());
    setElapsed(0);
    setResult(null);
    setAiInsight(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const finishTest = useCallback((finalInput: string, finalChars: CharData[]) => {
    const duration = (Date.now() - (startTime ?? Date.now())) / 1000;
    const words = finalInput.trim().split(/\s+/).length;
    const wpm = Math.round((words / duration) * 60);

    const correctCount = finalChars.filter(c => c.state === 'correct').length;
    const wrongCount   = finalChars.filter(c => c.state === 'wrong').length;
    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 100;
    const errorRate = total > 0 ? Math.round((wrongCount / total) * 100) : 0;

    const pauses = keystrokeTimes.current;
    const avgPause = pauses.length > 1
      ? pauses.slice(1).reduce((sum, t, i) => sum + (t - pauses[i]), 0) / (pauses.length - 1)
      : 200;

    const stressScore = calcStress(wpm, accuracy, errorRate, avgPause, hesitationCount.current);
    const { label, color, emoji } = stressLabel(stressScore);

    const res: TypingResult = {
      wpm, accuracy, errorCount: wrongCount, errorRate,
      avgPause: Math.round(avgPause),
      hesitationCount: hesitationCount.current,
      backspaceCount: backspaceCount.current,
      duration: Math.round(duration),
      stressScore,
      stressLabel: `${emoji} ${label}`,
      stressColor: color,
    };

    setResult(res);
    setPhase('done');
    setHistory(prev => [res, ...prev].slice(0, 5));
    onStressUpdate?.(stressScore);

    // Fetch AI insight
    setLoadingAi(true);
    analyseTypingStress(wpm, accuracy, errorRate, Math.round(avgPause))
      .then(insight => setAiInsight(insight))
      .catch(() => setAiInsight(null))
      .finally(() => setLoadingAi(false));
  }, [startTime, onStressUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (phase !== 'running') return;

    const now = Date.now();

    // Track pauses
    if (lastKeyTime.current !== null) {
      const gap = now - lastKeyTime.current;
      if (gap > 800) hesitationCount.current++;
    }
    lastKeyTime.current = now;
    keystrokeTimes.current.push(now);

    if (e.key === 'Backspace') {
      backspaceCount.current++;
    }
  }, [phase]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (phase !== 'running') return;
    const val = e.target.value;
    setInput(val);

    const newChars = prompt.split('').map((c, i) => {
      if (i >= val.length) return { char: c, state: 'pending' as CharState };
      return { char: c, state: val[i] === c ? 'correct' as CharState : 'wrong' as CharState };
    });

    setChars(newChars);
    setCursor(val.length);

    // Finished when all chars typed
    if (val.length >= prompt.length) {
      finishTest(val, newChars);
    }
  }, [phase, prompt, finishTest]);

  const reset = useCallback(() => {
    setPhase('idle');
    setInput('');
    setResult(null);
    setAiInsight(null);
    setElapsed(0);
    setChars(prompt.split('').map(c => ({ char: c, state: 'pending' })));
    setCursor(0);
    keystrokeTimes.current = [];
    backspaceCount.current = 0;
    hesitationCount.current = 0;
    lastKeyTime.current = null;
  }, [prompt]);

  const elapsedSec = elapsed / 1000;
  const liveWpm = startTime && elapsedSec > 1
    ? Math.round((input.trim().split(/\s+/).filter(Boolean).length / elapsedSec) * 60)
    : 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100">Typing Speed & Stress Test</h2>
              <p className="text-xs text-slate-400">Measures WPM, accuracy, hesitation, and cognitive stress</p>
            </div>
          </div>
          {phase !== 'idle' && (
            <button onClick={reset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600/30 text-slate-300 text-xs font-medium transition-all">
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Idle state */}
      {phase === 'idle' && (
        <div className="glass rounded-2xl p-8 text-center animate-fade-in">
          <div className="text-5xl mb-4">⌨️</div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Ready to measure your stress?</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
            Type the prompt as accurately as you can. Your speed, pauses, and error patterns reveal your current cognitive stress level.
          </p>
          <button
            onClick={startTest}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all hover:scale-105"
          >
            <Play className="w-4 h-4" /> Start Test
          </button>

          {/* History */}
          {history.length > 0 && (
            <div className="mt-6 text-left">
              <p className="text-xs text-slate-500 mb-2 text-center">Recent results</p>
              <div className="space-y-2">
                {history.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-700/30">
                    <span className="text-xs text-slate-400">{r.stressLabel}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-violet-300">{r.wpm} WPM</span>
                      <span className="text-slate-400">{r.accuracy}% acc</span>
                      <span style={{ color: r.stressColor }} className="font-medium">Stress {r.stressScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Running state */}
      {phase === 'running' && (
        <div className="space-y-4 animate-fade-in">
          {/* Live stats bar */}
          <div className="glass rounded-2xl px-5 py-3 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs text-slate-400">WPM</span>
              <span className="text-sm font-bold text-violet-300 tabular-nums w-8">{liveWpm}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-slate-400">Progress</span>
              <span className="text-sm font-bold text-blue-300 tabular-nums">{Math.round((cursor / prompt.length) * 100)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-slate-400">Errors</span>
              <span className="text-sm font-bold text-amber-300 tabular-nums">
                {chars.filter(c => c.state === 'wrong').length}
              </span>
            </div>
            <div className="ml-auto text-xs text-slate-500 tabular-nums">
              {elapsedSec.toFixed(1)}s
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 rounded-full bg-slate-700/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-100"
              style={{ width: `${(cursor / prompt.length) * 100}%` }}
            />
          </div>

          {/* Prompt display */}
          <div className="glass rounded-2xl p-5">
            <p className="font-mono text-base leading-relaxed tracking-wide select-none" aria-label="Typing prompt">
              {chars.map((c, i) => (
                <span
                  key={i}
                  className={`relative transition-colors duration-75 ${
                    c.state === 'correct' ? 'text-emerald-400' :
                    c.state === 'wrong'   ? 'text-red-400 bg-red-500/20 rounded' :
                    i === cursor          ? 'text-slate-100' :
                    'text-slate-500'
                  }`}
                >
                  {/* Blinking cursor */}
                  {i === cursor && (
                    <span className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-violet-400 animate-pulse rounded" />
                  )}
                  {c.char === ' ' ? '\u00A0' : c.char}
                </span>
              ))}
            </p>
          </div>

          {/* Hidden input */}
          <input
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            className="opacity-0 absolute pointer-events-none w-0 h-0"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Typing input"
          />

          {/* Click to focus hint */}
          <button
            onClick={() => inputRef.current?.focus()}
            className="w-full py-3 rounded-xl border border-dashed border-slate-600/50 text-slate-500 text-sm hover:border-violet-500/40 hover:text-violet-400 transition-all"
          >
            Click here or start typing ↑
          </button>
        </div>
      )}

      {/* Results */}
      {phase === 'done' && result && (
        <div className="space-y-4 animate-fade-in">
          {/* Stress score hero */}
          <div
            className="glass rounded-2xl p-6 text-center"
            style={{ borderColor: `${result.stressColor}30` }}
          >
            <div className="text-4xl mb-2">{result.stressLabel.split(' ')[0]}</div>
            <h3 className="text-xl font-bold mb-1" style={{ color: result.stressColor }}>
              {result.stressLabel.split(' ').slice(1).join(' ')}
            </h3>
            <p className="text-slate-400 text-sm mb-4">Stress Score: <span className="font-bold" style={{ color: result.stressColor }}>{result.stressScore}/100</span></p>

            {/* Stress bar */}
            <div className="h-3 rounded-full bg-slate-700/50 overflow-hidden max-w-xs mx-auto mb-4">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${result.stressScore}%`,
                  background: `linear-gradient(to right, #10b981, ${result.stressColor})`,
                }}
              />
            </div>

            <p className="text-xs text-slate-500">
              {result.stressScore < 20 && "You're typing fluidly — low cognitive load detected."}
              {result.stressScore >= 20 && result.stressScore < 40 && "Mild tension in your typing pattern. Nothing to worry about."}
              {result.stressScore >= 40 && result.stressScore < 65 && "Moderate stress signals detected. Consider a short break."}
              {result.stressScore >= 65 && "High stress indicators. Your typing shows significant cognitive strain."}
            </p>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'WPM',       value: result.wpm,           unit: '',   icon: <Zap className="w-3.5 h-3.5" />,          color: '#a78bfa' },
              { label: 'Accuracy',  value: result.accuracy,      unit: '%',  icon: <Target className="w-3.5 h-3.5" />,        color: '#60a5fa' },
              { label: 'Errors',    value: result.errorCount,    unit: '',   icon: <AlertTriangle className="w-3.5 h-3.5" />, color: result.errorCount > 5 ? '#f87171' : '#34d399' },
              { label: 'Hesitations', value: result.hesitationCount, unit: '', icon: <Brain className="w-3.5 h-3.5" />,      color: result.hesitationCount > 3 ? '#f59e0b' : '#34d399' },
            ].map(m => (
              <div key={m.label} className="glass rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1" style={{ color: m.color }}>
                  {m.icon}
                  <span className="text-xs text-slate-400">{m.label}</span>
                </div>
                <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}{m.unit}</p>
              </div>
            ))}
          </div>

          {/* Extra stats */}
          <div className="glass rounded-2xl p-4">
            <h4 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wide">Detailed Breakdown</h4>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              {[
                { label: 'Duration',        value: `${result.duration}s` },
                { label: 'Avg key pause',   value: `${result.avgPause}ms` },
                { label: 'Backspaces',      value: result.backspaceCount },
                { label: 'Error rate',      value: `${result.errorRate}%` },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1 border-b border-slate-700/20">
                  <span className="text-xs text-slate-500">{s.label}</span>
                  <span className="text-xs font-medium text-slate-300">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI insight */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-slate-200">AI Stress Analysis</span>
              {loadingAi && <span className="ml-auto text-xs text-violet-400 animate-pulse">Analysing…</span>}
            </div>
            {aiInsight ? (
              <p className="text-sm text-slate-300 leading-relaxed animate-fade-in">{aiInsight}</p>
            ) : !loadingAi ? (
              <p className="text-sm text-slate-400 leading-relaxed">
                {result.stressScore >= 65
                  ? `Your typing shows ${result.hesitationCount} hesitation pauses and ${result.errorCount} errors — patterns consistent with elevated cognitive stress. Consider stepping away for a few minutes.`
                  : result.stressScore >= 40
                  ? `Moderate stress signals: avg pause of ${result.avgPause}ms and ${result.backspaceCount} corrections suggest some mental friction. A short walk could help reset focus.`
                  : `Typing at ${result.wpm} WPM with ${result.accuracy}% accuracy indicates a calm, focused state. Your cognitive load appears well-managed right now.`
                }
              </p>
            ) : null}
          </div>

          {/* Trend comparison */}
          {history.length > 1 && (
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-slate-200">Stress Trend</span>
              </div>
              <div className="flex items-end gap-2 h-12">
                {history.slice().reverse().map((r, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm min-h-1"
                      style={{
                        height: `${(r.stressScore / 100) * 48}px`,
                        background: r.stressColor,
                        opacity: 0.6 + i * 0.08,
                      }}
                    />
                    <span className="text-xs" style={{ color: r.stressColor }}>{r.stressScore}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={startTest}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-all hover:scale-[1.02]"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <button
              onClick={reset}
              className="px-5 py-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600/30 text-slate-300 text-sm transition-all"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
