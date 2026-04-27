import React, { useState, useRef } from 'react';
import { Brain, Eye, EyeOff, Upload, User, Stethoscope, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register' | 'apply';

const DEMO = [
  { label: 'Patient (Critical)',  email: 'alex@demo.com',    pw: 'demo123'   },
  { label: 'Patient (Stable)',    email: 'sam@demo.com',     pw: 'demo123'   },
  { label: 'Psychiatrist',        email: 'dr.chen@demo.com', pw: 'doctor123' },
  { label: 'Admin',               email: 'admin@newron.com', pw: 'admin123'  },
];

const Field: React.FC<{
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  min?: string; max?: string; suffix?: React.ReactNode;
}> = ({ label, type = 'text', value, onChange, placeholder, min, max, suffix }) => (
  <div>
    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 5 }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} min={min} max={max} className="input"
        style={{ paddingRight: suffix ? 40 : undefined }} />
      {suffix && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
          {suffix}
        </div>
      )}
    </div>
  </div>
);

export const AuthScreen: React.FC = () => {
  const { login, register, applyAsPsychiatrist } = useAuth();
  const [mode, setMode]       = useState<Mode>('login');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Login
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');

  // Register
  const [name, setName]       = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPw, setRegPw]     = useState('');
  const [age, setAge]         = useState('');
  const [avatar, setAvatar]   = useState('');

  // Psychiatrist apply
  const [pName, setPName]     = useState('');
  const [pEmail, setPEmail]   = useState('');
  const [pPw, setPPw]         = useState('');
  const [pAge, setPAge]       = useState('');
  const [pSpec, setPSpec]     = useState('');
  const [pLicense, setPLicense] = useState('');
  const [pHospital, setPHospital] = useState('');
  const [pAvatar, _setPAvatar] = useState('');

  const handleAvatarUpload = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setter(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const res = login(email, password);
    setLoading(false);
    if (!res.success) setError(res.error || 'Login failed');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!name.trim()) return setError('Name is required');
    if (!age || isNaN(+age) || +age < 13 || +age > 120) return setError('Enter a valid age (13–120)');
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const res = register({ name, email: regEmail, password: regPw, age: +age, avatar });
    setLoading(false);
    if (!res.success) setError(res.error || 'Registration failed');
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!pName.trim()) return setError('Name is required');
    if (!pLicense.trim()) return setError('License number is required');
    if (!pHospital.trim()) return setError('Hospital is required');
    if (!pSpec.trim()) return setError('Specialty is required');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const res = applyAsPsychiatrist({
      name: pName, email: pEmail, password: pPw, age: +pAge,
      specialty: pSpec, licenseNumber: pLicense, hospital: pHospital, avatar: pAvatar,
    });
    setLoading(false);
    if (!res.success) setError(res.error || 'Application failed');
    else setSuccess('Application submitted! An admin will review your credentials within 24 hours.');
  };

  const eyeBtn = (
    <button type="button" onClick={() => setShowPass(p => !p)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
      {showPass ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
    </button>
  );

  const TABS: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: 'login',    label: 'Sign In',    icon: <User style={{ width: 12, height: 12 }} /> },
    { id: 'register', label: 'Register',   icon: <User style={{ width: 12, height: 12 }} /> },
    { id: 'apply',    label: 'Psychiatrist', icon: <Stethoscope style={{ width: 12, height: 12 }} /> },
  ];

  return (
    <div style={{
      minHeight: '100svh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }} className="animate-fade-in">

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, margin: '0 auto 12px',
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain style={{ width: 24, height: 24, color: 'var(--accent)' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.5px' }}>Newron</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Mental Health Intelligence</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--border-2)',
          borderRadius: 20, padding: 24,
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'var(--surface)', borderRadius: 12,
            padding: 3, marginBottom: 20, border: '1px solid var(--border)', gap: 2,
          }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setMode(t.id); setError(''); setSuccess(''); }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '7px 4px', borderRadius: 9, border: 'none',
                  background: mode === t.id ? 'var(--accent)' : 'transparent',
                  color: mode === t.id ? 'var(--accent-text)' : 'var(--text-2)',
                  fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease',
                }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Error / Success */}
          {error && (
            <div style={{
              marginBottom: 14, padding: '9px 12px', borderRadius: 10,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#fca5a5', fontSize: 12,
            }} className="animate-fade-in">{error}</div>
          )}
          {success && (
            <div style={{
              marginBottom: 14, padding: '9px 12px', borderRadius: 10,
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
              color: '#6ee7b7', fontSize: 12,
            }} className="animate-fade-in">{success}</div>
          )}

          {/* ── Login ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="alex@demo.com" />
              <Field label="Password" type={showPass ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="demo123" suffix={eyeBtn} />
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginBottom: 8 }}>Quick demo access</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                  {DEMO.map(d => (
                    <button key={d.email} type="button"
                      onClick={() => { setEmail(d.email); setPassword(d.pw); }}
                      style={{
                        padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)',
                        background: 'var(--surface)', color: 'var(--text-2)',
                        fontSize: 11, cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s ease',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
                    >{d.label}</button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* ── Register ── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div onClick={() => fileRef.current?.click()} style={{
                  width: 60, height: 60, borderRadius: '50%', border: '2px dashed var(--border-2)',
                  cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--surface)',
                }}>
                  {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User style={{ width: 20, height: 20, color: 'var(--text-3)' }} />}
                </div>
                <button type="button" onClick={() => fileRef.current?.click()}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Upload style={{ width: 11, height: 11 }} /> Upload photo
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload(setAvatar)} />
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

          {/* ── Psychiatrist Application ── */}
          {mode === 'apply' && !success && (
            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 8,
                background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
              }}>
                <Shield style={{ width: 12, height: 12, color: '#60a5fa', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#93c5fd', lineHeight: 1.4 }}>
                  Applications are reviewed by admins. Approval grants access to the doctor dashboard.
                </span>
              </div>
              <Field label="Full Name" value={pName} onChange={setPName} placeholder="Dr. Jane Smith" />
              <Field label="Age" type="number" value={pAge} onChange={setPAge} placeholder="35" min="25" max="80" />
              <Field label="Email" type="email" value={pEmail} onChange={setPEmail} placeholder="dr.smith@hospital.com" />
              <Field label="Password" type={showPass ? 'text' : 'password'} value={pPw} onChange={setPPw} placeholder="Min 6 characters" suffix={eyeBtn} />
              <Field label="Specialty" value={pSpec} onChange={setPSpec} placeholder="Psychiatry / Clinical Psychology" />
              <Field label="License Number" value={pLicense} onChange={setPLicense} placeholder="PSY-2024-XXX" />
              <Field label="Hospital / Institution" value={pHospital} onChange={setPHospital} placeholder="City Medical Center" />
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                {loading ? 'Submitting…' : 'Submit Application'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
