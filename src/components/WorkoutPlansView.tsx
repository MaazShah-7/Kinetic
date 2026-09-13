import { useState, useMemo } from 'react';
import { WorkoutPlan, ExperienceLevel, UserPreferences } from '../types';
import { Play, Clock, Dumbbell, Sparkles, Trash2, Edit3, Copy, Search, ChevronDown, ChevronUp, Plus } from 'lucide-react';

interface WorkoutPlansViewProps {
  plans: WorkoutPlan[];
  onStartWorkout: (plan: WorkoutPlan) => void;
  onCustomizePlan: (plan: WorkoutPlan) => void;
  onEditPlan: (plan: WorkoutPlan) => void;
  onDeletePlan: (planId: string) => void;
  onCreateNew: () => void;
  preferences: UserPreferences;
}

export function WorkoutPlansView({
  plans,
  onStartWorkout,
  onCustomizePlan,
  onEditPlan,
  onDeletePlan,
  onCreateNew,
  preferences,
}: WorkoutPlansViewProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    plans.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ['All', ...Array.from(cats)];
  }, [plans]);

  // Filter plans
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchLevel = selectedLevel === 'All' || plan.level === selectedLevel;
      const matchCategory = selectedCategory === 'All' || plan.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.exercises.some((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchLevel && matchCategory && matchSearch;
    });
  }, [plans, selectedLevel, selectedCategory, searchQuery]);

  const levelColor = (level: ExperienceLevel) => {
    switch (level) {
      case 'Beginner':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Intermediate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Advanced':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-stone-800 text-stone-300 border-stone-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-100">
            Workout Routines
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Structured fitness plans for every experience level. Start immediately or customize your own routine.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold text-sm transition-all shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Routine</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-stone-900 border border-stone-800/80 rounded-2xl p-4 mb-8 space-y-4">
        {/* Top filter row: Levels & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Level tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => {
              const count = lvl === 'All' ? plans.length : plans.filter((p) => p.level === lvl).length;
              const isSelected = selectedLevel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-stone-100 text-stone-950 font-semibold shadow-sm'
                      : 'bg-stone-950/70 text-stone-400 hover:text-stone-200 border border-stone-800'
                  }`}
                >
                  <span>{lvl}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-stone-300/80 text-stone-900' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search plans or exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-1.5 text-xs sm:text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-stone-600 transition-colors"
            />
          </div>
        </div>

        {/* Category sub-filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-stone-800/60 scrollbar-none">
          <span className="text-[11px] font-medium uppercase tracking-wider text-stone-400 mr-1 shrink-0">
            Target:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium'
                  : 'text-stone-400 hover:text-stone-300 hover:bg-stone-800/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-16 bg-stone-900/50 border border-stone-800/60 rounded-2xl p-8">
          <Dumbbell className="w-10 h-10 text-stone-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-200">No workout plans found</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search query or filters, or create a personalized routine from scratch.
          </p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Routine</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => {
            const isExpanded = expandedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                id={`plan-card-${plan.id}`}
                className="bg-stone-900 border border-stone-800/80 rounded-2xl flex flex-col justify-between hover:border-stone-700 transition-all shadow-sm overflow-hidden group"
              >
                <div className="p-5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${levelColor(
                          plan.level
                        )}`}
                      >
                        {plan.level}
                      </span>
                      {plan.isCustom && (
                        <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Custom</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-stone-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>~{plan.durationMin}m</span>
                      </div>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-stone-100 group-hover:text-emerald-400 transition-colors">
                    {plan.title}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Quick exercise count and category pill */}
                  <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                    <span className="font-medium text-stone-300">
                      {plan.exercises.length} {plan.exercises.length === 1 ? 'Exercise' : 'Exercises'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-[11px] text-stone-300">
                      {plan.category}
                    </span>
                  </div>

                  {/* Exercises Peek Accordion */}
                  <div className="mt-3">
                    <button
                      onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                      className="w-full flex items-center justify-between text-xs font-medium text-stone-400 hover:text-stone-200 py-1.5 transition-colors"
                    >
                      <span>{isExpanded ? 'Hide exercises' : 'View exercise list'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1.5 bg-stone-950/60 rounded-xl p-3 border border-stone-800/60 text-xs">
                        {plan.exercises.map((ex, idx) => (
                          <div key={ex.id || idx} className="flex items-center justify-between py-1 border-b border-stone-800/40 last:border-0">
                            <div className="flex items-center gap-2 truncate pr-2">
                              <span className="text-[10px] font-mono text-stone-400 w-4">{idx + 1}.</span>
                              <span className="text-stone-200 font-medium truncate">{ex.name}</span>
                            </div>
                            <span className="text-stone-400 shrink-0 text-[11px]">
                              {ex.sets} × {ex.targetReps ? `${ex.targetReps}r` : `${ex.targetDurationSec}s`}
                              {ex.targetWeight ? ` @ ${ex.targetWeight}${preferences.unit}` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-stone-950/40 border-t border-stone-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {plan.isCustom ? (
                      <>
                        <button
                          onClick={() => onEditPlan(plan)}
                          title="Edit routine"
                          className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeletePlan(plan.id)}
                          title="Delete routine"
                          className="p-2 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onCustomizePlan(plan)}
                        title="Copy and customize as your own personalized routine"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Customize</span>
                      </button>
                    )}
                  </div>

                  {/* Primary Start Workout button */}
                  <button
                    id={`start-workout-btn-${plan.id}`}
                    onClick={() => onStartWorkout(plan)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.98]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Workout</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
