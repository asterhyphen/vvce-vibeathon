import React, { useState, useRef } from 'react';
import { Brain, Eye, EyeOff, Upload, Sparkles, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [age, setAge] = useState('');
  const [avatar, setAvatar] = useState('');

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const result = login(email, password);
    setLoading(false);
    if (!result.success) setError(result.error || 'Login failed');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Name is required');
    if (!age || isNaN(Number(age)) || Number(age) < 13 || Number(age) > 120) {
      return setError('Please enter a valid age (13–120)');
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const result = register({ name, email: regEmail, password: regPassword, age: Number(age), avatar });
    setLoading(false);
    if (!result.success) setError(result.error || 'Registration failed');
  };

  return (
    <div className="min-h-screen bg-[#080a14] flex items-center justify-center px-4">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-4">
            <Brain className="w-7 h-7 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">newron</h1>
          <p className="text-slate-400 text-sm mt-1 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Mental Health Intelligence
          </p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-6">
          {/* Tab switcher */}
          <div className="flex rounded-xl bg-slate-800/50 p-1 mb-6">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-violet-600/80 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm animate-fade-in">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="alex@demo.com"
                  required
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500/60 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="demo123"
                    required
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500/60 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium text-sm transition-all hover:scale-[1.02]"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              {/* Demo hint */}
              <div className="pt-2 border-t border-slate-700/30">
                <p className="text-xs text-slate-500 text-center mb-2">Demo accounts</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Patient (Critical)', email: 'alex@demo.com', pw: 'demo123' },
                    { label: 'Patient (Stable)', email: 'sam@demo.com', pw: 'demo123' },
                    { label: 'Psychiatrist', email: 'dr.chen@demo.com', pw: 'doctor123' },
                    { label: 'Patient (Declining)', email: 'jordan@demo.com', pw: 'demo123' },
                  ].map(d => (
                    <button
                      key={d.email}
                      type="button"
                      onClick={() => { setEmail(d.email); setPassword(d.pw); }}
                      className="text-xs px-2 py-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-700/70 text-slate-400 hover:text-slate-200 transition-all text-left"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Avatar upload */}
              <div className="flex flex-col items-center gap-2">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 hover:border-violet-500/60 cursor-pointer flex items-center justify-center overflow-hidden transition-colors"
                >
                  {avatar
                    ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                    : <User className="w-6 h-6 text-slate-500" />
                  }
                </div>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
                  <Upload className="w-3 h-3" /> Upload photo
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500/60 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Age</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="25" min="13" max="120" required
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500/60 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Email</label>
                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="you@email.com" required
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500/60 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6}
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500/60 transition-colors" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium text-sm transition-all hover:scale-[1.02]">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
