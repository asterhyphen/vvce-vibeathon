export type DriftLevel = 'stable' | 'declining' | 'critical';

export interface DriftDataPoint {
  day: string;
  score: number;
  label?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  avatar: string;
  driftLevel: DriftLevel;
  driftScore: number;
  lastActive: string;
  summary: string;
  trend: DriftDataPoint[];
  tags: string[];
  moodHistory?: MoodEntry[];
  journalEntries?: JournalEntry[];
}

export interface TimeSlot {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  available: boolean;
  priority?: boolean;
  bookedBy?: string;
  bookedAt?: string;
  duration?: number;       // minutes
  mode?: 'in-person' | 'video';
  rating?: number;         // 1–5
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  mode?: 'vent' | 'guidance' | 'mood-assessment';
}

export interface BehavioralSignal {
  typingSpeed: number;
  backspaceRate: number;
  pauseDuration: number;
  sentimentScore: number;
  sessionLength: number;
}

export interface MoodEntry {
  id: string;
  value: number; // 1–10
  label: string;
  note?: string;
  timestamp: Date;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: number;
  aiSummary?: string;
  sentToDoctor?: boolean;
  timestamp: Date;
  tags?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  avatar?: string; // base64 or url
  role: 'patient' | 'psychiatrist';
  driftLevel?: DriftLevel;
  driftScore?: number;
}

export interface WellnessTip {
  id: string;
  category: string;
  title: string;
  body: string;
  icon: string;
  source: string;
}
