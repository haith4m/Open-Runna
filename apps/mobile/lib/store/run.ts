import { create } from "zustand";
import type { LiveRunState } from "@openrunna/shared";

interface RunStore {
  activeRunId: string | null;
  liveState: LiveRunState;
  isTracking: boolean;

  setActiveRunId: (id: string | null) => void;
  updateLiveState: (partial: Partial<LiveRunState>) => void;
  setTracking: (tracking: boolean) => void;
  resetRun: () => void;
}

const defaultLiveState: LiveRunState = {
  status: "idle",
  elapsedSeconds: 0,
  movingSeconds: 0,
  distanceMeters: 0,
  currentPaceSecPerKm: 0,
  averagePaceSecPerKm: 0,
  currentHeartRate: undefined,
  currentCadenceSpm: undefined,
  currentAltitude: undefined,
  currentStepIndex: 0,
  currentStepType: undefined,
  currentStepProgress: 0,
  nextStepDescription: undefined,
  isOnPace: true,
  paceDeviation: 0,
  currentLapDistanceMeters: 0,
  currentLapPaceSecPerKm: 0,
  lapCount: 1,
};

export const useRunStore = create<RunStore>((set) => ({
  activeRunId: null,
  liveState: defaultLiveState,
  isTracking: false,

  setActiveRunId: (id) => set({ activeRunId: id }),
  updateLiveState: (partial) =>
    set((state) => ({ liveState: { ...state.liveState, ...partial } })),
  setTracking: (tracking) => set({ isTracking: tracking }),
  resetRun: () =>
    set({ activeRunId: null, liveState: defaultLiveState, isTracking: false }),
}));
