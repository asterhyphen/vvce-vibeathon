import { useState } from 'react';
import { Brain, LayoutDashboard, MessageCircle, Calendar, Stethoscope, Sparkles } from 'lucide-react';
import { useDriftEngine } from './hooks/useDriftEngine';
import { Dashboard } from './views/Dashboard';
import { ChatSupport } from './views/ChatSupport';
import { Appointments } from './views/Appointments';
import { DoctorDashboard } from './views/DoctorDashboard';
import { DriftBadge } from './components/DriftBadge';
import './App.css';

type Tab = 'dashboard' | 'chat' | 'appointments' | 'doctor';

const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'chat', label: 'AI Support', icon: <MessageCircle className="w-4 h-4" /> },
  { id: 'appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
  { id: 'doctor', label: 'Doctor View', icon: <Stethoscope className="w-4 h-4" /> },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { score, level, trend, signals, isAnalyzing, processKeystroke } = useDriftEngine();

  const handleOpenChat = () => setActiveTab('chat');
  const handleOpenAppointments = () => setActiveTab('appointments');

  return (
    <div className="min-h-screen bg-[#080a14]">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        {level === 'critical' && (
          <div
            className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full opacity-8 animate-crisis"
            style={{ background: 'radial-gradient(circle, #ef4444 0%, transparent 70%)', filter: 'blur(60px)' }}
          />
        )}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#080a14]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
              <Brain className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm tracking-tight">NeuroTrace</span>
              <div className="flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                <span className="text-xs text-slate-500">Mental Health Intelligence</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            {isAnalyzing && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-violet-400">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                Analyzing
              </span>
            )}
            <DriftBadge level={level} size="sm" showScore score={Math.round(score)} />
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar nav (desktop) */}
          <nav className="hidden md:flex flex-col gap-1 w-44 flex-shrink-0">
            <div className="glass rounded-2xl p-2 sticky top-20">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === item.id
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

              {/* Mini drift indicator */}
              <div className="mt-3 pt-3 border-t border-white/5 px-2">
                <p className="text-xs text-slate-500 mb-2">Current State</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Drift</span>
                  <span className={`text-xs font-bold ${
                    level === 'critical' ? 'text-red-400' : level === 'declining' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{Math.round(score)}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      level === 'critical' ? 'bg-red-400' : level === 'declining' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            </div>
          </nav>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {activeTab === 'dashboard' && (
              <Dashboard
                score={score}
                level={level}
                trend={trend}
                signals={signals}
                isAnalyzing={isAnalyzing}
                onOpenChat={handleOpenChat}
                onOpenAppointments={handleOpenAppointments}
              />
            )}
            {activeTab === 'chat' && (
              <ChatSupport
                level={level}
                score={score}
                onKeystroke={processKeystroke}
              />
            )}
            {activeTab === 'appointments' && (
              <Appointments level={level} score={score} />
            )}
            {activeTab === 'doctor' && (
              <DoctorDashboard />
            )}
          </main>
        </div>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#080a14]/90 backdrop-blur-xl">
        <div className="flex">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all ${
                activeTab === item.id ? 'text-violet-400' : 'text-slate-500'
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
          ))}
        </div>
      </nav>
    </div>
  );
}

export default App;
