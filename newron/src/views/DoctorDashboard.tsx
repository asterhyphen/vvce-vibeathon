import React, { useState } from 'react';
import { Users, ChevronRight, Brain, TrendingUp, X, FileText } from 'lucide-react';
import { mockPatients } from '../data/mockData';
import { DriftBadge } from '../components/DriftBadge';
import { TrendChart } from '../components/TrendChart';
import type { Patient } from '../types';

const RiskDot: React.FC<{ level: Patient['driftLevel'] }> = ({ level }) => {
  const colors = {
    stable: 'bg-emerald-400',
    declining: 'bg-amber-400',
    critical: 'bg-red-400 pulse-red',
  };
  return <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors[level]}`} />;
};

const PatientCard: React.FC<{ patient: Patient; onClick: () => void }> = ({ patient, onClick }) => (
  <button
    onClick={onClick}
    className="glass rounded-2xl p-4 w-full text-left transition-all duration-200 hover:bg-white/5 hover:scale-[1.01] animate-fade-in group"
  >
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
        patient.driftLevel === 'critical'
          ? 'bg-red-500/20 border border-red-500/40 text-red-300'
          : patient.driftLevel === 'declining'
          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
          : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
      }`}>
        {patient.avatar}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <RiskDot level={patient.driftLevel} />
          <p className="font-medium text-slate-100 text-sm truncate">{patient.name}</p>
          <span className="text-xs text-slate-500">Age {patient.age}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <DriftBadge level={patient.driftLevel} size="sm" />
          <span className="text-xs text-slate-500">Last active: {patient.lastActive}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {patient.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
    </div>
  </button>
);

const PatientDetail: React.FC<{ patient: Patient; onClose: () => void }> = ({ patient, onClose }) => (
  <div className="space-y-4 animate-fade-in">
    {/* Header */}
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold ${
            patient.driftLevel === 'critical'
              ? 'bg-red-500/20 border border-red-500/40 text-red-300'
              : patient.driftLevel === 'declining'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
              : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
          }`}>
            {patient.avatar}
          </div>
          <div>
            <h2 className="font-semibold text-slate-100">{patient.name}</h2>
            <p className="text-sm text-slate-400">Age {patient.age} • Last active {patient.lastActive}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <DriftBadge level={patient.driftLevel} size="sm" showScore score={patient.driftScore} />
              {patient.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/30 text-slate-400">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>

    {/* Trend chart */}
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-violet-400" />
        <h3 className="font-medium text-slate-200 text-sm">7-Day Drift Trend</h3>
      </div>
      <TrendChart data={patient.trend} level={patient.driftLevel} height={180} />
    </div>

    {/* AI Summary */}
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <h3 className="font-medium text-slate-200 text-sm">AI Mental State Summary</h3>
        <span className="ml-auto text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
          AI Generated
        </span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{patient.summary}</p>

      <div className="mt-4 pt-4 border-t border-slate-700/30">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Recommended Actions</span>
        </div>
        <ul className="space-y-1.5">
          {patient.driftLevel === 'critical' && [
            'Schedule immediate consultation',
            'Enable crisis support notifications',
            'Review medication if applicable',
          ].map(action => (
            <li key={action} className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              {action}
            </li>
          ))}
          {patient.driftLevel === 'declining' && [
            'Schedule check-in within 48 hours',
            'Send wellness resources',
            'Monitor for further decline',
          ].map(action => (
            <li key={action} className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              {action}
            </li>
          ))}
          {patient.driftLevel === 'stable' && [
            'Continue routine monitoring',
            'Positive reinforcement recommended',
          ].map(action => (
            <li key={action} className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              {action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export const DoctorDashboard: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const critical = mockPatients.filter(p => p.driftLevel === 'critical');
  const declining = mockPatients.filter(p => p.driftLevel === 'declining');
  const stable = mockPatients.filter(p => p.driftLevel === 'stable');

  if (selectedPatient) {
    return (
      <div className="animate-fade-in">
        <button
          onClick={() => setSelectedPatient(null)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors"
        >
          ← Back to patients
        </button>
        <PatientDetail patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100">Doctor Dashboard</h2>
            <p className="text-sm text-slate-400">{mockPatients.length} patients monitored</p>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              {critical.length} Critical
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {declining.length} Declining
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {stable.length} Stable
            </span>
          </div>
        </div>
      </div>

      {/* Critical patients */}
      {critical.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 px-1">
            ⚠ Critical — Immediate Attention
          </h3>
          <div className="space-y-2">
            {critical.map((p, i) => (
              <div key={p.id} style={{ animationDelay: `${i * 0.08}s` }}>
                <PatientCard patient={p} onClick={() => setSelectedPatient(p)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Declining patients */}
      {declining.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 px-1">
            ↘ Declining — Monitor Closely
          </h3>
          <div className="space-y-2">
            {declining.map((p, i) => (
              <div key={p.id} style={{ animationDelay: `${i * 0.08}s` }}>
                <PatientCard patient={p} onClick={() => setSelectedPatient(p)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stable patients */}
      {stable.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 px-1">
            ✓ Stable — Routine Monitoring
          </h3>
          <div className="space-y-2">
            {stable.map((p, i) => (
              <div key={p.id} style={{ animationDelay: `${i * 0.08}s` }}>
                <PatientCard patient={p} onClick={() => setSelectedPatient(p)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
