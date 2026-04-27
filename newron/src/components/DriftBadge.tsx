import React from 'react';
import type { DriftLevel } from '../types';

interface Props {
  level: DriftLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

const config = {
  stable:   { label: 'Stable',   dot: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  text: '#10b981' },
  declining:{ label: 'Declining',dot: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
  critical: { label: 'Critical', dot: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  text: '#ef4444' },
};

const sizes = {
  sm: { px: '8px 10px', gap: 5, dot: 6,  font: 11 },
  md: { px: '8px 14px', gap: 6, dot: 7,  font: 13 },
  lg: { px: '10px 16px',gap: 7, dot: 8,  font: 14 },
};

export const DriftBadge: React.FC<Props> = ({ level, score, size = 'md', showScore = false }) => {
  const c = config[level];
  const s = sizes[size];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: s.gap,
      padding: s.px, borderRadius: 99,
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.text, fontSize: s.font, fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: s.dot, height: s.dot, borderRadius: '50%',
        background: c.dot, flexShrink: 0,
        ...(level === 'critical' ? { animation: 'pulse-red 1.6s ease-in-out infinite' } : {}),
      }} />
      {c.label}
      {showScore && score !== undefined && (
        <span style={{ opacity: 0.65 }}>({score})</span>
      )}
    </span>
  );
};
