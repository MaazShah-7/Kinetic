import { WorkoutPlan, CompletedWorkoutSession, UserPreferences } from '../types';
import { DEFAULT_WORKOUT_PLANS } from '../data/defaultPlans';

const STORAGE_KEYS = {
  PLANS: 'fitness_app_plans_v1',
  SESSIONS: 'fitness_app_sessions_v1',
  PREFERENCES: 'fitness_app_prefs_v1',
  ACTIVE_SESSION: 'fitness_app_active_v1',
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  unit: 'kg',
  soundEnabled: true,
  defaultRestTimeSec: 60,
};

// Seed realistic initial sessions so statistics look immediately populated and illustrative
function getInitialSessions(): CompletedWorkoutSession[] {
  const now = new Date();
  const d1 = new Date(now);
  d1.setDate(now.getDate() - 4);
  const d2 = new Date(now);
  d2.setDate(now.getDate() - 2);
  const d3 = new Date(now);
  d3.setDate(now.getDate() - 1);

  return [
    {
      id: 'seed-sess-1',
      planId: 'beg-full-body-foundation',
      planTitle: 'Full Body Foundation',
      date: d1.toISOString(),
      durationSec: 1740, // 29 min
      totalVolume: 720,
      totalReps: 168,
      totalSets: 15,
      feelingRating: 'good',
      notes: 'Felt great, pushed the tempo on squats.',
      exercises: [
        {
          exerciseId: 'ex-b1',
          exerciseName: 'Bodyweight Squats',
          muscleGroup: 'Legs',
          sets: [
            { setNumber: 1, reps: 12, weight: 0, completed: true },
            { setNumber: 2, reps: 12, weight: 0, completed: true },
            { setNumber: 3, reps: 12, weight: 0, completed: true },
          ],
        },
        {
          exerciseId: 'ex-b3',
          exerciseName: 'Dumbbell / Resistance Rows',
          muscleGroup: 'Back',
          sets: [
            { setNumber: 1, reps: 12, weight: 10, completed: true },
            { setNumber: 2, reps: 12, weight: 10, completed: true },
            { setNumber: 3, reps: 12, weight: 10, completed: true },
          ],
        },
      ],
    },
    {
      id: 'seed-sess-2',
      planId: 'int-upper-body-power',
      planTitle: 'Upper Body Push & Pull',
      date: d2.toISOString(),
      durationSec: 2520, // 42 min
      totalVolume: 1840,
      totalReps: 174,
      totalSets: 17,
      feelingRating: 'hard',
      notes: 'Solid chest pump. Increased dumbbell bench weight on set 3.',
      exercises: [
        {
          exerciseId: 'ex-i1',
          exerciseName: 'Dumbbell Bench Press',
          muscleGroup: 'Chest',
          sets: [
            { setNumber: 1, reps: 10, weight: 16, completed: true },
            { setNumber: 2, reps: 10, weight: 16, completed: true },
            { setNumber: 3, reps: 10, weight: 18, completed: true },
            { setNumber: 4, reps: 8, weight: 18, completed: true },
          ],
        },
      ],
    },
    {
      id: 'seed-sess-3',
      planId: 'beg-core-mobility',
      planTitle: 'Core & Mobility Flow',
      date: d3.toISOString(),
      durationSec: 1380, // 23 min
      totalVolume: 0,
      totalReps: 110,
      totalSets: 12,
      feelingRating: 'easy',
      notes: 'Active recovery day. Spine feels unlocked.',
      exercises: [
        {
          exerciseId: 'ex-b6',
          exerciseName: 'Deadbugs',
          muscleGroup: 'Core',
          sets: [
            { setNumber: 1, reps: 12, weight: 0, completed: true },
            { setNumber: 2, reps: 12, weight: 0, completed: true },
            { setNumber: 3, reps: 12, weight: 0, completed: true },
          ],
        },
      ],
    },
  ];
}

export function loadPlans(): WorkoutPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLANS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(DEFAULT_WORKOUT_PLANS));
      return DEFAULT_WORKOUT_PLANS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Error loading plans from storage', e);
  }
  return DEFAULT_WORKOUT_PLANS;
}

export function savePlans(plans: WorkoutPlan[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  } catch (e) {
    console.error('Error saving plans', e);
  }
}

export function loadSessions(): CompletedWorkoutSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) {
      const initial = getInitialSessions();
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Error loading sessions', e);
  }
  return [];
}

export function saveSessions(sessions: CompletedWorkoutSession[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Error saving sessions', e);
  }
}

export function addCompletedSession(session: CompletedWorkoutSession) {
  const current = loadSessions();
  const updated = [session, ...current];
  saveSessions(updated);
  return updated;
}

export function deleteCompletedSession(sessionId: string) {
  const current = loadSessions();
  const updated = current.filter((s) => s.id !== sessionId);
  saveSessions(updated);
  return updated;
}

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error loading preferences', e);
  }
  return DEFAULT_PREFERENCES;
}

export function savePreferences(prefs: UserPreferences) {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  } catch (e) {
    console.error('Error saving preferences', e);
  }
}

// Compute consecutive active days streak
export function calculateStreak(sessions: CompletedWorkoutSession[]): number {
  if (!sessions.length) return 0;

  // Normalize dates to YYYY-MM-DD
  const workoutDates = new Set(
    sessions.map((s) => new Date(s.date).toISOString().split('T')[0])
  );

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Streak continues if worked out today OR yesterday
  let checkDate = new Date();
  if (!workoutDates.has(todayStr)) {
    if (!workoutDates.has(yesterdayStr)) {
      return 0; // streak broken
    }
    checkDate = yesterday;
  }

  let streak = 0;
  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (workoutDates.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
