import React, { useState, useRef } from 'react';
import { Upload, LogOut, Edit2, Check, X, Shield, User, Stethoscope, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const S = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 },
  label: { fontSize: 11, color: 'var(--text-3)', display: 'block' as const, marginBottom: 5 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' },
};

export const Profile: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(user?.name || '');
  const [age, setAge]         = useState(String(user?.age || ''));
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateProfile({ avatar: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    updateProfile({ name, age: Number(age) });
    setEditing(false);
  };

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isPsych = user.role === 'psychiatrist';
  const isAdm   = user.role === ('admin' as any);

  const roleColor  = isPsych ? '#60a5fa' : isAdm ? '#f59e0b' : 'var(--accent)';
  const RoleIcon   = isPsych ? Stethoscope : isAdm ? Shield : User;
  const roleLabel  = isPsych ? 'Psychiatrist' : isAdm ? 'Administrator' : 'Patient';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-fade-in">

      {/* Profile card */}
      <div style={S.card}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: 80, height: 80, borderRadius: '50%', cursor: 'pointer',
                border: `2px solid ${roleColor}50`, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${roleColor}15`, transition: 'border-color 0.15s ease',
              }}
            >
              {user.avatar
                ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 24, fontWeight: 700, color: roleColor }}>{initials}</span>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--accent)', border: '2px solid var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Upload style={{ width: 11, height: 11, color: 'var(--accent-text)' }} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
          </div>

          {/* Role badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 99,
            background: `${roleColor}15`, border: `1px solid ${roleColor}35`,
            color: roleColor, fontSize: 12, fontWeight: 500,
          }}>
            <RoleIcon style={{ width: 12, height: 12 }} />
            {roleLabel}
          </div>

          {/* Edit form */}
          {editing ? (
            <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={S.label}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" style={{ fontSize: 13 }} />
              </div>
              <div>
                <label style={S.label}>Age</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)} min="13" max="120" className="input" style={{ fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSave} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}>
                  <Check style={{ width: 14, height: 14 }} /> Save
                </button>
                <button onClick={() => { setEditing(false); setName(user.name); setAge(String(user.age)); }}
                  className="btn-ghost" style={{ fontSize: 13 }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)' }}>{user.name}</p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{user.email}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Age {user.age}</p>
              <button onClick={() => setEditing(true)} className="btn-ghost"
                style={{ marginTop: 12, fontSize: 12, padding: '6px 14px' }}>
                <Edit2 style={{ width: 12, height: 12 }} /> Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account details */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Shield style={{ width: 14, height: 14, color: 'var(--accent)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Account Details</span>
        </div>
        {[
          { label: 'Email',        value: user.email },
          { label: 'Role',         value: roleLabel },
          { label: 'Member since', value: 'April 2026' },
          { label: 'Data storage', value: 'Local only' },
        ].map(item => (
          <div key={item.label} style={{ ...S.row, ...(item === [{ label: 'Data storage', value: 'Local only' }][0] ? { borderBottom: 'none' } : {}) }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.label}</span>
            <span style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 500 }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Security */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Lock style={{ width: 14, height: 14, color: 'var(--accent)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Security</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
          All data is stored locally in your browser session. No data is transmitted to external servers unless AI features are enabled.
        </p>
      </div>

      {/* Sign out */}
      <button
        onClick={logout}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px 0', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)',
          background: 'rgba(239,68,68,0.08)', color: '#ef4444',
          fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
      >
        <LogOut style={{ width: 15, height: 15 }} />
        Sign Out
      </button>
    </div>
  );
};
