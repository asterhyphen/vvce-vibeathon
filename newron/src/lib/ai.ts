/**
 * Newron AI provider
 *
 * Priority:
 *   1. Ollama (local, free) — auto-detected at localhost:11434
 *      Set VITE_OLLAMA_MODEL=mistral  (or phi3, llama3.2, etc.)
 *   2. Gemini 1.5 Flash (free tier) — set VITE_GEMINI_API_KEY=AIza...
 *   3. Smart mock fallback — always works
 */

export const OLLAMA_URL   = (import.meta.env.VITE_OLLAMA_URL   as string | undefined) ?? 'http://localhost:11434';
export const OLLAMA_MODEL = (import.meta.env.VITE_OLLAMA_MODEL as string | undefined) ?? 'mistral';
const GEMINI_KEY          =  import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export type AIProvider = 'ollama' | 'gemini' | 'mock';

// Cache the check so we don't ping on every call
let _provider: AIProvider | null = null;
let _lastCheck = 0;

export async function getActiveProvider(): Promise<AIProvider> {
  if (_provider && Date.now() - _lastCheck < 30_000) return _provider;
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(1800) });
    if (res.ok) { _provider = 'ollama'; _lastCheck = Date.now(); return 'ollama'; }
  } catch { /* not running */ }
  if (GEMINI_KEY) { _provider = 'gemini'; _lastCheck = Date.now(); return 'gemini'; }
  _provider = 'mock'; _lastCheck = Date.now(); return 'mock';
}

export function resetProviderCache() { _provider = null; }

// ── Streaming Ollama ──────────────────────────────────────────────────────────
export async function ollamaStream(
  system: string,
  userMsg: string,
  onToken: (token: string) => void,
  onDone: (full: string) => void,
  onError: (e: Error) => void
) {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: true,
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: userMsg },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok || !res.body) throw new Error(`Ollama ${res.status}`);

    const reader = res.body.getReader();
    const dec    = new TextDecoder();
    let full     = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = dec.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          const tok = obj.message?.content ?? '';
          if (tok) { full += tok; onToken(tok); }
          if (obj.done) { onDone(full); return; }
        } catch { /* partial JSON */ }
      }
    }
    onDone(full);
  } catch (e) {
    onError(e as Error);
  }
}

// ── Non-streaming helpers ─────────────────────────────────────────────────────
async function ollamaChat(system: string, userMsg: string): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL, stream: false,
      messages: [{ role: 'system', content: system }, { role: 'user', content: userMsg }],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  return (await res.json()).message?.content ?? '';
}

async function geminiChat(system: string, userMsg: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: userMsg }] }],
      generationConfig: { maxOutputTokens: 350, temperature: 0.8 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function aiChat(system: string, userMsg: string): Promise<{ text: string; provider: AIProvider; ms: number }> {
  const provider = await getActiveProvider();
  const t0 = Date.now();
  let text = '';
  if (provider === 'ollama') text = await ollamaChat(system, userMsg);
  else if (provider === 'gemini') text = await geminiChat(system, userMsg);
  return { text: text || '', provider, ms: Date.now() - t0 };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getChatResponse(
  userMessage: string,
  mode: 'vent' | 'guidance',
  driftScore: number,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ text: string; provider: AIProvider; ms: number } | null> {
  const provider = await getActiveProvider();
  if (provider === 'mock') return null;

  const ctx = history.slice(-4).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
  const system = mode === 'vent'
    ? `You are a compassionate mental health support companion called Newron AI. Distress score: ${driftScore}/100.
Be warm, empathetic, non-judgmental. Ask gentle follow-up questions. Never diagnose. Max 3 sentences.
${ctx ? `\nPrior conversation:\n${ctx}` : ''}`
    : `You are a practical mental health guidance companion called Newron AI. Distress score: ${driftScore}/100.
Give evidence-based coping strategies. Be concise and specific. Max 4 sentences.
${ctx ? `\nPrior conversation:\n${ctx}` : ''}`;

  return aiChat(system, userMessage);
}

export async function summariseJournal(content: string, mood: number): Promise<string | null> {
  const provider = await getActiveProvider();
  if (provider === 'mock') return null;
  const { text } = await aiChat(
    `You are a clinical mental health AI. Summarise this journal entry in 2-3 sentences for a psychiatrist.
Identify: emotional themes, stress indicators, coping patterns, risk signals. Mood: ${mood}/10. No bullet points.`,
    content
  );
  return text || null;
}

export async function getWellnessTip(driftScore: number, recentMood: number): Promise<string | null> {
  const provider = await getActiveProvider();
  if (provider === 'mock') return null;
  const { text } = await aiChat(
    `You are a mental wellness coach. Give one short, specific, actionable wellness tip.
Distress: ${driftScore}/100. Mood: ${recentMood}/10. Max 2 sentences. Warm and encouraging.`,
    'Give me a wellness tip for right now.'
  );
  return text || null;
}

export async function analyseTypingStress(wpm: number, accuracy: number, errorRate: number, avgPause: number): Promise<string | null> {
  const provider = await getActiveProvider();
  if (provider === 'mock') return null;
  const { text } = await aiChat(
    `You are a cognitive stress analyst. Give a 1-sentence stress assessment based on typing metrics. Be direct and specific.`,
    `WPM: ${wpm}, accuracy: ${accuracy}%, error rate: ${errorRate}%, avg pause: ${avgPause}ms.`
  );
  return text || null;
}

export async function generateDailyInsight(
  driftScore: number,
  moodAvg: number,
  journalCount: number,
  typingStress: number | null
): Promise<string | null> {
  const provider = await getActiveProvider();
  if (provider === 'mock') return null;
  const { text } = await aiChat(
    `You are a mental health AI analyst. Write a 2-sentence daily insight for a user based on their data.
Be warm, specific, and actionable. Do not be generic.`,
    `Drift Index: ${driftScore}/100. Average mood today: ${moodAvg}/10. Journal entries: ${journalCount}. ${typingStress !== null ? `Typing stress score: ${typingStress}/100.` : ''}`
  );
  return text || null;
}

export async function generateWeeklyReport(
  avgDrift: number,
  avgMood: number,
  journalEntries: { title: string; mood: number; content: string }[],
  typingHistory: number[]
): Promise<string | null> {
  const provider = await getActiveProvider();
  if (provider === 'mock') return null;
  const journalSummary = journalEntries.slice(0, 3).map(j => `"${j.title}" (mood ${j.mood}/10)`).join(', ');
  const { text } = await aiChat(
    `You are a clinical mental health AI. Write a structured weekly mental health report in 4-5 sentences.
Cover: overall trend, key patterns, risk indicators, and one specific recommendation. Be clinical but compassionate.`,
    `Week summary — Avg Drift Index: ${avgDrift}/100. Avg mood: ${avgMood}/10. Journal entries: ${journalSummary || 'none'}. Typing stress scores: ${typingHistory.join(', ') || 'none'}.`
  );
  return text || null;
}

export async function getBreathingGuidance(driftScore: number): Promise<string | null> {
  const provider = await getActiveProvider();
  if (provider === 'mock') return null;
  const { text } = await aiChat(
    `You are a mindfulness coach. Recommend one specific breathing technique for this person's stress level in 1 sentence. Name the technique and give the count pattern.`,
    `Current stress/drift score: ${driftScore}/100.`
  );
  return text || null;
}
