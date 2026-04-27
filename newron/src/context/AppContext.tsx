import React, { createContext, useContext, useState, useCallback } from 'react';
import type { MoodEntry, JournalEntry } from '../types';

interface AppContextType {
  moodLog: MoodEntry[];
  addMood: (value: number, note?: string) => void;
  journals: JournalEntry[];
  addJournal: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
  updateJournal: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournal: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const MOOD_LABELS: Record<number, string> = {
  1: 'Terrible', 2: 'Very Bad', 3: 'Bad', 4: 'Low',
  5: 'Neutral', 6: 'Okay', 7: 'Good', 8: 'Great',
  9: 'Excellent', 10: 'Amazing',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [moodLog, setMoodLog] = useState<MoodEntry[]>([
    { id: 'm1', value: 7, label: 'Good', note: 'Had a productive morning', timestamp: new Date(Date.now() - 86400000 * 2) },
    { id: 'm2', value: 5, label: 'Neutral', note: 'Feeling a bit tired', timestamp: new Date(Date.now() - 86400000) },
    { id: 'm3', value: 6, label: 'Okay', timestamp: new Date(Date.now() - 3600000 * 4) },
  ]);

  const [journals, setJournals] = useState<JournalEntry[]>([
    {
      id: 'j1',
      title: 'Rough week at work',
      content: 'This week has been really overwhelming. The deadlines keep piling up and I feel like I can\'t keep up. I\'ve been sleeping poorly and my mind races at night. I need to find a way to manage this better.',
      mood: 4,
      aiSummary: 'Entry reflects work-related stress with sleep disruption. Key themes: deadline pressure, overwhelm, sleep issues. Recommend stress management techniques and sleep hygiene review.',
      sentToDoctor: false,
      timestamp: new Date(Date.now() - 86400000 * 3),
      tags: ['work', 'stress', 'sleep'],
    },
    {
      id: 'j2',
      title: 'Better day today',
      content: 'Went for a walk this morning and it really helped clear my head. Managed to finish two tasks I\'d been putting off. Small wins.',
      mood: 7,
      aiSummary: 'Positive entry showing recovery. Physical activity (walking) noted as helpful. Task completion boosted mood. Healthy coping pattern observed.',
      sentToDoctor: false,
      timestamp: new Date(Date.now() - 86400000),
      tags: ['positive', 'exercise'],
    },
  ]);

  const addMood = useCallback((value: number, note?: string) => {
    const entry: MoodEntry = {
      id: `m_${Date.now()}`,
      value,
      label: MOOD_LABELS[value] || 'Unknown',
      note,
      timestamp: new Date(),
    };
    setMoodLog(prev => [entry, ...prev]);
  }, []);

  const addJournal = useCallback((entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: `j_${Date.now()}`,
      timestamp: new Date(),
    };
    setJournals(prev => [newEntry, ...prev]);
  }, []);

  const updateJournal = useCallback((id: string, updates: Partial<JournalEntry>) => {
    setJournals(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  }, []);

  const deleteJournal = useCallback((id: string) => {
    setJournals(prev => prev.filter(j => j.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{ moodLog, addMood, journals, addJournal, updateJournal, deleteJournal }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
