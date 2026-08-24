export type Placement = 'temples' | 'occipital' | 'neck' | 'wrist';

export type ModeKey = 'paddles' | 'vibration' | 'rotation';

export type ModeState = Record<ModeKey, boolean>;
export type IntensityState = Record<ModeKey, number>; // 0-100 PWM duty cycle

export type StopReason = 'completed' | 'manual' | 'auto_20min';

export type SymptomTag = 'nausea' | 'aura' | 'photophobia' | 'phonophobia';

export interface FollowUp {
  atMinutes: 30 | 120;
  dueAt: number; // epoch ms
  rating: number | null; // 0-10
  tags: SymptomTag[];
  skipped: boolean;
  respondedAt: number | null;
}

export interface Session {
  id: string;
  startedAt: number; // epoch ms
  endedAt: number | null;
  durationSec: number | null;
  modes: ModeState;
  intensities: IntensityState;
  placement: Placement;
  quietMode: boolean;
  baselinePain: number | null; // 0-10, null if skipped
  stopReason: StopReason | null;
  followUps: FollowUp[];
}

export type MedicationCategory = 'triptan' | 'combination_analgesic' | 'simple_analgesic';

export interface MedicationEvent {
  id: string;
  date: string; // YYYY-MM-DD
  category: MedicationCategory;
  name: string | null;
  loggedAt: number;
}

export interface HeadacheDay {
  date: string; // YYYY-MM-DD
  severity: number; // 0-10
  durationHours: number | null;
  notes: string | null;
}

export interface DiaryEntry {
  date: string; // YYYY-MM-DD
  sleepHours: number | null;
  caffeineServings: number | null;
  screenTimeHours: number | null;
  stress: number | null; // 1-5
  cycleDay: number | null;
  skippedMeals: boolean;
  pressureHpa: number | null;
  temperatureC: number | null;
  weatherFetchedAt: number | null;
}

export interface ResearchResponse {
  id: string;
  createdAt: number;
  easeOfDonning: number; // 1-5
  comfort: number;
  perceivedPressure: number;
  perceivedSoothing: number;
  discreteness: number;
  freeText: string;
}

export interface MidasResult {
  id: string;
  completedAt: number;
  q1MissedWork: number;
  q2ReducedWork: number;
  q3MissedHousehold: number;
  q4ReducedHousehold: number;
  q5MissedSocial: number;
  headacheDaysLast3Months: number;
  avgPainLast3Months: number;
  totalScore: number;
  grade: 1 | 2 | 3 | 4;
}
