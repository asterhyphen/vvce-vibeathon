import React, { useState } from 'react';
import { AlertTriangle, Phone, MessageCircle, X, Heart } from 'lucide-react';

interface Props {
  onDismiss?: () => void;
  onChat?: () => void;
}

const CONTACTS = [
  { name: 'National Crisis Hotline', number: '988',              desc: 'Call or text anytime' },
  { name: 'Crisis Text Line',        number: 'Text HOME to 741741', desc: 'Free, 24/7' },
  { name: 'Emergency Services',      number: '911',              desc: 'Immediate danger' },
  { name: 'SAMHSA Helpline',         number: '1-800-662-4357',   desc: 'Mental health support' },
];

export const CrisisBanner: React.FC<Props> = ({ onDismiss, onChat }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="animate-fade-in glow-red" style={{
      borderRadius: 16,
      border: '1px solid rgba(239,68,68,0.35)',
      background: 'rgba(239,68,68,0.08)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div className="pulse-red" style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle style={{ width: 16, height: 16, color: '#ef4444' }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5' }}>
                Crisis Alert — Immediate Support Available
              </p>
              {onDismiss && (
                <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2 }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.5 }}>
              Your Drift Index has reached a critical level. You don't have to face this alone.
            </p>

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={onChat} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 10,
                background: 'var(--accent)', color: 'var(--accent-text)',
                border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}>
                <MessageCircle style={{ width: 13, height: 13 }} />
                Talk to AI Support
              </button>
              <button onClick={() => setExpanded(!expanded)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 10,
                background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
                border: '1px solid rgba(239,68,68,0.3)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}>
                <Phone style={{ width: 13, height: 13 }} />
                Emergency Contacts
              </button>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="animate-fade-in" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Heart style={{ width: 12, height: 12, color: '#ef4444' }} />
              Help is available 24/7
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CONTACTS.map(c => (
                <div key={c.name} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(239,68,68,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Phone style={{ width: 12, height: 12, color: '#ef4444' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-1)' }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: '#fca5a5', fontFamily: 'monospace' }}>{c.number}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-3)' }}>{c.desc}</p>
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
