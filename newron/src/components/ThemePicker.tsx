import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, THEMES, type ThemeId } from '../context/ThemeContext';

export const ThemePicker: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-ghost p-2 rounded-xl"
        title="Change theme"
        style={{ padding: '7px' }}
      >
        <Palette className="w-4 h-4" style={{ color: 'var(--text-2)' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-2xl p-2 z-50 animate-fade-in"
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border-2)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          }}
        >
          <p className="text-xs px-2 py-1.5 mb-1" style={{ color: 'var(--text-3)' }}>
            APPEARANCE
          </p>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id as ThemeId); setOpen(false); }}
              className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all text-left"
              style={{
                background: theme.id === t.id ? 'var(--accent-dim)' : 'transparent',
              }}
              onMouseEnter={e => {
                if (theme.id !== t.id)
                  (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
              }}
              onMouseLeave={e => {
                if (theme.id !== t.id)
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {/* Swatches */}
              <div className="flex gap-0.5 flex-shrink-0">
                {t.preview.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: i === 0 ? 14 : 10,
                      height: i === 0 ? 14 : 10,
                      background: c,
                      border: '1px solid rgba(255,255,255,0.1)',
                      marginTop: i === 0 ? 0 : 2,
                    }}
                  />
                ))}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{t.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{t.description}</p>
              </div>

              {theme.id === t.id && (
                <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
