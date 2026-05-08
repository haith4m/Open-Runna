import React, { createContext, useContext, useState } from "react";
import { Stack } from "expo-router";
import { View } from "react-native";

// Onboarding state shared across all onboarding screens
export interface OnboardingData {
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  targetDistance?: string;
  raceDate?: string;
  raceName?: string;
  goalType?: "finish" | "time" | "pr";
  goalTimeSeconds?: number;
  weeklyMileageKm?: number;
  longestRecentRunKm?: number;
  easyPaceSeconds?: number;
  recentRaceDistance?: string;
  recentRaceTimeSeconds?: number;
  availableTrainingDays?: string[];
  preferredLongRunDay?: string;
  maxRunDurationMinutes?: number;
  hasTreadmillAccess?: boolean;
  hasGymAccess?: boolean;
  doesStrengthTraining?: boolean;
  sleepQuality?: string;
}

const OnboardingContext = createContext<{
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
}>({
  data: {},
  update: () => {},
});

export function useOnboarding() {
  return useContext(OnboardingContext);
}

export default function OnboardingLayout() {
  const [data, setData] = useState<OnboardingData>({});

  const update = (partial: Partial<OnboardingData>) =>
    setData((prev) => ({ ...prev, ...partial }));

  return (
    <OnboardingContext.Provider value={{ data, update }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0A0A0A" },
          animation: "slide_from_right",
        }}
      />
    </OnboardingContext.Provider>
  );
}
