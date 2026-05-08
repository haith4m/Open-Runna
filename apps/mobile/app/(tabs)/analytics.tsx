import React, { useState } from "react";
import {
  View, Text, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../../lib/api";
import { formatPace, formatTime, distanceLabel } from "../../lib/utils/pace";

export default function AnalyticsScreen() {
  const [mileagePeriod, setMileagePeriod] = useState(12);

  const { data: weeklyData, isLoading: mileageLoading } = useQuery({
    queryKey: ["weekly-mileage", mileagePeriod],
    queryFn: () => analyticsApi.weeklyMileage(mileagePeriod).then((r) => r.data),
  });

  const { data: predictions } = useQuery({
    queryKey: ["race-predictions"],
    queryFn: () => analyticsApi.racePredictions().then((r) => r.data),
  });

  const { data: loadData } = useQuery({
    queryKey: ["training-load"],
    queryFn: () => analyticsApi.trainingLoad(60).then((r) => r.data),
  });

  const { data: consistency } = useQuery({
    queryKey: ["consistency"],
    queryFn: () => analyticsApi.consistency().then((r) => r.data),
  });

  const { data: fitness } = useQuery({
    queryKey: ["fitness-trend"],
    queryFn: () => analyticsApi.fitnessTrend().then((r) => r.data),
  });

  const weeks = weeklyData?.weeks ?? [];
  const maxKm = weeks.length > 0 ? Math.max(...weeks.map((w: any) => w.actualKm ?? 0), 1) : 1;
  const recentTsb = loadData?.timeline?.slice(-1)[0]?.tsb ?? null;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6 pb-4">
          <Text className="text-white text-2xl font-bold">Stats</Text>
          <Text className="text-text-secondary text-sm mt-1">
            Your training at a glance
          </Text>
        </View>

        {/* Key stats row */}
        <View className="px-6 flex-row gap-3 mb-6">
          <StatCard
            label="Consistency"
            value={consistency?.overallScore != null ? `${consistency.overallScore}%` : "--"}
            sub="of planned sessions"
            color="#00D4AA"
          />
          <StatCard
            label="Current VDOT"
            value={fitness?.currentVdot ? fitness.currentVdot.toFixed(1) : "--"}
            sub="fitness score"
            color="#60A5FA"
          />
          <StatCard
            label="Form (TSB)"
            value={recentTsb != null ? recentTsb.toFixed(0) : "--"}
            sub={recentTsb == null ? "" : recentTsb > 5 ? "Fresh" : recentTsb < -20 ? "Fatigued" : "Normal"}
            color={recentTsb == null ? "#A0A0A0" : recentTsb > 5 ? "#34D399" : recentTsb < -20 ? "#FF6B6B" : "#FBBF24"}
          />
        </View>

        {/* Weekly mileage chart */}
        <View className="mx-6 mb-6 bg-bg-surface rounded-2xl p-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white font-semibold">Weekly Mileage</Text>
            <View className="flex-row gap-2">
              {[8, 12, 24].map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setMileagePeriod(p)}
                  className={`px-3 py-1 rounded-full ${mileagePeriod === p ? "bg-brand-muted" : "bg-bg-overlay"}`}
                >
                  <Text className={`text-xs ${mileagePeriod === p ? "text-brand" : "text-text-muted"}`}>
                    {p}w
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {mileageLoading ? (
            <ActivityIndicator color="#00D4AA" />
          ) : (
            <View>
              {/* Bar chart */}
              <View className="flex-row items-end gap-1 h-32">
                {weeks.slice(-mileagePeriod).map((w: any, i: number) => {
                  const height = maxKm > 0 ? Math.max(4, (w.actualKm / maxKm) * 120) : 4;
                  const plannedHeight = w.plannedKm
                    ? Math.max(2, (w.plannedKm / maxKm) * 120)
                    : 0;
                  return (
                    <View key={i} className="flex-1 items-center justify-end gap-0.5">
                      {/* Planned bar (behind) */}
                      {plannedHeight > 0 && (
                        <View
                          className="absolute bottom-0 w-full rounded-sm opacity-30"
                          style={{ height: plannedHeight, backgroundColor: "#00D4AA" }}
                        />
                      )}
                      {/* Actual bar */}
                      <View
                        className="w-full rounded-sm"
                        style={{ height, backgroundColor: "#00D4AA" }}
                      />
                    </View>
                  );
                })}
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-text-muted text-xs">
                  {weeks.length > 0 ? weeks[0]?.week?.split("-W")[1] : ""}w
                </Text>
                <Text className="text-text-muted text-xs">Now</Text>
              </View>
              {weeks.length > 0 && (
                <Text className="text-text-secondary text-sm mt-2">
                  Avg:{" "}
                  <Text className="text-white font-semibold">
                    {(weeks.reduce((s: number, w: any) => s + (w.actualKm ?? 0), 0) / weeks.length).toFixed(0)} km/week
                  </Text>
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Race predictions */}
        {predictions?.predictions && predictions.predictions.length > 0 && (
          <View className="mx-6 mb-6 bg-bg-surface rounded-2xl p-4">
            <Text className="text-white font-semibold mb-4">Race Predictions</Text>
            <Text className="text-text-muted text-xs mb-3">
              Based on VDOT {predictions.vdot?.toFixed(1)} · Updates as you train
            </Text>
            <View className="gap-2">
              {predictions.predictions.map((p: any) => (
                <View key={p.distance} className="flex-row items-center justify-between py-2 border-b border-bg-overlay">
                  <Text className="text-text-secondary text-sm">
                    {distanceLabel(p.distance)}
                  </Text>
                  <Text className="text-white font-semibold font-mono">
                    {formatTime(p.predictedSeconds)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Training load (CTL/ATL/TSB) */}
        {loadData?.timeline && (
          <View className="mx-6 mb-8 bg-bg-surface rounded-2xl p-4">
            <Text className="text-white font-semibold mb-1">Training Load</Text>
            <Text className="text-text-muted text-xs mb-4">
              Fitness (CTL) · Fatigue (ATL) · Form (TSB)
            </Text>
            <SimpleLoadChart timeline={loadData.timeline.slice(-42)} />
            <View className="flex-row gap-4 mt-3">
              <LegendDot color="#00D4AA" label="Fitness" />
              <LegendDot color="#FF6B6B" label="Fatigue" />
              <LegendDot color="#60A5FA" label="Form" />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: string;
}) {
  return (
    <View className="flex-1 bg-bg-surface rounded-2xl p-3">
      <Text className="text-text-muted text-xs uppercase tracking-wide">{label}</Text>
      <Text className="text-xl font-bold mt-1 font-mono" style={{ color }}>
        {value}
      </Text>
      <Text className="text-text-muted text-xs mt-0.5">{sub}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-text-muted text-xs">{label}</Text>
    </View>
  );
}

function SimpleLoadChart({ timeline }: { timeline: any[] }) {
  if (!timeline || timeline.length === 0) return null;

  const maxVal = Math.max(
    ...timeline.map((d) => Math.max(d.ctl, d.atl, Math.abs(d.tsb))),
    1
  );
  const chartHeight = 60;

  return (
    <View style={{ height: chartHeight + 16 }}>
      <View className="flex-row items-end" style={{ height: chartHeight }}>
        {timeline.map((d, i) => (
          <View key={i} className="flex-1 items-center justify-end flex-row gap-0.5">
            <View
              style={{
                width: 2,
                height: Math.max(1, (d.ctl / maxVal) * chartHeight),
                backgroundColor: "#00D4AA",
                opacity: 0.8,
              }}
            />
            <View
              style={{
                width: 2,
                height: Math.max(1, (d.atl / maxVal) * chartHeight),
                backgroundColor: "#FF6B6B",
                opacity: 0.6,
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
