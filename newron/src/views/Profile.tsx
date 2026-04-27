import React, { useState, useRef } from 'react';
import { Upload, LogOut, Edit2, Check, X, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Profile: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(String(user?.age || ''));
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

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Profile card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-full border-2 border-violet-500/40 overflow-hidden cursor-pointer hover:border-violet-400 transition-colors flex items-center justify-center bg-violet-600/20"
            >
              {user.avatar
                ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-violet-300">{initials}</span>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-violet-600 border-2 border-[#080a14] flex items-center justify-center hover:bg-violet-500 transition-colors"
            >
              <Upload className="w-3 h-3 text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          {editing ? (
            <div className="w-full max-w-xs space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2 text-sm text-slate-100 outline-none focus:border-violet-500/60 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Age</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)} min="13" max="120"
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2 text-sm text-slate-100 outline-none focus:border-violet-500/60 transition-colors" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all">
                  <Check className="w-4 h-4" /> Save
                </button>
                <button onClick={() => { setEditing(false); setName(user.name); setAge(String(user.age)); }}
                  className="px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-100">{user.name}</h2>
              <p className="text-sm text-slate-400">{user.email}</p>
              <p className="text-sm text-slate-400">Age {user.age}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  user.role === 'psychiatrist'
                    ? 'bg-blue-500/15 border border-blue-500/30 text-blue-300'
                    : 'bg-violet-500/15 border border-violet-500/30 text-violet-300'
                }`}>
                  {user.role === 'psychiatrist' ? '🩺 Psychiatrist' : '👤 Patient'}
                </span>
              </div>
              <button onClick={() => setEditing(true)}
                className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm transition-all mx-auto">
                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account info */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" /> Account Details
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Email', value: user.email },
            { label: 'Role', value: user.role === 'psychiatrist' ? 'Psychiatrist' : 'Patient' },
            { label: 'Member since', value: 'April 2026' },
            { label: 'Data privacy', value: 'All data stored locally' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-700/20 last:border-0">
              <span className="text-xs text-slate-400">{item.label}</span>
              <span className="text-xs text-slate-200">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-sm font-medium transition-all"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
};
