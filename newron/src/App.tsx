import { useState, useEffect, useCallback } from 'react';
import {
  Brain, LayoutDashboard, MessageCircle, Calendar,
  Stethoscope, Smile, BookOpen, Heart,
  User, LogOut, ArrowLeftRight, Nfc, Keyboard, Wind, FileText,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useAppContext } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useDriftEngine } from './hooks/useDriftEngine';
import { Dashboard } from './views/Dashboard';
import { ChatSupport } from './views/ChatSupport';
import { Appointments } from './views/Appointments';
import { DoctorDashboard } from './views/DoctorDashboard';
import { MoodLogger } from './views/MoodLogger';
import { Journal } from './views/Journal';

import { Profile } from './views/Profile';
import { NFCMoodPage } from './views/NFCMoodPage';
import { TypingTest } from './views/TypingTest';
import { BreathCoach } from './views/BreathCoach';
import { WeeklyReport } from './views/WeeklyReport';
import { AuthScreen } from './views/AuthScreen';
import { DriftBadge } from './components/DriftBadge';
import { ThemePicker } from './components/ThemePicker';
import { AIStatusBar } from './components/AIStatusBar';
import type { AIProvider } from './lib/ai';
import './App.css';

type PatientTab = 'dashboard' | 'chat' | 'appointments' | 'mood' | 'journal' | 'tips' | 'typing' | 'breath' | 'report' | 'profile' | 'nfc';
type DoctorTab  = 'patients' | 'profile';

function scoreToAmbient(score: number): string {
  if (score <= 35) return '#10b981';
  if (score <= 65) return '#f59e0b';
  return '#ef4444';
}

// ── Inner app ─────────────────────────────────────────────────────────────────
function AppInner() {
  const { user, isPsychiatrist, switchRole, logout } = useAuth();
  const { moodLog } = useAppContext();
  const { theme } = useTheme();
  const { score, level, trend, signals, isAnalyzing, processKeystroke, injectStress } = useDriftEngine();

  const [patientTab, setPatientTab] = useState<PatientTab>('dashboard');
  const [doctorTab,  setDoctorTab]  = useState<DoctorTab>('patients');
  const [showNFC,    setShowNFC]    = useState(false);
  const [lastAIProvider, setLastAIProvider] = useState<AIProvider | undefined>();
  const [lastAIMs, setLastAIMs] = useState<number | undefined>();
  const [typingHistory, setTypingHistory] = useState<number[]>([]);

  useEffect(() => {
    if (window.location.hash === '#nfc-mood') setShowNFC(true);
  }, []);

  const handleTypingStress = useCallback((s: number) => {
    injectStress(s);
    setTypingHistory(prev => [s, ...prev].slice(0, 10));
  }, [injectStress]);
  const ambientColor = scoreToAmbient(score);
  const recentMood   = moodLog[0]?.value ?? 6;

  if (showNFC) {
    return <NFCMoodPage onDone={() => { setShowNFC(false); window.location.hash = ''; }} />;
  }

  const patientNav = [
    { id: 'dashboard'    as PatientTab, label: 'Home',     icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { id: 'chat'         as PatientTab, label: 'AI Chat',  icon: <MessageCircle   className="w-[18px] h-[18px]" /> },
    { id: 'mood'         as PatientTab, label: 'Mood',     icon: <Smile           className="w-[18px] h-[18px]" /> },
    { id: 'journal'      as PatientTab, label: 'Journal',  icon: <BookOpen        className="w-[18px] h-[18px]" /> },
    { id: 'typing'       as PatientTab, label: 'Typing',   icon: <Keyboard        className="w-[18px] h-[18px]" /> },
    { id: 'breath'       as PatientTab, label: 'Breathe',  icon: <Wind            className="w-[18px] h-[18px]" /> },
    { id: 'report'       as PatientTab, label: 'Report',   icon: <FileText        className="w-[18px] h-[18px]" /> },
    { id: 'appointments' as PatientTab, label: 'Book',     icon: <Calendar        className="w-[18px] h-[18px]" /> },
    { id: 'profile'      as PatientTab, label: 'Profile',  icon: <User            className="w-[18px] h-[18px]" /> },
  ];

  const doctorNav = [
    { id: 'patients' as DoctorTab, label: 'Patients', icon: <Stethoscope className="w-[18px] h-[18px]" /> },
    { id: 'profile'  as DoctorTab, label: 'Profile',  icon: <User        className="w-[18px] h-[18px]" /> },
  ];

  const mobileNav = isPsychiatrist ? doctorNav : patientNav.slice(0, 5);
  const activeTab = isPsychiatrist ? doctorTab : patientTab;

  const navigate = (id: string) => {
    if (isPsychiatrist) setDoctorTab(id as DoctorTab);
    else setPatientTab(id as PatientTab);
  };

  // Light theme needs dark text on header
  const isLight = theme.id === 'light';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Ambient glow — only on dark themes */}
      {!isLight && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div style={{
            position: 'absolute', top: '-10%', left: '20%',
            width: 480, height: 480, borderRadius: '50%',
            background: `radial-gradient(circle, ${ambientColor}18 0%, transparent 65%)`,
            filter: 'blur(60px)',
            transition: 'background 2s ease',
          }} />
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain style={{ width: 16, height: 16, color: 'var(--accent)' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', color: 'var(--text-1)' }}>
              Newron
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* AI Status — always visible */}
          <div className="hidden sm:block">
            <AIStatusBar lastResponseMs={lastAIMs} lastProvider={lastAIProvider} />
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

            {/* NFC */}
            {!isPsychiatrist && (
              <button onClick={() => setShowNFC(true)} className="btn-ghost" style={{ padding: 7 }} title="Quick mood log">
                <Nfc style={{ width: 16, height: 16 }} />
              </button>
            )}

            {/* Theme picker */}
            <ThemePicker />

            {/* Role switch */}
            <button
              onClick={switchRole}
              className="btn-ghost"
              style={{
                padding: '6px 10px',
                fontSize: 12,
                background: isPsychiatrist ? 'var(--accent-dim)' : undefined,
                borderColor: isPsychiatrist ? 'var(--accent-border)' : undefined,
                color: isPsychiatrist ? 'var(--accent)' : undefined,
              }}
              title="Switch role (demo)"
            >
              <ArrowLeftRight style={{ width: 13, height: 13 }} />
              <span className="hidden sm:block" style={{ marginLeft: 4 }}>
                {isPsychiatrist ? 'Psychiatrist' : 'Patient'}
              </span>
            </button>

            {/* Drift badge */}
            {!isPsychiatrist && (
              <DriftBadge level={level} size="sm" showScore score={Math.round(score)} />
            )}

            {/* Avatar */}
            <button
              onClick={() => navigate('profile')}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1px solid var(--border-2)',
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--accent-dim)',
                flexShrink: 0, cursor: 'pointer',
              }}
            >
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                    {user?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
              }
            </button>
          </div>
        </div>
      </header>

      {/* ── Layout ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 96px', display: 'flex', gap: 24 }}>

        {/* Sidebar */}
        <nav className="hidden md:block" style={{ width: 168, flexShrink: 0 }}>
          <div style={{
            position: 'sticky', top: 72,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 6,
          }}>
            {(isPsychiatrist ? doctorNav : patientNav).map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
                    background: isActive ? 'var(--nav-active-bg)' : 'transparent',
                    color: isActive ? 'var(--nav-active-text)' : 'var(--text-2)',
                    fontSize: 13, fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-1)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
                    }
                  }}
                >
                  {item.icon}
                  {item.label}
                  {item.id === 'chat' && level !== 'stable' && (
                    <span style={{
                      marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%',
                      background: level === 'critical' ? '#ef4444' : '#f59e0b',
                    }} className={level === 'critical' ? 'pulse-red' : ''} />
                  )}
                </button>
              );
            })}

            {/* Drift mini bar */}
            {!isPsychiatrist && (
              <div style={{ margin: '10px 4px 4px', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Drift</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ambientColor }}>{Math.round(score)}</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: 'var(--border-2)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${score}%`,
                    background: ambientColor,
                    transition: 'width 0.7s ease, background 1s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Sign out */}
            <button
              onClick={logout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 12px', borderRadius: 10, border: '1px solid transparent',
                background: 'transparent', color: 'var(--text-3)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease', marginTop: 4,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
                (e.currentTarget as HTMLElement).style.color = '#ef4444';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-3)';
              }}
            >
              <LogOut style={{ width: 18, height: 18 }} />
              Sign Out
            </button>
          </div>
        </nav>

        {/* Content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {isPsychiatrist ? (
            <>
              {doctorTab === 'patients' && <DoctorDashboard />}
              {doctorTab === 'profile'  && <Profile />}
            </>
          ) : (
            <>
              {patientTab === 'dashboard'    && <Dashboard score={score} level={level} trend={trend} signals={signals} isAnalyzing={isAnalyzing} onOpenChat={() => setPatientTab('chat')} onOpenAppointments={() => setPatientTab('appointments')} />}
              {patientTab === 'chat'         && <ChatSupport level={level} score={score} onKeystroke={processKeystroke} onAIResponse={(p, ms) => { setLastAIProvider(p); setLastAIMs(ms); }} />}
              {patientTab === 'mood'         && <MoodLogger />}
              {patientTab === 'journal'      && <Journal />}
              {patientTab === 'typing'       && <TypingTest onStressUpdate={handleTypingStress} />}
              {patientTab === 'breath'       && <BreathCoach driftScore={score} />}
              {patientTab === 'report'       && <WeeklyReport avgDrift={score} level={level} typingHistory={typingHistory} />}
              {patientTab === 'appointments' && <Appointments level={level} score={score} />}
              {patientTab === 'profile'      && <Profile />}
            </>
          )}
        </main>
      </div>

      {/* ── Mobile bottom nav ──────────────────────────────────────────────── */}
      <nav className="md:hidden" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--header-bg)',
        borderTop: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
      }}>
        {mobileNav.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, padding: '10px 4px 12px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: isActive ? 'var(--accent)' : 'var(--text-3)',
                fontSize: 10, fontWeight: 500,
                transition: 'color 0.15s ease',
              }}
            >
              <span style={{ position: 'relative' }}>
                {item.icon}
                {item.id === 'chat' && level !== 'stable' && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 6, height: 6, borderRadius: '50%',
                    background: level === 'critical' ? '#ef4444' : '#f59e0b',
                  }} />
                )}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ── Auth gate ─────────────────────────────────────────────────────────────────
function AppWithAuth() {
  const { user } = useAuth();
  if (!user) return <AuthScreen />;
  return <AppInner />;
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <AppWithAuth />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
