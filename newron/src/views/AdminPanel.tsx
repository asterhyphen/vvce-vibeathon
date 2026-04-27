import React, { useState } from 'react';
import {
  ShieldCheck, Clock, CheckCircle, XCircle, User,
  Building2, Hash, Stethoscope, ChevronDown, ChevronUp,
  AlertTriangle, Users, BarChart3,
} from 'lucide-react';
import { useAuth, type PsychiatristApplication } from '../context/AuthContext';

const S = {
  page: { display: 'flex', flexDirection: 'column' as const, gap: 16 },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 16, padding: 20,
  },
  row: { display: 'flex', alignItems: 'center', gap: 12 },
  iconBox: (color: string) => ({
    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
    background: `${color}18`, border: `1px solid ${color}40`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }),
  badge: (color: string) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
    background: `${color}15`, border: `1px solid ${color}35`, color,
  }),
  label: { fontSize: 11, color: 'var(--text-3)', marginBottom: 4, display: 'block' as const },
  value: { fontSize: 13, color: 'var(--text-1)', fontWeight: 500 },
  divider: { borderTop: '1px solid var(--border)', margin: '12px 0' },
};

const STATUS_CONFIG = {
  pending:  { color: '#f59e0b', icon: Clock,         label: 'Pending Review' },
  approved: { color: '#10b981', icon: CheckCircle,   label: 'Approved' },
  rejected: { color: '#ef4444', icon: XCircle,       label: 'Rejected' },
};

const ApplicationCard: React.FC<{
  app: PsychiatristApplication;
  onApprove: () => void;
  onReject: () => void;
}> = ({ app, onApprove, onReject }) => {
  const [expanded, setExpanded] = useState(app.status === 'pending');
  const cfg = STATUS_CONFIG[app.status];
  const StatusIcon = cfg.icon;
  const initials = app.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{
      ...S.card,
      borderColor: app.status === 'pending' ? 'rgba(245,158,11,0.25)' : 'var(--border)',
    }} className="animate-fade-in">
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: cfg.color,
        }}>
          {app.avatar
            ? <img src={app.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : initials
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{app.name}</span>
            <span style={S.badge(cfg.color)}>
              <StatusIcon style={{ width: 10, height: 10 }} />
              {cfg.label}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            {app.email} · Applied {app.appliedAt.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}
        >
          {expanded ? <ChevronUp style={{ width: 16, height: 16 }} /> : <ChevronDown style={{ width: 16, height: 16 }} />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="animate-fade-in">
          <div style={S.divider} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {[
              { icon: Stethoscope, label: 'Specialty',       value: app.specialty },
              { icon: Hash,        label: 'License Number',  value: app.licenseNumber },
              { icon: Building2,   label: 'Hospital',        value: app.hospital },
              { icon: User,        label: 'Age',             value: `${app.age} years` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <Icon style={{ width: 12, height: 12, color: 'var(--text-3)' }} />
                  <span style={S.label}>{label}</span>
                </div>
                <span style={S.value}>{value}</span>
              </div>
            ))}
          </div>

          {/* Action buttons — only for pending */}
          {app.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onApprove}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 0', borderRadius: 10, border: '1px solid rgba(16,185,129,0.4)',
                  background: 'rgba(16,185,129,0.1)', color: '#10b981',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.1)'}
              >
                <CheckCircle style={{ width: 14, height: 14 }} />
                Approve
              </button>
              <button
                onClick={onReject}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 0', borderRadius: 10, border: '1px solid rgba(239,68,68,0.35)',
                  background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
              >
                <XCircle style={{ width: 14, height: 14 }} />
                Reject
              </button>
            </div>
          )}

          {app.status === 'approved' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10,
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            }}>
              <CheckCircle style={{ width: 13, height: 13, color: '#10b981' }} />
              <span style={{ fontSize: 12, color: '#10b981' }}>
                Approved — credentials sent to {app.email}
              </span>
            </div>
          )}

          {app.status === 'rejected' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10,
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <XCircle style={{ width: 13, height: 13, color: '#ef4444' }} />
              <span style={{ fontSize: 12, color: '#ef4444' }}>Application rejected</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const AdminPanel: React.FC = () => {
  const { applications, approveApplication, rejectApplication } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const counts = {
    all:      applications.length,
    pending:  applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  return (
    <div style={S.page} className="animate-fade-in">

      {/* Header */}
      <div style={S.card}>
        <div style={S.row}>
          <div style={S.iconBox('var(--accent)')}>
            <ShieldCheck style={{ width: 18, height: 18, color: 'var(--accent)' }} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>Admin Panel</p>
            <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Psychiatrist credential verification</p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
          {[
            { label: 'Pending',  count: counts.pending,  color: '#f59e0b', icon: Clock },
            { label: 'Approved', count: counts.approved, color: '#10b981', icon: CheckCircle },
            { label: 'Rejected', count: counts.rejected, color: '#ef4444', icon: XCircle },
          ].map(({ label, count, color, icon: Icon }) => (
            <div key={label} style={{
              padding: '12px 14px', borderRadius: 12,
              background: `${color}0d`, border: `1px solid ${color}25`,
              textAlign: 'center',
            }}>
              <Icon style={{ width: 16, height: 16, color, margin: '0 auto 6px' }} />
              <p style={{ fontSize: 22, fontWeight: 700, color }}>{count}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Warning if pending */}
        {counts.pending > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 14,
            padding: '9px 12px', borderRadius: 10,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          }}>
            <AlertTriangle style={{ width: 13, height: 13, color: '#f59e0b', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#fcd34d' }}>
              {counts.pending} application{counts.pending > 1 ? 's' : ''} awaiting review
            </span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => {
          const colors = { all: 'var(--accent)', pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };
          const c = colors[f];
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 99, border: '1px solid',
              borderColor: filter === f ? `${c}50` : 'var(--border)',
              background: filter === f ? `${c}15` : 'transparent',
              color: filter === f ? c : 'var(--text-2)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease',
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span style={{
                marginLeft: 5, fontSize: 10,
                background: filter === f ? `${c}25` : 'var(--surface-2)',
                padding: '1px 5px', borderRadius: 99,
                color: filter === f ? c : 'var(--text-3)',
              }}>
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications list */}
      {filtered.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
          <Users style={{ width: 32, height: 32, color: 'var(--text-3)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>No {filter === 'all' ? '' : filter} applications</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(app => (
            <ApplicationCard
              key={app.id}
              app={app}
              onApprove={() => approveApplication(app.id)}
              onReject={() => rejectApplication(app.id)}
            />
          ))}
        </div>
      )}

      {/* Info box */}
      <div style={{ ...S.card, background: 'var(--surface-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <BarChart3 style={{ width: 13, height: 13, color: 'var(--accent)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>Verification Process</span>
        </div>
        {[
          'Psychiatrist submits application with license number and hospital affiliation',
          'Admin reviews credentials and verifies license validity',
          'Approved psychiatrists gain access to the doctor dashboard',
          'Rejected applicants receive notification with reason',
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: 'var(--accent)',
            }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
