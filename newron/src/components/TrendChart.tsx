import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { DriftDataPoint, DriftLevel } from '../types';

interface Props {
  data: DriftDataPoint[];
  level: DriftLevel;
  height?: number;
  compact?: boolean;
}

const levelColor = {
  stable:   '#10b981',
  declining:'#f59e0b',
  critical: '#ef4444',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const score = payload[0].value as number;
  const lvl   = score >= 65 ? 'Critical' : score >= 35 ? 'Declining' : 'Stable';
  const color = score >= 65 ? '#ef4444' : score >= 35 ? '#f59e0b' : '#10b981';
  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--border-2)',
      borderRadius: 10, padding: '8px 12px', fontSize: 12,
    }}>
      <p style={{ color: 'var(--text-3)', marginBottom: 2 }}>{label}</p>
      <p style={{ color, fontWeight: 600 }}>{Math.round(score)} — {lvl}</p>
    </div>
  );
};

export const TrendChart: React.FC<Props> = ({ data, level, height = 200, compact = false }) => {
  const color = levelColor[level];
  const id    = `grad-${level}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 4, left: compact ? -24 : -4, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: 'var(--text-3)', fontSize: compact ? 10 : 11 }} axisLine={false} tickLine={false} />
        {!compact && <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />}
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={35} stroke="rgba(245,158,11,0.2)" strokeDasharray="4 4" />
        <ReferenceLine y={65} stroke="rgba(239,68,68,0.2)"  strokeDasharray="4 4" />
        <Area
          type="monotoneX" dataKey="score"
          stroke={color} strokeWidth={2}
          fill={`url(#${id})`}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: 'var(--bg)', strokeWidth: 2 }}
          style={{ filter: `drop-shadow(0 0 4px ${color}50)` }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
