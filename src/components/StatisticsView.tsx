import { useState, useMemo } from 'react';
import { CompletedWorkoutSession, UserPreferences, MuscleGroup } from '../types';
import { calculateStreak } from '../utils/storage';
import {
  Flame,
  Clock,
  Dumbbell,
  CheckCircle,
  Calendar,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  Award,
  Zap
} from 'lucide-react';

interface StatisticsViewProps {
  sessions: CompletedWorkoutSession[];
  preferences: UserPreferences;
  onDeleteSession: (sessionId: string) => void;
  onClearAllSessions: () => void;
}

export function StatisticsView({
  sessions,
  preferences,
  onDeleteSession,
  onClearAllSessions,
}: StatisticsViewProps) {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Overall KPIs
  const totalWorkouts = sessions.length;
  const currentStreak = useMemo(() => calculateStreak(sessions), [sessions]);

  const totalSecondsTrained = useMemo(
    () => sessions.reduce((acc, s) => acc + (s.durationSec || 0), 0),
    [sessions]
  );
  const totalHours = (totalSecondsTrained / 3600).toFixed(1);

  const totalVolumeLifted = useMemo(
    () => sessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0),
    [sessions]
  );

  const totalRepsCompleted = useMemo(
    () => sessions.reduce((acc, s) => acc + (s.totalReps || 0), 0),
    [sessions]
  );

  // Weekly Activity (Last 7 days: Day name, minutes, active)
  const weeklyActivity = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      // Sessions on this day
      const daysSessions = sessions.filter((s) => {
        try {
          return new Date(s.date).toISOString().split('T')[0] === dayStr;
        } catch {
          return false;
        }
      });

      const minutes = daysSessions.reduce((acc, s) => acc + Math.round(s.durationSec / 60), 0);
      const volume = daysSessions.reduce((acc, s) => acc + s.totalVolume, 0);

      days.push({
        dayName,
        dateStr: dayStr,
        minutes,
        volume,
        hasWorkout: daysSessions.length > 0,
        isToday: i === 0,
      });
    }
    return days;
  }, [sessions]);

  const maxWeeklyMinutes = useMemo(() => {
    const max = Math.max(...weeklyActivity.map((d) => d.minutes), 0);
    return max > 0 ? max : 60;
  }, [weeklyActivity]);

  // Muscle Group Focus Distribution
  const muscleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalExercises = 0;

    sessions.forEach((s) => {
      s.exercises.forEach((ex) => {
        const mg = ex.muscleGroup || 'Full Body';
        counts[mg] = (counts[mg] || 0) + 1;
        totalExercises += 1;
      });
    });

    if (totalExercises === 0) return [];

    return Object.entries(counts)
      .map(([group, count]) => ({
        group: group as MuscleGroup,
        count,
        percent: Math.round((count / totalExercises) * 100),
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [sessions]);

  // Personal Bests
  const personalRecords = useMemo(() => {
    if (!sessions.length) return null;

    let longestSession = sessions[0];
    let heaviestVolumeSession = sessions[0];

    sessions.forEach((s) => {
      if (s.durationSec > longestSession.durationSec) longestSession = s;
      if (s.totalVolume > heaviestVolumeSession.totalVolume) heaviestVolumeSession = s;
    });

    return {
      longestMinutes: Math.round(longestSession.durationSec / 60),
      longestPlan: longestSession.planTitle,
      maxVolume: heaviestVolumeSession.totalVolume,
      maxVolumePlan: heaviestVolumeSession.planTitle,
    };
  }, [sessions]);

  // Export JSON backup
  const handleExportData = () => {
    const dataStr = JSON.stringify(sessions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinetic_fitness_workouts_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const feelingColor = (rating?: string) => {
    switch (rating) {
      case 'easy':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'good':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'hard':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'exhausted':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-stone-800 text-stone-400 border-stone-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-100">
            Progress & Statistics
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Detailed performance tracking, volume consistency, and completed session history.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {sessions.length > 0 && (
            <button
              onClick={handleExportData}
              className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Export workout logs to JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}

          {sessions.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-rose-950/40 border border-stone-800 hover:border-rose-900/60 text-stone-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Active Streak
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-stone-100">{currentStreak}</span>
            <span className="text-xs text-stone-400">{currentStreak === 1 ? 'Day' : 'Days'}</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            {currentStreak > 0 ? 'Consistent momentum maintained' : 'Complete a workout to start streak'}
          </p>
        </div>

        {/* Total Workouts */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Workouts Done
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-stone-100">{totalWorkouts}</span>
            <span className="text-xs text-stone-400">Sessions</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            {totalRepsCompleted.toLocaleString()} total reps completed
          </p>
        </div>

        {/* Total Time */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Time Trained
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-stone-100">{totalHours}</span>
            <span className="text-xs text-stone-400">Hours</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Across all saved workout sessions
          </p>
        </div>

        {/* Total Volume */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Total Volume
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-stone-100">
              {totalVolumeLifted > 1000 ? `${(totalVolumeLifted / 1000).toFixed(1)}k` : totalVolumeLifted}
            </span>
            <span className="text-xs text-stone-400">{preferences.unit}</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Calculated weight × reps lifted
          </p>
        </div>
      </div>

      {/* Charts Grid: Weekly Activity & Muscle Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-100">Weekly Consistency</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Minutes exercised over the past 7 days
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40">
              {weeklyActivity.filter((d) => d.hasWorkout).length} of 7 Days Active
            </span>
          </div>

          {/* Bar Chart Visual */}
          <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {weeklyActivity.map((day) => {
              const heightPercent = maxWeeklyMinutes > 0 ? (day.minutes / maxWeeklyMinutes) * 100 : 0;
              const barHeight = Math.max(day.hasWorkout ? 12 : 4, heightPercent);

              return (
                <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono bg-stone-950 border border-stone-800 px-1.5 py-0.5 rounded text-stone-200 shadow whitespace-nowrap mb-1">
                    {day.minutes} min
                  </div>

                  {/* Vertical bar */}
                  <div className="w-full max-w-[38px] bg-stone-950 rounded-lg p-1 h-32 flex items-end border border-stone-800/60">
                    <div
                      style={{ height: `${barHeight}%` }}
                      className={`w-full rounded-md transition-all duration-500 ${
                        day.hasWorkout
                          ? day.isToday
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-500/20'
                            : 'bg-emerald-600 group-hover:bg-emerald-500'
                          : 'bg-stone-800/60'
                      }`}
                    />
                  </div>

                  {/* Day Label */}
                  <div className="text-center">
                    <span
                      className={`text-xs font-medium block ${
                        day.isToday ? 'text-emerald-400 font-bold' : 'text-stone-400'
                      }`}
                    >
                      {day.dayName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Muscle Group Distribution (1 col) */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-100">Muscle Target Focus</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Distribution of muscle groups trained
            </p>

            <div className="mt-4 space-y-2.5">
              {muscleDistribution.length === 0 ? (
                <div className="text-xs text-stone-500 py-6 text-center">
                  No exercise data logged yet.
                </div>
              ) : (
                muscleDistribution.slice(0, 5).map((item) => (
                  <div key={item.group} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-300">{item.group}</span>
                      <span className="font-mono text-stone-400 text-[11px]">{item.percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-950 overflow-hidden border border-stone-800/60">
                      <div
                        style={{ width: `${item.percent}%` }}
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Personal Record Highlight */}
          {personalRecords && (
            <div className="mt-4 pt-3.5 border-t border-stone-800/80">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
                <Award className="w-3.5 h-3.5" />
                <span>Personal Best</span>
              </div>
              <p className="text-xs text-stone-300">
                Max single-session volume:{' '}
                <span className="font-bold text-stone-100">
                  {personalRecords.maxVolume} {preferences.unit}
                </span>{' '}
                ({personalRecords.maxVolumePlan})
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Workout History Log */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-100">Workout History Log</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Chronological log of past sessions and performance metrics
            </p>
          </div>
          <span className="text-xs text-stone-400 font-medium">
            {sessions.length} Recorded
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="py-12 text-center">
            <Zap className="w-8 h-8 text-stone-600 mx-auto mb-2" />
            <p className="text-xs text-stone-400">No workout sessions logged yet.</p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Pick a workout plan and complete your first session to track progress.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => {
              const isExpanded = expandedSessionId === sess.id;
              const dateFormatted = new Date(sess.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={sess.id}
                  className="bg-stone-950 border border-stone-800/80 rounded-xl overflow-hidden transition-all"
                >
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-emerald-400 shrink-0">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-stone-200">{sess.planTitle}</h4>
                          {sess.feelingRating && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${feelingColor(
                                sess.feelingRating
                              )}`}
                            >
                              {sess.feelingRating}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span>{dateFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats summary & buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800/60">
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="text-left">
                          <span className="text-[10px] text-stone-400 block font-sans">Time</span>
                          <span className="text-stone-200 font-semibold">{formatDuration(sess.durationSec)}</span>
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] text-stone-400 block font-sans">Sets</span>
                          <span className="text-stone-200 font-semibold">{sess.totalSets}</span>
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] text-stone-400 block font-sans">Volume</span>
                          <span className="text-emerald-400 font-semibold">
                            {sess.totalVolume} {preferences.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setExpandedSessionId(isExpanded ? null : sess.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-900 transition-colors"
                          title="View exercise details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => onDeleteSession(sess.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                          title="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Exercise & Set Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 bg-stone-900/40 border-t border-stone-800/60 text-xs">
                      {sess.notes && (
                        <div className="mb-3 p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 italic">
                          "{sess.notes}"
                        </div>
                      )}

                      <div className="space-y-2">
                        {sess.exercises.map((ex, exIdx) => (
                          <div
                            key={ex.exerciseId || exIdx}
                            className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800/80"
                          >
                            <div className="flex items-center justify-between font-medium text-stone-200 mb-1.5">
                              <span>{ex.exerciseName}</span>
                              <span className="text-[10px] text-stone-400 uppercase">{ex.muscleGroup}</span>
                            </div>

                            {/* Sets breakdown */}
                            <div className="flex flex-wrap gap-1.5">
                              {ex.sets.map((s, sIdx) => (
                                <span
                                  key={sIdx}
                                  className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                                    s.completed
                                      ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                                      : 'bg-stone-800 border-stone-700 text-stone-400'
                                  }`}
                                >
                                  S{s.setNumber}: {s.reps}r {s.weight ? `@ ${s.weight}${preferences.unit}` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-stone-100">Clear All Workout Logs?</h3>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              This will erase all completed workout history and reset your statistics. Your saved workout routines will remain intact.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-300 hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllSessions();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
