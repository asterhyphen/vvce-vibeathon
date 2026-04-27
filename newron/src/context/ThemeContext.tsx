import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId = 'mono' | 'dark' | 'light' | 'sage' | 'midnight';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  preview: string[]; // 3 hex swatches
  vars: Record<string, string>;
}

export const THEMES: Theme[] = [
  {
    id: 'mono',
    name: 'Mono',
    description: 'Pure black & white. Maximum clarity.',
    preview: ['#000000', '#ffffff', '#888888'],
    vars: {
      '--bg':           '#0a0a0a',
      '--bg-2':         '#111111',
      '--bg-3':         '#1a1a1a',
      '--surface':      '#161616',
      '--surface-2':    '#1f1f1f',
      '--border':       'rgba(255,255,255,0.08)',
      '--border-2':     'rgba(255,255,255,0.14)',
      '--text-1':       '#ffffff',
      '--text-2':       '#a0a0a0',
      '--text-3':       '#555555',
      '--accent':       '#ffffff',
      '--accent-dim':   'rgba(255,255,255,0.08)',
      '--accent-border':'rgba(255,255,255,0.2)',
      '--accent-text':  '#000000',
      '--nav-active-bg':'rgba(255,255,255,0.08)',
      '--nav-active-text':'#ffffff',
      '--chat-user-bg': 'linear-gradient(135deg,#333,#222)',
      '--chat-ai-bg':   'rgba(255,255,255,0.05)',
      '--scrollbar':    '#333',
      '--header-bg':    'rgba(10,10,10,0.85)',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Deep space with violet accents.',
    preview: ['#0a0b14', '#7c3aed', '#60a5fa'],
    vars: {
      '--bg':           '#080a14',
      '--bg-2':         '#0f1020',
      '--bg-3':         '#141628',
      '--surface':      'rgba(255,255,255,0.04)',
      '--surface-2':    'rgba(255,255,255,0.07)',
      '--border':       'rgba(255,255,255,0.08)',
      '--border-2':     'rgba(255,255,255,0.14)',
      '--text-1':       '#f1f5f9',
      '--text-2':       '#94a3b8',
      '--text-3':       '#475569',
      '--accent':       '#7c3aed',
      '--accent-dim':   'rgba(124,58,237,0.15)',
      '--accent-border':'rgba(124,58,237,0.4)',
      '--accent-text':  '#ffffff',
      '--nav-active-bg':'rgba(124,58,237,0.15)',
      '--nav-active-text':'#a78bfa',
      '--chat-user-bg': 'linear-gradient(135deg,#7c3aed,#4f46e5)',
      '--chat-ai-bg':   'rgba(255,255,255,0.06)',
      '--scrollbar':    '#3b3f6e',
      '--header-bg':    'rgba(8,10,20,0.85)',
    },
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Clean white. Easy on the eyes.',
    preview: ['#f8f9fa', '#1a1a2e', '#6366f1'],
    vars: {
      '--bg':           '#f4f4f5',
      '--bg-2':         '#ffffff',
      '--bg-3':         '#e4e4e7',
      '--surface':      'rgba(0,0,0,0.03)',
      '--surface-2':    'rgba(0,0,0,0.06)',
      '--border':       'rgba(0,0,0,0.08)',
      '--border-2':     'rgba(0,0,0,0.14)',
      '--text-1':       '#09090b',
      '--text-2':       '#52525b',
      '--text-3':       '#a1a1aa',
      '--accent':       '#6366f1',
      '--accent-dim':   'rgba(99,102,241,0.1)',
      '--accent-border':'rgba(99,102,241,0.35)',
      '--accent-text':  '#ffffff',
      '--nav-active-bg':'rgba(99,102,241,0.1)',
      '--nav-active-text':'#6366f1',
      '--chat-user-bg': 'linear-gradient(135deg,#6366f1,#4f46e5)',
      '--chat-ai-bg':   'rgba(0,0,0,0.04)',
      '--scrollbar':    '#d4d4d8',
      '--header-bg':    'rgba(244,244,245,0.9)',
    },
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Calm green. Grounding and natural.',
    preview: ['#0d1117', '#22c55e', '#86efac'],
    vars: {
      '--bg':           '#0b0f0c',
      '--bg-2':         '#111812',
      '--bg-3':         '#162018',
      '--surface':      'rgba(34,197,94,0.04)',
      '--surface-2':    'rgba(34,197,94,0.07)',
      '--border':       'rgba(34,197,94,0.1)',
      '--border-2':     'rgba(34,197,94,0.18)',
      '--text-1':       '#ecfdf5',
      '--text-2':       '#86efac',
      '--text-3':       '#4ade80',
      '--accent':       '#22c55e',
      '--accent-dim':   'rgba(34,197,94,0.15)',
      '--accent-border':'rgba(34,197,94,0.4)',
      '--accent-text':  '#000000',
      '--nav-active-bg':'rgba(34,197,94,0.12)',
      '--nav-active-text':'#4ade80',
      '--chat-user-bg': 'linear-gradient(135deg,#16a34a,#15803d)',
      '--chat-ai-bg':   'rgba(34,197,94,0.06)',
      '--scrollbar':    '#166534',
      '--header-bg':    'rgba(11,15,12,0.88)',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep blue. Focused and serene.',
    preview: ['#020617', '#3b82f6', '#93c5fd'],
    vars: {
      '--bg':           '#020617',
      '--bg-2':         '#0a0f1e',
      '--bg-3':         '#0f172a',
      '--surface':      'rgba(59,130,246,0.05)',
      '--surface-2':    'rgba(59,130,246,0.09)',
      '--border':       'rgba(59,130,246,0.1)',
      '--border-2':     'rgba(59,130,246,0.2)',
      '--text-1':       '#f0f9ff',
      '--text-2':       '#93c5fd',
      '--text-3':       '#3b82f6',
      '--accent':       '#3b82f6',
      '--accent-dim':   'rgba(59,130,246,0.15)',
      '--accent-border':'rgba(59,130,246,0.4)',
      '--accent-text':  '#ffffff',
      '--nav-active-bg':'rgba(59,130,246,0.12)',
      '--nav-active-text':'#60a5fa',
      '--chat-user-bg': 'linear-gradient(135deg,#1d4ed8,#1e40af)',
      '--chat-ai-bg':   'rgba(59,130,246,0.07)',
      '--scrollbar':    '#1e3a5f',
      '--header-bg':    'rgba(2,6,23,0.88)',
    },
  },
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES[0],
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    return (localStorage.getItem('newron-theme') as ThemeId) ?? 'mono';
  });

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    localStorage.setItem('newron-theme', themeId);
    // Set body bg immediately to avoid flash
    document.body.style.background = theme.vars['--bg'];
    document.body.style.color = theme.vars['--text-1'];
  }, [theme, themeId]);

  const setTheme = (id: ThemeId) => setThemeId(id);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
