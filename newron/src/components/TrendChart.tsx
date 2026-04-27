import React from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import type { DriftDataPoint, DriftLevel } from '../types';

interface Props {
  data: DriftDataPoint[];
  level: DriftLevel;
  height?: number;
  compact?: boolean;
}

const levelGradients = {
  stable: { color: '#10b981', gradient: ['#10b981', '#059669'] },
  declining: { color: '#f59e0b', gradient: ['#f59e0b', '#d97706'] },
  critical: { color: '#ef4444', gradient: ['#ef4444', '#dc2626'] },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    const level = score >= 65 ? 'Critical' : score >= 35 ? 'Declining' : 'Stable';
    const color = score >= 65 ? '#ef4444' : score >= 35 ? '#f59e0b' : '#10b981';
    return (
      <div className="glass rounded-xl px-3 py-2 text-sm">
        <p className="text-slate-400 text-xs mb-1">{label}</p>
        <p className="font-semibold" style={{ color }}>
          {Math.round(score)} — {level}
        </p>
      </div>
    );
  }
  return null;
};

export const TrendChart: React.FC<Props> = ({ data, level, height = 200, compact = false }) => {
  const { color } = levelGradients[level];
  const gradientId = `drift-gradient-${level}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: compact ? -20 : 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: '#64748b', fontSize: compact ? 10 : 12 }}
          axisLine={false}
          tickLine={false}
        />
        {!compact && (
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
        )}
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={35} stroke="rgba(245,158,11,0.2)" strokeDasharray="4 4" />
        <ReferenceLine y={65} stroke="rgba(239,68,68,0.2)" strokeDasharray="4 4" />
        <Area
          type="monotoneX"
          dataKey="score"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 5, fill: color, stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 }}
          style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
