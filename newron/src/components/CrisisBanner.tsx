import React, { useState } from 'react';
import { AlertTriangle, Phone, MessageCircle, X, Heart } from 'lucide-react';

interface Props {
  onDismiss?: () => void;
  onChat?: () => void;
}

export const CrisisBanner: React.FC<Props> = ({ onDismiss, onChat }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="animate-fade-in">
      {/* Main banner */}
      <div className="relative overflow-hidden rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-red-800/10 to-red-900/20 animate-crisis" />

        <div className="relative flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center pulse-red">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-red-300 text-sm">Crisis Alert — Immediate Support Available</h3>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Your Drift Index has reached a critical level. You don't have to face this alone — support is here right now.
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={onChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-white text-xs font-medium transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Talk to AI Support
              </button>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-medium transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                Emergency Contacts
              </button>
            </div>
          </div>
        </div>

        {/* Expanded emergency contacts */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-red-500/20 animate-fade-in">
            <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-red-400" />
              Immediate help is available 24/7
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { name: 'National Crisis Hotline', number: '988', desc: 'Call or text anytime' },
                { name: 'Crisis Text Line', number: 'Text HOME to 741741', desc: 'Free, 24/7 support' },
                { name: 'Emergency Services', number: '911', desc: 'Immediate danger' },
                { name: 'SAMHSA Helpline', number: '1-800-662-4357', desc: 'Mental health & substance' },
              ].map(contact => (
                <div key={contact.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-200">{contact.name}</p>
                    <p className="text-xs text-red-300 font-mono">{contact.number}</p>
                    <p className="text-xs text-slate-500">{contact.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
