import React, { useState, useEffect } from 'react';
import { Heart, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';
import { wellnessTips } from '../data/mockData';
import { getWellnessTip } from '../lib/openai';
import type { DriftLevel } from '../types';

interface Props {
  score: number;
  level: DriftLevel;
  recentMood: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Breathing: '#60a5fa',
  Movement: '#34d399',
  Sleep: '#a78bfa',
  Mindfulness: '#f472b6',
  Connection: '#fb923c',
  Nutrition: '#facc15',
  Journaling: '#c084fc',
  Grounding: '#38bdf8',
};

export const WellnessTips: React.FC<Props> = ({ score, level, recentMood }) => {
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [featured, setFeatured] = useState(wellnessTips[0]);

  // Rotate featured tip every 30s
  useEffect(() => {
    const idx = Math.floor(Date.now() / 30000) % wellnessTips.length;
    setFeatured(wellnessTips[idx]);
  }, []);

  const fetchAiTip = async () => {
    setLoadingAi(true);
    try {
      const tip = await getWellnessTip(score, recentMood);
      setAiTip(tip || getLocalTip(score));
    } catch {
      setAiTip(getLocalTip(score));
    }
    setLoadingAi(false);
  };

  const getLocalTip = (s: number): string => {
    if (s >= 65) return "You're going through a tough time. Try placing one hand on your chest and taking 3 slow breaths — it activates your parasympathetic nervous system and can reduce distress within minutes.";
    if (s >= 35) return "Things feel a bit heavy right now. A 5-minute walk outside — even just to the end of the street — can shift your mood more than you'd expect.";
    return "You're doing well. Keep the momentum by doing one small thing today that brings you genuine joy, no matter how minor it seems.";
  };

  const categories = [...new Set(wellnessTips.map(t => t.category))];
  const filtered = activeCategory
    ? wellnessTips.filter(t => t.category === activeCategory)
    : wellnessTips;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <Heart className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100">Wellness Tips</h2>
            <p className="text-xs text-slate-400">Evidence-based support for your mental health</p>
          </div>
        </div>
      </div>

      {/* AI Personalised Tip */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-slate-200">Personalised for You</span>
          </div>
          <button
            onClick={fetchAiTip}
            disabled={loadingAi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loadingAi ? 'animate-spin' : ''}`} />
            {loadingAi ? 'Getting tip…' : 'Get Tip'}
          </button>
        </div>

        {aiTip ? (
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 animate-fade-in">
            <p className="text-sm text-slate-200 leading-relaxed">{aiTip}</p>
            <p className="text-xs text-violet-400 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {import.meta.env.VITE_OPENAI_API_KEY ? 'AI-generated for your current state' : 'Personalised suggestion'}
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <p className="text-sm text-slate-400 leading-relaxed">{getLocalTip(score)}</p>
            <p className="text-xs text-slate-500 mt-2">Based on your Drift Index: {Math.round(score)}</p>
          </div>
        )}
      </div>

      {/* Featured tip */}
      <div
        className="rounded-2xl p-5 border"
        style={{
          background: `linear-gradient(135deg, ${CATEGORY_COLORS[featured.category] || '#7c3aed'}18, transparent)`,
          borderColor: `${CATEGORY_COLORS[featured.category] || '#7c3aed'}30`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{featured.icon}</span>
          <div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: `${CATEGORY_COLORS[featured.category]}20`, color: CATEGORY_COLORS[featured.category] }}>
              {featured.category}
            </span>
          </div>
          <span className="ml-auto text-xs text-slate-500">Featured</span>
        </div>
        <h3 className="font-semibold text-slate-100 mb-1">{featured.title}</h3>
        <p className="text-sm text-slate-300 leading-relaxed">{featured.body}</p>
        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> Source: {featured.source}
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            !activeCategory ? 'bg-violet-600/80 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === cat
                ? 'text-white'
                : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
            }`}
            style={activeCategory === cat ? { background: CATEGORY_COLORS[cat] || '#7c3aed' } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tips grid */}
      <div className="space-y-3">
        {filtered.map((tip, i) => (
          <div
            key={tip.id}
            className="glass rounded-2xl p-4 animate-fade-in"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{tip.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-slate-100 text-sm">{tip.title}</h3>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: `${CATEGORY_COLORS[tip.category] || '#7c3aed'}20`, color: CATEGORY_COLORS[tip.category] || '#a78bfa' }}
                  >
                    {tip.category}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{tip.body}</p>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> {tip.source}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
