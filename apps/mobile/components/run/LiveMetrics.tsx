import React from "react";
import { View, Text } from "react-native";
import { formatPace, formatDistance, formatDuration } from "../../lib/utils/pace";
import { useRunStore } from "../../lib/store/run";

export function LiveMetrics() {
  const { liveState } = useRunStore();

  const paceColor = !liveState.isOnPace
    ? liveState.paceDeviation > 0
      ? "#FF6B6B"  // too slow
      : "#34D399"  // too fast
    : "#FFFFFF";

  return (
    <View className="flex-1 bg-bg">
      {/* Primary pace — huge, dominant */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-text-muted text-sm uppercase tracking-widest mb-2">
          Current Pace
        </Text>
        <Text
          className="text-8xl font-bold font-mono"
          style={{ color: paceColor }}
        >
          {formatPace(liveState.currentPaceSecPerKm)}
        </Text>
        <Text className="text-text-secondary text-xl mt-1">/km</Text>

        {/* Pace deviation hint */}
        {Math.abs(liveState.paceDeviation) > 10 && (
          <View className="mt-3 px-4 py-1.5 rounded-full"
            style={{ backgroundColor: paceColor + "22" }}>
            <Text className="text-sm font-medium" style={{ color: paceColor }}>
              {liveState.paceDeviation > 0 ? "Too slow" : "Too fast"} by{" "}
              {Math.abs(liveState.paceDeviation)}s
            </Text>
          </View>
        )}
      </View>

      {/* Secondary metrics row */}
      <View className="flex-row px-6 pb-6 gap-4">
        <MetricBox
          label="Distance"
          value={formatDistance(liveState.distanceMeters)}
        />
        <MetricBox
          label="Time"
          value={formatDuration(liveState.movingSeconds)}
        />
        <MetricBox
          label="Avg Pace"
          value={formatPace(liveState.averagePaceSecPerKm)}
        />
      </View>

      {/* Optional HR + cadence */}
      {(liveState.currentHeartRate || liveState.currentCadenceSpm) && (
        <View className="flex-row px-6 pb-8 gap-4">
          {liveState.currentHeartRate && (
            <MetricBox
              label="Heart Rate"
              value={`${liveState.currentHeartRate} bpm`}
              color="#FF6B6B"
            />
          )}
          {liveState.currentCadenceSpm && (
            <MetricBox
              label="Cadence"
              value={`${liveState.currentCadenceSpm} spm`}
              color="#60A5FA"
            />
          )}
          <MetricBox
            label="Lap"
            value={`${liveState.lapCount}`}
          />
        </View>
      )}
    </View>
  );
}

function MetricBox({
  label,
  value,
  color = "#FFFFFF",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View className="flex-1 bg-bg-surface rounded-2xl p-3 items-center">
      <Text className="text-text-muted text-xs uppercase tracking-wide">{label}</Text>
      <Text className="font-mono font-semibold text-lg mt-1" style={{ color }}>
        {value}
      </Text>
    </View>
  );
}
