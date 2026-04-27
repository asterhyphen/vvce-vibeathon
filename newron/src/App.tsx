import { useState, useEffect } from 'react';
import {
  Brain, LayoutDashboard, MessageCircle, Calendar,
  Stethoscope, Sparkles, Smile, BookOpen, Heart,
  User, LogOut, ArrowLeftRight, Nfc,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useAppContext } from './context/AppContext';
import { useDriftEngine } from './hooks/useDriftEngine';
import { Dashboard } from './views/Dashboard';
import { ChatSupport } from './views/ChatSupport';
import { Appointments } from './views/Appointments';
import { DoctorDashboard } from './views/DoctorDashboard';
import { MoodLogger } from './views/MoodLogger';
import { Journal } from './views/Journal';
import { WellnessTips } from './views/WellnessTips';
import { Profile } from './views/Profile';
import { NFCMoodPage } from './views/NFCMoodPage';
import { AuthScreen } from './views/AuthScreen';
import { DriftBadge } from './components/DriftBadge';
import './App.css';

type PatientTab = 'dashboard' | 'chat' | 'appointments' | 'mood' | 'journal' | 'tips' | 'profile' | 'nfc';
type DoctorTab = 'patients' | 'profile';

// ── Score-based ambient background color ─────────────────────────────────────
function scoreToAmbient(score: number): string {
  const s = Math.max(0, Math.min(100, score));
  if (s <= 35) return '#10b981'; // green
  if (s <= 65) return '#f59e0b'; // amber
  return '#ef4444';              // red
}

// ── Inner app (authenticated) ─────────────────────────────────────────────────
function AppInner() {
  const { user, isPsychiatrist, switchRole, logout } = useAuth();
  const { moodLog } = useAppContext();
  const { score, level, trend, signals, isAnalyzing, processKeystroke } = useDriftEngine();

  const [patientTab, setPatientTab] = useState<PatientTab>('dashboard');
  const [doctorTab, setDoctorTab] = useState<DoctorTab>('patients');
  const [showNFC, setShowNFC] = useState(false);

  // Check for NFC hash on load
  useEffect(() => {
    if (window.location.hash === '#nfc-mood') setShowNFC(true);
  }, []);

  const ambientColor = scoreToAmbient(score);
  const recentMood = moodLog[0]?.value ?? 6;

  if (showNFC) {
    return <NFCMoodPage onDone={() => { setShowNFC(false); window.location.hash = ''; }} />;
  }

  const patientNav = [
    { id: 'dashboard' as PatientTab, label: 'Home',         icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'chat'      as PatientTab, label: 'AI Chat',      icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'mood'      as PatientTab, label: 'Mood',         icon: <Smile className="w-4 h-4" /> },
    { id: 'journal'   as PatientTab, label: 'Journal',      icon: <BookOpen className="w-4 h-4" /> },
    { id: 'tips'      as PatientTab, label: 'Wellness',     icon: <Heart className="w-4 h-4" /> },
    { id: 'appointments' as PatientTab, label: 'Book',      icon: <Calendar className="w-4 h-4" /> },
    { id: 'profile'   as PatientTab, label: 'Profile',      icon: <User className="w-4 h-4" /> },
  ];

  const doctorNav = [
    { id: 'patients' as DoctorTab, label: 'Patients', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'profile'  as DoctorTab, label: 'Profile',  icon: <User className="w-4 h-4" /> },
  ];

  const activePatientNav = patientNav;
  const mobilePatientNav = patientNav.slice(0, 5); // show first 5 in bottom bar

  return (
    <div className="min-h-screen bg-[#080a14]">
      {/* Ambient background — color shifts with score */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full"
          style={{
            background: `radial-gradient(circle, ${ambientColor} 0%, transparent 70%)`,
            filter: 'blur(80px)',
            opacity: 0.08,
            transition: 'background 2s ease',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)',
            filter: 'blur(80px)',
            opacity: 0.06,
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#080a14]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
              <Brain className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm tracking-tight">newron</span>
              <div className="flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                <span className="text-xs text-slate-500 hidden sm:block">Mental Health Intelligence</span>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* NFC quick log */}
            {!isPsychiatrist && (
              <button
                onClick={() => setShowNFC(true)}
                className="p-2 rounded-xl text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                title="Quick NFC mood log"
              >
                <Nfc className="w-4 h-4" />
              </button>
            )}

            {/* Role switch (demo helper) */}
            <button
              onClick={switchRole}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                isPsychiatrist
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-300 hover:bg-blue-500/25'
                  : 'bg-slate-700/40 border-slate-600/30 text-slate-400 hover:text-slate-200'
              }`}
              title="Switch between patient and psychiatrist view"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span className="hidden sm:block">{isPsychiatrist ? 'Psychiatrist' : 'Patient'}</span>
            </button>

            {/* Drift badge (patient only) */}
            {!isPsychiatrist && isAnalyzing && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-violet-400">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                Analyzing
              </span>
            )}
            {!isPsychiatrist && (
              <DriftBadge level={level} size="sm" showScore score={Math.round(score)} />
            )}

            {/* User avatar */}
            <button
              onClick={() => isPsychiatrist ? setDoctorTab('profile') : setPatientTab('profile')}
              className="w-8 h-8 rounded-full border border-violet-500/30 overflow-hidden flex items-center justify-center bg-violet-600/20 flex-shrink-0"
            >
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-xs font-bold text-violet-300">
                    {user?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
              }
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <div className="flex gap-6">
          {/* Sidebar (desktop) */}
          <nav className="hidden md:flex flex-col gap-1 w-44 flex-shrink-0">
            <div className="glass rounded-2xl p-2 sticky top-20">
              {(isPsychiatrist ? doctorNav : activePatientNav).map(item => (
                <button
                  key={item.id}
                  onClick={() => isPsychiatrist
                    ? setDoctorTab(item.id as DoctorTab)
                    : setPatientTab(item.id as PatientTab)
                  }
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    (isPsychiatrist ? doctorTab : patientTab) === item.id
                      ? 'nav-active'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {item.id === 'chat' && level !== 'stable' && (
                    <span className={`ml-auto w-2 h-2 rounded-full ${level === 'critical' ? 'bg-red-400 pulse-red' : 'bg-amber-400'}`} />
                  )}
                </button>
              ))}

              {/* Mini drift bar (patient) */}
              {!isPsychiatrist && (
                <div className="mt-3 pt-3 border-t border-white/5 px-2">
                  <p className="text-xs text-slate-500 mb-2">Drift Index</p>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Score</span>
                    <span className="text-xs font-bold" style={{ color: ambientColor }}>{Math.round(score)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${score}%`, background: ambientColor }}
                    />
                  </div>
                </div>
              )}

              {/* Sign out */}
              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all mt-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </nav>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {isPsychiatrist ? (
              <>
                {doctorTab === 'patients' && <DoctorDashboard />}
                {doctorTab === 'profile' && <Profile />}
              </>
            ) : (
              <>
                {patientTab === 'dashboard' && (
                  <Dashboard
                    score={score} level={level} trend={trend}
                    signals={signals} isAnalyzing={isAnalyzing}
                    onOpenChat={() => setPatientTab('chat')}
                    onOpenAppointments={() => setPatientTab('appointments')}
                  />
                )}
                {patientTab === 'chat' && (
                  <ChatSupport level={level} score={score} onKeystroke={processKeystroke} />
                )}
                {patientTab === 'mood' && <MoodLogger />}
                {patientTab === 'journal' && <Journal />}
                {patientTab === 'tips' && <WellnessTips score={score} level={level} recentMood={recentMood} />}
                {patientTab === 'appointments' && <Appointments level={level} score={score} />}
                {patientTab === 'profile' && <Profile />}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#080a14]/90 backdrop-blur-xl">
        <div className="flex">
          {(isPsychiatrist ? doctorNav : mobilePatientNav).map(item => {
            const isActive = isPsychiatrist ? doctorTab === item.id : patientTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => isPsychiatrist
                  ? setDoctorTab(item.id as DoctorTab)
                  : setPatientTab(item.id as PatientTab)
                }
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all ${
                  isActive ? 'text-violet-400' : 'text-slate-500'
                }`}
              >
                <span className="relative">
                  {item.icon}
                  {item.id === 'chat' && level !== 'stable' && (
                    <span className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ${level === 'critical' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  )}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ── Root with providers ───────────────────────────────────────────────────────
function AppWithAuth() {
  const { user } = useAuth();
  if (!user) return <AuthScreen />;
  return <AppInner />;
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppWithAuth />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
