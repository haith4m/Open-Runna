import React, { useState } from "react";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "./_layout";
import { Button } from "../../components/ui/Button";

const WEEKLY_KM_OPTIONS = [
  { label: "< 20 km", value: 15 },
  { label: "20–40 km", value: 30 },
  { label: "40–60 km", value: 50 },
  { label: "60–80 km", value: 70 },
  { label: "80–100 km", value: 90 },
  { label: "> 100 km", value: 115 },
];

const EASY_PACE_OPTIONS = [
  { label: "9:00+/km", subtitle: "Walking/jogging pace", value: 540 },
  { label: "8:00/km",  subtitle: "Comfortable jog",      value: 480 },
  { label: "7:00/km",  subtitle: "Easy running",         value: 420 },
  { label: "6:00/km",  subtitle: "Moderate easy",        value: 360 },
  { label: "5:30/km",  subtitle: "Solid easy pace",      value: 330 },
  { label: "5:00/km",  subtitle: "Fast easy pace",       value: 300 },
  { label: "< 5:00/km",subtitle: "Elite easy running",   value: 270 },
];

export default function FitnessScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [weeklyKm, setWeeklyKm] = useState(data.weeklyMileageKm ?? null);
  const [easyPace, setEasyPace] = useState(data.easyPaceSeconds ?? null);

  function handleNext() {
    if (!weeklyKm || !easyPace) return;
    update({
      weeklyMileageKm: weeklyKm,
      longestRecentRunKm: Math.round(weeklyKm * 0.30),
      easyPaceSeconds: easyPace,
    });
    router.push("/(onboarding)/05-schedule");
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-16 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <ProgressDots current={3} total={6} />

        <Text className="text-white text-3xl font-bold mt-8 mb-2">
          Your current fitness
        </Text>
        <Text className="text-text-secondary text-base mb-8 leading-relaxed">
          Be realistic — overestimating leads to injury. Underestimating leads to a plan that adapts up quickly anyway.
        </Text>

        {/* Weekly mileage */}
        <Text className="text-text-secondary text-sm mb-3 uppercase tracking-wide">
          Current weekly mileage
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {WEEKLY_KM_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setWeeklyKm(opt.value)}
              className={`px-4 py-3 rounded-xl border-2 ${
                weeklyKm === opt.value
                  ? "bg-brand-muted border-brand"
                  : "bg-bg-surface border-transparent"
              }`}
            >
              <Text className={`text-sm font-semibold ${weeklyKm === opt.value ? "text-brand" : "text-white"}`}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Easy pace */}
        <Text className="text-text-secondary text-sm mb-1 uppercase tracking-wide">
          Your comfortable easy pace
        </Text>
        <Text className="text-text-muted text-sm mb-3">
          The pace you'd naturally run an easy conversational run
        </Text>
        <View className="gap-2">
          {EASY_PACE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setEasyPace(opt.value)}
              className={`p-4 rounded-xl border-2 flex-row items-center justify-between ${
                easyPace === opt.value
                  ? "bg-brand-muted border-brand"
                  : "bg-bg-surface border-transparent"
              }`}
            >
              <Text className={`text-base font-semibold font-mono ${easyPace === opt.value ? "text-brand" : "text-white"}`}>
                {opt.label}
              </Text>
              <Text className="text-text-secondary text-sm">{opt.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label="Continue"
          size="lg"
          disabled={!weeklyKm || !easyPace}
          onPress={handleNext}
          className="mt-8"
        />
        <TouchableOpacity onPress={() => router.back()} className="mt-4 items-center">
          <Text className="text-text-secondary text-sm">← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
