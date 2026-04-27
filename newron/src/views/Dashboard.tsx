import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, Activity, Clock, Zap, Eye } from 'lucide-react';
import { DriftRing } from '../components/DriftRing';
import { DriftBadge } from '../components/DriftBadge';
import { TrendChart } from '../components/TrendChart';
import { CrisisBanner } from '../components/CrisisBanner';
import { AIInsightCard } from '../components/AIInsightCard';
import type { DriftLevel, DriftDataPoint, BehavioralSignal } from '../types';
import { useAppContext } from '../context/AppContext';

interface Props {
  score: number;
  level: DriftLevel;
  trend: DriftDataPoint[];
  signals: BehavioralSignal;
  isAnalyzing: boolean;
  onOpenChat: () => void;
  onOpenAppointments: () => void;
}

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 16, padding: 20, ...style,
  }}>
    {children}
  </div>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; right?: React.ReactNode }> = ({ icon, title, right }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
    <span style={{ color: 'var(--accent)', display: 'flex' }}>{icon}</span>
    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{title}</span>
    {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
  </div>
);

const SignalCard: React.FC<{ label: string; value: string; icon: React.ReactNode; status: 'good' | 'warn' | 'bad' }> = ({ label, value, icon, status }) => {
  const colors = {
    good: { text: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
    warn: { text: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    bad:  { text: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)' },
  };
  const c = colors[status];
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 12, padding: '12px 14px',
      transition: 'all 0.4s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ color: c.text, opacity: 0.8, display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{value}</p>
    </div>
  );
};

export const Dashboard: React.FC<Props> = ({ score, level, trend, signals, isAnalyzing, onOpenChat, onOpenAppointments }) => {
  const { moodLog, journals } = useAppContext();
  const [showCrisis, setShowCrisis] = useState(false);
  const [prevLevel, setPrevLevel]   = useState<DriftLevel>(level);
  const [alert, setAlert]           = useState<string | null>(null);

  useEffect(() => {
    if (level === prevLevel) return;
    if (level === 'critical') { setShowCrisis(true); setAlert(null); }
    else if (level === 'declining' && prevLevel === 'stable') setAlert('Early warning signs detected. Consider taking a break.');
    else if (level === 'stable' && prevLevel !== 'stable') { setAlert(null); setShowCrisis(false); }
    setPrevLevel(level);
  }, [level, prevLevel]);

  const trendIcon = score > 50
    ? <TrendingUp  style={{ width: 14, height: 14, color: '#ef4444' }} />
    : score > 25
    ? <Minus       style={{ width: 14, height: 14, color: '#f59e0b' }} />
    : <TrendingDown style={{ width: 14, height: 14, color: '#10b981' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-fade-in">

      {showCrisis && <CrisisBanner onDismiss={() => setShowCrisis(false)} onChat={onOpenChat} />}

      {alert && !showCrisis && (
        <div className="animate-fade-in" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 12,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <Activity style={{ width: 14, height: 14, color: '#f59e0b', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#fcd34d', flex: 1 }}>{alert}</p>
          <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* Score card */}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <DriftRing score={score} size={156} isAnalyzing={isAnalyzing} />

          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <Brain style={{ width: 16, height: 16, color: 'var(--accent)' }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>Mental State Overview</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
              <DriftBadge level={level} size="md" />
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)' }}>
                {trendIcon}
                {score > 50 ? 'Trending up' : score > 25 ? 'Holding steady' : 'Trending well'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, maxWidth: 340, margin: '0 auto 16px' }}>
              {level === 'stable'   && 'Your behavioral patterns look healthy. Keep maintaining your current routine.'}
              {level === 'declining'&& 'Some early warning signs detected. Small changes now can prevent escalation.'}
              {level === 'critical' && 'Significant distress signals detected. Please reach out for support — you deserve care.'}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {level !== 'stable' && (
                <button onClick={onOpenChat} className="btn-primary" style={{ fontSize: 13 }}>
                  Talk to AI Support
                </button>
              )}
              {(level === 'declining' || level === 'critical') && (
                <button onClick={onOpenAppointments} className="btn-ghost" style={{
                  fontSize: 13,
                  ...(level === 'critical' ? {
                    background: 'rgba(239,68,68,0.1)',
                    borderColor: 'rgba(239,68,68,0.3)',
                    color: '#fca5a5',
                  } : {}),
                }}>
                  {level === 'critical' ? '⚡ Priority Appointment' : 'Book Appointment'}
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Trend */}
      <Card>
        <SectionTitle
          icon={<TrendingUp style={{ width: 15, height: 15 }} />}
          title="7-Day Drift Trend"
          right={
            <div style={{ display: 'flex', gap: 12 }}>
              {[['#10b981','Stable'],['#f59e0b','Declining'],['#ef4444','Critical']].map(([c,l]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-3)' }}>
                  <span style={{ width: 16, height: 2, background: c, borderRadius: 99, display: 'inline-block' }} />
                  {l}
                </span>
              ))}
            </div>
          }
        />
        <TrendChart data={trend} level={level} height={190} />
      </Card>

      {/* AI Daily Insight */}
      <AIInsightCard
        driftScore={score}
        moodAvg={moodLog.length ? moodLog.slice(0, 3).reduce((s, e) => s + e.value, 0) / Math.min(moodLog.length, 3) : 5}
        journalCount={journals.length}
        typingStress={null}
      />

      {/* Signals */}
      <Card>
        <SectionTitle
          icon={<Eye style={{ width: 15, height: 15 }} />}
          title="Passive Behavioral Signals"
          right={isAnalyzing && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--accent)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-red 1.6s infinite' }} />
              Analyzing
            </span>
          )}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <SignalCard label="Typing Speed" value={`${signals.typingSpeed.toFixed(1)} c/s`}
            icon={<Zap style={{ width: 13, height: 13 }} />}
            status={signals.typingSpeed < 1.5 ? 'bad' : signals.typingSpeed < 2.5 ? 'warn' : 'good'} />
          <SignalCard label="Backspace Rate" value={`${signals.backspaceRate.toFixed(0)}%`}
            icon={<Activity style={{ width: 13, height: 13 }} />}
            status={signals.backspaceRate > 30 ? 'bad' : signals.backspaceRate > 15 ? 'warn' : 'good'} />
          <SignalCard label="Avg Pause" value={`${(signals.pauseDuration / 1000).toFixed(1)}s`}
            icon={<Clock style={{ width: 13, height: 13 }} />}
            status={signals.pauseDuration > 1500 ? 'bad' : signals.pauseDuration > 700 ? 'warn' : 'good'} />
          <SignalCard label="Sentiment"
            value={signals.sentimentScore > 0.2 ? 'Positive' : signals.sentimentScore < -0.1 ? 'Negative' : 'Neutral'}
            icon={<Brain style={{ width: 13, height: 13 }} />}
            status={signals.sentimentScore < -0.2 ? 'bad' : signals.sentimentScore < 0.1 ? 'warn' : 'good'} />
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 12 }}>
          Updates in real-time as you type in AI Chat
        </p>
      </Card>
    </div>
  );
};
