import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "./_layout";

const LEVELS = [
  {
    id: "beginner",
    label: "New to Running",
    subtitle: "Running fewer than 3 months, or just getting started",
    details: "Less than 20 km/week",
    icon: "○",
  },
  {
    id: "intermediate",
    label: "Consistent Runner",
    subtitle: "Running regularly for 6+ months with a few races under your belt",
    details: "20–60 km/week",
    icon: "◎",
  },
  {
    id: "advanced",
    label: "Experienced Runner",
    subtitle: "Training seriously, have run multiple races and follow structured plans",
    details: "60+ km/week",
    icon: "◆",
  },
] as const;

export default function ExperienceScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  function select(level: typeof LEVELS[number]["id"]) {
    update({ experienceLevel: level });
    router.push("/(onboarding)/02-goal");
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-16 pb-12"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress dots */}
        <ProgressDots current={0} total={6} />

        <Text className="text-white text-3xl font-bold mt-8 mb-2">
          How long have you been running?
        </Text>
        <Text className="text-text-secondary text-base mb-8 leading-relaxed">
          Be honest — this determines the pace and load of your plan. There's no wrong answer.
        </Text>

        <View className="gap-3">
          {LEVELS.map((level) => {
            const isSelected = data.experienceLevel === level.id;
            return (
              <TouchableOpacity
                key={level.id}
                onPress={() => select(level.id)}
                activeOpacity={0.8}
                className={`rounded-2xl p-5 border-2 ${
                  isSelected
                    ? "bg-brand-muted border-brand"
                    : "bg-bg-surface border-transparent"
                }`}
              >
                <View className="flex-row items-start gap-3">
                  <Text
                    className="text-2xl mt-0.5"
                    style={{ color: isSelected ? "#00D4AA" : "#A0A0A0" }}
                  >
                    {level.icon}
                  </Text>
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-semibold ${
                        isSelected ? "text-brand" : "text-white"
                      }`}
                    >
                      {level.label}
                    </Text>
                    <Text className="text-text-secondary text-sm mt-1 leading-relaxed">
                      {level.subtitle}
                    </Text>
                    <Text className="text-text-muted text-xs mt-2 uppercase tracking-wide">
                      {level.details}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className="h-1 rounded-full"
          style={{
            flex: 1,
            backgroundColor: i <= current ? "#00D4AA" : "#2A2A2A",
          }}
        />
      ))}
    </View>
  );
}
