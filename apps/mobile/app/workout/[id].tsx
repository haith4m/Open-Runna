import React from "react";
import {
  View, Text, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workoutsApi, coachApi } from "../../lib/api";
import { formatPace, formatDistance, paceZoneColor, paceZoneLabel } from "../../lib/utils/pace";
import { Button } from "../../components/ui/Button";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: workout, isLoading } = useQuery({
    queryKey: ["workout", id],
    queryFn: () => workoutsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { mutate: skipWorkout } = useMutation({
    mutationFn: () => workoutsApi.updateStatus(id!, "skipped", "user_skip"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-today"] });
      router.back();
    },
  });

  const { mutate: askCoach, data: coachResponse, isPending: askingCoach } = useMutation({
    mutationFn: () =>
      coachApi.chat(`Explain this workout: ${workout?.title}`, "workout_explanation", id!).then((r) => r.data),
  });

  if (isLoading || !workout) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#00D4AA" size="large" />
      </SafeAreaView>
    );
  }

  const zoneColor = paceZoneColor(workout.primaryZone);
  const steps = workout.steps as any[];

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Nav bar */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Text className="text-brand text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-text-muted text-xs uppercase tracking-widest flex-1 text-center">
          {workout.phase} Phase
        </Text>
        <View className="w-16" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pb-4">
          {workout.isKeySession && (
            <View className="bg-brand-muted self-start px-3 py-1 rounded-full mb-3">
              <Text className="text-brand text-xs font-semibold uppercase tracking-wide">Key Session</Text>
            </View>
          )}
          <Text className="text-white text-3xl font-bold">{workout.title}</Text>
          <Text className="text-text-secondary text-base mt-2 leading-relaxed">
            {workout.description}
          </Text>

          {/* Quick stats */}
          <View className="flex-row gap-3 mt-4">
            <StatChip label="Distance" value={formatDistance(workout.totalDistanceMeters)} />
            <StatChip label="Est. Time" value={`~${workout.estimatedDurationMinutes} min`} />
            <StatChip label="Zone" value={paceZoneLabel(workout.primaryZone)} color={zoneColor} />
          </View>
        </View>

        {/* Workout steps */}
        <View className="px-6 mb-6">
          <Text className="text-text-secondary text-xs uppercase tracking-widest mb-3">
            Workout Structure
          </Text>
          <View className="gap-2">
            {steps?.map((step, i) => (
              <StepRow key={i} step={step} index={i} />
            ))}
          </View>
        </View>

        {/* Coach rationale */}
        <View className="mx-6 mb-6 bg-bg-surface rounded-2xl p-4 border-l-4" style={{ borderLeftColor: zoneColor }}>
          <Text className="text-text-muted text-xs uppercase tracking-wide mb-2">
            Why this workout
          </Text>
          <Text className="text-text-secondary text-sm leading-relaxed">
            {workout.coachRationale}
          </Text>
        </View>

        {/* AI Coach response */}
        {coachResponse?.response && (
          <View className="mx-6 mb-6 bg-bg-elevated rounded-2xl p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-6 h-6 rounded-full bg-brand-muted items-center justify-center">
                <Text className="text-brand text-xs font-bold">C</Text>
              </View>
              <Text className="text-brand text-xs font-semibold">Your Coach</Text>
            </View>
            <Text className="text-white text-sm leading-relaxed">{coachResponse.response}</Text>
          </View>
        )}

        {/* Actions */}
        <View className="px-6 pb-8 gap-3">
          {workout.status === "scheduled" && (
            <>
              <Button
                label="Start This Run →"
                size="lg"
                onPress={() => router.push("/run/active")}
              />
              {!coachResponse?.response && (
                <Button
                  label={askingCoach ? "Asking coach…" : "Ask Coach to Explain"}
                  variant="secondary"
                  size="md"
                  loading={askingCoach}
                  onPress={() => askCoach()}
                />
              )}
              <Button
                label="Skip This Workout"
                variant="ghost"
                size="md"
                onPress={() => skipWorkout()}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View className="bg-bg-surface rounded-xl px-3 py-2 items-center">
      <Text className="text-text-muted text-xs uppercase tracking-wide">{label}</Text>
      <Text className="font-semibold text-sm mt-0.5" style={{ color: color ?? "#FFFFFF" }}>
        {value}
      </Text>
    </View>
  );
}

function StepRow({ step, index }: { step: any; index: number }) {
  const isRepeat = step.type === "repeat_set";
  const zoneColor = step.paceZone ? paceZoneColor(step.paceZone) : "#6B7280";

  return (
    <View className="bg-bg-surface rounded-xl p-3">
      <View className="flex-row items-center gap-2">
        <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: zoneColor }} />
        <Text className="text-white text-sm font-medium flex-1">{step.description ?? step.type}</Text>
        {step.paceZone && (
          <Text className="text-xs font-medium" style={{ color: zoneColor }}>
            {paceZoneLabel(step.paceZone)}
          </Text>
        )}
      </View>

      {step.coachingNote && (
        <Text className="text-text-muted text-xs mt-1.5 leading-relaxed ml-3.5">
          {step.coachingNote}
        </Text>
      )}

      {isRepeat && step.repeatSteps && (
        <View className="ml-4 mt-2 gap-1.5">
          <Text className="text-text-muted text-xs mb-1">{step.repeatCount}× repeat:</Text>
          {step.repeatSteps.map((rs: any, ri: number) => (
            <View key={ri} className="flex-row items-center gap-2">
              <View className="w-1 h-1 rounded-full bg-bg-overlay" />
              <Text className="text-text-secondary text-xs flex-1">{rs.description}</Text>
              {rs.paceZone && (
                <Text className="text-xs" style={{ color: paceZoneColor(rs.paceZone) }}>
                  {paceZoneLabel(rs.paceZone)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
