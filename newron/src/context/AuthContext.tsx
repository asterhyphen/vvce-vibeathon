import React, { createContext, useContext, useState, useCallback } from 'react';
import type { UserProfile } from '../types';

// ── Preset demo accounts ──────────────────────────────────────────────────────
export const DEMO_USERS: (UserProfile & { password: string })[] = [
  {
    id: 'u1',
    name: 'Alex Morgan',
    email: 'alex@demo.com',
    password: 'demo123',
    age: 28,
    role: 'patient',
    avatar: '',
    driftLevel: 'critical',
    driftScore: 82,
  },
  {
    id: 'u2',
    name: 'Jordan Lee',
    email: 'jordan@demo.com',
    password: 'demo123',
    age: 34,
    role: 'patient',
    avatar: '',
    driftLevel: 'declining',
    driftScore: 54,
  },
  {
    id: 'u3',
    name: 'Sam Rivera',
    email: 'sam@demo.com',
    password: 'demo123',
    age: 22,
    role: 'patient',
    avatar: '',
    driftLevel: 'stable',
    driftScore: 18,
  },
  {
    id: 'doc1',
    name: 'Dr. Sarah Chen',
    email: 'dr.chen@demo.com',
    password: 'doctor123',
    age: 41,
    role: 'psychiatrist',
    avatar: '',
  },
];

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  register: (data: RegisterData) => { success: boolean; error?: string };
  updateProfile: (updates: Partial<UserProfile>) => void;
  isPsychiatrist: boolean;
  switchRole: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  age: number;
  avatar?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [forcedPsychiatrist, setForcedPsychiatrist] = useState(false);

  const login = useCallback((email: string, password: string) => {
    const found = DEMO_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return { success: false, error: 'Invalid email or password' };
    const { password: _pw, ...profile } = found;
    setUser(profile);
    setForcedPsychiatrist(false);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setForcedPsychiatrist(false);
  }, []);

  const register = useCallback((data: RegisterData) => {
    const exists = DEMO_USERS.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) return { success: false, error: 'Email already registered' };
    const newUser: UserProfile = {
      id: `u_${Date.now()}`,
      name: data.name,
      email: data.email,
      age: data.age,
      role: 'patient',
      avatar: data.avatar || '',
      driftLevel: 'stable',
      driftScore: 15,
    };
    DEMO_USERS.push({ ...newUser, password: data.password });
    setUser(newUser);
    return { success: true };
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  const switchRole = useCallback(() => {
    setForcedPsychiatrist(prev => !prev);
  }, []);

  const isPsychiatrist = forcedPsychiatrist || user?.role === 'psychiatrist';

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateProfile, isPsychiatrist, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
