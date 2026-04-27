import React, { useState } from 'react';
import { Calendar, Clock, Star, CheckCircle, AlertTriangle, Tag } from 'lucide-react';
import type { DriftLevel, TimeSlot } from '../types';
import { mockTimeSlots } from '../data/mockData';
import { DriftBadge } from '../components/DriftBadge';
import { useAuth } from '../context/AuthContext';

interface Props {
  level: DriftLevel;
  score: number;
}

// Sort slots: priority first, then available, then unavailable
const sortSlots = (slots: TimeSlot[], level: DriftLevel): TimeSlot[] => {
  return [...slots].sort((a, b) => {
    // Priority slots first when critical
    if (level === 'critical') {
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
    }
    // Available before unavailable
    if (a.available && !b.available) return -1;
    if (!a.available && b.available) return 1;
    return 0;
  });
};

export const Appointments: React.FC<Props> = ({ level, score }) => {
  const { user } = useAuth();
  const [booked, setBooked] = useState<Map<string, { at: string; by: string }>>(new Map());
  const [confirming, setConfirming] = useState<string | null>(null);

  const sortedSlots = sortSlots(mockTimeSlots, level);
  const isRiskBooking = level !== 'stable';

  const handleBook = (slot: TimeSlot) => {
    if (!slot.available) return;
    setConfirming(slot.id);
    setTimeout(() => {
      setBooked(prev => {
        const next = new Map(prev);
        next.set(slot.id, { at: new Date().toLocaleTimeString(), by: user?.name || 'You' });
        return next;
      });
      setConfirming(null);
    }, 900);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-100">Smart Appointments</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {level === 'critical'
                ? 'Priority booking active — slots sorted by urgency for your state.'
                : level === 'declining'
                ? 'Proactive check-in suggested. Early support prevents escalation.'
                : 'Your mental state is stable. Routine check-ins available.'}
            </p>
          </div>
          <DriftBadge level={level} size="sm" />
        </div>

        {level !== 'stable' && (
          <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${
            level === 'critical'
              ? 'bg-red-500/10 border border-red-500/25'
              : 'bg-amber-500/10 border border-amber-500/25'
          }`}>
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${level === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
            <p className={`text-xs ${level === 'critical' ? 'text-red-300' : 'text-amber-300'}`}>
              {level === 'critical'
                ? `Drift Index ${Math.round(score)} — Critical. Priority slots are shown first. Please book as soon as possible.`
                : `Drift Index ${Math.round(score)} — Declining. We recommend scheduling within the next 48 hours.`}
            </p>
          </div>
        )}
      </div>

      {/* Slots */}
      <div className="space-y-3">
        {sortedSlots.map((slot, i) => {
          const booking = booked.get(slot.id);
          const isBooked = !!booking;
          const isConfirming = confirming === slot.id;
          const isPriority = slot.priority && level === 'critical';

          return (
            <div
              key={slot.id}
              className={`glass rounded-2xl p-4 transition-all duration-300 animate-fade-in ${
                isPriority ? 'border-red-500/40 glow-red' : ''
              } ${isBooked ? 'opacity-80' : ''}`}
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              {isPriority && (
                <div className="flex items-center gap-1.5 mb-3">
                  <Star className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                  <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Priority Slot — Critical Patient</span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                    isPriority
                      ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                      : 'bg-violet-600/20 border border-violet-500/30 text-violet-300'
                  }`}>
                    {slot.doctor.split(' ').map(n => n[0]).join('').slice(1, 3)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-100 text-sm">{slot.doctor}</p>
                    <p className="text-xs text-slate-400">{slot.specialty}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />{slot.date}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />{slot.time}
                      </span>
                    </div>
                    {isBooked && isRiskBooking && (
                      <div className="flex items-center gap-1 mt-2">
                        <Tag className="w-3 h-3 text-violet-400" />
                        <span className="text-xs text-violet-400">Scheduled due to risk (Drift: {Math.round(score)})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isBooked ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">Booked</span>
                    </div>
                  ) : !slot.available ? (
                    <div className="px-3 py-1.5 rounded-lg bg-slate-700/30 border border-slate-600/30">
                      <span className="text-xs text-slate-500">Unavailable</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBook(slot)}
                      disabled={isConfirming}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 ${
                        isPriority
                          ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300'
                          : 'bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300'
                      } ${isConfirming ? 'opacity-60 cursor-wait' : ''}`}
                    >
                      {isConfirming ? 'Booking…' : isPriority ? '⚡ Book Priority' : 'Book Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booked summary */}
      {booked.size > 0 && (
        <div className="glass rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-medium text-slate-200">Your Upcoming Sessions</h3>
          </div>
          {mockTimeSlots.filter(s => booked.has(s.id)).map(slot => {
            const b = booked.get(slot.id)!;
            return (
              <div key={slot.id} className="flex items-center justify-between py-2.5 border-t border-slate-700/30 first:border-0">
                <div>
                  <p className="text-sm text-slate-200">{slot.doctor}</p>
                  <p className="text-xs text-slate-400">{slot.date} at {slot.time}</p>
                  <p className="text-xs text-slate-500">Booked at {b.at}</p>
                </div>
                {isRiskBooking && (
                  <span className="text-xs text-violet-400 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Risk-flagged
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
