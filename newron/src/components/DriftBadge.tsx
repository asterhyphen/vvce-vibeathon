import React from 'react';
import type { DriftLevel } from '../types';

interface Props {
  level: DriftLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

const config = {
  stable: {
    label: 'Stable',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  declining: {
    label: 'Declining',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  critical: {
    label: 'Critical',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-3 py-1 gap-1.5',
  lg: 'text-base px-4 py-1.5 gap-2',
};

export const DriftBadge: React.FC<Props> = ({ level, score, size = 'md', showScore = false }) => {
  const c = config[level];
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${c.bg} ${c.border} ${c.color} ${sizeClasses[size]}`}>
      <span className={`rounded-full ${c.dot} ${level === 'critical' ? 'pulse-red' : ''} ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
      {c.label}
      {showScore && score !== undefined && (
        <span className="opacity-70 ml-1">({score})</span>
      )}
    </span>
  );
};
