import type { Patient, TimeSlot, DriftDataPoint} from '../types';

export const generateTrend = (baseScore: number, variance: number): DriftDataPoint[] => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => ({
    day,
    score: Math.max(0, Math.min(100,
      baseScore + (Math.sin(i * 0.8) * variance) + (Math.random() * variance * 0.5)
    )),
  }));
};

export const mockPatients: Patient[] = [
  {
    id: 'p1',
    name: 'Alex Morgan',
    age: 28,
    avatar: 'AM',
    driftLevel: 'critical',
    driftScore: 82,
    lastActive: '2 hours ago',
    summary: 'Elevated burnout risk detected. Significant increase in typing hesitation and negative sentiment over 5 days. Sleep disruption patterns observed. Immediate intervention recommended.',
    trend: generateTrend(75, 12),
    tags: ['Burnout Risk', 'Sleep Issues', 'High Stress'],
  },
  {
    id: 'p2',
    name: 'Jordan Lee',
    age: 34,
    avatar: 'JL',
    driftLevel: 'declining',
    driftScore: 54,
    lastActive: '1 day ago',
    summary: 'Moderate anxiety indicators. Increased backspace frequency suggests rumination. Sentiment trending negative over 3 days. Recommend check-in session.',
    trend: generateTrend(50, 10),
    tags: ['Anxiety', 'Rumination'],
  },
  {
    id: 'p3',
    name: 'Sam Rivera',
    age: 22,
    avatar: 'SR',
    driftLevel: 'stable',
    driftScore: 18,
    lastActive: '3 hours ago',
    summary: 'Stable mental state. Consistent engagement patterns. Positive sentiment maintained. No intervention required at this time.',
    trend: generateTrend(20, 6),
    tags: ['Stable', 'Consistent'],
  },
  {
    id: 'p4',
    name: 'Casey Kim',
    age: 41,
    avatar: 'CK',
    driftLevel: 'declining',
    driftScore: 61,
    lastActive: '5 hours ago',
    summary: 'Work-related stress indicators rising. Session lengths increasing with lower productivity signals. Recommend stress management resources.',
    trend: generateTrend(58, 14),
    tags: ['Work Stress', 'Fatigue'],
  },
  {
    id: 'p5',
    name: 'Taylor Pham',
    age: 29,
    avatar: 'TP',
    driftLevel: 'stable',
    driftScore: 24,
    lastActive: '30 minutes ago',
    summary: 'Good mental health indicators. Regular engagement, positive sentiment, and healthy session patterns observed.',
    trend: generateTrend(22, 5),
    tags: ['Stable', 'Positive'],
  },
];

// Sorted by priority: critical first, then declining, then stable
export const getSortedPatients = () =>
  [...mockPatients].sort((a, b) => {
    const order = { critical: 0, declining: 1, stable: 2 };
    if (order[a.driftLevel] !== order[b.driftLevel]) return order[a.driftLevel] - order[b.driftLevel];
    return b.driftScore - a.driftScore;
  });

export const mockTimeSlots: TimeSlot[] = [
  {
    id: 'ts1',
    doctor: 'Dr. Sarah Chen',
    specialty: 'Clinical Psychologist',
    date: 'Tomorrow',
    time: '10:00 AM',
    available: true,
    duration: 50,
    mode: 'video',
    rating: 4.9,
  },
  {
    id: 'ts2',
    doctor: 'Dr. Marcus Webb',
    specialty: 'Psychiatrist',
    date: 'Tomorrow',
    time: '2:30 PM',
    available: true,
    priority: true,
    duration: 30,
    mode: 'in-person',
    rating: 4.8,
  },
  {
    id: 'ts3',
    doctor: 'Dr. Priya Nair',
    specialty: 'Therapist',
    date: 'Wed, Apr 29',
    time: '11:00 AM',
    available: true,
    duration: 50,
    mode: 'video',
    rating: 4.7,
  },
  {
    id: 'ts4',
    doctor: 'Dr. James Okafor',
    specialty: 'Counselor',
    date: 'Wed, Apr 29',
    time: '4:00 PM',
    available: false,
    duration: 45,
    mode: 'in-person',
    rating: 4.6,
  },
  {
    id: 'ts5',
    doctor: 'Dr. Sarah Chen',
    specialty: 'Clinical Psychologist',
    date: 'Thu, Apr 30',
    time: '9:00 AM',
    available: true,
    duration: 50,
    mode: 'video',
    rating: 4.9,
  },
  {
    id: 'ts6',
    doctor: 'Dr. Aisha Patel',
    specialty: 'Psychiatrist',
    date: 'Thu, Apr 30',
    time: '3:00 PM',
    available: true,
    duration: 30,
    mode: 'in-person',
    rating: 4.5,
  },
  {
    id: 'ts7',
    doctor: 'Dr. Marcus Webb',
    specialty: 'Psychiatrist',
    date: 'Fri, May 1',
    time: '10:30 AM',
    available: true,
    duration: 30,
    mode: 'video',
    rating: 4.8,
  },
];

export const ventResponses: string[] = [
  "I hear you. That sounds really heavy to carry. Take your time — I'm here and I'm listening.",
  "Thank you for sharing that with me. It takes courage to put these feelings into words. What's been weighing on you most?",
  "That makes complete sense. Anyone would feel overwhelmed in that situation. You're not alone in this.",
  "I can feel how much this is affecting you. Your feelings are completely valid. Would you like to keep talking about it?",
  "It sounds like you've been holding a lot in. I'm glad you're letting it out. How long have you been feeling this way?",
  "You're doing the right thing by acknowledging these feelings. Sometimes just naming them helps. What does a typical day feel like for you right now?",
];

export const guidanceResponses: string[] = [
  "Based on what you're sharing, I'd suggest starting with a simple grounding exercise: take 5 slow breaths, focusing only on the sensation of air. This can interrupt the stress cycle.",
  "One thing that often helps is breaking the situation into smaller pieces. What's the one smallest step you could take today — even something tiny?",
  "It sounds like your nervous system is in overdrive. A 10-minute walk outside, even just around the block, can genuinely shift your mental state. Would that be possible today?",
  "I'd recommend the 5-4-3-2-1 technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. It anchors you to the present moment.",
  "Journaling for just 5 minutes before bed — writing down 3 things that went okay today — has strong evidence behind it for reducing anxiety over time.",
  "Have you tried setting a 'worry window'? Designate 15 minutes a day to think about your concerns, then consciously redirect outside that window. It gives your mind permission to rest.",
];


