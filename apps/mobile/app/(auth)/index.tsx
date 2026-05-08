import React from "react";
import { View, Text, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../../components/ui/Button";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <LinearGradient
        colors={["#0A0A0A", "#0D1F1A", "#0A0A0A"]}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-20 pb-12 justify-between">
          {/* Header */}
          <View className="items-center">
            {/* Logo mark */}
            <View className="w-20 h-20 rounded-3xl bg-brand items-center justify-center mb-8">
              <Text className="text-bg text-4xl font-bold">R</Text>
            </View>

            <Text className="text-white text-4xl font-bold tracking-tight text-center">
              Open Runna
            </Text>
            <Text className="text-text-secondary text-lg mt-3 text-center leading-relaxed">
              Train like a professional.{"\n"}
              Guided by real sports science.
            </Text>
          </View>

          {/* Feature highlights */}
          <View className="gap-4">
            {[
              { icon: "◈", text: "Adaptive plans built around your life" },
              { icon: "◎", text: "Real coaching logic, not generic schedules" },
              { icon: "△", text: "AI coach powered by exercise physiology" },
            ].map((f) => (
              <View key={f.text} className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-xl bg-brand-muted items-center justify-center">
                  <Text className="text-brand text-lg">{f.icon}</Text>
                </View>
                <Text className="text-text-secondary text-base flex-1">{f.text}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <View className="gap-3">
            <Button
              label="Get Started"
              size="lg"
              onPress={() => router.push("/(auth)/register")}
            />
            <Button
              label="I already have an account"
              variant="ghost"
              size="md"
              onPress={() => router.push("/(auth)/login")}
            />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
