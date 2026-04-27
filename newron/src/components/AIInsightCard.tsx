import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Cpu, Zap, WifiOff } from 'lucide-react';
import { generateDailyInsight, getActiveProvider, OLLAMA_MODEL, type AIProvider } from '../lib/ai';

interface Props {
  driftScore: number;
  moodAvg: number;
  journalCount: number;
  typingStress: number | null;
}

const FALLBACKS = [
  "Your behavioral patterns today suggest moderate cognitive load. Consider a 5-minute breathing break to reset your nervous system before continuing.",
  "Mood and activity data indicate you're managing well. Maintaining your current routine and sleep schedule will help sustain this stability.",
  "Early stress signals detected in your session patterns. Journaling for 5 minutes about what's weighing on you can significantly reduce rumination.",
  "Your engagement patterns show resilience. One small act of self-care today — even a short walk — compounds into meaningful wellbeing over time.",
];

export const AIInsightCard: React.FC<Props> = ({ driftScore, moodAvg, journalCount, typingStress }) => {
  const [insight, setInsight]     = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [provider, setProvider]   = useState<AIProvider>('mock');
  const [ms, setMs]               = useState<number | null>(null);
  const [autoLoaded, setAutoLoaded] = useState(false);

  useEffect(() => {
    getActiveProvider().then(p => {
      setProvider(p);
      // Auto-load if AI is available
      if (p !== 'mock' && !autoLoaded) {
        setAutoLoaded(true);
        fetchInsight(p);
      }
    });
  }, []);

  const fetchInsight = async (_p?: AIProvider) => {
    setLoading(true);
    const t0 = Date.now();
    try {
      const text = await generateDailyInsight(driftScore, moodAvg, journalCount, typingStress);
      setInsight(text || FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)]);
      setMs(Date.now() - t0);
    } catch {
      setInsight(FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)]);
    }
    setLoading(false);
  };

  const providerColor = provider === 'ollama' ? '#10b981' : provider === 'gemini' ? '#60a5fa' : '#f59e0b';
  const providerLabel = provider === 'ollama' ? `Ollama · ${OLLAMA_MODEL}` : provider === 'gemini' ? 'Gemini 1.5 Flash' : 'Smart fallback';
  const ProviderIcon  = provider === 'ollama' ? Cpu : provider === 'gemini' ? Zap : WifiOff;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles style={{ width: 15, height: 15, color: 'var(--accent)' }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>AI Daily Insight</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <ProviderIcon style={{ width: 10, height: 10, color: providerColor }} />
              <span style={{ fontSize: 10, color: providerColor }}>{providerLabel}</span>
              {ms && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>· {ms}ms</span>}
            </div>
          </div>
        </div>
        <button
          onClick={() => fetchInsight()}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 8,
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            color: 'var(--accent)', fontSize: 11, fontWeight: 500,
            cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1,
          }}
        >
          <RefreshCw style={{ width: 11, height: 11, animation: loading ? 'spin-slow 1s linear infinite' : 'none' }} />
          {loading ? 'Generating…' : 'Refresh'}
        </button>
      </div>

      {loading && !insight ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[100, 85, 60].map((w, i) => (
            <div key={i} style={{
              height: 12, borderRadius: 6, background: 'var(--border-2)',
              width: `${w}%`,
              animation: 'pulse-red 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            {provider === 'ollama' ? `${OLLAMA_MODEL} is analysing your data…` : 'Generating personalised insight…'}
          </p>
        </div>
      ) : insight ? (
        <div className="animate-fade-in">
          <p style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.7 }}>{insight}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: providerColor, boxShadow: `0 0 6px ${providerColor}` }} />
            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
              Generated by {providerLabel} · Based on your Drift Index ({Math.round(driftScore)}), mood ({moodAvg.toFixed(1)}/10), and {journalCount} journal entries
            </span>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
            {provider === 'mock'
              ? 'Add an Ollama model or Gemini key to get personalised AI insights'
              : 'Click Refresh to generate your daily AI insight'}
          </p>
          {provider === 'mock' && (
            <code style={{ fontSize: 10, color: 'var(--text-3)', background: 'var(--surface-2)', padding: '4px 8px', borderRadius: 6 }}>
              VITE_OLLAMA_MODEL=mistral
            </code>
          )}
        </div>
      )}
    </div>
  );
};
