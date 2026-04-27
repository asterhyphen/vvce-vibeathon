import React, { useState, useEffect, useRef } from 'react';
import { Wind, Play, Square, Brain, RefreshCw } from 'lucide-react';
import { getBreathingGuidance, getActiveProvider } from '../lib/ai';

interface Technique {
  name: string;
  pattern: [number, number, number, number]; // inhale, hold, exhale, hold
  description: string;
  color: string;
  forStress: string;
}

const TECHNIQUES: Technique[] = [
  { name: 'Box Breathing',    pattern: [4, 4, 4, 4], description: 'Equal counts. Used by Navy SEALs for acute stress.', color: '#60a5fa', forStress: 'High stress, anxiety' },
  { name: '4-7-8 Breathing',  pattern: [4, 7, 8, 0], description: 'Activates parasympathetic nervous system rapidly.', color: '#a78bfa', forStress: 'Panic, insomnia' },
  { name: 'Coherent Breathing',pattern: [5, 0, 5, 0], description: 'Maximises heart rate variability. Deeply calming.', color: '#34d399', forStress: 'General anxiety' },
  { name: 'Physiological Sigh',pattern: [2, 1, 8, 0], description: 'Double inhale + long exhale. Fastest stress relief.', color: '#f472b6', forStress: 'Immediate relief' },
];

const PHASE_LABELS = ['Inhale', 'Hold', 'Exhale', 'Hold'];

export const BreathCoach: React.FC<{ driftScore: number }> = ({ driftScore }) => {
  const [selected, setSelected]   = useState(0);
  const [running, setRunning]     = useState(false);
  const [phase, setPhase]         = useState(0);   // 0-3
  const [tick, setTick]           = useState(0);   // seconds in current phase
  const [cycles, setCycles]       = useState(0);
  const [aiRec, setAiRec]         = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tech = TECHNIQUES[selected];
  const phaseDuration = tech.pattern[phase];
  const progress = phaseDuration > 0 ? tick / phaseDuration : 0;

  // Breathing engine
  useEffect(() => {
    if (!running) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTick(prev => {
        const dur = tech.pattern[phase];
        if (dur === 0 || prev + 1 >= dur) {
          // Move to next non-zero phase
          let nextPhase = (phase + 1) % 4;
          while (tech.pattern[nextPhase] === 0) nextPhase = (nextPhase + 1) % 4;
          setPhase(nextPhase);
          if (nextPhase === 0) setCycles(c => c + 1);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, phase, tech]);

  const stop = () => { setRunning(false); setPhase(0); setTick(0); };

  const fetchAiRec = async () => {
    setLoadingAi(true);
    const p = await getActiveProvider();
    if (p !== 'mock') {
      const text = await getBreathingGuidance(driftScore);
      setAiRec(text);
    } else {
      setAiRec(driftScore >= 65
        ? "Try 4-7-8 breathing: inhale 4 counts, hold 7, exhale 8. This activates your parasympathetic nervous system within 2 cycles."
        : driftScore >= 35
        ? "Box breathing (4-4-4-4) is ideal for your current stress level — it balances your nervous system without over-stimulating it."
        : "Coherent breathing (5-5) will maintain your calm state and improve heart rate variability over time.");
    }
    setLoadingAi(false);
  };

  // Ring animation values
  const ringSize = 180;
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const ringProgress = phase === 0 ? progress : phase === 2 ? 1 - progress : phase === 1 ? 1 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-fade-in">

      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wind style={{ width: 18, height: 18, color: 'var(--accent)' }} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>Breath Coach</p>
            <p style={{ fontSize: 12, color: 'var(--text-2)' }}>AI-guided breathing for stress relief</p>
          </div>
          {cycles > 0 && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{cycles}</p>
              <p style={{ fontSize: 10, color: 'var(--text-3)' }}>cycles</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendation */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Brain style={{ width: 14, height: 14, color: 'var(--accent)' }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>AI Recommendation</span>
          </div>
          <button onClick={fetchAiRec} disabled={loadingAi} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 8,
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            color: 'var(--accent)', fontSize: 11, cursor: 'pointer', opacity: loadingAi ? 0.6 : 1,
          }}>
            <RefreshCw style={{ width: 10, height: 10, animation: loadingAi ? 'spin-slow 1s linear infinite' : 'none' }} />
            {loadingAi ? 'Asking AI…' : 'Ask AI'}
          </button>
        </div>
        {aiRec ? (
          <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }} className="animate-fade-in">{aiRec}</p>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Click "Ask AI" to get a personalised breathing recommendation based on your Drift Index ({Math.round(driftScore)}).
          </p>
        )}
      </div>

      {/* Technique selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {TECHNIQUES.map((t, i) => (
          <button key={t.name} onClick={() => { setSelected(i); stop(); }}
            style={{
              padding: '12px 14px', borderRadius: 12, border: '1px solid',
              borderColor: selected === i ? t.color : 'var(--border)',
              background: selected === i ? `${t.color}12` : 'var(--surface)',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
            }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: selected === i ? t.color : 'var(--text-1)', marginBottom: 2 }}>{t.name}</p>
            <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>{t.pattern.filter(Boolean).join('-')} pattern</p>
            <p style={{ fontSize: 10, color: 'var(--text-3)' }}>{t.forStress}</p>
          </button>
        ))}
      </div>

      {/* Breathing visualiser */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      }}>
        {/* Animated ring */}
        <div style={{ position: 'relative', width: ringSize, height: ringSize }}>
          {/* Outer glow */}
          {running && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: `radial-gradient(circle, ${tech.color}20 0%, transparent 70%)`,
              transform: `scale(${0.9 + ringProgress * 0.3})`,
              transition: 'transform 1s ease',
            }} />
          )}
          <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx={ringSize/2} cy={ringSize/2} r={radius} fill="none" stroke="var(--border-2)" strokeWidth={8} />
            {/* Progress */}
            <circle cx={ringSize/2} cy={ringSize/2} r={radius} fill="none"
              stroke={tech.color} strokeWidth={8} strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - ringProgress)}
              style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 8px ${tech.color}80)` }}
            />
          </svg>
          {/* Center text */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            {running ? (
              <>
                <span style={{ fontSize: 32, fontWeight: 700, color: tech.color, lineHeight: 1 }}>
                  {phaseDuration > 0 ? phaseDuration - tick : ''}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>{PHASE_LABELS[phase]}</span>
              </>
            ) : (
              <>
                <Wind style={{ width: 28, height: 28, color: 'var(--text-3)', marginBottom: 4 }} />
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Ready</span>
              </>
            )}
          </div>
        </div>

        {/* Pattern display */}
        <div style={{ display: 'flex', gap: 8 }}>
          {PHASE_LABELS.map((label, i) => tech.pattern[i] > 0 && (
            <div key={label} style={{
              padding: '6px 12px', borderRadius: 8,
              background: running && phase === i ? `${tech.color}20` : 'var(--surface-2)',
              border: `1px solid ${running && phase === i ? tech.color : 'var(--border)'}`,
              transition: 'all 0.3s ease',
            }}>
              <p style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center' }}>{label}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: running && phase === i ? tech.color : 'var(--text-2)', textAlign: 'center' }}>
                {tech.pattern[i]}s
              </p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10 }}>
          {!running ? (
            <button onClick={() => { setRunning(true); setPhase(0); setTick(0); setCycles(0); }}
              className="btn-primary" style={{ gap: 6, padding: '10px 24px' }}>
              <Play style={{ width: 15, height: 15 }} /> Start
            </button>
          ) : (
            <button onClick={stop} className="btn-ghost" style={{ gap: 6, padding: '10px 24px' }}>
              <Square style={{ width: 15, height: 15 }} /> Stop
            </button>
          )}
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', maxWidth: 280 }}>
          {tech.description}
        </p>
      </div>
    </div>
  );
};
