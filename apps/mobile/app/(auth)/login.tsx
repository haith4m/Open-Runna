import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, SafeAreaView, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../lib/store/auth";
import { Button } from "../../components/ui/Button";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Required", "Please enter your email and password.");
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace("/(tabs)");
    } catch {}
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-8 self-start"
          >
            <Text className="text-brand text-base">← Back</Text>
          </TouchableOpacity>

          <Text className="text-white text-3xl font-bold mb-2">Welcome back</Text>
          <Text className="text-text-secondary text-base mb-8">
            Sign in to continue training
          </Text>

          {error && (
            <View className="bg-accent-muted rounded-xl p-3 mb-4">
              <Text className="text-accent text-sm">{error}</Text>
            </View>
          )}

          <View className="gap-4">
            <View>
              <Text className="text-text-secondary text-sm mb-2 uppercase tracking-wide">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={(t) => { setEmail(t); clearError(); }}
                placeholder="you@example.com"
                placeholderTextColor="#606060"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                className="bg-bg-surface text-white rounded-2xl px-4 py-4 text-base"
              />
            </View>

            <View>
              <Text className="text-text-secondary text-sm mb-2 uppercase tracking-wide">
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={(t) => { setPassword(t); clearError(); }}
                placeholder="••••••••"
                placeholderTextColor="#606060"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                className="bg-bg-surface text-white rounded-2xl px-4 py-4 text-base"
              />
            </View>
          </View>

          <Button
            label="Sign In"
            size="lg"
            loading={isLoading}
            onPress={handleLogin}
            className="mt-6"
          />

          <TouchableOpacity
            onPress={() => router.push("/(auth)/register")}
            className="mt-4 items-center"
          >
            <Text className="text-text-secondary text-base">
              No account?{" "}
              <Text className="text-brand">Create one free</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
