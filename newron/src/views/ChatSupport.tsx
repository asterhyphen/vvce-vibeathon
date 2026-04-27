import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Heart, Lightbulb, Mic, RotateCcw } from 'lucide-react';
import type { ChatMessage, DriftLevel } from '../types';
import { ventResponses, guidanceResponses } from '../data/mockData';
import { getChatResponse } from '../lib/ai';
import { DriftBadge } from '../components/DriftBadge';

interface Props {
  level: DriftLevel;
  score: number;
  onKeystroke: (key: string, text: string) => void;
}

const getFallbackResponse = (text: string, mode: 'vent' | 'guidance'): string => {
  const responses = mode === 'vent' ? ventResponses : guidanceResponses;
  const idx = Math.abs(text.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % responses.length;
  return responses[idx];
};

const TypingIndicator = () => (
  <div className="flex items-end gap-2 animate-fade-in">
    <div className="w-7 h-7 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
      <Bot className="w-3.5 h-3.5 text-violet-400" />
    </div>
    <div className="chat-bubble-ai px-4 py-3">
      <div className="flex gap-1 items-center h-4">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400"
            style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  </div>
);

export const ChatSupport: React.FC<Props> = ({ level, score, onKeystroke }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'ai',
      content: level === 'critical'
        ? "I noticed your Drift Index is elevated right now. I'm here with you — no judgment, no pressure. Would you like to talk about what's been going on, or would you prefer some calming guidance?"
        : level === 'declining'
        ? "Hey, I've been noticing some patterns that suggest you might be carrying a bit more than usual lately. I'm here to listen. How are you really doing?"
        : "Hi there. I'm your newron support companion. I'm here whenever you need to talk, vent, or get some guidance. How are you feeling today?",
      timestamp: new Date(),
      mode: 'vent',
    },
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'vent' | 'guidance'>('vent');
  const [isTypingAI, setIsTypingAI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTypingAI]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeystroke(e.key, input);
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [input, onKeystroke]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      mode,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTypingAI(true);

    // Build history for OpenAI
    const history = messages.slice(-6).map(m => ({
      role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }));

    try {
      // Try OpenAI first, fall back to mock
      const aiContent = await getChatResponse(text, mode, score, history)
        ?? getFallbackResponse(text, mode);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiContent,
        timestamp: new Date(),
        mode,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: getFallbackResponse(text, mode),
        timestamp: new Date(),
        mode,
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTypingAI(false);
    }
  }, [input, mode, score, messages]);

  const clearChat = () => {
    setMessages([{
      id: '0',
      role: 'ai',
      content: "Let's start fresh. I'm here — what's on your mind?",
      timestamp: new Date(),
      mode: 'vent',
    }]);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in" style={{ minHeight: '600px' }}>
      {/* Header */}
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
              <Bot className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100 text-sm">newron AI</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-400">
                  {import.meta.env.VITE_OPENAI_API_KEY ? 'GPT-4o-mini · Active' : 'Active · Add API key for GPT'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DriftBadge level={level} size="sm" showScore score={Math.round(score)} />
            <button onClick={clearChat}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all" title="Clear chat">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 mt-3">
          {(['vent', 'guidance'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === m
                  ? m === 'vent'
                    ? 'bg-violet-600/30 border border-violet-500/40 text-violet-300'
                    : 'bg-blue-600/30 border border-blue-500/40 text-blue-300'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-300'
              }`}
            >
              {m === 'vent' ? <Heart className="w-3 h-3" /> : <Lightbulb className="w-3 h-3" />}
              {m === 'vent' ? 'Vent Mode' : 'Guidance Mode'}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4" style={{ maxHeight: '420px' }}>
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'ai'
                ? 'bg-violet-600/30 border border-violet-500/30'
                : 'bg-blue-600/30 border border-blue-500/30'
            }`}>
              {msg.role === 'ai'
                ? <Bot className="w-3.5 h-3.5 text-violet-400" />
                : <User className="w-3.5 h-3.5 text-blue-400" />
              }
            </div>
            <div className={`max-w-xs sm:max-w-sm ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'} px-4 py-3`}>
              <p className="text-sm leading-relaxed text-slate-100">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-violet-200/60' : 'text-slate-500'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isTypingAI && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass rounded-2xl p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'vent' ? "Share what's on your mind…" : "Describe what you're going through…"}
            rows={2}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 resize-none outline-none leading-relaxed"
            style={{ maxHeight: '120px' }}
          />
          <div className="flex flex-col gap-1.5">
            <button className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all" title="Voice (simulated)">
              <Mic className="w-4 h-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTypingAI}
              className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all hover:scale-105"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-2">
          {mode === 'vent' ? '💜 Safe space. Your words are private.' : '💡 Evidence-based guidance.'}
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};
