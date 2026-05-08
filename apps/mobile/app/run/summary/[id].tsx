import React from "react";
import {
  View, Text, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { runsApi } from "../../../lib/api";
import { formatPace, formatDistance, formatDuration, paceZoneColor } from "../../../lib/utils/pace";

export default function RunSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: run, isLoading } = useQuery({
    queryKey: ["run", id],
    queryFn: () => runsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading || !run) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#00D4AA" size="large" />
      </SafeAreaView>
    );
  }

  const pace = run.averagePaceSecPerKm;
  const splits: any[] = run.splits ?? [];

  const complianceColor =
    !run.complianceScore ? "#A0A0A0"
    : run.complianceScore >= 0.9 ? "#34D399"
    : run.complianceScore >= 0.7 ? "#FBBF24"
    : "#FF6B6B";

  const feelingEmojis: Record<string, string> = {
    terrible: "😰", hard: "😤", ok: "😐", good: "😊", great: "🔥",
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <TouchableOpacity onPress={() => router.replace("/(tabs)")} className="self-start mb-4">
            <Text className="text-brand text-base">← Home</Text>
          </TouchableOpacity>
          <Text className="text-text-muted text-xs uppercase tracking-widest mb-1">Run Complete</Text>
          <Text className="text-white text-3xl font-bold">
            {formatDistance(run.totalDistanceMeters)}
          </Text>
          <Text className="text-text-secondary text-sm mt-1">
            {new Date(run.startedAt).toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </Text>
        </View>

        {/* Primary metrics */}
        <View className="px-6 mb-4">
          <View className="bg-bg-surface rounded-2xl p-5">
            <View className="flex-row gap-4">
              <BigMetric
                label="Distance"
                value={formatDistance(run.totalDistanceMeters)}
              />
              <BigMetric
                label="Time"
                value={formatDuration(run.durationSeconds)}
              />
              <BigMetric
                label="Avg Pace"
                value={pace ? formatPace(pace) : "--:--"}
                unit="/km"
              />
            </View>

            {/* Compliance bar */}
            {run.complianceScore != null && (
              <View className="mt-4 pt-4 border-t border-bg-overlay">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-text-muted text-xs uppercase tracking-wide">
                    Plan Compliance
                  </Text>
                  <Text className="font-semibold text-sm" style={{ color: complianceColor }}>
                    {Math.round(run.complianceScore * 100)}%
                  </Text>
                </View>
                <View className="h-1.5 bg-bg-overlay rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(run.complianceScore * 100)}%`,
                      backgroundColor: complianceColor,
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Secondary metrics */}
        <View className="px-6 mb-4">
          <View className="flex-row gap-3">
            {run.trainingLoad > 0 && (
              <MetricCard label="Training Load" value={run.trainingLoad.toFixed(0)} sub="TSS" color="#60A5FA" />
            )}
            {run.averageHeartRate && (
              <MetricCard label="Avg HR" value={`${run.averageHeartRate}`} sub="bpm" color="#FF6B6B" />
            )}
            {run.elevationGainMeters && run.elevationGainMeters > 0 && (
              <MetricCard label="Elevation" value={`${Math.round(run.elevationGainMeters)}m`} sub="gain" color="#FBBF24" />
            )}
            {run.averageCadenceSpm && (
              <MetricCard label="Cadence" value={`${run.averageCadenceSpm}`} sub="spm" color="#A78BFA" />
            )}
          </View>
        </View>

        {/* Splits table */}
        {splits.length > 0 && (
          <View className="mx-6 mb-4 bg-bg-surface rounded-2xl p-4">
            <Text className="text-white font-semibold mb-3">Splits</Text>
            <View className="gap-1">
              {/* Header */}
              <View className="flex-row pb-2 border-b border-bg-overlay">
                <Text className="text-text-muted text-xs w-10">#</Text>
                <Text className="text-text-muted text-xs flex-1">Pace</Text>
                <Text className="text-text-muted text-xs w-16 text-right">Time</Text>
              </View>
              {splits.map((split: any, i: number) => {
                // Colour-code against average pace
                const deviation = pace ? split.paceSecPerKm - pace : 0;
                const colour =
                  Math.abs(deviation) < 15 ? "#FFFFFF"
                  : deviation > 0 ? "#FF6B6B"   // slower
                  : "#34D399";                   // faster
                return (
                  <View key={i} className="flex-row items-center py-1.5">
                    <Text className="text-text-muted text-sm w-10">{i + 1}</Text>
                    <Text className="text-sm font-mono font-semibold flex-1" style={{ color: colour }}>
                      {formatPace(split.paceSecPerKm)}/km
                    </Text>
                    <Text className="text-text-secondary text-sm w-16 text-right font-mono">
                      {formatDuration(split.durationSeconds)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Feeling + notes */}
        {run.feelingRating && (
          <View className="mx-6 mb-4 bg-bg-surface rounded-2xl p-4 flex-row items-center gap-3">
            <Text className="text-3xl">{feelingEmojis[run.feelingRating] ?? "😐"}</Text>
            <View>
              <Text className="text-text-muted text-xs uppercase tracking-wide">How it felt</Text>
              <Text className="text-white font-semibold capitalize mt-0.5">{run.feelingRating}</Text>
            </View>
            {run.perceivedEffort && (
              <View className="ml-auto items-end">
                <Text className="text-text-muted text-xs uppercase tracking-wide">RPE</Text>
                <Text className="text-white font-semibold text-lg">{run.perceivedEffort}/10</Text>
              </View>
            )}
          </View>
        )}

        {run.postRunNotes && (
          <View className="mx-6 mb-4 bg-bg-surface rounded-2xl p-4">
            <Text className="text-text-muted text-xs uppercase tracking-wide mb-2">Notes</Text>
            <Text className="text-white text-sm leading-relaxed">{run.postRunNotes}</Text>
          </View>
        )}

        {/* Actions */}
        <View className="px-6 pb-10 gap-3">
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            className="bg-brand rounded-2xl py-4 items-center"
          >
            <Text className="text-bg text-base font-bold">Back to Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/coach")}
            className="bg-bg-surface rounded-2xl py-4 items-center"
          >
            <Text className="text-text-secondary text-base">Discuss with Coach</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BigMetric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-text-muted text-xs uppercase tracking-wide">{label}</Text>
      <View className="flex-row items-end mt-1">
        <Text className="text-white text-xl font-bold font-mono">{value}</Text>
        {unit && <Text className="text-text-muted text-xs mb-0.5 ml-0.5">{unit}</Text>}
      </View>
    </View>
  );
}

function MetricCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: string;
}) {
  return (
    <View className="flex-1 bg-bg-surface rounded-2xl p-3 items-center">
      <Text className="text-text-muted text-xs uppercase tracking-wide">{label}</Text>
      <Text className="font-bold text-lg font-mono mt-1" style={{ color }}>{value}</Text>
      <Text className="text-text-muted text-xs">{sub}</Text>
    </View>
  );
}
