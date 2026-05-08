import React from "react";
import { View, Text } from "react-native";
import { formatPace } from "../../lib/utils/pace";
import { paceZoneColor, paceZoneLabel } from "../../lib/utils/pace";

interface PaceDisplayProps {
  paceSecPerKm: number;
  zone?: string;
  label?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showUnit?: boolean;
  imperial?: boolean;
}

export function PaceDisplay({
  paceSecPerKm,
  zone,
  label,
  size = "md",
  showUnit = true,
  imperial = false,
}: PaceDisplayProps) {
  const paceStr = formatPace(paceSecPerKm, imperial);
  const unit = imperial ? "/mi" : "/km";
  const color = zone ? paceZoneColor(zone) : "#FFFFFF";

  const textSizes = {
    sm: { pace: "text-xl font-bold", unit: "text-xs", label: "text-xs" },
    md: { pace: "text-3xl font-bold", unit: "text-sm", label: "text-xs" },
    lg: { pace: "text-5xl font-bold", unit: "text-base", label: "text-sm" },
    xl: { pace: "text-7xl font-bold", unit: "text-xl", label: "text-base" },
  };

  const sizes = textSizes[size];

  return (
    <View className="items-center">
      {label && (
        <Text className={`${sizes.label} text-text-muted uppercase tracking-widest mb-1`}>
          {label}
        </Text>
      )}
      <View className="flex-row items-end gap-1">
        <Text className={`${sizes.pace} font-mono`} style={{ color }}>
          {paceStr}
        </Text>
        {showUnit && (
          <Text className={`${sizes.unit} text-text-secondary mb-1`}>
            {unit}
          </Text>
        )}
      </View>
      {zone && (
        <View
          className="px-2 py-0.5 rounded-full mt-1"
          style={{ backgroundColor: `${color}22` }}
        >
          <Text className="text-xs font-medium" style={{ color }}>
            {paceZoneLabel(zone)}
          </Text>
        </View>
      )}
    </View>
  );
}
