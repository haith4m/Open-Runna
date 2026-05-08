import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "./_layout";

const DISTANCES = [
  { id: "5k",            label: "5K",          icon: "⚡", desc: "Great first goal or speed work" },
  { id: "10k",           label: "10K",          icon: "◎", desc: "The sweet spot of speed and endurance" },
  { id: "half_marathon", label: "Half Marathon", icon: "◆", desc: "21.1 km — the smart runner's marathon" },
  { id: "marathon",      label: "Marathon",     icon: "★", desc: "42.2 km — the defining distance" },
  { id: "50k",           label: "50K Ultra",    icon: "▲", desc: "First step into ultramarathon" },
  { id: "100k",          label: "100K Ultra",   icon: "◉", desc: "For the committed long hauler" },
];

export default function GoalScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  function select(distance: string) {
    update({ targetDistance: distance });
    router.push("/(onboarding)/03-race");
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-16 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <ProgressDots current={1} total={6} />

        <Text className="text-white text-3xl font-bold mt-8 mb-2">
          What are you training for?
        </Text>
        <Text className="text-text-secondary text-base mb-8 leading-relaxed">
          Choose your target race distance. You can always update this later.
        </Text>

        <View className="gap-3">
          {DISTANCES.map((d) => {
            const isSelected = data.targetDistance === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                onPress={() => select(d.id)}
                activeOpacity={0.8}
                className={`rounded-2xl p-4 border-2 flex-row items-center gap-4 ${
                  isSelected ? "bg-brand-muted border-brand" : "bg-bg-surface border-transparent"
                }`}
              >
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center"
                  style={{ backgroundColor: isSelected ? "#00D4AA22" : "#1E1E1E" }}
                >
                  <Text className="text-2xl">{d.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className={`text-lg font-semibold ${isSelected ? "text-brand" : "text-white"}`}>
                    {d.label}
                  </Text>
                  <Text className="text-text-secondary text-sm mt-0.5">{d.desc}</Text>
                </View>
                {isSelected && <Text className="text-brand text-lg">✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 items-center"
        >
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
