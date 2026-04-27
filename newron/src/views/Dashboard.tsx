import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, Activity, Clock, Zap, Eye } from 'lucide-react';
import { DriftRing } from '../components/DriftRing';
import { DriftBadge } from '../components/DriftBadge';
import { TrendChart } from '../components/TrendChart';
import { CrisisBanner } from '../components/CrisisBanner';
import type { DriftLevel, DriftDataPoint, BehavioralSignal } from '../types';

interface Props {
  score: number;
  level: DriftLevel;
  trend: DriftDataPoint[];
  signals: BehavioralSignal;
  isAnalyzing: boolean;
  onOpenChat: () => void;
  onOpenAppointments: () => void;
}

const SignalCard: React.FC<{ label: string; value: string; icon: React.ReactNode; status: 'good' | 'warn' | 'bad' }> = ({
  label, value, icon, status,
}) => {
  const colors = {
    good: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    warn: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    bad: 'text-red-400 bg-red-500/10 border-red-500/20',
  };
  return (
    <div className={`glass rounded-xl p-3 border ${colors[status]} transition-all duration-500`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="opacity-70">{icon}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
};

export const Dashboard: React.FC<Props> = ({
  score, level, trend, signals, isAnalyzing, onOpenChat, onOpenAppointments,
}) => {
  const [showCrisis, setShowCrisis] = useState(false);
  const [prevLevel, setPrevLevel] = useState<DriftLevel>(level);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (level !== prevLevel) {
      if (level === 'critical') {
        setShowCrisis(true);
        setAlertMessage(null);
      } else if (level === 'declining' && prevLevel === 'stable') {
        setAlertMessage('Your mental state is showing early signs of decline. Consider taking a break.');
      } else if (level === 'stable' && prevLevel !== 'stable') {
        setAlertMessage(null);
        setShowCrisis(false);
      }
      setPrevLevel(level);
    }
  }, [level, prevLevel]);

  const trendIcon = score > 50
    ? <TrendingUp className="w-4 h-4 text-red-400" />
    : score > 25
    ? <Minus className="w-4 h-4 text-amber-400" />
    : <TrendingDown className="w-4 h-4 text-emerald-400" />;

  const getTypingStatus = () => {
    if (signals.typingSpeed < 1.5) return 'bad';
    if (signals.typingSpeed < 2.5) return 'warn';
    return 'good';
  };

  const getBackspaceStatus = () => {
    if (signals.backspaceRate > 30) return 'bad';
    if (signals.backspaceRate > 15) return 'warn';
    return 'good';
  };

  const getSentimentStatus = () => {
    if (signals.sentimentScore < -0.2) return 'bad';
    if (signals.sentimentScore < 0.1) return 'warn';
    return 'good';
  };

  const getPauseStatus = () => {
    if (signals.pauseDuration > 1500) return 'bad';
    if (signals.pauseDuration > 700) return 'warn';
    return 'good';
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Crisis Banner */}
      {showCrisis && (
        <CrisisBanner
          onDismiss={() => setShowCrisis(false)}
          onChat={onOpenChat}
        />
      )}

      {/* Subtle alert */}
      {alertMessage && !showCrisis && (
        <div className="animate-fade-in flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
          <Activity className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">{alertMessage}</p>
          <button
            onClick={() => setAlertMessage(null)}
            className="ml-auto text-slate-500 hover:text-slate-300 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main score card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Drift Ring */}
          <div className="flex-shrink-0">
            <DriftRing score={score} level={level} size={160} isAnalyzing={isAnalyzing} />
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <Brain className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-slate-100">Mental State Overview</h2>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
              <DriftBadge level={level} size="lg" />
              <span className="flex items-center gap-1 text-sm text-slate-400">
                {trendIcon}
                {score > 50 ? 'Trending up' : score > 25 ? 'Holding steady' : 'Trending well'}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              {level === 'stable' && 'Your behavioral patterns look healthy. Keep maintaining your current routine.'}
              {level === 'declining' && 'Some early warning signs detected. Small changes now can prevent escalation.'}
              {level === 'critical' && 'Significant distress signals detected. Please reach out for support — you deserve care.'}
            </p>

            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              {level !== 'stable' && (
                <button
                  onClick={onOpenChat}
                  className="px-4 py-2 rounded-xl bg-violet-600/80 hover:bg-violet-600 text-white text-sm font-medium transition-all hover:scale-105"
                >
                  Talk to AI Support
                </button>
              )}
              {(level === 'declining' || level === 'critical') && (
                <button
                  onClick={onOpenAppointments}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 ${
                    level === 'critical'
                      ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300'
                      : 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300'
                  }`}
                >
                  {level === 'critical' ? '⚡ Priority Appointment' : 'Book Appointment'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 7-day trend */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <h3 className="font-medium text-slate-200">7-Day Drift Trend</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-emerald-400 inline-block rounded" /> Stable</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-amber-400 inline-block rounded" /> Declining</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-red-400 inline-block rounded" /> Critical</span>
          </div>
        </div>
        <TrendChart data={trend} level={level} height={200} />
      </div>

      {/* Behavioral signals */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-violet-400" />
          <h3 className="font-medium text-slate-200">Passive Behavioral Signals</h3>
          {isAnalyzing && (
            <span className="ml-auto text-xs text-violet-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Analyzing
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SignalCard
            label="Typing Speed"
            value={`${signals.typingSpeed.toFixed(1)} c/s`}
            icon={<Zap className="w-3.5 h-3.5" />}
            status={getTypingStatus()}
          />
          <SignalCard
            label="Backspace Rate"
            value={`${signals.backspaceRate.toFixed(0)}%`}
            icon={<Activity className="w-3.5 h-3.5" />}
            status={getBackspaceStatus()}
          />
          <SignalCard
            label="Avg Pause"
            value={`${(signals.pauseDuration / 1000).toFixed(1)}s`}
            icon={<Clock className="w-3.5 h-3.5" />}
            status={getPauseStatus()}
          />
          <SignalCard
            label="Sentiment"
            value={signals.sentimentScore > 0.2 ? 'Positive' : signals.sentimentScore < -0.1 ? 'Negative' : 'Neutral'}
            icon={<Brain className="w-3.5 h-3.5" />}
            status={getSentimentStatus()}
          />
        </div>
        <p className="text-xs text-slate-600 mt-3 text-center">
          Signals update in real-time as you type in the chat interface
        </p>
      </div>
    </div>
  );
};
