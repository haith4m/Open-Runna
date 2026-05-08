import React from "react";
import {
  View, Text, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { workoutsApi, analyticsApi } from "../../lib/api";
import { WorkoutCard } from "../../components/workout/WorkoutCard";
import { formatPace } from "../../lib/utils/pace";
import { useAuthStore } from "../../lib/store/auth";

export default function HomeScreen() {
  const router = useRouter();
  const { email } = useAuthStore();

  const { data: todayData, isLoading: todayLoading, refetch } = useQuery({
    queryKey: ["workout-today"],
    queryFn: () => workoutsApi.getToday().then((r) => r.data),
  });

  const { data: upcomingData } = useQuery({
    queryKey: ["workouts-upcoming"],
    queryFn: () => workoutsApi.getUpcoming(5).then((r) => r.data),
  });

  const { data: consistencyData } = useQuery({
    queryKey: ["consistency"],
    queryFn: () => analyticsApi.consistency().then((r) => r.data),
  });

  const greeting = getGreeting();
  const firstName = email?.split("@")[0] ?? "Athlete";

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={todayLoading} onRefresh={refetch} tintColor="#00D4AA" />
        }
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-text-muted text-sm uppercase tracking-widest">{greeting}</Text>
          <Text className="text-white text-2xl font-bold mt-1 capitalize">{firstName}</Text>
        </View>

        {/* Consistency strip */}
        {consistencyData?.overallScore != null && (
          <View className="mx-6 mb-4 bg-bg-surface rounded-2xl p-4">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-text-muted text-xs uppercase tracking-wide">Consistency</Text>
                <Text className="text-white text-2xl font-bold mt-0.5">
                  {consistencyData.overallScore}%
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-text-muted text-xs uppercase tracking-wide">Key Sessions</Text>
                <Text className="text-brand text-2xl font-bold mt-0.5">
                  {consistencyData.keySessionScore ?? "--"}%
                </Text>
              </View>
              <View className="w-16 h-16">
                <ConsistencyRing value={(consistencyData.overallScore ?? 0) / 100} />
              </View>
            </View>
          </View>
        )}

        {/* Today's workout */}
        <View className="px-6 mb-6">
          <Text className="text-text-secondary text-sm uppercase tracking-widest mb-3">
            Today
          </Text>

          {todayLoading ? (
            <View className="bg-bg-surface rounded-2xl p-8 items-center">
              <ActivityIndicator color="#00D4AA" />
            </View>
          ) : todayData?.workout ? (
            <>
              <WorkoutCard workout={todayData.workout} />
              {todayData.workout.status === "scheduled" && (
                <TouchableOpacity
                  onPress={() => router.push("/run/active")}
                  className="mt-3 bg-brand rounded-2xl py-4 items-center"
                  activeOpacity={0.85}
                >
                  <Text className="text-bg text-base font-bold">Start Today's Run →</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View className="bg-bg-surface rounded-2xl p-6 items-center">
              <Text className="text-3xl mb-3">○</Text>
              <Text className="text-white font-semibold text-base">Rest Day</Text>
              <Text className="text-text-secondary text-sm mt-1 text-center">
                Recovery is training. Take it easy today.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/run/active")}
                className="mt-4 bg-bg-elevated rounded-xl px-5 py-3"
              >
                <Text className="text-text-secondary text-sm">Run anyway (optional)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Upcoming workouts */}
        {upcomingData && upcomingData.length > 0 && (
          <View className="px-6 mb-8">
            <Text className="text-text-secondary text-sm uppercase tracking-widest mb-3">
              Coming Up
            </Text>
            <View className="gap-3">
              {upcomingData.slice(1, 4).map((w: any) => (
                <WorkoutCard key={w.id} workout={w} compact />
              ))}
            </View>
          </View>
        )}

        {/* Quick actions */}
        <View className="px-6 mb-8">
          <Text className="text-text-secondary text-sm uppercase tracking-widest mb-3">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <QuickAction
              icon="△"
              label="Ask Coach"
              onPress={() => router.push("/(tabs)/coach")}
            />
            <QuickAction
              icon="◆"
              label="View Stats"
              onPress={() => router.push("/(tabs)/analytics")}
            />
            <QuickAction
              icon="◎"
              label="Full Plan"
              onPress={() => router.push("/(tabs)/plan")}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 bg-bg-surface rounded-2xl p-4 items-center gap-2"
      activeOpacity={0.8}
    >
      <Text className="text-brand text-2xl">{icon}</Text>
      <Text className="text-text-secondary text-xs font-medium">{label}</Text>
    </TouchableOpacity>
  );
}

function ConsistencyRing({ value }: { value: number }) {
  // Simple circular progress indicator using border
  const color = value >= 0.8 ? "#00D4AA" : value >= 0.6 ? "#FBBF24" : "#FF6B6B";
  return (
    <View className="w-16 h-16 rounded-full items-center justify-center"
      style={{ borderWidth: 4, borderColor: color }}>
      <Text className="text-white text-sm font-bold">{Math.round(value * 100)}%</Text>
    </View>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
