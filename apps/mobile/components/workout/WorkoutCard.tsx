import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { formatDistance, formatDuration, paceZoneColor, paceZoneLabel } from "../../lib/utils/pace";

interface WorkoutCardProps {
  workout: {
    id: string;
    title: string;
    description: string;
    type: string;
    primaryZone: string;
    totalDistanceMeters: number;
    estimatedDurationMinutes: number;
    intensityScore: number;
    isKeySession: boolean;
    status: string;
    scheduledDate: string;
  };
  compact?: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  easy: "○",
  recovery: "·",
  long_run: "◎",
  tempo: "◈",
  cruise_intervals: "◇",
  intervals: "△",
  repetitions: "▲",
  hill_repeats: "▲",
  marathon_pace: "◆",
  progression: "►",
  fartlek: "⬟",
};

export function WorkoutCard({ workout, compact = false }: WorkoutCardProps) {
  const router = useRouter();
  const zoneColor = paceZoneColor(workout.primaryZone);
  const isComplete = workout.status === "completed";
  const isSkipped = workout.status === "skipped" || workout.status === "missed";

  return (
    <TouchableOpacity
      onPress={() => router.push(`/workout/${workout.id}`)}
      activeOpacity={0.85}
      className={`bg-bg-surface rounded-2xl p-4 ${isComplete ? "opacity-60" : ""}`}
    >
      {/* Zone accent bar */}
      <View
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: zoneColor }}
      />

      <View className="pl-2">
        {/* Header row */}
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            {workout.isKeySession && (
              <View className="bg-brand-muted px-2 py-0.5 rounded-full">
                <Text className="text-brand text-xs font-semibold">KEY</Text>
              </View>
            )}
            <Text className="text-text-primary font-semibold text-base flex-1" numberOfLines={1}>
              {TYPE_ICONS[workout.type] ?? "○"} {workout.title}
            </Text>
          </View>

          {/* Status badge */}
          {isComplete && (
            <View className="bg-brand-muted px-2 py-0.5 rounded-full">
              <Text className="text-brand text-xs">Done ✓</Text>
            </View>
          )}
          {isSkipped && (
            <View className="bg-bg-overlay px-2 py-0.5 rounded-full">
              <Text className="text-text-muted text-xs">Skipped</Text>
            </View>
          )}
        </View>

        {!compact && (
          <Text className="text-text-secondary text-sm mt-1" numberOfLines={2}>
            {workout.description}
          </Text>
        )}

        {/* Metrics row */}
        <View className="flex-row items-center gap-4 mt-3">
          <MetricChip
            label="Distance"
            value={formatDistance(workout.totalDistanceMeters)}
          />
          <MetricChip
            label="Time"
            value={`~${workout.estimatedDurationMinutes} min`}
          />
          <MetricChip
            label="Zone"
            value={paceZoneLabel(workout.primaryZone)}
            color={zoneColor}
          />
        </View>

        {/* Intensity dots */}
        <View className="flex-row items-center gap-1 mt-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <View
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor:
                  i < workout.intensityScore ? zoneColor : "#2A2A2A",
              }}
            />
          ))}
          <Text className="text-text-muted text-xs ml-1">
            {workout.intensityScore}/10
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MetricChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View className="items-center">
      <Text className="text-text-muted text-xs uppercase tracking-wide">{label}</Text>
      <Text
        className="text-sm font-semibold mt-0.5"
        style={{ color: color ?? "#FFFFFF" }}
      >
        {value}
      </Text>
    </View>
  );
}
