import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Heart, Lightbulb, RotateCcw, Cpu, Zap, Brain, Info } from 'lucide-react';
import type { ChatMessage, DriftLevel } from '../types';
import {
  getChatResponse, ollamaStream, getActiveProvider,
  OLLAMA_MODEL, type AIProvider,
  CBT_MOCK_VENT, CBT_MOCK_GUIDANCE, CBT_MOCK_MOOD_QUESTIONS,
  CBT_VENT_SYSTEM, CBT_GUIDANCE_SYSTEM, CBT_MOOD_ASSESSMENT_SYSTEM,
} from '../lib/ai';
import { DriftBadge } from '../components/DriftBadge';
import { useAuth } from '../context/AuthContext';

type ChatMode = 'vent' | 'guidance' | 'mood-assessment';

interface Props {
  level: DriftLevel;
  score: number;
  onKeystroke: (key: string, text: string) => void;
  onAIResponse?: (provider: AIProvider, ms: number) => void;
}

const PROVIDER_META: Record<AIProvider, { label: string; color: string; icon: React.ReactNode }> = {
  ollama: { label: `Ollama · ${OLLAMA_MODEL}`, color: '#10b981', icon: <Cpu style={{ width: 11, height: 11 }} /> },
  gemini: { label: 'Gemini 1.5 Flash',         color: '#60a5fa', icon: <Zap style={{ width: 11, height: 11 }} /> },
  mock:   { label: 'CBT-guided responses',      color: '#a78bfa', icon: <Brain style={{ width: 11, height: 11 }} /> },
};

const MODE_CONFIG: Record<ChatMode, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
  'vent':            { label: 'Vent',       icon: <Heart  style={{ width: 12, height: 12 }} />, color: '#f472b6', desc: 'Be heard without judgment' },
  'guidance':        { label: 'Guidance',   icon: <Lightbulb style={{ width: 12, height: 12 }} />, color: '#60a5fa', desc: 'CBT techniques & strategies' },
  'mood-assessment': { label: 'Check-in',   icon: <Brain  style={{ width: 12, height: 12 }} />, color: '#a78bfa', desc: 'AI-guided mood assessment' },
};

// CBT-grounded opening messages per mode
const OPENING: Record<ChatMode, (level: DriftLevel, name: string) => string> = {
  'vent': (level, name) => level === 'critical'
    ? `${name}, I can see your stress indicators are quite high right now. I'm here with you — no judgment, no rush. What's been weighing on you most today?`
    : level === 'declining'
    ? `Hey ${name}. I've noticed some patterns suggesting things might feel heavier than usual. I'm here to listen. What's been going on?`
    : `Hi ${name}. I'm here whenever you need to talk. What's on your mind today?`,

  'guidance': (_level, name) =>
    `Hi ${name}. I'm here to offer evidence-based CBT strategies tailored to what you're going through. What situation or feeling would you like to work through?`,

  'mood-assessment': (_level, name) =>
    `Hi ${name}. I'd like to do a brief check-in to understand how you're really doing. I'll ask a few questions — there are no right or wrong answers. How has your day been so far?`,
};

// Fallback responses when no AI is available
const getMockResponse = (text: string, mode: ChatMode, questionIndex: number): string => {
  if (mode === 'mood-assessment') {
    return CBT_MOCK_MOOD_QUESTIONS[Math.min(questionIndex, CBT_MOCK_MOOD_QUESTIONS.length - 1)];
  }
  const pool = mode === 'vent' ? CBT_MOCK_VENT : CBT_MOCK_GUIDANCE;
  return pool[Math.abs(text.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % pool.length];
};

const ThinkingDots = () => (
  <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: 6, height: 6, borderRadius: '50%',
        background: 'var(--accent)', opacity: 0.7,
        animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
  </div>
);

export const ChatSupport: React.FC<Props> = ({ level, score, onKeystroke, onAIResponse }) => {
  const { user } = useAuth();
  const userName = user?.name?.split(' ')[0] || 'there';

  const [mode, setMode] = useState<ChatMode>('vent');
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '0', role: 'ai', timestamp: new Date(), mode: 'vent',
    content: OPENING['vent'](level, userName),
  }]);
  const [input, setInput]           = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activeProvider, setActiveProvider] = useState<AIProvider>('mock');
  const [lastMs, setLastMs]         = useState<number | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  const [moodQuestionIdx, setMoodQuestionIdx] = useState(1); // tracks which CBT question we're on
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const sendingRef     = useRef(false); // race condition guard

  useEffect(() => {
    getActiveProvider().then(setActiveProvider);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, streamingText]);

  // Switch mode — reset chat with new opening
  const switchMode = useCallback((newMode: ChatMode) => {
    setMode(newMode);
    setMessages([{
      id: Date.now().toString(), role: 'ai', timestamp: new Date(), mode: newMode,
      content: OPENING[newMode](level, userName),
    }]);
    setMoodQuestionIdx(1);
    setTokenCount(0);
    setLastMs(null);
    sendingRef.current = false;
    setIsThinking(false);
    setStreamingText('');
  }, [level, userName]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeystroke(e.key, input);
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [input, onKeystroke]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sendingRef.current) return;

    // Race condition guard — set BEFORE any async work
    sendingRef.current = true;
    setIsThinking(true);
    setStreamingText('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(), role: 'user',
      content: text, timestamp: new Date(), mode,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    const history = messages.slice(-8).map(m => ({
      role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }));

    const t0 = Date.now();

    const finish = (content: string, provider: AIProvider) => {
      const ms = Date.now() - t0;
      setIsThinking(false);
      setStreamingText('');
      setLastMs(ms);
      sendingRef.current = false;
      if (provider !== 'mock') onAIResponse?.(provider, ms);
      if (mode === 'mood-assessment') setMoodQuestionIdx(prev => prev + 1);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'ai',
        content, timestamp: new Date(), mode,
      }]);
    };

    // ── Ollama streaming ──────────────────────────────────────────────────────
    if (activeProvider === 'ollama') {
      const ctx = history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      const system = mode === 'vent'
        ? CBT_VENT_SYSTEM(score, ctx)
        : mode === 'guidance'
        ? CBT_GUIDANCE_SYSTEM(score, ctx)
        : CBT_MOOD_ASSESSMENT_SYSTEM(userName);

      let tokens = 0;
      ollamaStream(
        system, text,
        (tok) => { setStreamingText(prev => prev + tok); tokens++; setTokenCount(tokens); },
        (full) => finish(full || getMockResponse(text, mode, moodQuestionIdx), 'ollama'),
        (_err) => finish(getMockResponse(text, mode, moodQuestionIdx), 'mock')
      );
      return;
    }

    // ── Gemini / mock ─────────────────────────────────────────────────────────
    try {
      const result = await getChatResponse(text, mode, score, history, userName);
      finish(result?.text || getMockResponse(text, mode, moodQuestionIdx), result?.provider ?? 'mock');
    } catch {
      finish(getMockResponse(text, mode, moodQuestionIdx), 'mock');
    }
  }, [input, mode, score, messages, activeProvider, moodQuestionIdx, userName, onAIResponse]);

  const pMeta = PROVIDER_META[activeProvider];
  const mMeta = MODE_CONFIG[mode];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="animate-fade-in">

      {/* Disclaimer banner — shown once */}
      {showDisclaimer && (
        <div className="animate-fade-in" style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '10px 14px', borderRadius: 12,
          background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
        }}>
          <Info style={{ width: 14, height: 14, color: '#a78bfa', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5, flex: 1 }}>
            Newron AI uses CBT-informed responses for support and psychoeducation. It is not a substitute for professional mental health care. If you're in crisis, please contact a qualified professional.
          </p>
          <button onClick={() => setShowDisclaimer(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 14, flexShrink: 0 }}>
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot style={{ width: 18, height: 18, color: 'var(--accent)' }} />
              </div>
              <span style={{
                position: 'absolute', bottom: 1, right: 1,
                width: 10, height: 10, borderRadius: '50%',
                background: pMeta.color, border: '2px solid var(--bg)',
                boxShadow: `0 0 6px ${pMeta.color}`,
              }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Newron AI</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span style={{ color: pMeta.color, display: 'flex' }}>{pMeta.icon}</span>
                <span style={{ fontSize: 11, color: pMeta.color, fontWeight: 500 }}>{pMeta.label}</span>
                {lastMs && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>· {lastMs}ms</span>}
                {tokenCount > 0 && activeProvider === 'ollama' && (
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>· {tokenCount}t</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DriftBadge level={level} size="sm" showScore score={Math.round(score)} />
            <button
              onClick={() => switchMode(mode)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}
              title="Reset conversation"
            >
              <RotateCcw style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* Mode selector */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {(Object.entries(MODE_CONFIG) as [ChatMode, typeof MODE_CONFIG[ChatMode]][]).map(([id, cfg]) => (
            <button
              key={id}
              onClick={() => switchMode(id)}
              title={cfg.desc}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 11px', borderRadius: 8, border: '1px solid',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: mode === id ? `${cfg.color}18` : 'transparent',
                borderColor: mode === id ? `${cfg.color}50` : 'var(--border)',
                color: mode === id ? cfg.color : 'var(--text-2)',
              }}
            >
              {cfg.icon}
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Mode description */}
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
          {mMeta.desc}
          {mode === 'mood-assessment' && ' · AI will ask structured CBT questions'}
          {mode === 'guidance' && ' · Evidence-based techniques, named and explained'}
        </p>
      </div>

      {/* Messages */}
      <div style={{
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10,
        maxHeight: 460, paddingRight: 4, minHeight: 200,
      }}>
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className="animate-fade-in"
            style={{
              display: 'flex', alignItems: 'flex-end', gap: 8,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              animationDelay: `${Math.min(i, 3) * 0.04}s`,
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'ai' ? 'var(--accent-dim)' : 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {msg.role === 'ai'
                ? <Bot  style={{ width: 13, height: 13, color: 'var(--accent)' }} />
                : <User style={{ width: 13, height: 13, color: 'var(--text-2)' }} />
              }
            </div>

            {/* Bubble */}
            <div
              className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
              style={{ maxWidth: '74%', padding: '10px 14px' }}
            >
              <p style={{
                fontSize: 13, lineHeight: 1.65,
                color: msg.role === 'user' ? '#fff' : 'var(--text-1)',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 10, opacity: 0.45, color: msg.role === 'user' ? '#fff' : 'var(--text-3)' }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.role === 'ai' && (
                  <span style={{ fontSize: 10, color: pMeta.color, opacity: 0.7 }}>
                    CBT-informed
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming / thinking */}
        {(isThinking || streamingText) && (
          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot style={{ width: 13, height: 13, color: 'var(--accent)' }} />
            </div>
            <div className="chat-bubble-ai" style={{ maxWidth: '74%', padding: '10px 14px' }}>
              {streamingText ? (
                <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-1)', whiteSpace: 'pre-wrap' }}>
                  {streamingText}
                  <span style={{
                    display: 'inline-block', width: 2, height: 13,
                    background: 'var(--accent)', marginLeft: 2,
                    animation: 'pulse-red 0.7s infinite', verticalAlign: 'middle',
                  }} />
                </p>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ThinkingDots />
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {activeProvider === 'ollama' ? `${OLLAMA_MODEL} thinking…` : 'Thinking…'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'vent' ? "Share what's on your mind…" :
              mode === 'guidance' ? "Describe what you're going through…" :
              "Type your answer…"
            }
            rows={2}
            aria-label="Chat input"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, color: 'var(--text-1)', resize: 'none', lineHeight: 1.6,
              fontFamily: 'inherit', maxHeight: 120,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            aria-label="Send message"
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0,
              background: input.trim() && !isThinking ? 'var(--accent)' : 'var(--surface-2)',
              color: input.trim() && !isThinking ? 'var(--accent-text)' : 'var(--text-3)',
              cursor: input.trim() && !isThinking ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <Send style={{ width: 15, height: 15 }} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {mode === 'vent' ? '💜 Safe space · CBT-informed listening' :
             mode === 'guidance' ? '🧠 Evidence-based CBT techniques' :
             '📋 Structured mood assessment · Enter to send'}
          </p>
          <span style={{ fontSize: 10, color: pMeta.color, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: pMeta.color, boxShadow: `0 0 4px ${pMeta.color}` }} />
            {activeProvider === 'mock' ? 'CBT fallback' : 'AI live'}
          </span>
        </div>
      </div>
    </div>
  );
};
