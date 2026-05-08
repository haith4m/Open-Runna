import React, { useState } from "react";
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "./_layout";
import { Button } from "../../components/ui/Button";

const DAYS = [
  { id: "monday",    short: "Mon" },
  { id: "tuesday",   short: "Tue" },
  { id: "wednesday", short: "Wed" },
  { id: "thursday",  short: "Thu" },
  { id: "friday",    short: "Fri" },
  { id: "saturday",  short: "Sat" },
  { id: "sunday",    short: "Sun" },
];

const LONG_RUN_DAYS = [
  { id: "saturday", label: "Saturday" },
  { id: "sunday",   label: "Sunday" },
  { id: "friday",   label: "Friday" },
];

export default function ScheduleScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const [selectedDays, setSelectedDays] = useState<string[]>(
    data.availableTrainingDays ?? ["tuesday", "thursday", "saturday", "sunday"]
  );
  const [longRunDay, setLongRunDay] = useState(data.preferredLongRunDay ?? "sunday");

  function toggleDay(dayId: string) {
    setSelectedDays((prev) =>
      prev.includes(dayId)
        ? prev.length <= 3 ? prev  // minimum 3 days
          : prev.filter((d) => d !== dayId)
        : [...prev, dayId]
    );
  }

  function handleNext() {
    update({
      availableTrainingDays: selectedDays,
      preferredLongRunDay: longRunDay,
    });
    router.push("/(onboarding)/06-summary");
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-16 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <ProgressDots current={4} total={6} />

        <Text className="text-white text-3xl font-bold mt-8 mb-2">
          When can you train?
        </Text>
        <Text className="text-text-secondary text-base mb-8 leading-relaxed">
          Pick at least 3 days. Your plan will only schedule runs on these days.
        </Text>

        {/* Day selector */}
        <Text className="text-text-secondary text-sm mb-3 uppercase tracking-wide">
          Available days ({selectedDays.length} selected)
        </Text>
        <View className="flex-row gap-2 mb-6">
          {DAYS.map((day) => {
            const isSelected = selectedDays.includes(day.id);
            return (
              <TouchableOpacity
                key={day.id}
                onPress={() => toggleDay(day.id)}
                className="flex-1 aspect-square rounded-xl items-center justify-center"
                style={{
                  backgroundColor: isSelected ? "#00D4AA22" : "#141414",
                  borderWidth: 2,
                  borderColor: isSelected ? "#00D4AA" : "transparent",
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: isSelected ? "#00D4AA" : "#A0A0A0" }}
                >
                  {day.short}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Long run day */}
        <Text className="text-text-secondary text-sm mb-3 uppercase tracking-wide">
          Preferred long run day
        </Text>
        <View className="flex-row gap-2 mb-4">
          {LONG_RUN_DAYS.map((d) => (
            <TouchableOpacity
              key={d.id}
              onPress={() => setLongRunDay(d.id)}
              className={`flex-1 py-3 rounded-xl items-center border-2 ${
                longRunDay === d.id ? "bg-brand-muted border-brand" : "bg-bg-surface border-transparent"
              }`}
            >
              <Text className={`text-sm font-semibold ${longRunDay === d.id ? "text-brand" : "text-text-secondary"}`}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-text-muted text-xs mb-8 leading-relaxed">
          The long run is the cornerstone of your week. Give yourself the next day off.
        </Text>

        <Button
          label="Continue"
          size="lg"
          disabled={selectedDays.length < 3}
          onPress={handleNext}
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
