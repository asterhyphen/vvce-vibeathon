import { useState, useEffect, useRef, useCallback } from 'react';
import type { DriftLevel, DriftDataPoint, BehavioralSignal } from '../types';

interface DriftState {
  score: number;
  level: DriftLevel;
  trend: DriftDataPoint[];
  signals: BehavioralSignal;
  isAnalyzing: boolean;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const generateInitialTrend = (): DriftDataPoint[] => {
  return DAYS.map((day, i) => ({
    day,
    score: 15 + Math.sin(i * 0.5) * 8 + Math.random() * 5,
  }));
};

const getLevelFromScore = (score: number): DriftLevel => {
  if (score >= 65) return 'critical';
  if (score >= 35) return 'declining';
  return 'stable';
};

export const useDriftEngine = () => {
  const [state, setState] = useState<DriftState>({
    score: 18,
    level: 'stable',
    trend: generateInitialTrend(),
    signals: {
      typingSpeed: 4.2,
      backspaceRate: 8,
      pauseDuration: 320,
      sentimentScore: 0.6,
      sessionLength: 12,
    },
    isAnalyzing: false,
  });

  const typingTimestamps = useRef<number[]>([]);
  const backspaceCount = useRef(0);
  const totalChars = useRef(0);
  const sessionStart = useRef(Date.now());
  const lastKeystroke = useRef(Date.now());
  const pauseAccumulator = useRef<number[]>([]);

  // Analyze text sentiment (simple keyword-based simulation)
  const analyzeSentiment = useCallback((text: string): number => {
    const negativeWords = ['sad', 'tired', 'exhausted', 'anxious', 'worried', 'stressed',
      'overwhelmed', 'hopeless', 'depressed', 'lonely', 'scared', 'angry', 'frustrated',
      'worthless', 'empty', 'numb', 'lost', 'broken', 'hurt', 'pain', 'cry', 'hate',
      'terrible', 'awful', 'horrible', 'bad', 'worse', 'worst', 'fail', 'failed'];
    const positiveWords = ['happy', 'good', 'great', 'better', 'okay', 'fine', 'calm',
      'peaceful', 'hopeful', 'grateful', 'thankful', 'love', 'joy', 'excited', 'proud',
      'confident', 'strong', 'well', 'nice', 'wonderful', 'amazing', 'fantastic'];

    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    words.forEach(word => {
      if (negativeWords.some(n => word.includes(n))) score -= 0.15;
      if (positiveWords.some(p => word.includes(p))) score += 0.1;
    });
    return Math.max(-1, Math.min(1, score));
  }, []);

  // Process a keystroke event
  const processKeystroke = useCallback((key: string, text: string) => {
    const now = Date.now();
    const pause = now - lastKeystroke.current;
    lastKeystroke.current = now;

    if (pause > 100 && pause < 5000) {
      pauseAccumulator.current.push(pause);
      if (pauseAccumulator.current.length > 20) pauseAccumulator.current.shift();
    }

    typingTimestamps.current.push(now);
    if (typingTimestamps.current.length > 30) typingTimestamps.current.shift();

    if (key === 'Backspace') {
      backspaceCount.current++;
    }
    totalChars.current++;

    // Calculate signals
    const recentTimestamps = typingTimestamps.current;
    let typingSpeed = 3.5;
    if (recentTimestamps.length > 2) {
      const elapsed = (recentTimestamps[recentTimestamps.length - 1] - recentTimestamps[0]) / 1000;
      typingSpeed = elapsed > 0 ? recentTimestamps.length / elapsed : 3.5;
    }

    const backspaceRate = totalChars.current > 0
      ? (backspaceCount.current / totalChars.current) * 100
      : 0;

    const avgPause = pauseAccumulator.current.length > 0
      ? pauseAccumulator.current.reduce((a, b) => a + b, 0) / pauseAccumulator.current.length
      : 300;

    const sentimentScore = text.length > 10 ? analyzeSentiment(text) : 0.3;
    const sessionLength = (Date.now() - sessionStart.current) / 60000;

    const signals: BehavioralSignal = {
      typingSpeed: Math.max(0.5, typingSpeed),
      backspaceRate: Math.min(100, backspaceRate),
      pauseDuration: avgPause,
      sentimentScore,
      sessionLength,
    };

    // Calculate drift score
    let driftScore = 0;

    // Slow typing → higher drift
    if (signals.typingSpeed < 1.5) driftScore += 25;
    else if (signals.typingSpeed < 2.5) driftScore += 15;
    else if (signals.typingSpeed < 3.5) driftScore += 5;

    // High backspace rate → rumination
    if (signals.backspaceRate > 30) driftScore += 25;
    else if (signals.backspaceRate > 20) driftScore += 15;
    else if (signals.backspaceRate > 10) driftScore += 8;

    // Long pauses → hesitation
    if (signals.pauseDuration > 1500) driftScore += 20;
    else if (signals.pauseDuration > 800) driftScore += 10;
    else if (signals.pauseDuration > 500) driftScore += 5;

    // Negative sentiment
    if (signals.sentimentScore < -0.3) driftScore += 25;
    else if (signals.sentimentScore < 0) driftScore += 12;
    else if (signals.sentimentScore > 0.3) driftScore -= 5;

    // Long session → fatigue
    if (signals.sessionLength > 60) driftScore += 10;
    else if (signals.sessionLength > 30) driftScore += 5;

    const clampedScore = Math.max(0, Math.min(100, driftScore));

    setState(prev => {
      const newTrend = [...prev.trend];
      // Update today's (last) value
      newTrend[newTrend.length - 1] = {
        ...newTrend[newTrend.length - 1],
        score: clampedScore,
      };
      return {
        ...prev,
        score: clampedScore,
        level: getLevelFromScore(clampedScore),
        trend: newTrend,
        signals,
        isAnalyzing: true,
      };
    });

    setTimeout(() => {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }, 800);
  }, [analyzeSentiment]);

  // Simulate passive background drift changes
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        // Slowly drift score based on inactivity
        const inactivity = (Date.now() - lastKeystroke.current) / 1000;
        let delta = 0;
        if (inactivity > 120) delta = 2; // 2 min inactivity → slight increase
        if (inactivity > 300) delta = 4; // 5 min inactivity → more increase

        const newScore = Math.max(0, Math.min(100, prev.score + delta * (Math.random() - 0.3)));
        return {
          ...prev,
          score: newScore,
          level: getLevelFromScore(newScore),
        };
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const resetSession = useCallback(() => {
    typingTimestamps.current = [];
    backspaceCount.current = 0;
    totalChars.current = 0;
    sessionStart.current = Date.now();
    lastKeystroke.current = Date.now();
    pauseAccumulator.current = [];
    setState({
      score: 18,
      level: 'stable',
      trend: generateInitialTrend(),
      signals: {
        typingSpeed: 4.2,
        backspaceRate: 8,
        pauseDuration: 320,
        sentimentScore: 0.6,
        sessionLength: 0,
      },
      isAnalyzing: false,
    });
  }, []);

  // Inject an external stress score (e.g. from typing test) — blends with current score
  const injectStress = useCallback((externalScore: number) => {
    setState(prev => {
      const blended = Math.round(prev.score * 0.4 + externalScore * 0.6);
      const clamped = Math.max(0, Math.min(100, blended));
      const newTrend = [...prev.trend];
      newTrend[newTrend.length - 1] = { ...newTrend[newTrend.length - 1], score: clamped };
      return {
        ...prev,
        score: clamped,
        level: getLevelFromScore(clamped),
        trend: newTrend,
        isAnalyzing: true,
      };
    });
    setTimeout(() => setState(prev => ({ ...prev, isAnalyzing: false })), 1200);
  }, []);

  return { ...state, processKeystroke, resetSession, injectStress };
};
