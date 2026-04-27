import React from 'react';

interface Props {
  score: number;
  size?: number;
  isAnalyzing?: boolean;
}

// Interpolate between green (0) → yellow (50) → red (100)
function scoreToColor(score: number): { stroke: string; glow: string; text: string } {
  const s = Math.max(0, Math.min(100, score));
  let r: number, g: number, b: number;

  if (s <= 50) {
    // green → yellow
    const t = s / 50;
    r = Math.round(16 + (234 - 16) * t);
    g = Math.round(185 + (179 - 185) * t);
    b = Math.round(129 + (8 - 129) * t);
  } else {
    // yellow → red
    const t = (s - 50) / 50;
    r = Math.round(234 + (239 - 234) * t);
    g = Math.round(179 + (68 - 179) * t);
    b = Math.round(8 + (68 - 8) * t);
  }

  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  return {
    stroke: hex,
    glow: `rgba(${r},${g},${b},0.45)`,
    text: hex,
  };
}

export const DriftRing: React.FC<Props> = ({ score, size = 160, isAnalyzing = false }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const colors = scoreToColor(score);

  const label = score >= 65 ? 'Critical' : score >= 35 ? 'Declining' : 'Stable';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer ambient glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          opacity: 0.18,
          transition: 'background 1s ease',
        }}
      />

      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', transition: 'all 0.5s ease' }}
      >
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9"
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{
            transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1), stroke 1s ease',
            filter: `drop-shadow(0 0 7px ${colors.glow})`,
          }}
        />
      </svg>

      {/* Center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold leading-none tabular-nums"
          style={{ fontSize: size * 0.22, color: colors.text, transition: 'color 1s ease' }}
        >
          {Math.round(score)}
        </span>
        <span className="text-slate-400 mt-0.5" style={{ fontSize: size * 0.085 }}>
          Drift Index
        </span>
        <span
          className="mt-0.5 font-medium"
          style={{ fontSize: size * 0.075, color: colors.text, transition: 'color 1s ease' }}
        >
          {label}
        </span>
        {isAnalyzing && (
          <span className="text-violet-400 mt-1" style={{ fontSize: size * 0.065 }}>
            analyzing…
          </span>
        )}
      </div>
    </div>
  );
};
