import { useState, type FormEvent } from 'react';
import { WorkoutPlan, Exercise, ExperienceLevel, MuscleGroup } from '../types';
import { X, Plus, Trash2, ChevronUp, ChevronDown, Dumbbell, Sparkles } from 'lucide-react';

interface RoutineBuilderModalProps {
  initialPlan?: WorkoutPlan | null;
  onSave: (plan: WorkoutPlan) => void;
  onClose: () => void;
  unit: 'kg' | 'lbs';
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Full Body',
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Cardio',
];

const PRESET_EXERCISES: Partial<Exercise>[] = [
  { name: 'Push-ups', muscleGroup: 'Chest', equipment: 'Bodyweight', sets: 3, targetReps: 12, restSec: 60 },
  { name: 'Dumbbell Bench Press', muscleGroup: 'Chest', equipment: 'Dumbbells', sets: 4, targetReps: 10, restSec: 75 },
  { name: 'Goblet Squats', muscleGroup: 'Legs', equipment: 'Dumbbell', sets: 4, targetReps: 12, restSec: 60 },
  { name: 'Barbell / Dumbbell Deadlift', muscleGroup: 'Legs', equipment: 'Weights', sets: 4, targetReps: 8, restSec: 90 },
  { name: 'Dumbbell Rows', muscleGroup: 'Back', equipment: 'Dumbbells', sets: 3, targetReps: 12, restSec: 60 },
  { name: 'Pull-ups / Lat Pulldown', muscleGroup: 'Back', equipment: 'Bar / Cable', sets: 3, targetReps: 8, restSec: 75 },
  { name: 'Overhead Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Dumbbells', sets: 3, targetReps: 10, restSec: 60 },
  { name: 'Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbells', sets: 3, targetReps: 15, restSec: 45 },
  { name: 'Bicep Curls', muscleGroup: 'Arms', equipment: 'Dumbbells', sets: 3, targetReps: 12, restSec: 45 },
  { name: 'Tricep Dips', muscleGroup: 'Arms', equipment: 'Bench / Bars', sets: 3, targetReps: 12, restSec: 45 },
  { name: 'Plank Hold', muscleGroup: 'Core', equipment: 'Mat', sets: 3, targetDurationSec: 45, restSec: 45 },
  { name: 'Russian Twists', muscleGroup: 'Core', equipment: 'Mat', sets: 3, targetReps: 20, restSec: 45 },
  { name: 'Mountain Climbers', muscleGroup: 'Cardio', equipment: 'Mat', sets: 3, targetDurationSec: 35, restSec: 40 },
  { name: 'Jumping Jacks / Burpees', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 3, targetReps: 15, restSec: 45 },
];

export function RoutineBuilderModal({
  initialPlan,
  onSave,
  onClose,
  unit,
}: RoutineBuilderModalProps) {
  const [title, setTitle] = useState(initialPlan?.title || '');
  const [description, setDescription] = useState(initialPlan?.description || '');
  const [level, setLevel] = useState<ExperienceLevel>(initialPlan?.level || 'Beginner');
  const [category, setCategory] = useState(initialPlan?.category || 'Full Body');
  const [durationMin, setDurationMin] = useState(initialPlan?.durationMin || 30);
  const [exercises, setExercises] = useState<Exercise[]>(
    initialPlan?.exercises && initialPlan.exercises.length > 0
      ? initialPlan.exercises.map((e) => ({ ...e, id: e.id || `ex-${Date.now()}-${Math.random()}` }))
      : [
          {
            id: `ex-${Date.now()}-1`,
            name: 'Bodyweight Squats',
            muscleGroup: 'Legs',
            equipment: 'Bodyweight',
            sets: 3,
            targetReps: 12,
            restSec: 60,
            instructions: 'Keep chest high and sink down with knees tracking toes.',
          },
        ]
  );
  const [showPresets, setShowPresets] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddBlankExercise = () => {
    setExercises((prev) => [
      ...prev,
      {
        id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: '',
        muscleGroup: 'Full Body',
        equipment: 'Dumbbells',
        sets: 3,
        targetReps: 10,
        restSec: 60,
        instructions: '',
      },
    ]);
  };

  const handleAddPreset = (preset: Partial<Exercise>) => {
    setExercises((prev) => [
      ...prev,
      {
        id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: preset.name || 'Exercise',
        muscleGroup: preset.muscleGroup || 'Full Body',
        equipment: preset.equipment || 'None',
        sets: preset.sets || 3,
        targetReps: preset.targetReps,
        targetDurationSec: preset.targetDurationSec,
        restSec: preset.restSec || 60,
        instructions: preset.instructions || '',
      },
    ]);
    setShowPresets(false);
  };

  const handleUpdateExercise = (idx: number, updates: Partial<Exercise>) => {
    setExercises((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
  };

  const handleRemoveExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMoveExercise = (idx: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && idx === 0) ||
      (direction === 'down' && idx === exercises.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    setExercises((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handleSaveRoutine = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a routine title.');
      return;
    }
    if (exercises.length === 0) {
      setErrorMsg('Please include at least one exercise in the routine.');
      return;
    }
    for (let i = 0; i < exercises.length; i++) {
      if (!exercises[i].name.trim()) {
        setErrorMsg(`Exercise #${i + 1} needs a name.`);
        return;
      }
    }

    const planToSave: WorkoutPlan = {
      id: initialPlan?.id || `custom-plan-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || `${level} routine targeting ${category}`,
      level,
      category,
      durationMin: Number(durationMin) || 30,
      exercises,
      isCustom: true,
      createdAt: initialPlan?.createdAt || new Date().toISOString(),
    };

    onSave(planToSave);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">
                {initialPlan ? 'Edit Routine' : 'Build Custom Routine'}
              </h2>
              <p className="text-xs text-stone-400">
                Personalize exercises, sets, reps, and target rest times.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSaveRoutine} className="overflow-y-auto flex-1 py-4 pr-1 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Routine Basics */}
          <div className="space-y-3 bg-stone-950/60 border border-stone-800/80 rounded-2xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Routine Details
            </h3>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Routine Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. My Morning Strength Boost"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-stone-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Experience Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as ExperienceLevel)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-stone-600"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Target Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-stone-600"
                >
                  {MUSCLE_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                  <option value="HIIT">HIIT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Estimated Minutes
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={durationMin}
                  onChange={(e) => setDurationMin(Number(e.target.value))}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-stone-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Description / Notes
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief goal or focus of this routine..."
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-stone-600"
              />
            </div>
          </div>

          {/* Exercises Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Exercises ({exercises.length})
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPresets(!showPresets)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{showPresets ? 'Close Library' : 'Pick from Library'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddBlankExercise}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Exercise</span>
                </button>
              </div>
            </div>

            {/* Presets picker dropdown */}
            {showPresets && (
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-2xl">
                <div className="text-[11px] text-stone-400 font-medium mb-2">
                  Click any exercise to append it to your workout:
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {PRESET_EXERCISES.map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleAddPreset(preset)}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-stone-200 text-xs text-left transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>{preset.name}</span>
                      <span className="text-[10px] text-stone-400">({preset.muscleGroup})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List of current exercises */}
            <div className="space-y-3">
              {exercises.map((ex, idx) => (
                <div
                  key={ex.id || idx}
                  className="bg-stone-950/80 border border-stone-800/90 rounded-2xl p-3.5 space-y-2.5 relative group"
                >
                  {/* Row 1: Number, Name, Muscle, Reorder & Delete */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-stone-400 w-5">
                      #{idx + 1}
                    </span>

                    <input
                      type="text"
                      required
                      value={ex.name}
                      placeholder="Exercise name..."
                      onChange={(e) => handleUpdateExercise(idx, { name: e.target.value })}
                      className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-stone-600"
                    />

                    <select
                      value={ex.muscleGroup}
                      onChange={(e) =>
                        handleUpdateExercise(idx, { muscleGroup: e.target.value as MuscleGroup })
                      }
                      className="bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-300 focus:outline-none"
                    >
                      {MUSCLE_GROUPS.map((mg) => (
                        <option key={mg} value={mg}>
                          {mg}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveExercise(idx, 'up')}
                        className="p-1 text-stone-400 hover:text-stone-200 disabled:opacity-30"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === exercises.length - 1}
                        onClick={() => handleMoveExercise(idx, 'down')}
                        className="p-1 text-stone-400 hover:text-stone-200 disabled:opacity-30"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(idx)}
                        className="p-1 text-stone-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Sets, Target Reps/Duration, Target Weight, Rest Secs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] text-stone-400 mb-0.5">Sets</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={ex.sets}
                        onChange={(e) =>
                          handleUpdateExercise(idx, { sets: Number(e.target.value) || 1 })
                        }
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-400 mb-0.5">
                        {ex.targetDurationSec !== undefined ? 'Hold (Secs)' : 'Target Reps'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="300"
                        value={ex.targetDurationSec !== undefined ? ex.targetDurationSec : (ex.targetReps || 10)}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 1;
                          if (ex.targetDurationSec !== undefined) {
                            handleUpdateExercise(idx, { targetDurationSec: val });
                          } else {
                            handleUpdateExercise(idx, { targetReps: val });
                          }
                        }}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-400 mb-0.5">
                        Weight ({unit})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0 (BW)"
                        value={ex.targetWeight || ''}
                        onChange={(e) =>
                          handleUpdateExercise(idx, {
                            targetWeight: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-400 mb-0.5">Rest (Secs)</label>
                      <input
                        type="number"
                        min="10"
                        max="300"
                        step="5"
                        value={ex.restSec || 60}
                        onChange={(e) =>
                          handleUpdateExercise(idx, { restSec: Number(e.target.value) || 60 })
                        }
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200 font-mono"
                      />
                    </div>
                  </div>

                  {/* Row 3: Optional Form Tip / Cues */}
                  <div>
                    <input
                      type="text"
                      placeholder="Optional form cue or equipment (e.g. Incline bench, keep elbows in)..."
                      value={ex.instructions || ''}
                      onChange={(e) => handleUpdateExercise(idx, { instructions: e.target.value })}
                      className="w-full bg-stone-900/60 border border-stone-800/80 rounded-lg px-2.5 py-1 text-[11px] text-stone-300 placeholder-stone-600 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-stone-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-sm"
            >
              Save Routine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
