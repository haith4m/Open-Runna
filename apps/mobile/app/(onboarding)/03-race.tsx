import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "./_layout";
import { Button } from "../../components/ui/Button";

export default function RaceScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const [raceName, setRaceName] = useState(data.raceName ?? "");
  const [raceDate, setRaceDate] = useState(data.raceDate ?? "");
  const [goalType, setGoalType] = useState<"finish" | "time" | "pr">(data.goalType ?? "finish");

  function handleNext() {
    if (!raceDate) return;
    update({ raceName, raceDate, goalType });
    router.push("/(onboarding)/04-fitness");
  }

  // Calculate minimum weeks from today
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 28); // at least 4 weeks out

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-16 pb-12"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ProgressDots current={2} total={6} />

        <Text className="text-white text-3xl font-bold mt-8 mb-2">
          Tell me about your race
        </Text>
        <Text className="text-text-secondary text-base mb-8">
          When is it, and what do you want to achieve?
        </Text>

        {/* Race name (optional) */}
        <View className="mb-5">
          <Text className="text-text-secondary text-sm mb-2 uppercase tracking-wide">
            Race Name <Text className="text-text-muted">(optional)</Text>
          </Text>
          <TextInput
            value={raceName}
            onChangeText={setRaceName}
            placeholder="e.g. London Marathon 2026"
            placeholderTextColor="#606060"
            className="bg-bg-surface text-white rounded-2xl px-4 py-4 text-base"
          />
        </View>

        {/* Race date */}
        <View className="mb-5">
          <Text className="text-text-secondary text-sm mb-2 uppercase tracking-wide">
            Race Date
          </Text>
          <TextInput
            value={raceDate}
            onChangeText={setRaceDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#606060"
            className="bg-bg-surface text-white rounded-2xl px-4 py-4 text-base font-mono"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          {raceDate && isValidDate(raceDate) && (
            <Text className="text-brand text-sm mt-2">
              {getWeeksUntil(raceDate)} weeks until race day
            </Text>
          )}
        </View>

        {/* Goal type */}
        <View className="mb-8">
          <Text className="text-text-secondary text-sm mb-3 uppercase tracking-wide">
            What's your goal?
          </Text>
          <View className="flex-row gap-2">
            {(["finish", "pr", "time"] as const).map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGoalType(g)}
                className={`flex-1 py-3 rounded-xl items-center border-2 ${
                  goalType === g ? "bg-brand-muted border-brand" : "bg-bg-surface border-transparent"
                }`}
              >
                <Text className={`text-sm font-semibold ${goalType === g ? "text-brand" : "text-text-secondary"}`}>
                  {g === "finish" ? "Finish It" : g === "pr" ? "New PR" : "Target Time"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          label="Continue"
          size="lg"
          disabled={!raceDate || !isValidDate(raceDate)}
          onPress={handleNext}
        />

        <TouchableOpacity onPress={() => router.back()} className="mt-4 items-center">
          <Text className="text-text-secondary text-sm">← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function isValidDate(str: string): boolean {
  const d = new Date(str);
  return !isNaN(d.getTime()) && str.length === 10;
}

function getWeeksUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.round(diff / (7 * 24 * 60 * 60 * 1000));
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
