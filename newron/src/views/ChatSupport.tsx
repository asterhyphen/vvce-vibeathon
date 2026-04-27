import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Heart, Lightbulb, RotateCcw, Cpu, Zap, WifiOff } from 'lucide-react';
import type { ChatMessage, DriftLevel } from '../types';
import { ventResponses, guidanceResponses } from '../data/mockData';
import { getChatResponse, ollamaStream, getActiveProvider, OLLAMA_MODEL, type AIProvider } from '../lib/ai';
import { DriftBadge } from '../components/DriftBadge';

interface Props {
  level: DriftLevel;
  score: number;
  onKeystroke: (key: string, text: string) => void;
  onAIResponse?: (provider: AIProvider, ms: number) => void;
}

const getFallback = (text: string, mode: 'vent' | 'guidance') => {
  const pool = mode === 'vent' ? ventResponses : guidanceResponses;
  return pool[Math.abs(text.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % pool.length];
};

const PROVIDER_LABEL: Record<AIProvider, { label: string; color: string; icon: React.ReactNode }> = {
  ollama: { label: `Ollama · ${OLLAMA_MODEL}`, color: '#10b981', icon: <Cpu style={{ width: 12, height: 12 }} /> },
  gemini: { label: 'Gemini 1.5 Flash',         color: '#60a5fa', icon: <Zap style={{ width: 12, height: 12 }} /> },
  mock:   { label: 'Mock responses',            color: '#f59e0b', icon: <WifiOff style={{ width: 12, height: 12 }} /> },
};

// Animated typing dots
const ThinkingDots = () => (
  <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: 7, height: 7, borderRadius: '50%',
        background: 'var(--accent)',
        opacity: 0.7,
        animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
  </div>
);

export const ChatSupport: React.FC<Props> = ({ level, score, onKeystroke, onAIResponse }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '0', role: 'ai', timestamp: new Date(), mode: 'vent',
    content: level === 'critical'
      ? "I noticed your Drift Index is elevated. I'm here with you — no judgment. Would you like to talk, or would you prefer some calming guidance?"
      : level === 'declining'
      ? "Hey — I've been noticing some patterns suggesting you might be carrying more than usual. I'm here to listen. How are you really doing?"
      : "Hi there. I'm your Newron AI companion. I'm here whenever you need to talk, vent, or get guidance. How are you feeling today?\nThis is just a chatbot for general purpose advice and is in no means a medical advisor, the developers are not responsible for what the advices that the chatbot gives",
  }]);

  const [input, setInput]         = useState('');
  const [mode, setMode]           = useState<'vent' | 'guidance'>('vent');
  const [isThinking, setIsThinking] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activeProvider, setActiveProvider] = useState<AIProvider>('mock');
  const [lastMs, setLastMs]       = useState<number | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getActiveProvider().then(setActiveProvider);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, streamingText]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeystroke(e.key, input);
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [input, onKeystroke]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isThinking) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date(), mode };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);
    setStreamingText('');

    const history = messages.slice(-6).map(m => ({
      role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }));

    const t0 = Date.now();

    // Try streaming with Ollama first
    if (activeProvider === 'ollama') {
      const ctx = history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      const system = mode === 'vent'
        ? `You are a compassionate mental health support companion called Newron AI. Distress score: ${score}/100. Be warm, empathetic, non-judgmental. Ask gentle follow-up questions. Never diagnose. Max 3 sentences.${ctx ? `\n\nPrior:\n${ctx}` : ''}`
        : `You are a practical mental health guidance companion called Newron AI. Distress score: ${score}/100. Give evidence-based coping strategies. Be concise. Max 4 sentences.${ctx ? `\n\nPrior:\n${ctx}` : ''}`;

      let tokens = 0;
      ollamaStream(
        system, text,
        (tok) => { setStreamingText(prev => prev + tok); tokens++; setTokenCount(tokens); },
        (full) => {
          const ms = Date.now() - t0;
          setIsThinking(false);
          setStreamingText('');
          setLastMs(ms);
          onAIResponse?.('ollama', ms);
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(), role: 'ai',
            content: full || getFallback(text, mode),
            timestamp: new Date(), mode,
          }]);
        },
        (_err) => {
          setIsThinking(false);
          setStreamingText('');
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(), role: 'ai',
            content: getFallback(text, mode), timestamp: new Date(), mode,
          }]);
        }
      );
      return;
    }

    // Gemini or mock
    try {
      const result = await getChatResponse(text, mode, score, history);
      const ms = Date.now() - t0;
      setLastMs(ms);
      if (result) onAIResponse?.(result.provider, ms);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'ai',
        content: result?.text || getFallback(text, mode),
        timestamp: new Date(), mode,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'ai',
        content: getFallback(text, mode), timestamp: new Date(), mode,
      }]);
    } finally {
      setIsThinking(false);
      setStreamingText('');
    }
  }, [input, mode, score, messages, isThinking, activeProvider, onAIResponse]);

  const pInfo = PROVIDER_LABEL[activeProvider];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 600 }} className="animate-fade-in">

      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* AI avatar with live pulse */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot style={{ width: 18, height: 18, color: 'var(--accent)' }} />
              </div>
              {activeProvider !== 'mock' && (
                <span style={{
                  position: 'absolute', bottom: 1, right: 1,
                  width: 10, height: 10, borderRadius: '50%',
                  background: pInfo.color,
                  border: '2px solid var(--bg)',
                  boxShadow: `0 0 8px ${pInfo.color}`,
                }} />
              )}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Newron AI</p>
              {/* Live AI provider badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span style={{ color: pInfo.color, display: 'flex' }}>{pInfo.icon}</span>
                <span style={{ fontSize: 11, color: pInfo.color, fontWeight: 500 }}>{pInfo.label}</span>
                {lastMs && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>· {lastMs}ms</span>}
                {tokenCount > 0 && activeProvider === 'ollama' && (
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>· {tokenCount} tokens</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DriftBadge level={level} size="sm" showScore score={Math.round(score)} />
            <button onClick={() => {
              setMessages([{ id: '0', role: 'ai', content: "Let's start fresh. I'm here — what's on your mind?", timestamp: new Date(), mode: 'vent' }]);
              setTokenCount(0); setLastMs(null);
            }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }} title="Clear chat">
              <RotateCcw style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {(['vent', 'guidance'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 8, border: '1px solid',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: mode === m ? 'var(--accent-dim)' : 'transparent',
              borderColor: mode === m ? 'var(--accent-border)' : 'var(--border)',
              color: mode === m ? 'var(--accent)' : 'var(--text-2)',
            }}>
              {m === 'vent' ? <Heart style={{ width: 12, height: 12 }} /> : <Lightbulb style={{ width: 12, height: 12 }} />}
              {m === 'vent' ? 'Vent Mode' : 'Guidance Mode'}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
        maxHeight: 440, paddingRight: 4,
      }}>
        {messages.map((msg, i) => (
          <div key={msg.id} className="animate-fade-in"
            style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', animationDelay: `${i * 0.03}s` }}>
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
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
              style={{ maxWidth: '72%', padding: '10px 14px' }}>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: msg.role === 'user' ? '#fff' : 'var(--text-1)' }}>
                {msg.content}
              </p>
              <p style={{ fontSize: 10, marginTop: 4, opacity: 0.5, color: msg.role === 'user' ? '#fff' : 'var(--text-3)' }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {msg.role === 'ai' && activeProvider !== 'mock' && (
                  <span style={{ marginLeft: 6, color: pInfo.color }}>· {pInfo.label.split(' ')[0]}</span>
                )}
              </p>
            </div>
          </div>
        ))}

        {/* Streaming response — text appears token by token */}
        {(isThinking || streamingText) && (
          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot style={{ width: 13, height: 13, color: 'var(--accent)' }} />
            </div>
            <div className="chat-bubble-ai" style={{ maxWidth: '72%', padding: '10px 14px' }}>
              {streamingText ? (
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-1)' }}>
                  {streamingText}
                  <span style={{
                    display: 'inline-block', width: 2, height: 14,
                    background: 'var(--accent)', marginLeft: 2,
                    animation: 'pulse-red 0.8s infinite',
                    verticalAlign: 'middle',
                  }} />
                </p>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ThinkingDots />
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {activeProvider === 'ollama' ? `${OLLAMA_MODEL} is thinking…` : 'AI is thinking…'}
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
            placeholder={mode === 'vent' ? "Share what's on your mind…" : "Describe what you're going through…"}
            rows={2}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, color: 'var(--text-1)', resize: 'none', lineHeight: 1.6,
              fontFamily: 'inherit', maxHeight: 120,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none',
              background: input.trim() && !isThinking ? 'var(--accent)' : 'var(--surface-2)',
              color: input.trim() && !isThinking ? 'var(--accent-text)' : 'var(--text-3)',
              cursor: input.trim() && !isThinking ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease', flexShrink: 0,
            }}
          >
            <Send style={{ width: 15, height: 15 }} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {mode === 'vent' ? '💜 Safe space. Private.' : '💡 Evidence-based guidance.'}
          </p>
          {activeProvider !== 'mock' && (
            <span style={{ fontSize: 10, color: pInfo.color, display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: pInfo.color, boxShadow: `0 0 4px ${pInfo.color}` }} />
              AI Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
