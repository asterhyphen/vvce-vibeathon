import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, Brain, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const MOOD_CONFIG: Record<number, { label: string; emoji: string; color: string }> = {
  1:  { label: 'Terrible',  emoji: '😞', color: '#ef4444' },
  2:  { label: 'Very Bad',  emoji: '😟', color: '#f97316' },
  3:  { label: 'Bad',       emoji: '😕', color: '#f59e0b' },
  4:  { label: 'Low',       emoji: '😐', color: '#eab308' },
  5:  { label: 'Neutral',   emoji: '😶', color: '#84cc16' },
  6:  { label: 'Okay',      emoji: '🙂', color: '#22c55e' },
  7:  { label: 'Good',      emoji: '😊', color: '#10b981' },
  8:  { label: 'Great',     emoji: '😄', color: '#06b6d4' },
  9:  { label: 'Excellent', emoji: '😁', color: '#6366f1' },
  10: { label: 'Amazing',   emoji: '🤩', color: '#a855f7' },
};

// This page is designed to be the landing page when someone taps an NFC tag
// URL: /mood (or /#/mood) — program your NFC tag to open this URL
export const NFCMoodPage: React.FC<{ onDone?: () => void }> = ({ onDone }) => {
  const { addMood } = useAppContext();
  const [step, setStep] = useState<'select' | 'done'>('select');
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState('');

  // Haptic on mount (NFC tap simulation)
  useEffect(() => {
    if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
  }, []);

  const handleLog = () => {
    if (!selected) return;
    addMood(selected, note.trim() || undefined);
    if ('vibrate' in navigator) navigator.vibrate([30, 20, 60]);
    setStep('done');
  };

  const cfg = selected ? MOOD_CONFIG[selected] : null;

  if (step === 'done' && cfg) {
    return (
      <div className="min-h-screen bg-[#080a14] flex items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4">{cfg.emoji}</div>
          <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: cfg.color }} />
          <h2 className="text-xl font-semibold text-slate-100 mb-1">Mood Logged!</h2>
          <p className="text-slate-400 text-sm mb-2">{cfg.label} · {selected}/10</p>
          {note && <p className="text-slate-500 text-xs italic mb-4">"{note}"</p>}
          <p className="text-xs text-slate-500 mb-6">Your newron dashboard has been updated.</p>
          {onDone && (
            <button onClick={onDone}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all">
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a14] flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-3">
            <Brain className="w-7 h-7 text-violet-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">newron</h1>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Smartphone className="w-3.5 h-3.5 text-violet-400" />
            <p className="text-sm text-slate-400">Quick Mood Check-in</p>
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <h2 className="text-center font-medium text-slate-200 mb-4">How are you feeling right now?</h2>

          {/* Emoji grid */}
          <div className="grid grid-cols-5 gap-2 mb-5">
            {Object.entries(MOOD_CONFIG).map(([val, c]) => {
              const n = Number(val);
              const isSelected = selected === n;
              return (
                <button
                  key={val}
                  onClick={() => {
                    setSelected(n);
                    if ('vibrate' in navigator) navigator.vibrate(15);
                  }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    isSelected
                      ? 'scale-110 ring-2'
                      : 'hover:bg-slate-700/40 hover:scale-105'
                  }`}
                  style={isSelected ? { background: `${c.color}20`, outline: `2px solid ${c.color}` } : {}}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-xs font-medium" style={{ color: isSelected ? c.color : '#64748b' }}>{n}</span>
                </button>
              );
            })}
          </div>

          {selected && cfg && (
            <div className="animate-fade-in mb-4">
              <div className="text-center mb-3">
                <span className="text-3xl">{cfg.emoji}</span>
                <p className="font-semibold mt-1" style={{ color: cfg.color }}>{cfg.label}</p>
              </div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a quick note… (optional)"
                rows={2}
                className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/50 resize-none transition-colors"
              />
            </div>
          )}

          <button
            onClick={handleLog}
            disabled={!selected}
            className="w-full py-3 rounded-xl font-medium text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
            style={cfg ? { background: `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color}88)` } : { background: '#7c3aed' }}
          >
            {selected ? `Log Mood — ${cfg?.label}` : 'Select a mood above'}
          </button>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="w-3 h-3 text-violet-400" />
            Tap your NFC tag anytime to log your mood
          </div>
        </div>

        {/* NFC setup instructions */}
        <div className="mt-4 glass rounded-2xl p-4">
          <h3 className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-violet-400" />
            Program your NFC tag
          </h3>
          <ol className="space-y-1.5 text-xs text-slate-400">
            <li>1. Download any NFC writer app (e.g. NFC Tools)</li>
            <li>2. Write a URL record pointing to this page</li>
            <li>3. Place the tag somewhere visible (desk, fridge, mirror)</li>
            <li>4. Tap to instantly open this mood check-in</li>
          </ol>
          <div className="mt-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
            <p className="text-xs text-violet-300 font-mono break-all">
              {window.location.origin}/#nfc-mood
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
