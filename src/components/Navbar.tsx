import { Dumbbell, BarChart3, Plus, Volume2, VolumeX, Play } from 'lucide-react';
import { UserPreferences } from '../types';

interface NavbarProps {
  activeTab: 'plans' | 'active' | 'stats';
  setActiveTab: (tab: 'plans' | 'active' | 'stats') => void;
  hasActiveWorkout: boolean;
  activePlanTitle?: string;
  onOpenCreateRoutine: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  hasActiveWorkout,
  activePlanTitle,
  onOpenCreateRoutine,
  preferences,
  onUpdatePreferences,
}: NavbarProps) {
  return (
    <header id="app-header" className="sticky top-0 z-30 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 text-stone-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-base tracking-tight text-stone-100 flex items-center gap-2">
              <span>Kinetic</span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                Fitness
              </span>
            </div>
            <p className="text-xs text-stone-400 hidden sm:block">Routines • Timer • Progress</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800/80">
          <button
            id="nav-plans-btn"
            onClick={() => setActiveTab('plans')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'plans'
                ? 'bg-stone-800 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Workout Plans
          </button>

          {hasActiveWorkout && (
            <button
              id="nav-active-btn"
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'active'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>In Progress</span>
            </button>
          )}

          <button
            id="nav-stats-btn"
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'stats'
                ? 'bg-stone-800 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Statistics</span>
          </button>
        </nav>

        {/* Right Actions: Create Routine + Preferences */}
        <div className="flex items-center gap-2">
          {/* Unit Toggle (kg/lbs) */}
          <button
            id="unit-toggle-btn"
            onClick={() => onUpdatePreferences({ unit: preferences.unit === 'kg' ? 'lbs' : 'kg' })}
            title={`Toggle unit (currently ${preferences.unit})`}
            className="h-8 px-2.5 rounded-lg border border-stone-800 bg-stone-950 text-xs font-medium text-stone-300 hover:bg-stone-800 transition-colors uppercase"
          >
            {preferences.unit}
          </button>

          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={() => onUpdatePreferences({ soundEnabled: !preferences.soundEnabled })}
            title={preferences.soundEnabled ? 'Mute timer sound' : 'Enable timer sound'}
            className="w-8 h-8 rounded-lg border border-stone-800 bg-stone-950 flex items-center justify-center text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            {preferences.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>

          {/* Create Routine Button */}
          <button
            id="create-routine-btn"
            onClick={onOpenCreateRoutine}
            className="hidden sm:flex items-center gap-1.5 bg-stone-100 text-stone-900 hover:bg-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Routine</span>
          </button>
        </div>
      </div>

      {/* Mobile in-progress quick banner if in different tab */}
      {hasActiveWorkout && activeTab !== 'active' && (
        <div className="bg-emerald-950/60 border-t border-emerald-800/40 px-4 py-2 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-medium truncate">Workout active: {activePlanTitle || 'Session'}</span>
          </div>
          <button
            onClick={() => setActiveTab('active')}
            className="flex items-center gap-1 font-semibold text-emerald-300 hover:text-emerald-100 underline text-xs"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Resume</span>
          </button>
        </div>
      )}
    </header>
  );
}
