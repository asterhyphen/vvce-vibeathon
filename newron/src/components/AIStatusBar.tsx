import React, { useEffect, useState } from 'react';
import { Cpu, WifiOff, Zap } from 'lucide-react';
import { getActiveProvider, OLLAMA_MODEL, type AIProvider } from '../lib/ai';

interface Props {
  lastResponseMs?: number;
  lastProvider?: AIProvider;
}

const PROVIDER_INFO: Record<AIProvider, { label: string; color: string; icon: React.ReactNode; detail: string }> = {
  ollama:  { label: 'Ollama',  color: '#10b981', icon: <Cpu  style={{ width: 11, height: 11 }} />, detail: `Local · ${OLLAMA_MODEL}` },
  gemini:  { label: 'Gemini', color: '#60a5fa', icon: <Zap  style={{ width: 11, height: 11 }} />, detail: 'gemini-1.5-flash · Free' },
  mock:    { label: 'Mock',   color: '#f59e0b', icon: <WifiOff style={{ width: 11, height: 11 }} />, detail: 'No AI key — using fallback' },
};

export const AIStatusBar: React.FC<Props> = ({ lastResponseMs, lastProvider }) => {
  const [provider, setProvider] = useState<AIProvider>('mock');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getActiveProvider().then(p => { setProvider(p); setChecking(false); });
  }, []);

  // Update when a response comes in
  useEffect(() => {
    if (lastProvider) setProvider(lastProvider);
  }, [lastProvider]);

  const info = PROVIDER_INFO[provider];

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 99,
      background: 'var(--surface)', border: '1px solid var(--border)',
      fontSize: 11,
    }}>
      {checking ? (
        <>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-3)', animation: 'pulse-red 1.5s infinite' }} />
          <span style={{ color: 'var(--text-3)' }}>Detecting AI…</span>
        </>
      ) : (
        <>
          <span style={{ color: info.color, display: 'flex', alignItems: 'center' }}>{info.icon}</span>
          <span style={{ color: info.color, fontWeight: 600 }}>{info.label}</span>
          <span style={{ color: 'var(--text-3)' }}>·</span>
          <span style={{ color: 'var(--text-2)' }}>{info.detail}</span>
          {lastResponseMs && provider !== 'mock' && (
            <>
              <span style={{ color: 'var(--text-3)' }}>·</span>
              <span style={{ color: 'var(--text-3)' }}>{lastResponseMs}ms</span>
            </>
          )}
          {provider !== 'mock' && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: info.color,
              boxShadow: `0 0 6px ${info.color}`,
              animation: 'pulse-red 2s infinite',
            }} />
          )}
        </>
      )}
    </div>
  );
};
