import React, { useState } from "react";
import { View, Text, SafeAreaView, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "./_layout";
import { Button } from "../../components/ui/Button";
import { profileApi, plansApi } from "../../lib/api";
import { estimateVdotFromEasyPace, computeTrainingPaces, predictRaceTimeForDistance } from "@openrunna/pace-calculator";
import { formatPace, formatTime, distanceLabel } from "../../lib/utils/pace";

export default function SummaryScreen() {
  const router = useRouter();
  const { data } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate VDOT and paces right here for the preview
  const vdotEst = data.easyPaceSeconds
    ? estimateVdotFromEasyPace(data.easyPaceSeconds)
    : { vdot: 35, confidence: 0.2 };

  const paces = computeTrainingPaces(vdotEst.vdot);

  const predictedSeconds = data.targetDistance
    ? Math.round(predictRaceTimeForDistance(vdotEst.vdot, data.targetDistance as any))
    : null;

  const weeksUntilRace = data.raceDate
    ? Math.max(4, Math.round((new Date(data.raceDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))
    : 16;

  async function handleBuildPlan() {
    setLoading(true);
    setError(null);
    try {
      // 1. Save profile
      await profileApi.update({
        experienceLevel: data.experienceLevel,
        weeklyMileageKm: data.weeklyMileageKm,
        longestRecentRunKm: data.longestRecentRunKm,
        availableTrainingDays: data.availableTrainingDays,
        preferredLongRunDay: data.preferredLongRunDay,
        hasTreadmillAccess: data.hasTreadmillAccess ?? false,
      });

      // 2. Generate plan
      await plansApi.generate({
        targetDistance: data.targetDistance,
        raceDate: data.raceDate,
        goalType: data.goalType ?? "finish",
        goalTimeSeconds: data.goalTimeSeconds,
        raceName: data.raceName,
      });

      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-16 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <ProgressDots current={5} total={6} />

        <Text className="text-white text-3xl font-bold mt-8 mb-2">
          Your plan preview
        </Text>
        <Text className="text-text-secondary text-base mb-8">
          Here's what we've built based on your profile.
        </Text>

        {error && (
          <View className="bg-accent-muted rounded-xl p-3 mb-6">
            <Text className="text-accent text-sm">{error}</Text>
          </View>
        )}

        {/* Plan summary card */}
        <View className="bg-bg-surface rounded-2xl p-5 mb-4">
          <Row label="Race" value={distanceLabel(data.targetDistance ?? "marathon")} />
          <Row label="Race Date" value={data.raceDate ?? "TBD"} />
          <Row label="Training Weeks" value={`${weeksUntilRace} weeks`} />
          <Row label="Weekly Runs" value={`${data.availableTrainingDays?.length ?? 4} days/week`} />
          <Row label="Starting Volume" value={`~${data.weeklyMileageKm ?? 0} km/week`} />
        </View>

        {/* Pace card */}
        <View className="bg-bg-surface rounded-2xl p-5 mb-4">
          <Text className="text-text-secondary text-xs uppercase tracking-wide mb-3">
            Your Training Paces
          </Text>
          <Row label="Easy" value={`${formatPace(paces.easy.midpointSecPerKm)}/km`} color="#34D399" />
          <Row label="Threshold" value={`${formatPace(paces.threshold.midpointSecPerKm)}/km`} color="#FBBF24" />
          <Row label="Intervals" value={`${formatPace(paces.interval.midpointSecPerKm)}/km`} color="#F97316" />

          {predictedSeconds && (
            <View className="mt-3 pt-3 border-t border-bg-overlay">
              <Text className="text-text-muted text-xs mb-1">
                Predicted {distanceLabel(data.targetDistance ?? "marathon")} time
              </Text>
              <Text className="text-brand text-xl font-bold font-mono">
                {formatTime(predictedSeconds)}
              </Text>
              <Text className="text-text-muted text-xs mt-1">
                Based on your easy pace. Will sharpen as you run more.
              </Text>
            </View>
          )}
        </View>

        {/* Confidence */}
        <View className="bg-bg-surface rounded-2xl p-4 mb-8">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-text-secondary text-sm">Fitness confidence:</Text>
            <Text className="text-brand font-semibold text-sm">
              {Math.round(vdotEst.confidence * 100)}%
            </Text>
          </View>
          <Text className="text-text-muted text-xs leading-relaxed">
            This increases as you complete runs and log race times. The plan adapts automatically.
          </Text>
        </View>

        <Button
          label="Build My Plan"
          size="lg"
          loading={loading}
          onPress={handleBuildPlan}
        />

        <Text className="text-text-muted text-xs text-center mt-4 leading-relaxed">
          Your plan adapts as you train. Missed sessions, injuries, and life — all handled.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View className="flex-row justify-between items-center py-2">
      <Text className="text-text-secondary text-sm">{label}</Text>
      <Text className="font-semibold text-sm" style={{ color: color ?? "#FFFFFF" }}>
        {value}
      </Text>
    </View>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} className="h-1 rounded-full flex-1"
          style={{ backgroundColor: i <= current ? "#00D4AA" : "#2A2A2A" }} />
      ))}
    </View>
  );
}
