/**
 * newron AI provider
 *
 * Priority order:
 *   1. Ollama (local, free) — set VITE_OLLAMA_URL=http://localhost:11434  (default)
 *                             set VITE_OLLAMA_MODEL=gemma3 (or llama3.2, mistral, etc.)
 *   2. Gemini (free tier)   — set VITE_GEMINI_API_KEY=AIza...
 *                             Free: 15 req/min, 1M tokens/day on gemini-1.5-flash
 *   3. Mock fallback        — always works, no key needed
 *
 * .env example:
 *   VITE_GEMINI_API_KEY=AIzaSy...
 *   VITE_OLLAMA_URL=http://localhost:11434
 *   VITE_OLLAMA_MODEL=gemma3
 */

const GEMINI_KEY  = import.meta.env.VITE_GEMINI_API_KEY  as string | undefined;
const OLLAMA_URL  = (import.meta.env.VITE_OLLAMA_URL  as string | undefined) ?? 'http://localhost:11434';
const OLLAMA_MODEL = (import.meta.env.VITE_OLLAMA_MODEL as string | undefined) ?? 'gemma3';

// ── Detect which provider is active ──────────────────────────────────────────
export type AIProvider = 'ollama' | 'gemini' | 'mock';

let _ollamaAvailable: boolean | null = null;

async function checkOllama(): Promise<boolean> {
  if (_ollamaAvailable !== null) return _ollamaAvailable;
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(1500) });
    _ollamaAvailable = res.ok;
  } catch {
    _ollamaAvailable = false;
  }
  return _ollamaAvailable;
}

export async function getActiveProvider(): Promise<AIProvider> {
  if (await checkOllama()) return 'ollama';
  if (GEMINI_KEY) return 'gemini';
  return 'mock';
}

// ── Ollama ────────────────────────────────────────────────────────────────────
async function ollamaChat(system: string, userMsg: string): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: userMsg },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.message?.content ?? '';
}

// ── Gemini ────────────────────────────────────────────────────────────────────
async function geminiChat(system: string, userMsg: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: userMsg }] }],
      generationConfig: { maxOutputTokens: 300, temperature: 0.8 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ── Unified call ──────────────────────────────────────────────────────────────
async function aiChat(system: string, userMsg: string): Promise<string | null> {
  const provider = await getActiveProvider();
  if (provider === 'ollama') return ollamaChat(system, userMsg);
  if (provider === 'gemini') return geminiChat(system, userMsg);
  return null; // mock fallback handled by callers
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getChatResponse(
  userMessage: string,
  mode: 'vent' | 'guidance',
  driftScore: number,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string | null> {
  const historyText = history.slice(-4)
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const system = mode === 'vent'
    ? `You are a compassionate mental health support companion called Newron AI. The user's current mental distress score is ${driftScore}/100.
Be warm, empathetic, and non-judgmental. Listen actively. Ask gentle follow-up questions.
Never diagnose. Keep responses under 3 sentences. Use a calm, human tone.
${historyText ? `\nConversation so far:\n${historyText}` : ''}`
    : `You are a practical mental health guidance companion called Newron AI. The user's distress score is ${driftScore}/100.
Offer evidence-based coping strategies, grounding techniques, and actionable advice.
Be concise and specific. Keep responses under 4 sentences.
${historyText ? `\nConversation so far:\n${historyText}` : ''}`;

  return aiChat(system, userMessage);
}

export async function summariseJournal(content: string, mood: number): Promise<string | null> {
  const system = `You are a clinical mental health AI assistant. Summarise the following journal entry in 2-3 sentences for a psychiatrist.
Identify: key emotional themes, stress indicators, coping patterns, and any risk signals.
Mood score: ${mood}/10. Be clinical but compassionate. Do not use bullet points.`;
  return aiChat(system, content);
}

export async function getWellnessTip(driftScore: number, recentMood: number): Promise<string | null> {
  const system = `You are a mental wellness coach. Give one short, specific, actionable wellness tip.
Distress score: ${driftScore}/100. Recent mood: ${recentMood}/10.
Keep it under 2 sentences. Be warm and encouraging.`;
  return aiChat(system, 'Give me a wellness tip for right now.');
}

export async function analyseTypingStress(
  wpm: number,
  accuracy: number,
  errorRate: number,
  avgPause: number
): Promise<string | null> {
  const system = `You are a cognitive stress analyst. Based on typing test metrics, give a 1-sentence stress assessment.
Be direct and specific. Mention what the numbers suggest about cognitive load or stress.`;
  const msg = `Typing speed: ${wpm} WPM, accuracy: ${accuracy}%, error rate: ${errorRate}%, average pause between keystrokes: ${avgPause}ms.`;
  return aiChat(system, msg);
}
