// OpenAI integration — set VITE_OPENAI_API_KEY in your .env file
// e.g.  VITE_OPENAI_API_KEY=sk-...

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const MODEL = 'gpt-4o-mini';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chat(messages: Message[]): Promise<string> {
  if (!API_KEY) {
    // Fallback to mock responses when no key is set
    return null as unknown as string;
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: 300, temperature: 0.8 }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}

// ── Chat support ──────────────────────────────────────────────────────────────
export async function getChatResponse(
  userMessage: string,
  mode: 'vent' | 'guidance',
  driftScore: number,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string | null> {
  if (!API_KEY) return null;

  const systemPrompt = mode === 'vent'
    ? `You are a compassionate mental health support companion called Newron AI. The user's current mental distress score is ${driftScore}/100. 
       Be warm, empathetic, and non-judgmental. Listen actively. Ask gentle follow-up questions. 
       Never diagnose. Keep responses under 3 sentences. Use a calm, human tone.`
    : `You are a practical mental health guidance companion called Newron AI. The user's distress score is ${driftScore}/100.
       Offer evidence-based coping strategies, grounding techniques, and actionable advice.
       Be concise and specific. Keep responses under 4 sentences.`;

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ];

  return chat(messages);
}

// ── Journal AI summary ────────────────────────────────────────────────────────
export async function summariseJournal(content: string, mood: number): Promise<string | null> {
  if (!API_KEY) return null;

  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a clinical mental health AI assistant. Summarise the following journal entry in 2-3 sentences for a psychiatrist. 
      Identify: key emotional themes, stress indicators, coping patterns, and any risk signals. 
      Mood score: ${mood}/10. Be clinical but compassionate. Do not use bullet points.`,
    },
    { role: 'user', content },
  ];

  return chat(messages);
}

// ── Wellness tips ─────────────────────────────────────────────────────────────
export async function getWellnessTip(driftScore: number, recentMood: number): Promise<string | null> {
  if (!API_KEY) return null;

  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a mental wellness coach. Give one short, specific, actionable wellness tip based on the user's current state.
      Distress score: ${driftScore}/100. Recent mood: ${recentMood}/10.
      Keep it under 2 sentences. Be warm and encouraging.`,
    },
    { role: 'user', content: 'Give me a wellness tip for right now.' },
  ];

  return chat(messages);
}
