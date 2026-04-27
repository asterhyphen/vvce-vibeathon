import React, { useState, useRef } from 'react';
import { Brain, Eye, EyeOff, Upload, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

const DEMO = [
  { label: 'Patient — Critical',  email: 'alex@demo.com',     pw: 'demo123'   },
  { label: 'Patient — Stable',    email: 'sam@demo.com',      pw: 'demo123'   },
  { label: 'Psychiatrist',        email: 'dr.chen@demo.com',  pw: 'doctor123' },
  { label: 'Patient — Declining', email: 'jordan@demo.com',   pw: 'demo123'   },
];

const Field: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: string; max?: string;
  suffix?: React.ReactNode;
}> = ({ label, type = 'text', value, onChange, placeholder, min, max, suffix }) => (
  <div>
    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} min={min} max={max}
        className="input"
        style={{ paddingRight: suffix ? 40 : undefined }}
      />
      {suffix && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
          {suffix}
        </div>
      )}
    </div>
  </div>
);

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode]       = useState<Mode>('login');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]       = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPw, setRegPw]     = useState('');
  const [age, setAge]         = useState('');
  const [avatar, setAvatar]   = useState('');

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 350));
    const res = login(email, password);
    setLoading(false);
    if (!res.success) setError(res.error || 'Login failed');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!name.trim()) return setError('Name is required');
    if (!age || isNaN(+age) || +age < 13 || +age > 120) return setError('Enter a valid age (13–120)');
    setLoading(true);
    await new Promise(r => setTimeout(r, 350));
    const res = register({ name, email: regEmail, password: regPw, age: +age, avatar });
    setLoading(false);
    if (!res.success) setError(res.error || 'Registration failed');
  };

  const eyeBtn = (
    <button type="button" onClick={() => setShowPass(p => !p)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
      {showPass ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
    </button>
  );

  return (
    <div style={{
      minHeight: '100svh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 360 }} className="animate-fade-in">

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, margin: '0 auto 12px',
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain style={{ width: 24, height: 24, color: 'var(--accent)' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.5px' }}>Newron</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Mental Health Intelligence</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--border-2)',
          borderRadius: 20, padding: 24,
        }}>
          {/* Tab switcher */}
          <div style={{
            display: 'flex', background: 'var(--surface)', borderRadius: 12,
            padding: 4, marginBottom: 24, border: '1px solid var(--border)',
          }}>
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 9, border: 'none',
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  color: mode === m ? 'var(--accent-text)' : 'var(--text-2)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="animate-fade-in" style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#fca5a5', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="alex@demo.com" />
              <Field label="Password" type={showPass ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="demo123" suffix={eyeBtn} />

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              {/* Demo accounts */}
              <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginBottom: 8 }}>
                  Demo accounts
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {DEMO.map(d => (
                    <button key={d.email} type="button"
                      onClick={() => { setEmail(d.email); setPassword(d.pw); }}
                      style={{
                        padding: '7px 10px', borderRadius: 9, border: '1px solid var(--border)',
                        background: 'var(--surface)', color: 'var(--text-2)',
                        fontSize: 11, cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.12s ease',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--text-1)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div onClick={() => fileRef.current?.click()} style={{
                  width: 64, height: 64, borderRadius: '50%',
                  border: '2px dashed var(--border-2)',
                  cursor: 'pointer', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--surface)',
                  transition: 'border-color 0.15s ease',
                }}>
                  {avatar
                    ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <User style={{ width: 22, height: 22, color: 'var(--text-3)' }} />
                  }
                </div>
                <button type="button" onClick={() => fileRef.current?.click()}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Upload style={{ width: 12, height: 12 }} /> Upload photo
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
              </div>

              <Field label="Full Name" value={name} onChange={setName} placeholder="Your name" />
              <Field label="Age" type="number" value={age} onChange={setAge} placeholder="25" min="13" max="120" />
              <Field label="Email" type="email" value={regEmail} onChange={setRegEmail} placeholder="you@email.com" />
              <Field label="Password" type={showPass ? 'text' : 'password'} value={regPw} onChange={setRegPw} placeholder="Min 6 characters" suffix={eyeBtn} />

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
