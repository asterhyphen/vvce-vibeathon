import React, { createContext, useContext, useState, useCallback } from 'react';
import type { UserProfile } from '../types';

export type PsychiatristStatus = 'approved' | 'pending' | 'rejected';

export interface PsychiatristApplication {
  id: string;
  name: string;
  email: string;
  age: number;
  specialty: string;
  licenseNumber: string;
  hospital: string;
  appliedAt: Date;
  status: PsychiatristStatus;
  avatar?: string;
}

export const DEMO_USERS: (UserProfile & { password: string })[] = [
  { id: 'u1', name: 'Alex Morgan',    email: 'alex@demo.com',    password: 'demo123',   age: 28, role: 'patient',      avatar: '', driftLevel: 'critical',  driftScore: 82 },
  { id: 'u2', name: 'Jordan Lee',     email: 'jordan@demo.com',  password: 'demo123',   age: 34, role: 'patient',      avatar: '', driftLevel: 'declining', driftScore: 54 },
  { id: 'u3', name: 'Sam Rivera',     email: 'sam@demo.com',     password: 'demo123',   age: 22, role: 'patient',      avatar: '', driftLevel: 'stable',    driftScore: 18 },
  { id: 'doc1', name: 'Dr. Sarah Chen', email: 'dr.chen@demo.com', password: 'doctor123', age: 41, role: 'psychiatrist', avatar: '' },
  { id: 'admin1', name: 'Admin',      email: 'admin@newron.com', password: 'admin123',  age: 30, role: 'admin' as any, avatar: '' },
];

// Pre-seeded pending applications for demo
export const INITIAL_APPLICATIONS: PsychiatristApplication[] = [
  {
    id: 'app1', name: 'Dr. Marcus Webb', email: 'marcus@demo.com', age: 38,
    specialty: 'Psychiatry', licenseNumber: 'PSY-2024-001', hospital: 'City Medical Center',
    appliedAt: new Date(Date.now() - 86400000 * 2), status: 'pending',
  },
  {
    id: 'app2', name: 'Dr. Priya Nair', email: 'priya@demo.com', age: 44,
    specialty: 'Clinical Psychology', licenseNumber: 'PSY-2024-002', hospital: 'Wellness Institute',
    appliedAt: new Date(Date.now() - 86400000), status: 'pending',
  },
  {
    id: 'app3', name: 'Dr. James Okafor', email: 'james@demo.com', age: 51,
    specialty: 'Psychiatry', licenseNumber: 'PSY-2023-089', hospital: 'Metro Health',
    appliedAt: new Date(Date.now() - 86400000 * 5), status: 'approved',
  },
];

interface AuthContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  register: (data: RegisterData) => { success: boolean; error?: string };
  applyAsPsychiatrist: (data: PsychiatristRegisterData) => { success: boolean; error?: string };
  updateProfile: (updates: Partial<UserProfile>) => void;
  isPsychiatrist: boolean;
  switchRole: () => void;
  // Admin
  applications: PsychiatristApplication[];
  approveApplication: (id: string) => void;
  rejectApplication: (id: string) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  age: number;
  avatar?: string;
}

interface PsychiatristRegisterData extends RegisterData {
  specialty: string;
  licenseNumber: string;
  hospital: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [forcedPsychiatrist, setForcedPsychiatrist] = useState(false);
  const [applications, setApplications] = useState<PsychiatristApplication[]>(INITIAL_APPLICATIONS);

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

  const logout = useCallback(() => { setUser(null); setForcedPsychiatrist(false); }, []);

  const register = useCallback((data: RegisterData) => {
    const exists = DEMO_USERS.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) return { success: false, error: 'Email already registered' };
    const newUser: UserProfile = {
      id: `u_${Date.now()}`, name: data.name, email: data.email,
      age: data.age, role: 'patient', avatar: data.avatar || '',
      driftLevel: 'stable', driftScore: 15,
    };
    DEMO_USERS.push({ ...newUser, password: data.password });
    setUser(newUser);
    return { success: true };
  }, []);

  const applyAsPsychiatrist = useCallback((data: PsychiatristRegisterData) => {
    const exists = DEMO_USERS.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) return { success: false, error: 'Email already registered' };
    const app: PsychiatristApplication = {
      id: `app_${Date.now()}`, name: data.name, email: data.email, age: data.age,
      specialty: data.specialty, licenseNumber: data.licenseNumber, hospital: data.hospital,
      appliedAt: new Date(), status: 'pending', avatar: data.avatar,
    };
    setApplications(prev => [app, ...prev]);
    return { success: true };
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  const switchRole = useCallback(() => setForcedPsychiatrist(prev => !prev), []);

  const approveApplication = useCallback((id: string) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
    // Add to demo users as psychiatrist
    const app = applications.find(a => a.id === id);
    if (app) {
      DEMO_USERS.push({
        id: `doc_${id}`, name: app.name, email: app.email, password: 'approved123',
        age: app.age, role: 'psychiatrist', avatar: app.avatar || '',
      });
    }
  }, [applications]);

  const rejectApplication = useCallback((id: string) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
  }, []);

  const isPsychiatrist = forcedPsychiatrist || user?.role === 'psychiatrist';
  const isAdmin = user?.role === ('admin' as any);

  return (
    <AuthContext.Provider value={{
      user, isAdmin, login, logout, register, applyAsPsychiatrist,
      updateProfile, isPsychiatrist, switchRole,
      applications, approveApplication, rejectApplication,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
