import React, { useState } from "react";
import {
  View, Text, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { plansApi } from "../../lib/api";
import { WorkoutCard } from "../../components/workout/WorkoutCard";
import { distanceLabel } from "../../lib/utils/pace";

export default function PlanScreen() {
  const { data: planData, isLoading } = useQuery({
    queryKey: ["active-plan"],
    queryFn: () => plansApi.getActive().then((r) => r.data),
  });

  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#00D4AA" size="large" />
        <Text className="text-text-secondary mt-4">Loading your plan…</Text>
      </SafeAreaView>
    );
  }

  if (!planData) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center px-6">
        <Text className="text-4xl mb-4">◎</Text>
        <Text className="text-white text-xl font-bold text-center">No Active Plan</Text>
        <Text className="text-text-secondary text-center mt-2">
          Complete onboarding to generate your personalised training plan.
        </Text>
      </SafeAreaView>
    );
  }

  const now = new Date();
  const currentWeek = planData.weeks?.find(
    (w: any) => new Date(w.startDate) <= now &&
      new Date(new Date(w.startDate).getTime() + 7 * 24 * 60 * 60 * 1000) > now
  );

  const daysUntilRace = Math.ceil(
    (new Date(planData.raceDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const phaseColors: Record<string, string> = {
    base: "#34D399",
    build: "#60A5FA",
    peak: "#FBBF24",
    taper: "#A78BFA",
    recovery: "#6B7280",
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Plan header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-text-muted text-xs uppercase tracking-widest mb-1">
            Training Plan
          </Text>
          <Text className="text-white text-2xl font-bold">{planData.name}</Text>

          {/* Race countdown */}
          <View className="flex-row items-center gap-4 mt-4">
            <View className="bg-bg-surface rounded-2xl px-4 py-3 flex-row items-center gap-2">
              <Text className="text-brand text-2xl font-bold">{daysUntilRace}</Text>
              <Text className="text-text-secondary text-sm">days to race</Text>
            </View>
            <View className="bg-bg-surface rounded-2xl px-4 py-3 flex-row items-center gap-2">
              <Text className="text-white text-2xl font-bold">
                {currentWeek?.weekNumber ?? "--"}
              </Text>
              <Text className="text-text-secondary text-sm">
                of {planData.totalWeeks} weeks
              </Text>
            </View>
          </View>
        </View>

        {/* Current phase indicator */}
        {currentWeek && (
          <View className="mx-6 mb-4 bg-bg-surface rounded-2xl p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: phaseColors[currentWeek.phase] ?? "#FFFFFF" }}
              />
              <Text
                className="text-sm font-semibold uppercase tracking-wide"
                style={{ color: phaseColors[currentWeek.phase] ?? "#FFFFFF" }}
              >
                {currentWeek.phase} Phase
              </Text>
              {currentWeek.isRecoveryWeek && (
                <View className="bg-bg-overlay px-2 py-0.5 rounded-full ml-auto">
                  <Text className="text-text-muted text-xs">Recovery Week</Text>
                </View>
              )}
              {currentWeek.isTaperWeek && (
                <View className="bg-purple-900/30 px-2 py-0.5 rounded-full ml-auto">
                  <Text className="text-purple-400 text-xs">Taper Week</Text>
                </View>
              )}
            </View>
            <Text className="text-text-secondary text-sm leading-relaxed">
              {currentWeek.phaseDescription}
            </Text>
            <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-bg-overlay">
              <Text className="text-text-secondary text-sm">
                {currentWeek.plannedDistanceKm?.toFixed(0)} km planned this week
              </Text>
              {currentWeek.actualDistanceKm != null && (
                <Text className="text-brand text-sm ml-auto">
                  {currentWeek.actualDistanceKm?.toFixed(0)} km done
                </Text>
              )}
            </View>
          </View>
        )}

        {/* All weeks */}
        <View className="px-6 pb-8">
          <Text className="text-text-secondary text-sm uppercase tracking-widest mb-3">
            All {planData.totalWeeks} Weeks
          </Text>
          <View className="gap-2">
            {planData.weeks?.map((week: any) => {
              const isExpanded = expandedWeek === week.weekNumber;
              const isCurrent = week.weekNumber === currentWeek?.weekNumber;
              const weekStart = new Date(week.startDate);
              const isPast = weekStart < now && !isCurrent;

              return (
                <View key={week.weekNumber}>
                  <TouchableOpacity
                    onPress={() =>
                      setExpandedWeek(isExpanded ? null : week.weekNumber)
                    }
                    className={`rounded-2xl px-4 py-3 flex-row items-center justify-between ${
                      isCurrent ? "bg-bg-elevated border border-brand/30" : "bg-bg-surface"
                    }`}
                    activeOpacity={0.85}
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        className="w-1 h-6 rounded-full"
                        style={{ backgroundColor: phaseColors[week.phase] ?? "#4B5563" }}
                      />
                      <View>
                        <View className="flex-row items-center gap-2">
                          <Text
                            className={`font-semibold text-sm ${isCurrent ? "text-brand" : isPast ? "text-text-muted" : "text-white"}`}
                          >
                            Week {week.weekNumber}
                          </Text>
                          {isCurrent && (
                            <View className="bg-brand-muted px-1.5 py-0.5 rounded">
                              <Text className="text-brand text-xs">Current</Text>
                            </View>
                          )}
                          {week.isRecoveryWeek && (
                            <Text className="text-text-muted text-xs">· Recovery</Text>
                          )}
                        </View>
                        <Text className="text-text-muted text-xs mt-0.5">
                          {formatWeekDate(week.startDate)} · {week.plannedDistanceKm?.toFixed(0)} km
                        </Text>
                      </View>
                    </View>
                    <Text className="text-text-muted text-lg">{isExpanded ? "∧" : "∨"}</Text>
                  </TouchableOpacity>

                  {isExpanded && week.workouts && (
                    <View className="gap-2 mt-2 ml-4">
                      {week.workouts.map((workout: any) => (
                        <WorkoutCard key={workout.id} workout={workout} compact />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatWeekDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}
