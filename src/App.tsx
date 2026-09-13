import { useState, useEffect } from 'react';
import { WorkoutPlan, CompletedWorkoutSession, UserPreferences } from './types';
import {
  loadPlans,
  savePlans,
  loadSessions,
  saveSessions,
  addCompletedSession,
  deleteCompletedSession,
  loadPreferences,
  savePreferences,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { WorkoutPlansView } from './components/WorkoutPlansView';
import { ActiveWorkoutPlayer } from './components/ActiveWorkoutPlayer';
import { StatisticsView } from './components/StatisticsView';
import { RoutineBuilderModal } from './components/RoutineBuilderModal';

export default function App() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [sessions, setSessions] = useState<CompletedWorkoutSession[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences());

  const [activeTab, setActiveTab] = useState<'plans' | 'active' | 'stats'>('plans');
  const [activeWorkoutPlan, setActiveWorkoutPlan] = useState<WorkoutPlan | null>(null);

  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const loadedPlans = loadPlans();
    setPlans(loadedPlans);

    const loadedSessions = loadSessions();
    setSessions(loadedSessions);

    const loadedPrefs = loadPreferences();
    setPreferences(loadedPrefs);
  }, []);

  // Handlers for plans
  const handleSaveRoutine = (savedPlan: WorkoutPlan) => {
    let updated: WorkoutPlan[];
    const existingIdx = plans.findIndex((p) => p.id === savedPlan.id);
    if (existingIdx >= 0) {
      updated = [...plans];
      updated[existingIdx] = savedPlan;
    } else {
      updated = [savedPlan, ...plans];
    }
    setPlans(updated);
    savePlans(updated);
    setIsRoutineModalOpen(false);
    setEditingPlan(null);
  };

  const handleDeletePlan = (planId: string) => {
    const updated = plans.filter((p) => p.id !== planId);
    setPlans(updated);
    savePlans(updated);
  };

  const handleEditPlan = (plan: WorkoutPlan) => {
    setEditingPlan(plan);
    setIsRoutineModalOpen(true);
  };

  const handleCustomizePlan = (plan: WorkoutPlan) => {
    const clonedPlan: WorkoutPlan = {
      ...plan,
      id: `custom-plan-${Date.now()}`,
      title: `${plan.title} (Personalized)`,
      isCustom: true,
      createdAt: new Date().toISOString(),
      exercises: plan.exercises.map((e) => ({
        ...e,
        id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })),
    };
    setEditingPlan(clonedPlan);
    setIsRoutineModalOpen(true);
  };

  // Workout execution handlers
  const handleStartWorkout = (plan: WorkoutPlan) => {
    setActiveWorkoutPlan(plan);
    setActiveTab('active');
  };

  const handleFinishWorkout = (session: CompletedWorkoutSession) => {
    const updatedSessions = addCompletedSession(session);
    setSessions(updatedSessions);
    setActiveWorkoutPlan(null);
    setActiveTab('stats');
  };

  const handleCancelWorkout = () => {
    setActiveWorkoutPlan(null);
    setActiveTab('plans');
  };

  // History handlers
  const handleDeleteSession = (sessionId: string) => {
    const updated = deleteCompletedSession(sessionId);
    setSessions(updated);
  };

  const handleClearAllSessions = () => {
    saveSessions([]);
    setSessions([]);
  };

  // Preferences
  const handleUpdatePreferences = (updated: Partial<UserPreferences>) => {
    const newPrefs = { ...preferences, ...updated };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveWorkout={!!activeWorkoutPlan}
        activePlanTitle={activeWorkoutPlan?.title}
        onOpenCreateRoutine={() => {
          setEditingPlan(null);
          setIsRoutineModalOpen(true);
        }}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'plans' && (
          <WorkoutPlansView
            plans={plans}
            onStartWorkout={handleStartWorkout}
            onCustomizePlan={handleCustomizePlan}
            onEditPlan={handleEditPlan}
            onDeletePlan={handleDeletePlan}
            onCreateNew={() => {
              setEditingPlan(null);
              setIsRoutineModalOpen(true);
            }}
            preferences={preferences}
          />
        )}

        {activeTab === 'active' && activeWorkoutPlan && (
          <ActiveWorkoutPlayer
            plan={activeWorkoutPlan}
            preferences={preferences}
            onFinishWorkout={handleFinishWorkout}
            onCancelWorkout={handleCancelWorkout}
          />
        )}

        {activeTab === 'stats' && (
          <StatisticsView
            sessions={sessions}
            preferences={preferences}
            onDeleteSession={handleDeleteSession}
            onClearAllSessions={handleClearAllSessions}
          />
        )}
      </main>

      {/* Routine Builder Modal */}
      {isRoutineModalOpen && (
        <RoutineBuilderModal
          initialPlan={editingPlan}
          onSave={handleSaveRoutine}
          onClose={() => {
            setIsRoutineModalOpen(false);
            setEditingPlan(null);
          }}
          unit={preferences.unit}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-stone-800/80 bg-stone-950 py-6 text-center text-xs text-stone-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>Kinetic Physical Fitness &bull; Stored Routines, Workout Timer & Progress Tracking</p>
          <div className="flex items-center gap-3 text-stone-400">
            <span>Beginner &bull; Intermediate &bull; Advanced</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
