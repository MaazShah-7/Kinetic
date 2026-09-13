import { useState, useEffect, useRef, useMemo } from 'react';
import { WorkoutPlan, CompletedWorkoutSession, UserPreferences, SetLog, ExerciseLog } from '../types';
import { playCountdownBeep, playSuccessChime } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Timer as TimerIcon,
  X,
  Volume2,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  Award
} from 'lucide-react';

interface ActiveWorkoutPlayerProps {
  plan: WorkoutPlan;
  preferences: UserPreferences;
  onFinishWorkout: (session: CompletedWorkoutSession) => void;
  onCancelWorkout: () => void;
}

export function ActiveWorkoutPlayer({
  plan,
  preferences,
  onFinishWorkout,
  onCancelWorkout,
}: ActiveWorkoutPlayerProps) {
  // Current exercise index
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);

  // Overall workout elapsed timer
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Set-by-set logging state for every exercise
  // Map of exerciseId -> SetLog[]
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, SetLog[]>>(() => {
    const initial: Record<string, SetLog[]> = {};
    plan.exercises.forEach((ex) => {
      initial[ex.id] = Array.from({ length: ex.sets }, (_, i) => ({
        setNumber: i + 1,
        reps: ex.targetReps || 10,
        weight: ex.targetWeight || 0,
        completed: false,
        timeSec: ex.targetDurationSec || 0,
      }));
    });
    return initial;
  });

  // Rest Timer State
  const [isResting, setIsResting] = useState(false);
  const [restRemainingSec, setRestRemainingSec] = useState(0);
  const [totalRestDuration, setTotalRestDuration] = useState(60);
  const [isRestPaused, setIsRestPaused] = useState(false);

  // Exercise Hold Timer (for timed exercises like plank)
  const [isHoldTimerActive, setIsHoldTimerActive] = useState(false);
  const [holdTimerRemaining, setHoldTimerRemaining] = useState(0);
  const [holdTimerTotal, setHoldTimerTotal] = useState(0);

  // Finish dialog state
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [feeling, setFeeling] = useState<'easy' | 'good' | 'hard' | 'exhausted'>('good');
  const [notes, setNotes] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  const currentExercise = plan.exercises[currentExerciseIdx];
  const currentSets = exerciseLogs[currentExercise?.id] || [];

  // Ref to track sound preference inside timer callbacks
  const soundEnabledRef = useRef(preferences.soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = preferences.soundEnabled;
  }, [preferences.soundEnabled]);

  // Overall Elapsed Timer tick
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Rest Timer interval
  useEffect(() => {
    if (!isResting || isRestPaused) return;

    if (restRemainingSec <= 0) {
      if (soundEnabledRef.current) {
        playSuccessChime();
      }
      setIsResting(false);
      return;
    }

    // Audio countdown for last 3 seconds
    if (soundEnabledRef.current && restRemainingSec <= 3 && restRemainingSec > 0) {
      playCountdownBeep(restRemainingSec === 1 ? 880 : 587, 0.1);
    }

    const timer = setTimeout(() => {
      setRestRemainingSec((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isResting, isRestPaused, restRemainingSec]);

  // Timed exercise hold interval
  useEffect(() => {
    if (!isHoldTimerActive) return;

    if (holdTimerRemaining <= 0) {
      if (soundEnabledRef.current) {
        playSuccessChime();
      }
      setIsHoldTimerActive(false);
      return;
    }

    if (soundEnabledRef.current && holdTimerRemaining <= 3 && holdTimerRemaining > 0) {
      playCountdownBeep(holdTimerRemaining === 1 ? 880 : 587, 0.1);
    }

    const timer = setTimeout(() => {
      setHoldTimerRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isHoldTimerActive, holdTimerRemaining]);

  // Trigger Rest Timer
  const triggerRest = (seconds?: number) => {
    const duration = seconds || currentExercise?.restSec || preferences.defaultRestTimeSec || 60;
    setTotalRestDuration(duration);
    setRestRemainingSec(duration);
    setIsResting(true);
    setIsRestPaused(false);
  };

  // Toggle set completion
  const handleToggleSet = (setIdx: number) => {
    const exId = currentExercise.id;
    const sets = [...(exerciseLogs[exId] || [])];
    const targetSet = { ...sets[setIdx] };
    const willBeCompleted = !targetSet.completed;

    targetSet.completed = willBeCompleted;
    sets[setIdx] = targetSet;

    setExerciseLogs((prev) => ({
      ...prev,
      [exId]: sets,
    }));

    // If marked completed, trigger rest timer automatically
    if (willBeCompleted) {
      triggerRest(currentExercise.restSec);

      // Check if all sets for this exercise are now completed
      const allCompleted = sets.every((s) => s.completed);
      if (allCompleted && currentExerciseIdx < plan.exercises.length - 1) {
        // We will allow user to manually click next or after rest finishes
      }
    }
  };

  // Update reps or weight for a set
  const handleUpdateSetValue = (
    setIdx: number,
    field: 'reps' | 'weight' | 'timeSec',
    delta: number
  ) => {
    const exId = currentExercise.id;
    const sets = [...(exerciseLogs[exId] || [])];
    const targetSet = { ...sets[setIdx] };

    const currentVal = targetSet[field] || 0;
    const newVal = Math.max(0, currentVal + delta);
    targetSet[field] = newVal;
    sets[setIdx] = targetSet;

    setExerciseLogs((prev) => ({
      ...prev,
      [exId]: sets,
    }));
  };

  // Add extra set on the fly
  const handleAddSet = () => {
    const exId = currentExercise.id;
    const sets = [...(exerciseLogs[exId] || [])];
    const lastSet = sets[sets.length - 1];
    sets.push({
      setNumber: sets.length + 1,
      reps: lastSet ? lastSet.reps : 10,
      weight: lastSet ? lastSet.weight : 0,
      completed: false,
      timeSec: currentExercise.targetDurationSec || 0,
    });
    setExerciseLogs((prev) => ({
      ...prev,
      [exId]: sets,
    }));
  };

  // Start hold countdown for timed exercise
  const startHoldTimer = () => {
    const targetSec = currentExercise.targetDurationSec || 30;
    setHoldTimerTotal(targetSec);
    setHoldTimerRemaining(targetSec);
    setIsHoldTimerActive(true);
  };

  // Aggregate stats on workout completion
  const workoutMetrics = useMemo(() => {
    let totalSets = 0;
    let totalReps = 0;
    let totalVolume = 0;

    (Object.values(exerciseLogs) as SetLog[][]).forEach((sets) => {
      sets.forEach((s) => {
        if (s.completed) {
          totalSets += 1;
          totalReps += s.reps;
          totalVolume += s.reps * (s.weight || 0);
        }
      });
    });

    return { totalSets, totalReps, totalVolume };
  }, [exerciseLogs]);

  // Handle Finish Workout Modal Open
  const handleInitiateFinish = () => {
    setIsPaused(true);
    setIsResting(false);
    setShowFinishModal(true);
    // Celebrate with confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#f59e0b'],
      });
    } catch {
      // ignore
    }
  };

  // Confirm Save & Finish
  const handleConfirmSave = () => {
    const formattedExercises: ExerciseLog[] = plan.exercises.map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: exerciseLogs[ex.id] || [],
    }));

    const session: CompletedWorkoutSession = {
      id: `session-${Date.now()}`,
      planId: plan.id,
      planTitle: plan.title,
      date: new Date().toISOString(),
      durationSec: elapsedSec,
      exercises: formattedExercises,
      totalVolume: workoutMetrics.totalVolume,
      totalReps: workoutMetrics.totalReps,
      totalSets: workoutMetrics.totalSets,
      feelingRating: feeling,
      notes: notes.trim() || undefined,
    };

    onFinishWorkout(session);
  };

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Rest timer circle SVG metrics
  const restProgress = totalRestDuration > 0 ? (restRemainingSec / totalRestDuration) : 0;
  const circumference = 2 * Math.PI * 44; // r = 44

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Top Bar: Workout Name, Elapsed Timer, Finish / Exit */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 mb-5 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCancelPrompt(true)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            title="Cancel workout"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                In Progress
              </span>
              <span className="text-xs text-stone-400">•</span>
              <span className="text-xs text-stone-400 truncate max-w-[140px] sm:max-w-xs">{plan.title}</span>
            </div>
            <h2 className="text-lg font-bold text-stone-100 truncate">{currentExercise?.name}</h2>
          </div>
        </div>

        {/* Elapsed Timer & Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-sm sm:text-base font-bold text-stone-100">
              {formatTime(elapsedSec)}
            </span>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1 text-stone-400 hover:text-stone-200 transition-colors"
              title={isPaused ? 'Resume workout' : 'Pause workout'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-stone-300" />}
            </button>
          </div>

          <button
            onClick={handleInitiateFinish}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Finish</span>
          </button>
        </div>
      </div>

      {/* Progress Segment Indicator (Exercises 1..N) */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-stone-400 mb-1.5 font-medium">
          <span>
            Exercise {currentExerciseIdx + 1} of {plan.exercises.length}
          </span>
          <span className="text-stone-300">{currentExercise?.muscleGroup}</span>
        </div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${plan.exercises.length}, minmax(0, 1fr))` }}>
          {plan.exercises.map((ex, idx) => {
            const exSets = exerciseLogs[ex.id] || [];
            const isCompleted = exSets.length > 0 && exSets.every((s) => s.completed);
            const isCurrent = idx === currentExerciseIdx;

            return (
              <button
                key={ex.id || idx}
                onClick={() => setCurrentExerciseIdx(idx)}
                title={`${ex.name}`}
                className={`h-2 rounded-full transition-all ${
                  isCurrent
                    ? 'bg-emerald-400 ring-2 ring-emerald-500/30'
                    : isCompleted
                    ? 'bg-emerald-700'
                    : 'bg-stone-800 hover:bg-stone-700'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Main Exercise & Set Tracker Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5 flex-1">
        {/* Left 2 Cols: Current Exercise Details & Sets Table */}
        <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            {/* Exercise Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-800">
              <div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-400">
                  {currentExercise?.equipment || 'Bodyweight'} • {currentExercise?.muscleGroup}
                </span>
                <h1 className="text-2xl font-bold text-stone-100 mt-0.5">{currentExercise?.name}</h1>
              </div>

              {currentExercise?.targetDurationSec ? (
                <button
                  onClick={startHoldTimer}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-500/30 transition-colors"
                >
                  <TimerIcon className="w-4 h-4" />
                  <span>Start {currentExercise.targetDurationSec}s Hold</span>
                </button>
              ) : null}
            </div>

            {/* Instruction Tip */}
            {currentExercise?.instructions && (
              <div className="mt-3.5 p-3 rounded-xl bg-stone-950/60 border border-stone-800/80 text-xs text-stone-300 leading-relaxed">
                <span className="font-semibold text-stone-400 mr-1.5">Form Cue:</span>
                {currentExercise.instructions}
              </div>
            )}

            {/* Hold Timer active banner (if active) */}
            {isHoldTimerActive && (
              <div className="mt-3.5 p-4 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center font-mono font-bold text-indigo-300 text-lg">
                    {holdTimerRemaining}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-indigo-200">Active Interval Hold</h4>
                    <p className="text-[11px] text-indigo-400">Hold steady with braced core</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHoldTimerRemaining((r) => r + 5)}
                    className="px-2 py-1 rounded bg-indigo-900/60 text-indigo-300 text-xs font-mono"
                  >
                    +5s
                  </button>
                  <button
                    onClick={() => setIsHoldTimerActive(false)}
                    className="px-2.5 py-1 rounded bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-medium"
                  >
                    Stop
                  </button>
                </div>
              </div>
            )}

            {/* Sets Logging Table */}
            <div className="mt-5">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400 pb-2 px-2">
                <span className="col-span-2">Set</span>
                <span className="col-span-4">Weight ({preferences.unit})</span>
                <span className="col-span-4">{currentExercise?.targetDurationSec ? 'Hold Secs' : 'Reps'}</span>
                <span className="col-span-2 text-right">Done</span>
              </div>

              <div className="space-y-2">
                {currentSets.map((s, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
                      s.completed
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-stone-200'
                        : 'bg-stone-950/60 border-stone-800 text-stone-300'
                    }`}
                  >
                    {/* Set Number */}
                    <div className="col-span-2 font-mono font-semibold text-xs flex items-center gap-1">
                      <span className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-[10px] text-stone-300">
                        {s.setNumber}
                      </span>
                    </div>

                    {/* Weight Stepper */}
                    <div className="col-span-4 flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateSetValue(idx, 'weight', -2.5)}
                        className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs transition-colors shrink-0"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={s.weight || ''}
                        placeholder="0"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const sets = [...currentSets];
                          sets[idx].weight = val;
                          setExerciseLogs((prev) => ({ ...prev, [currentExercise.id]: sets }));
                        }}
                        className="w-full text-center bg-stone-900 border border-stone-800 rounded px-1 py-1 text-xs font-mono font-medium text-stone-100 focus:outline-none focus:border-stone-600"
                      />
                      <button
                        onClick={() => handleUpdateSetValue(idx, 'weight', 2.5)}
                        className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs transition-colors shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Reps or Time Stepper */}
                    <div className="col-span-4 flex items-center gap-1">
                      <button
                        onClick={() =>
                          handleUpdateSetValue(
                            idx,
                            currentExercise?.targetDurationSec ? 'timeSec' : 'reps',
                            -1
                          )
                        }
                        className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs transition-colors shrink-0"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={
                          currentExercise?.targetDurationSec
                            ? (s.timeSec ?? currentExercise.targetDurationSec)
                            : (s.reps ?? currentExercise.targetReps ?? 10)
                        }
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const sets = [...currentSets];
                          if (currentExercise?.targetDurationSec) {
                            sets[idx].timeSec = val;
                          } else {
                            sets[idx].reps = val;
                          }
                          setExerciseLogs((prev) => ({ ...prev, [currentExercise.id]: sets }));
                        }}
                        className="w-full text-center bg-stone-900 border border-stone-800 rounded px-1 py-1 text-xs font-mono font-medium text-stone-100 focus:outline-none focus:border-stone-600"
                      />
                      <button
                        onClick={() =>
                          handleUpdateSetValue(
                            idx,
                            currentExercise?.targetDurationSec ? 'timeSec' : 'reps',
                            1
                          )
                        }
                        className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs transition-colors shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Completion Checkbox Button */}
                    <div className="col-span-2 flex justify-end">
                      <button
                        id={`set-check-btn-${idx}`}
                        onClick={() => handleToggleSet(idx)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          s.completed
                            ? 'bg-emerald-500 text-stone-950 shadow-sm'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-400'
                        }`}
                        title={s.completed ? 'Mark incomplete' : 'Complete set & start rest'}
                      >
                        {s.completed ? (
                          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <Circle className="w-5 h-5 text-stone-500" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Set button */}
              <div className="mt-3 flex justify-between items-center pt-2">
                <button
                  onClick={handleAddSet}
                  className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Set</span>
                </button>
                <button
                  onClick={() => triggerRest(currentExercise?.restSec)}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <TimerIcon className="w-3.5 h-3.5" />
                  <span>Start Rest ({currentExercise?.restSec || 60}s)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Exercise navigation buttons */}
          <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentExerciseIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentExerciseIdx === 0}
              className="px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 hover:text-stone-100 disabled:opacity-40 disabled:hover:text-stone-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentExerciseIdx < plan.exercises.length - 1 ? (
              <button
                onClick={() => setCurrentExerciseIdx((prev) => prev + 1)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-900 hover:bg-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Next Exercise</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleInitiateFinish}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-stone-950 hover:bg-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Finish Workout</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Col: Smart Rest Timer & Quick Summary */}
        <div className="space-y-5">
          {/* Rest Timer Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 text-center flex flex-col items-center justify-between shadow-sm">
            <div className="w-full flex items-center justify-between text-xs text-stone-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Rest Timer</span>
              {preferences.soundEnabled && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <Volume2 className="w-3 h-3" /> Audio On
                </span>
              )}
            </div>

            {/* Circular SVG Timer */}
            <div className="relative my-4 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90">
                {/* Background Track */}
                <circle
                  cx="72"
                  cy="72"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-stone-800 fill-none"
                />
                {/* Active Progress */}
                <circle
                  cx="72"
                  cy="72"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - restProgress)}
                  strokeLinecap="round"
                  className={`transition-all duration-500 fill-none ${
                    isResting
                      ? restRemainingSec <= 5
                        ? 'text-rose-500'
                        : 'text-emerald-400'
                      : 'text-stone-700'
                  }`}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-bold tracking-tight text-stone-100">
                  {isResting ? restRemainingSec : currentExercise?.restSec || 60}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 mt-0.5">
                  Seconds
                </span>
              </div>
            </div>

            {/* Rest controls */}
            {isResting ? (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setRestRemainingSec((s) => Math.max(0, s - 15))}
                    className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 hover:text-white text-xs font-mono transition-colors"
                  >
                    -15s
                  </button>
                  <button
                    onClick={() => setIsRestPaused(!isRestPaused)}
                    className="px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {isRestPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isRestPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setRestRemainingSec((s) => s + 15);
                      setTotalRestDuration((d) => d + 15);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 hover:text-white text-xs font-mono transition-colors"
                  >
                    +15s
                  </button>
                </div>
                <button
                  onClick={() => setIsResting(false)}
                  className="w-full py-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors"
                >
                  Skip Rest
                </button>
              </div>
            ) : (
              <div className="w-full">
                <button
                  onClick={() => triggerRest(currentExercise?.restSec)}
                  className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <TimerIcon className="w-4 h-4" />
                  <span>Start Rest ({currentExercise?.restSec || 60}s)</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Metrics summary box */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Workout Snapshot
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800/80">
                <div className="font-mono text-base font-bold text-stone-100">{workoutMetrics.totalSets}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Sets Done</div>
              </div>
              <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800/80">
                <div className="font-mono text-base font-bold text-stone-100">{workoutMetrics.totalReps}</div>
                <div className="text-[10px] text-stone-400 mt-0.5">Total Reps</div>
              </div>
              <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800/80">
                <div className="font-mono text-base font-bold text-emerald-400">
                  {workoutMetrics.totalVolume}
                </div>
                <div className="text-[10px] text-stone-400 mt-0.5">{preferences.unit} Vol</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Prompt */}
      {showCancelPrompt && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-stone-100">Cancel Active Workout?</h3>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              Are you sure you want to exit? Your progress for this session will not be recorded in your history.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowCancelPrompt(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-300 hover:bg-stone-800 transition-colors"
              >
                Keep Going
              </button>
              <button
                onClick={onCancelWorkout}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
              >
                Exit Workout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finish Celebration & Summary Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl my-8">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Award className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-stone-100">Workout Complete!</h2>
              <p className="text-xs text-stone-400 mt-1">
                Outstanding effort. Here is your session breakdown:
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center">
                <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Time Taken</div>
                <div className="font-mono text-lg font-bold text-stone-100 mt-1">
                  {formatTime(elapsedSec)}
                </div>
              </div>
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center">
                <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Sets Finished</div>
                <div className="font-mono text-lg font-bold text-stone-100 mt-1">
                  {workoutMetrics.totalSets}
                </div>
              </div>
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center">
                <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Total Reps</div>
                <div className="font-mono text-lg font-bold text-stone-100 mt-1">
                  {workoutMetrics.totalReps}
                </div>
              </div>
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center">
                <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                  Total Volume
                </div>
                <div className="font-mono text-lg font-bold text-emerald-400 mt-1">
                  {workoutMetrics.totalVolume} {preferences.unit}
                </div>
              </div>
            </div>

            {/* Feeling Selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-stone-300 mb-2">
                How did this workout feel?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'easy', label: 'Easy' },
                  { key: 'good', label: 'Good' },
                  { key: 'hard', label: 'Hard' },
                  { key: 'exhausted', label: 'Tough' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFeeling(item.key as typeof feeling)}
                    className={`py-2 rounded-xl text-xs font-medium transition-all ${
                      feeling === item.key
                        ? 'bg-emerald-500 text-stone-950 font-bold shadow-sm'
                        : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Workout Notes */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Session Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Good pump, increased weight on bench press..."
                rows={2}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-stone-600 resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="w-1/3 py-2.5 rounded-xl border border-stone-800 text-xs font-medium text-stone-400 hover:text-stone-200 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="w-2/3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-sm"
              >
                Save & View Stats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
