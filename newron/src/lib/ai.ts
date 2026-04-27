/**
 * Newron AI provider
 *
 * Priority:
 *   1. Ollama (local, free) — auto-detected at localhost:11434
 *      Set VITE_OLLAMA_MODEL=mistral  (or phi3, llama3.2, etc.)
 *   2. Gemini 1.5 Flash (free tier) — set VITE_GEMINI_API_KEY=AIza...
 *   3. Smart mock fallback — always works, CBT-grounded responses
 */

export const OLLAMA_URL   = (import.meta.env.VITE_OLLAMA_URL   as string | undefined) ?? 'http://localhost:11434';
export const OLLAMA_MODEL = (import.meta.env.VITE_OLLAMA_MODEL as string | undefined) ?? 'mistral';
const GEMINI_KEY          =  import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export type AIProvider = 'ollama' | 'gemini' | 'mock';

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

// ── CBT System Prompts ────────────────────────────────────────────────────────
// These are the core of the AI's therapeutic approach.
// All responses must follow CBT principles: identify thoughts, challenge distortions,
// build coping strategies, and guide behavioural activation.

export const CBT_VENT_SYSTEM = (driftScore: number, ctx: string) => `
You are Newron, a compassionate AI mental health companion trained in Cognitive Behavioural Therapy (CBT).
The user's current distress/drift score is ${driftScore}/100.

Your role is to:
1. VALIDATE feelings first — never dismiss or minimise
2. Use Socratic questioning to gently explore automatic thoughts (e.g. "What went through your mind when that happened?")
3. Help identify cognitive distortions (catastrophising, all-or-nothing thinking, mind reading, etc.) WITHOUT labelling them harshly
4. Guide the user toward balanced thinking — not toxic positivity
5. Ask ONE focused question per response — don't overwhelm
6. Keep responses warm, human, and under 3 sentences
7. Never diagnose. Never give medical advice. Always recommend professional help for serious concerns.

${ctx ? `Recent conversation:\n${ctx}\n` : ''}
Respond as a caring CBT-informed companion. Be specific to what the user just said.`.trim();

export const CBT_GUIDANCE_SYSTEM = (driftScore: number, ctx: string) => `
You are Newron, a practical AI mental health companion trained in Cognitive Behavioural Therapy (CBT).
The user's distress score is ${driftScore}/100.

Your role is to provide structured CBT-based guidance:
1. Offer ONE specific, actionable CBT technique per response
2. Name the technique (e.g. "thought record", "behavioural activation", "grounding", "cognitive restructuring")
3. Give clear step-by-step instructions — max 3 steps
4. Explain WHY it works (brief, 1 sentence)
5. Keep it under 4 sentences total
6. Tailor the technique to the user's specific situation

${ctx ? `Recent conversation:\n${ctx}\n` : ''}
Be practical, specific, and evidence-based.`.trim();

export const CBT_MOOD_ASSESSMENT_SYSTEM = (userName: string) => `
You are Newron, a CBT-trained AI conducting a brief mood assessment for ${userName}.

Your goal is to assess their current mental state through structured CBT-informed questions.
Follow this sequence naturally (don't rush):
1. Start with open-ended: "How has your day been so far?"
2. Explore emotions: "What emotions are most present for you right now?"
3. Identify triggers: "Has anything specific happened that's affecting your mood?"
4. Check thoughts: "What kinds of thoughts have been going through your mind?"
5. Assess behaviour: "How has this been affecting what you're doing day-to-day?"
6. End with: "On a scale of 1-10, how would you rate your overall mood right now?"

Ask ONE question at a time. Be warm and conversational, not clinical.
After the user answers the mood rating, provide a brief CBT-informed reflection and suggest one coping strategy.
Keep each response under 3 sentences.`.trim();

export const CBT_JOURNAL_ANALYSIS_SYSTEM = (mood: number) => `
You are a clinical AI trained in CBT analysis. Analyse this journal entry for a psychiatrist.
Mood score: ${mood}/10.

Identify and report on:
1. Primary emotional themes (name specific emotions)
2. Cognitive distortions present (e.g. catastrophising, personalisation, black-and-white thinking)
3. Behavioural patterns (avoidance, withdrawal, activation)
4. Protective factors and strengths shown
5. Risk indicators if any
6. Recommended CBT intervention focus

Write 3-4 sentences. Be clinical but compassionate. No bullet points.`.trim();

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

// ── Non-streaming ─────────────────────────────────────────────────────────────
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
      generationConfig: { maxOutputTokens: 400, temperature: 0.75 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function aiChat(
  system: string,
  userMsg: string
): Promise<{ text: string; provider: AIProvider; ms: number }> {
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
  mode: 'vent' | 'guidance' | 'mood-assessment',
  driftScore: number,
  history: { role: 'user' | 'assistant'; content: string }[],
  userName?: string
): Promise<{ text: string; provider: AIProvider; ms: number } | null> {
  const provider = await getActiveProvider();
  if (provider === 'mock') return null;

  const ctx = history.slice(-6).map(m =>
    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
  ).join('\n');

  let system: string;
  if (mode === 'vent') system = CBT_VENT_SYSTEM(driftScore, ctx);
  else if (mode === 'guidance') system = CBT_GUIDANCE_SYSTEM(driftScore, ctx);
  else system = CBT_MOOD_ASSESSMENT_SYSTEM(userName || 'the user');

  return aiChat(system, userMessage);
}

export async function summariseJournal(content: string, mood: number): Promise<string | null> {
  const provider = await getActiveProvider();
  if (provider === 'mock') return null;
  const { text } = await aiChat(CBT_JOURNAL_ANALYSIS_SYSTEM(mood), content);
  return text || null;
}

export async function autoAnalyseJournalEntry(
  content: string,
  mood: number,
  wpm?: number,
  backspaceRate?: number,
  pauseMs?: number
): Promise<string | null> {
  const provider = await getActiveProvider();
  if (provider === 'mock') return null;

  const typingContext = wpm
    ? `\nTyping metrics while writing: ${wpm} WPM, ${backspaceRate?.toFixed(0)}% backspace rate, ${pauseMs}ms avg pause between keystrokes.`
    : '';

  const { text } = await aiChat(
    `You are a clinical AI trained in CBT. Analyse this journal entry automatically as the user writes.
Mood: ${mood}/10.${typingContext}
The typing metrics reveal cognitive state — slow typing + high backspaces = rumination/distress.
Write 2-3 sentences identifying: emotional themes, cognitive patterns, and one specific CBT-based suggestion.
Be warm and direct. No bullet points.`,
    content
  );
  return text || null;
}

export async function getWellnessTip(driftScore: number, recentMood: number): Promise<string | null> {
  const provider = await getActiveProvider();
  if (provider === 'mock') return null;
  const { text } = await aiChat(
    `You are a CBT-trained wellness coach. Give one specific, actionable CBT technique.
Distress: ${driftScore}/100. Mood: ${recentMood}/10.
Name the technique, give 1-2 steps, explain why it works. Max 2 sentences. Warm tone.`,
    'Give me a CBT-based wellness tip for right now.'
  );
  return text || null;
}

export async function analyseTypingStress(
  wpm: number,
  accuracy: number,
  errorRate: number,
  avgPause: number
): Promise<string | null> {
  const provider = await getActiveProvider();
  if (provider === 'mock') return null;
  const { text } = await aiChat(
    `You are a cognitive stress analyst using CBT principles. Give a 1-sentence assessment.
Mention what the typing patterns suggest about cognitive load, and one brief CBT-based coping suggestion.`,
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
    `You are a CBT-trained mental health AI. Write a 2-sentence daily insight.
Be specific, warm, and actionable. Reference CBT concepts where relevant. Not generic.`,
    `Drift Index: ${driftScore}/100. Avg mood: ${moodAvg}/10. Journal entries: ${journalCount}. ${typingStress !== null ? `Typing stress: ${typingStress}/100.` : ''}`
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
  const journalSummary = journalEntries.slice(0, 3)
    .map(j => `"${j.title}" (mood ${j.mood}/10)`)
    .join(', ');
  const { text } = await aiChat(
    `You are a clinical CBT-trained AI. Write a structured weekly mental health report in 4-5 sentences.
Cover: overall trend, cognitive/behavioural patterns, risk indicators, and one specific CBT recommendation.`,
    `Avg Drift: ${avgDrift}/100. Avg mood: ${avgMood}/10. Journals: ${journalSummary || 'none'}. Typing stress: ${typingHistory.join(', ') || 'none'}.`
  );
  return text || null;
}

export async function getBreathingGuidance(driftScore: number): Promise<string | null> {
  const provider = await getActiveProvider();
  if (provider === 'mock') return null;
  const { text } = await aiChat(
    `You are a CBT-trained mindfulness coach. Recommend one breathing technique in 1 sentence. Name it and give the count pattern.`,
    `Stress/drift score: ${driftScore}/100.`
  );
  return text || null;
}

// ── CBT Mock Responses (used when no AI is available) ─────────────────────────
// These are carefully crafted CBT-informed responses, not generic platitudes.

export const CBT_MOCK_VENT = [
  "That sounds really difficult. When you say you're feeling overwhelmed, what specific thought keeps coming back to you most?",
  "I hear you. It takes courage to name what you're feeling. What's the story your mind is telling you about this situation?",
  "That makes sense given what you're going through. I'm curious — when did you first notice this feeling today?",
  "Your feelings are completely valid. What would you say to a close friend who was feeling exactly what you're feeling right now?",
  "I'm here with you. Sometimes our minds jump to worst-case scenarios. What's the most realistic outcome you can imagine?",
  "Thank you for sharing that. What evidence do you have that supports that thought — and what evidence might challenge it?",
];

export const CBT_MOCK_GUIDANCE = [
  "Try a thought record: write down the situation, your automatic thought, the emotion it caused, and then one balanced alternative thought. This interrupts the cognitive distortion cycle.",
  "Behavioural activation can help here — schedule one small, achievable activity you've been avoiding. Action often precedes motivation, not the other way around.",
  "Use the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. It anchors you to the present and interrupts rumination.",
  "Try cognitive restructuring: ask yourself 'Is this thought a fact or an interpretation?' Then write one piece of evidence for and against it. This builds metacognitive awareness.",
  "Progressive muscle relaxation: tense each muscle group for 5 seconds then release, starting from your feet. It activates the parasympathetic nervous system within minutes.",
  "Schedule a 'worry window' — 15 minutes daily where you allow yourself to think about concerns. Outside that window, redirect. This reduces generalised anxiety over time.",
];

export const CBT_MOCK_MOOD_QUESTIONS = [
  "How has your day been so far? I'd love to hear what's been on your mind.",
  "What emotions are most present for you right now? Try to name them as specifically as you can.",
  "Has anything specific happened today that's been affecting how you feel?",
  "What kinds of thoughts have been going through your mind most frequently today?",
  "How has your mood been affecting what you're doing — your work, relationships, or daily routine?",
  "On a scale of 1 to 10, how would you rate your overall mood right now? And what's one thing that would move it up by just one point?",
];
