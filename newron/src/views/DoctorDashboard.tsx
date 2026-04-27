import React, { useState } from 'react';
import { Users, ChevronRight, Brain, TrendingUp, X, FileText, BookOpen, Send, CheckCircle } from 'lucide-react';
import { getSortedPatients } from '../data/mockData';
import { DriftBadge } from '../components/DriftBadge';
import { TrendChart } from '../components/TrendChart';
import type { Patient } from '../types';
import { useAppContext } from '../context/AppContext';

// Fake journal entries "sent" to this doctor
const SENT_JOURNALS = [
  {
    patientName: 'Alex Morgan',
    patientId: 'p1',
    title: 'Rough week at work',
    content: 'This week has been really overwhelming. The deadlines keep piling up and I feel like I can\'t keep up. I\'ve been sleeping poorly and my mind races at night.',
    mood: 4,
    aiSummary: 'Entry reflects work-related stress with sleep disruption. Key themes: deadline pressure, overwhelm, sleep issues. Recommend stress management techniques and sleep hygiene review.',
    sentAt: '2 hours ago',
  },
  {
    patientName: 'Jordan Lee',
    patientId: 'p2',
    title: 'Feeling disconnected',
    content: 'I\'ve been feeling really disconnected from everything lately. Hard to focus, hard to care. Not sure what\'s going on.',
    mood: 3,
    aiSummary: 'Dissociation and anhedonia indicators present. Mood score 3/10. Possible early depressive episode. Recommend prompt clinical assessment.',
    sentAt: '1 day ago',
  },
];

const RiskDot: React.FC<{ level: Patient['driftLevel'] }> = ({ level }) => {
  const colors = {
    stable: 'bg-emerald-400',
    declining: 'bg-amber-400',
    critical: 'bg-red-400 pulse-red',
  };
  return <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors[level]}`} />;
};

const PatientCard: React.FC<{ patient: Patient; onClick: () => void; rank: number }> = ({ patient, onClick, rank }) => (
  <button
    onClick={onClick}
    className="glass rounded-2xl p-4 w-full text-left transition-all duration-200 hover:bg-white/5 hover:scale-[1.01] animate-fade-in group"
  >
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
          patient.driftLevel === 'critical'
            ? 'bg-red-500/20 border border-red-500/40 text-red-300'
            : patient.driftLevel === 'declining'
            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
            : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
        }`}>
          {patient.avatar}
        </div>
        {rank <= 2 && patient.driftLevel === 'critical' && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {rank}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <RiskDot level={patient.driftLevel} />
          <p className="font-medium text-slate-100 text-sm truncate">{patient.name}</p>
          <span className="text-xs text-slate-500">Age {patient.age}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <DriftBadge level={patient.driftLevel} size="sm" showScore score={patient.driftScore} />
          <span className="text-xs text-slate-500">{patient.lastActive}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {patient.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{tag}</span>
          ))}
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
    </div>
  </button>
);

const PatientDetail: React.FC<{ patient: Patient; onClose: () => void }> = ({ patient, onClose }) => {
  const sentJournals = SENT_JOURNALS.filter(j => j.patientId === patient.id);
  const [replied, setReplied] = useState<Set<string>>(new Set());
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  return (
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
              <p className="text-sm text-slate-400">Age {patient.age} · {patient.lastActive}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <DriftBadge level={patient.driftLevel} size="sm" showScore score={patient.driftScore} />
                {patient.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/30 text-slate-400">{tag}</span>
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trend */}
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
          <span className="ml-auto text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">AI Generated</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{patient.summary}</p>

        <div className="mt-4 pt-4 border-t border-slate-700/30">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Recommended Actions</span>
          </div>
          <ul className="space-y-1.5">
            {patient.driftLevel === 'critical' && ['Schedule immediate consultation', 'Enable crisis support notifications', 'Review medication if applicable'].map(a => (
              <li key={a} className="flex items-center gap-2 text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />{a}
              </li>
            ))}
            {patient.driftLevel === 'declining' && ['Schedule check-in within 48 hours', 'Send wellness resources', 'Monitor for further decline'].map(a => (
              <li key={a} className="flex items-center gap-2 text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />{a}
              </li>
            ))}
            {patient.driftLevel === 'stable' && ['Continue routine monitoring', 'Positive reinforcement recommended'].map(a => (
              <li key={a} className="flex items-center gap-2 text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />{a}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Journal entries sent by patient */}
      {sentJournals.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-violet-400" />
            <h3 className="font-medium text-slate-200 text-sm">Journal Entries Shared</h3>
            <span className="ml-auto text-xs text-slate-500">{sentJournals.length} entries</span>
          </div>
          <div className="space-y-4">
            {sentJournals.map((j, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-slate-200">{j.title}</h4>
                  <span className="text-xs text-slate-500">{j.sentAt}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{j.content}</p>
                <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20 mb-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <span className="text-violet-400 font-medium">AI: </span>{j.aiSummary}
                  </p>
                </div>
                {replied.has(`${i}`) ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" /> Reply sent
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText[`${i}`] || ''}
                      onChange={e => setReplyText(prev => ({ ...prev, [`${i}`]: e.target.value }))}
                      placeholder="Reply to patient…"
                      className="flex-1 bg-slate-700/40 border border-slate-600/40 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/50"
                    />
                    <button
                      onClick={() => setReplied(prev => new Set([...prev, `${i}`]))}
                      disabled={!replyText[`${i}`]?.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/30 text-violet-300 text-xs disabled:opacity-40 transition-all"
                    >
                      <Send className="w-3 h-3" /> Send
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const DoctorDashboard: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { journals } = useAppContext();
  const sentCount = journals.filter(j => j.sentToDoctor).length;

  const patients = getSortedPatients();
  const critical = patients.filter(p => p.driftLevel === 'critical');
  const declining = patients.filter(p => p.driftLevel === 'declining');
  const stable = patients.filter(p => p.driftLevel === 'stable');

  if (selectedPatient) {
    return (
      <div className="animate-fade-in">
        <button onClick={() => setSelectedPatient(null)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors">
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
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100">Psychiatrist Dashboard</h2>
            <p className="text-sm text-slate-400">{patients.length} patients · sorted by priority</p>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs flex-wrap">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-400" />{critical.length} Critical
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />{declining.length} Declining
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />{stable.length} Stable
            </span>
            {sentCount > 0 && (
              <span className="flex items-center gap-1.5 text-violet-400">
                <BookOpen className="w-3 h-3" />{sentCount + SENT_JOURNALS.length} journals
              </span>
            )}
          </div>
        </div>
      </div>

      {critical.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 px-1">
            ⚠ Critical — Immediate Attention Required
          </h3>
          <div className="space-y-2">
            {critical.map((p, i) => (
              <PatientCard key={p.id} patient={p} onClick={() => setSelectedPatient(p)} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {declining.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 px-1">
            ↘ Declining — Monitor Closely
          </h3>
          <div className="space-y-2">
            {declining.map((p, i) => (
              <PatientCard key={p.id} patient={p} onClick={() => setSelectedPatient(p)} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {stable.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 px-1">
            ✓ Stable — Routine Monitoring
          </h3>
          <div className="space-y-2">
            {stable.map((p, i) => (
              <PatientCard key={p.id} patient={p} onClick={() => setSelectedPatient(p)} rank={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
