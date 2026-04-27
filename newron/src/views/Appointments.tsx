import React, { useState, useMemo } from 'react';
import {
  Calendar, Clock, Star, CheckCircle, AlertTriangle, Tag,
  Video, MapPin, X, Filter, ChevronDown, ChevronUp, Timer, StarIcon,
} from 'lucide-react';
import type { DriftLevel, TimeSlot } from '../types';
import { mockTimeSlots } from '../data/mockData';
import { DriftBadge } from '../components/DriftBadge';
import { useAuth } from '../context/AuthContext';

interface Props {
  level: DriftLevel;
  score: number;
}

/* ── Specialty color map ──────────────────────────────────────────────────── */
const specialtyColors: Record<string, { bg: string; border: string; text: string }> = {
  'Clinical Psychologist': { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.35)', text: '#a78bfa' },
  'Psychiatrist':          { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.35)',  text: '#60a5fa' },
  'Therapist':             { bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.35)',  text: '#34d399' },
  'Counselor':             { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.35)',  text: '#fbbf24' },
};

const getSpecColor = (spec: string) =>
  specialtyColors[spec] ?? { bg: 'var(--surface-2)', border: 'var(--border-2)', text: 'var(--text-2)' };

/* ── Sort slots ───────────────────────────────────────────────────────────── */
const sortSlots = (slots: TimeSlot[], level: DriftLevel): TimeSlot[] =>
  [...slots].sort((a, b) => {
    if (level === 'critical') {
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
    }
    if (a.available && !b.available) return -1;
    if (!a.available && b.available) return 1;
    return 0;
  });

/* ── Group by date ────────────────────────────────────────────────────────── */
const groupByDate = (slots: TimeSlot[]): Map<string, TimeSlot[]> => {
  const map = new Map<string, TimeSlot[]>();
  for (const s of slots) {
    const arr = map.get(s.date) ?? [];
    arr.push(s);
    map.set(s.date, arr);
  }
  return map;
};

/* ── Confirmation modal ───────────────────────────────────────────────────── */
const ConfirmModal: React.FC<{
  slot: TimeSlot;
  onConfirm: () => void;
  onCancel: () => void;
  isPriority: boolean;
  loading: boolean;
}> = ({ slot, onConfirm, onCancel, isPriority, loading }) => {
  const sc = getSpecColor(slot.specialty);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Confirm booking with ${slot.doctor}`}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* Card */}
      <div
        className="animate-fade-in"
        style={{
          position: 'relative', width: '100%', maxWidth: 400,
          background: 'var(--bg-2)',
          border: '1px solid var(--border-2)',
          borderRadius: 20, padding: 24,
        }}
      >
        <button
          onClick={onCancel}
          aria-label="Close"
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-2)',
          }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>

        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>
          Confirm Appointment
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
          Review the details below before booking.
        </p>

        {/* Doctor info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: 14, borderRadius: 14,
          background: 'var(--surface)', border: '1px solid var(--border)',
          marginBottom: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: sc.bg, border: `1px solid ${sc.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 600, color: sc.text, flexShrink: 0,
          }}>
            {slot.doctor.split(' ').map(n => n[0]).join('').slice(1, 3)}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{slot.doctor}</p>
            <p style={{ fontSize: 12, color: sc.text }}>{slot.specialty}</p>
          </div>
        </div>

        {/* Details grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          marginBottom: 20,
        }}>
          {[
            { icon: <Calendar style={{ width: 13, height: 13 }} />, label: 'Date', value: slot.date },
            { icon: <Clock style={{ width: 13, height: 13 }} />, label: 'Time', value: slot.time },
            { icon: <Timer style={{ width: 13, height: 13 }} />, label: 'Duration', value: `${slot.duration ?? 50} min` },
            { icon: slot.mode === 'video' ? <Video style={{ width: 13, height: 13 }} /> : <MapPin style={{ width: 13, height: 13 }} />, label: 'Mode', value: slot.mode === 'video' ? 'Video Call' : 'In-Person' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '10px 12px', borderRadius: 12,
              background: 'var(--surface)', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <span style={{ color: 'var(--text-3)' }}>{item.icon}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.label}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{item.value}</span>
            </div>
          ))}
        </div>

        {isPriority && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', borderRadius: 12,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            marginBottom: 16,
          }}>
            <Star style={{ width: 13, height: 13, color: '#ef4444', fill: '#ef4444' }} />
            <span style={{ fontSize: 12, color: '#fca5a5' }}>Priority slot — recommended for your current state</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center', borderRadius: 12 }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn-primary"
            style={{
              flex: 1, justifyContent: 'center', borderRadius: 12,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Booking…' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Slot card ────────────────────────────────────────────────────────────── */
const SlotCard: React.FC<{
  slot: TimeSlot;
  level: DriftLevel;
  score: number;
  isBooked: boolean;
  booking?: { at: string; by: string };
  onBook: () => void;
  onCancelBooking: () => void;
  index: number;
}> = ({ slot, level, score, isBooked, booking, onBook, onCancelBooking, index }) => {
  const isPriority = !!slot.priority && level === 'critical';
  const sc = getSpecColor(slot.specialty);
  const isRisk = level !== 'stable';

  return (
    <div
      className={`animate-fade-in ${isPriority ? 'glow-red' : ''}`}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${isPriority ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`,
        borderRadius: 16,
        padding: 16,
        transition: 'all 0.3s ease',
        opacity: isBooked ? 0.85 : !slot.available ? 0.5 : 1,
        animationDelay: `${index * 0.06}s`,
      }}
    >
      {isPriority && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 12, paddingBottom: 10,
          borderBottom: '1px solid rgba(239,68,68,0.15)',
        }}>
          <Star style={{ width: 12, height: 12, color: '#ef4444', fill: '#ef4444' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Priority — Critical Patient
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: sc.bg, border: `1px solid ${sc.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 600, color: sc.text,
        }}>
          {slot.doctor.split(' ').map(n => n[0]).join('').slice(1, 3)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{slot.doctor}</span>
            {slot.rating && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#fbbf24' }}>
                <Star style={{ width: 10, height: 10, fill: '#fbbf24' }} />
                {slot.rating}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: sc.text, marginTop: 1 }}>{slot.specialty}</p>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)' }}>
              <Clock style={{ width: 12, height: 12 }} />
              {slot.time}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)' }}>
              <Timer style={{ width: 12, height: 12 }} />
              {slot.duration ?? 50} min
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 500,
              padding: '2px 8px', borderRadius: 99,
              background: slot.mode === 'video' ? 'rgba(59,130,246,0.12)' : 'rgba(16,185,129,0.12)',
              color: slot.mode === 'video' ? '#60a5fa' : '#34d399',
              border: `1px solid ${slot.mode === 'video' ? 'rgba(59,130,246,0.25)' : 'rgba(16,185,129,0.25)'}`,
            }}>
              {slot.mode === 'video' ? <Video style={{ width: 10, height: 10 }} /> : <MapPin style={{ width: 10, height: 10 }} />}
              {slot.mode === 'video' ? 'Video' : 'In-Person'}
            </span>
          </div>

          {/* Risk tag */}
          {isBooked && isRisk && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
              <Tag style={{ width: 11, height: 11, color: '#a78bfa' }} />
              <span style={{ fontSize: 11, color: '#a78bfa' }}>Scheduled due to risk (Drift: {Math.round(score)})</span>
            </div>
          )}

          {/* Booked info */}
          {isBooked && booking && (
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              Booked at {booking.at}
            </p>
          )}
        </div>

        {/* Action */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start' }}>
          {isBooked ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 10,
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
              }}>
                <CheckCircle style={{ width: 13, height: 13, color: '#34d399' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: '#34d399' }}>Booked</span>
              </div>
              <button
                onClick={onCancelBooking}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: 'var(--text-3)',
                  textDecoration: 'underline', textUnderlineOffset: 2,
                  padding: 0,
                }}
              >
                Cancel
              </button>
            </div>
          ) : !slot.available ? (
            <div style={{
              padding: '6px 12px', borderRadius: 10,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Full</span>
            </div>
          ) : (
            <button
              onClick={onBook}
              style={{
                padding: '7px 14px', borderRadius: 10,
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isPriority ? 'rgba(239,68,68,0.15)' : 'var(--accent-dim)',
                border: `1px solid ${isPriority ? 'rgba(239,68,68,0.35)' : 'var(--accent-border)'}`,
                color: isPriority ? '#fca5a5' : 'var(--accent)',
              }}
            >
              {isPriority ? '⚡ Book Priority' : 'Book'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════════════════════ */
export const Appointments: React.FC<Props> = ({ level, score }) => {
  const { user } = useAuth();
  const [booked, setBooked] = useState<Map<string, { at: string; by: string }>>(new Map());
  const [confirmSlot, setConfirmSlot] = useState<TimeSlot | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showUpcoming, setShowUpcoming] = useState(true);

  /* Derive specialties for filter chips */
  const specialties = useMemo(
    () => Array.from(new Set(mockTimeSlots.map(s => s.specialty))),
    [],
  );

  /* Filter + sort + group */
  const filtered = useMemo(() => {
    let slots = mockTimeSlots;
    if (activeFilter) slots = slots.filter(s => s.specialty === activeFilter);
    return sortSlots(slots, level);
  }, [activeFilter, level]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const isRiskBooking = level !== 'stable';
  const bookedSlots = mockTimeSlots.filter(s => booked.has(s.id));

  /* Handlers */
  const handleConfirm = () => {
    if (!confirmSlot) return;
    setBookingLoading(true);
    setTimeout(() => {
      setBooked(prev => {
        const next = new Map(prev);
        next.set(confirmSlot.id, { at: new Date().toLocaleTimeString(), by: user?.name || 'You' });
        return next;
      });
      setBookingLoading(false);
      setConfirmSlot(null);
    }, 800);
  };

  const handleCancelBooking = (id: string) => {
    setBooked(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-fade-in">

      {/* ── Header card ──────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 18, padding: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Calendar style={{ width: 20, height: 20, color: '#a78bfa' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>
              Smart Appointments
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>
              {level === 'critical'
                ? 'Priority booking active — slots sorted by urgency for your state.'
                : level === 'declining'
                ? 'Proactive check-in suggested. Early support prevents escalation.'
                : 'Your mental state is stable. Routine check-ins available.'}
            </p>
          </div>
          <DriftBadge level={level} size="sm" />
        </div>

        {/* Risk banner */}
        {level !== 'stable' && (
          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 8,
            background: level === 'critical' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${level === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
          }}>
            <AlertTriangle style={{
              width: 14, height: 14, flexShrink: 0,
              color: level === 'critical' ? '#ef4444' : '#f59e0b',
            }} />
            <p style={{ fontSize: 12, color: level === 'critical' ? '#fca5a5' : '#fcd34d', margin: 0 }}>
              {level === 'critical'
                ? `Drift Index ${Math.round(score)} — Critical. Priority slots shown first. Please book soon.`
                : `Drift Index ${Math.round(score)} — Declining. We recommend scheduling within 48 hours.`}
            </p>
          </div>
        )}
      </div>

      {/* ── Filter chips ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Filter style={{ width: 13, height: 13, color: 'var(--text-3)' }} />
        <button
          onClick={() => setActiveFilter(null)}
          style={{
            padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.15s ease',
            background: !activeFilter ? 'var(--accent-dim)' : 'transparent',
            border: `1px solid ${!activeFilter ? 'var(--accent-border)' : 'var(--border)'}`,
            color: !activeFilter ? 'var(--accent)' : 'var(--text-2)',
          }}
        >
          All
        </button>
        {specialties.map(spec => {
          const sc = getSpecColor(spec);
          const active = activeFilter === spec;
          return (
            <button
              key={spec}
              onClick={() => setActiveFilter(active ? null : spec)}
              style={{
                padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s ease',
                background: active ? sc.bg : 'transparent',
                border: `1px solid ${active ? sc.border : 'var(--border)'}`,
                color: active ? sc.text : 'var(--text-2)',
              }}
            >
              {spec}
            </button>
          );
        })}
      </div>

      {/* ── Slots grouped by date ────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '40px 20px', textAlign: 'center',
        }}>
          <Calendar style={{ width: 32, height: 32, color: 'var(--text-3)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>No slots match your filter.</p>
          <button
            onClick={() => setActiveFilter(null)}
            className="btn-ghost"
            style={{ marginTop: 12, fontSize: 12 }}
          >
            Clear filter
          </button>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([date, slots]) => (
          <div key={date}>
            {/* Date header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 10, paddingLeft: 2,
            }}>
              <span style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text-1)',
              }}>
                {date}
              </span>
              <span style={{
                fontSize: 11, color: 'var(--text-3)',
                padding: '2px 8px', borderRadius: 99,
                background: 'var(--surface)', border: '1px solid var(--border)',
              }}>
                {slots.filter(s => s.available && !booked.has(s.id)).length} available
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {slots.map((slot, i) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  level={level}
                  score={score}
                  isBooked={booked.has(slot.id)}
                  booking={booked.get(slot.id)}
                  onBook={() => setConfirmSlot(slot)}
                  onCancelBooking={() => handleCancelBooking(slot.id)}
                  index={i}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* ── Upcoming sessions summary ────────────────────────────────────── */}
      {bookedSlots.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden',
        }}>
          <button
            onClick={() => setShowUpcoming(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 16px', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--text-1)',
            }}
          >
            <CheckCircle style={{ width: 15, height: 15, color: '#34d399' }} />
            <span style={{ fontSize: 14, fontWeight: 500, flex: 1, textAlign: 'left' }}>
              Your Upcoming Sessions ({bookedSlots.length})
            </span>
            {showUpcoming
              ? <ChevronUp style={{ width: 14, height: 14, color: 'var(--text-3)' }} />
              : <ChevronDown style={{ width: 14, height: 14, color: 'var(--text-3)' }} />}
          </button>

          {showUpcoming && (
            <div style={{ padding: '0 16px 14px' }}>
              {bookedSlots.map(slot => {
                const b = booked.get(slot.id)!;
                const sc = getSpecColor(slot.specialty);
                return (
                  <div
                    key={slot.id}
                    className="animate-fade-in"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 0',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: sc.bg, border: `1px solid ${sc.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600, color: sc.text,
                    }}>
                      {slot.doctor.split(' ').map(n => n[0]).join('').slice(1, 3)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{slot.doctor}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-2)' }}>
                        {slot.date} at {slot.time} · {slot.duration ?? 50} min · {slot.mode === 'video' ? 'Video' : 'In-Person'}
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--text-3)' }}>Booked at {b.at}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {isRiskBooking && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a78bfa' }}>
                          <Tag style={{ width: 10, height: 10 }} />
                          Risk
                        </span>
                      )}
                      <button
                        onClick={() => handleCancelBooking(slot.id)}
                        style={{
                          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: 8, padding: '4px 10px',
                          fontSize: 11, color: '#ef4444', cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Confirmation modal ───────────────────────────────────────────── */}
      {confirmSlot && (
        <ConfirmModal
          slot={confirmSlot}
          isPriority={!!confirmSlot.priority && level === 'critical'}
          loading={bookingLoading}
          onConfirm={handleConfirm}
          onCancel={() => { setConfirmSlot(null); setBookingLoading(false); }}
        />
      )}
    </div>
  );
};
