export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type MuscleGroup = 
  | 'Full Body'
  | 'Chest'
  | 'Back'
  | 'Legs'
  | 'Shoulders'
  | 'Arms'
  | 'Core'
  | 'Cardio';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: string;
  sets: number;
  targetReps?: number;
  targetDurationSec?: number; // for timed exercises like plank, wall-sit
  targetWeight?: number; // in current user units
  restSec: number;
  instructions?: string;
}

export interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  level: ExperienceLevel;
  durationMin: number;
  category: string;
  exercises: Exercise[];
  isCustom?: boolean;
  createdAt?: string;
}

export interface SetLog {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  timeSec?: number;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: SetLog[];
}

export interface CompletedWorkoutSession {
  id: string;
  planId: string;
  planTitle: string;
  date: string; // ISO string
  durationSec: number;
  exercises: ExerciseLog[];
  totalVolume: number; // weight * reps across all completed sets
  totalReps: number;
  totalSets: number;
  notes?: string;
  feelingRating?: 'easy' | 'good' | 'hard' | 'exhausted';
}

export interface UserPreferences {
  unit: 'kg' | 'lbs';
  soundEnabled: boolean;
  defaultRestTimeSec: number;
}
