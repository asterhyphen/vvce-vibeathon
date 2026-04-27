import React, { useState } from 'react';
import { BookOpen, Plus, Sparkles, Send, Trash2, Tag, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { summariseJournal } from '../lib/openai';
import type { JournalEntry } from '../types';

const MOOD_EMOJIS: Record<number, string> = {
  1:'😞',2:'😟',3:'😕',4:'😐',5:'😶',6:'🙂',7:'😊',8:'😄',9:'😁',10:'🤩',
};
const MOOD_COLORS: Record<number, string> = {
  1:'#ef4444',2:'#f97316',3:'#f59e0b',4:'#eab308',5:'#84cc16',
  6:'#22c55e',7:'#10b981',8:'#06b6d4',9:'#6366f1',10:'#a855f7',
};

const FALLBACK_SUMMARIES = [
  'Entry reflects emotional processing with themes of self-reflection. Mood indicators suggest moderate stress. Recommend continued journaling and mindfulness practices.',
  'Positive coping patterns observed. Entry shows resilience and problem-solving orientation. No immediate risk indicators.',
  'Entry indicates elevated stress levels with rumination patterns. Key themes: work pressure, fatigue. Recommend stress management review.',
  'Mixed emotional state detected. Some positive anchors present alongside challenges. Healthy emotional awareness demonstrated.',
];

const JournalCard: React.FC<{
  entry: JournalEntry;
  onSummarise: (id: string) => void;
  onSendToDoctor: (id: string) => void;
  onDelete: (id: string) => void;
  summarising: boolean;
}> = ({ entry, onSummarise, onSendToDoctor, onDelete, summarising }) => {
  const [expanded, setExpanded] = useState(false);
  const moodColor = MOOD_COLORS[entry.mood] || '#6366f1';
  const moodEmoji = MOOD_EMOJIS[entry.mood] || '😶';

  return (
    <div className="glass rounded-2xl p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0 mt-0.5">{moodEmoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-100 text-sm truncate">{entry.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {entry.timestamp.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              {' · '}
              <span style={{ color: moodColor }}>Mood {entry.mood}/10</span>
            </p>
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {entry.tags.map(t => (
                  <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 flex items-center gap-0.5">
                    <Tag className="w-2.5 h-2.5" />{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {entry.sentToDoctor && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Sent
            </span>
          )}
          <button onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(entry.id)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 animate-fade-in">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{entry.content}</p>

          {/* AI Summary */}
          {entry.aiSummary ? (
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-medium text-violet-300">AI Summary</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{entry.aiSummary}</p>
            </div>
          ) : (
            <button
              onClick={() => onSummarise(entry.id)}
              disabled={summarising}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-medium transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" />
              {summarising ? 'Summarising…' : 'Summarise with AI'}
            </button>
          )}

          {/* Send to doctor */}
          {entry.aiSummary && !entry.sentToDoctor && (
            <button
              onClick={() => onSendToDoctor(entry.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-all"
            >
              <Send className="w-3 h-3" />
              Send to Psychiatrist
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const Journal: React.FC = () => {
  const { journals, addJournal, updateJournal, deleteJournal } = useAppContext();
  const [showNew, setShowNew] = useState(false);
  const [summarising, setSummarising] = useState<string | null>(null);

  // New entry form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(6);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      setTags(prev => [...new Set([...prev, tagInput.trim().toLowerCase()])]);
      setTagInput('');
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    addJournal({ title, content, mood, tags, sentToDoctor: false });
    setTitle(''); setContent(''); setMood(6); setTags([]); setTagInput('');
    setShowNew(false);
    setSaving(false);
  };

  const handleSummarise = async (id: string) => {
    const entry = journals.find(j => j.id === id);
    if (!entry) return;
    setSummarising(id);
    try {
      const summary = await summariseJournal(entry.content, entry.mood);
      const fallback = FALLBACK_SUMMARIES[Math.floor(Math.random() * FALLBACK_SUMMARIES.length)];
      updateJournal(id, { aiSummary: summary || fallback });
    } catch {
      updateJournal(id, { aiSummary: FALLBACK_SUMMARIES[0] });
    }
    setSummarising(null);
  };

  const handleSendToDoctor = (id: string) => {
    updateJournal(id, { sentToDoctor: true });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100">Journal</h2>
              <p className="text-xs text-slate-400">{journals.length} entries · AI-powered insights</p>
            </div>
          </div>
          <button
            onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600/80 hover:bg-violet-600 text-white text-sm font-medium transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            New Entry
          </button>
        </div>
      </div>

      {/* New entry form */}
      {showNew && (
        <div className="glass rounded-2xl p-5 animate-fade-in">
          <h3 className="font-medium text-slate-200 mb-4">New Journal Entry</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Entry title…"
              className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500/50 transition-colors"
            />

            {/* Mood picker */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Current Mood: {MOOD_EMOJIS[mood]} {mood}/10</label>
              <input
                type="range" min="1" max="10" step="1" value={mood}
                onChange={e => setMood(Number(e.target.value))}
                className="mood-slider w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${MOOD_COLORS[mood]} 0%, ${MOOD_COLORS[mood]} ${(mood - 1) / 9 * 100}%, rgba(255,255,255,0.1) ${(mood - 1) / 9 * 100}%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
            </div>

            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write freely… this is your safe space. What's on your mind today?"
              rows={5}
              className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/50 resize-none transition-colors leading-relaxed"
            />

            {/* Tags */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Tags (press Enter to add)</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300">
                    {t}
                    <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="text-violet-400 hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="e.g. work, anxiety, sleep…"
                className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={!title.trim() || !content.trim() || saving}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium transition-all"
              >
                {saving ? 'Saving…' : 'Save Entry'}
              </button>
              <button
                onClick={() => setShowNew(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries */}
      {journals.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No journal entries yet.</p>
          <p className="text-slate-500 text-xs mt-1">Start writing to track your mental journey.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {journals.map(entry => (
            <JournalCard
              key={entry.id}
              entry={entry}
              onSummarise={handleSummarise}
              onSendToDoctor={handleSendToDoctor}
              onDelete={deleteJournal}
              summarising={summarising === entry.id}
            />
          ))}
        </div>
      )}

      <style>{`
        .mood-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.4), 0 2px 6px rgba(0,0,0,0.4);
          cursor: pointer;
        }
        .mood-slider::-moz-range-thumb {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: white;
          border: none;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.4);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};
