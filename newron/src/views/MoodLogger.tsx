import React, { useState, useRef } from 'react';
import { Smile, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { MoodEntry } from '../types';

const MOOD_CONFIG: Record<number, { label: string; emoji: string; color: string; bg: string }> = {
  1:  { label: 'Terrible',  emoji: '😞', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  2:  { label: 'Very Bad',  emoji: '😟', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  3:  { label: 'Bad',       emoji: '😕', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  4:  { label: 'Low',       emoji: '😐', color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
  5:  { label: 'Neutral',   emoji: '😶', color: '#84cc16', bg: 'rgba(132,204,22,0.15)' },
  6:  { label: 'Okay',      emoji: '🙂', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  7:  { label: 'Good',      emoji: '😊', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  8:  { label: 'Great',     emoji: '😄', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  9:  { label: 'Excellent', emoji: '😁', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  10: { label: 'Amazing',   emoji: '🤩', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
};

const MoodHistoryItem: React.FC<{ entry: MoodEntry }> = ({ entry }) => {
  const cfg = MOOD_CONFIG[entry.value];
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-700/20 last:border-0 animate-fade-in">
      <span className="text-xl">{cfg.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
          <span className="text-xs text-slate-500">
            {entry.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            {' '}
            {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {entry.note && <p className="text-xs text-slate-400 truncate mt-0.5">{entry.note}</p>}
      </div>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        {entry.value}
      </div>
    </div>
  );
};

export const MoodLogger: React.FC = () => {
  const { moodLog, addMood } = useAppContext();
  const [sliderValue, setSliderValue] = useState(7);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);

  const cfg = MOOD_CONFIG[sliderValue];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderValue(val);
    // Haptic feedback via Vibration API (mobile)
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleLog = () => {
    addMood(sliderValue, note.trim() || undefined);
    setNote('');
    setSaved(true);
    // Haptic confirmation
    if ('vibrate' in navigator) navigator.vibrate([30, 20, 30]);
    setTimeout(() => setSaved(false), 2000);
  };

  // Average mood over last 7 entries
  const recentMoods = moodLog.slice(0, 7);
  const avgMood = recentMoods.length
    ? recentMoods.reduce((s, e) => s + e.value, 0) / recentMoods.length
    : 0;
  const avgCfg = MOOD_CONFIG[Math.round(avgMood)] || MOOD_CONFIG[5];

  // Mood trend (last 7 days mini bars)
  const last7 = [...moodLog].slice(0, 7).reverse();

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <Smile className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100">Mood Logger</h2>
            <p className="text-xs text-slate-400">How are you feeling right now?</p>
          </div>
        </div>
      </div>

      {/* Slider card */}
      <div className="glass rounded-2xl p-6">
        {/* Emoji + label */}
        <div
          className="flex flex-col items-center justify-center py-4 rounded-2xl mb-6 transition-all duration-300"
          style={{ background: cfg.bg }}
        >
          <span className="text-5xl mb-2 transition-all duration-200" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' }}>
            {cfg.emoji}
          </span>
          <span className="text-lg font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
          <span className="text-3xl font-bold mt-1" style={{ color: cfg.color }}>{sliderValue}<span className="text-base font-normal text-slate-400">/10</span></span>
        </div>

        {/* Slider */}
        <div className="relative mb-6">
          <input
            ref={sliderRef}
            type="range"
            min="1"
            max="10"
            step="1"
            value={sliderValue}
            onChange={handleSliderChange}
            className="mood-slider w-full h-3 rounded-full appearance-none cursor-pointer outline-none"
            style={{
              background: `linear-gradient(to right, ${cfg.color} 0%, ${cfg.color} ${(sliderValue - 1) / 9 * 100}%, rgba(255,255,255,0.1) ${(sliderValue - 1) / 9 * 100}%, rgba(255,255,255,0.1) 100%)`,
            }}
          />
          {/* Tick marks */}
          <div className="flex justify-between mt-2 px-0.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <span
                key={n}
                className="text-xs transition-all duration-200"
                style={{ color: n === sliderValue ? cfg.color : '#475569', fontWeight: n === sliderValue ? 700 : 400 }}
              >
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-1.5 block">Add a note (optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What's contributing to this feeling?"
            rows={2}
            className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/50 resize-none transition-colors"
          />
        </div>

        <button
          onClick={handleLog}
          className={`w-full py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02] ${
            saved
              ? 'bg-emerald-600/80 text-white'
              : 'text-white hover:opacity-90'
          }`}
          style={!saved ? { background: `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color}88)` } : {}}
        >
          {saved ? '✓ Mood Logged!' : `Log Mood — ${cfg.label}`}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-slate-400">7-Day Average</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{avgCfg.emoji}</span>
            <div>
              <p className="font-bold text-lg" style={{ color: avgCfg.color }}>{avgMood.toFixed(1)}</p>
              <p className="text-xs text-slate-400">{avgCfg.label}</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-slate-400">Entries</span>
          </div>
          <p className="font-bold text-2xl text-slate-100">{moodLog.length}</p>
          <p className="text-xs text-slate-400">total logged</p>
        </div>
      </div>

      {/* Mini trend bars */}
      {last7.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-slate-200">Recent Trend</span>
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {last7.map((entry, i) => {
              const c = MOOD_CONFIG[entry.value];
              const heightPct = (entry.value / 10) * 100;
              return (
                <div key={entry.id} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${heightPct}%`,
                      background: c.color,
                      opacity: 0.7 + i * 0.04,
                      minHeight: '4px',
                    }}
                  />
                  <span className="text-xs" style={{ color: c.color }}>{entry.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-medium text-slate-200 mb-3">Mood History</h3>
        {moodLog.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No entries yet. Log your first mood above.</p>
        ) : (
          <div>
            {moodLog.slice(0, 10).map(entry => (
              <MoodHistoryItem key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .mood-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.4), 0 2px 8px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .mood-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 0 5px rgba(139,92,246,0.3), 0 2px 12px rgba(0,0,0,0.5);
        }
        .mood-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: none;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.4);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};
