import React, { useState } from "react";
import {
  View, Text, SafeAreaView, ScrollView,
  TouchableOpacity, Switch, Alert, ActivityIndicator,
  Linking,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/authStore";
import { api } from "../../lib/api";

type ConnectionStatus = {
  connected: boolean;
  since?: string;
};

type ConnectionsMap = {
  strava?: ConnectionStatus;
  garmin?: ConnectionStatus;
  apple_health?: ConnectionStatus;
};

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const [metricUnits, setMetricUnits] = useState(true);

  const { data: connections, isLoading: loadingConnections } = useQuery<{ connections: ConnectionsMap }>({
    queryKey: ["integrations-status"],
    queryFn: () => api.get("/integrations/status").then((r) => r.data),
  });

  const disconnectMutation = useMutation({
    mutationFn: (source: string) => api.delete(`/integrations/${source}/disconnect`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["integrations-status"] }),
  });

  function connectStrava() {
    const url = `${process.env["EXPO_PUBLIC_API_URL"]}/api/v1/integrations/strava/connect`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open Strava connection page")
    );
  }

  function handleLogout() {
    Alert.alert("Log out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => { logout(); router.replace("/(auth)/login"); } },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6 pb-4">
          <Text className="text-white text-2xl font-bold">Settings</Text>
        </View>

        {/* Profile */}
        <SectionHeader label="Account" />
        <View className="mx-6 bg-bg-surface rounded-2xl overflow-hidden mb-4">
          <SettingsRow
            label="Email"
            value={user?.email ?? "—"}
          />
          <SettingsRow
            label="Edit Profile"
            onPress={() => router.push("/settings/edit-profile")}
            chevron
          />
          <SettingsRow
            label="Change Password"
            onPress={() => router.push("/settings/change-password")}
            chevron
          />
        </View>

        {/* Units */}
        <SectionHeader label="Preferences" />
        <View className="mx-6 bg-bg-surface rounded-2xl overflow-hidden mb-4">
          <View className="flex-row items-center justify-between px-4 py-3.5">
            <Text className="text-white text-base">Metric Units (km)</Text>
            <Switch
              value={metricUnits}
              onValueChange={setMetricUnits}
              trackColor={{ false: "#374151", true: "#00D4AA" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Wearable connections */}
        <SectionHeader label="Connected Apps" />
        <View className="mx-6 bg-bg-surface rounded-2xl overflow-hidden mb-4">
          {loadingConnections ? (
            <View className="py-6 items-center">
              <ActivityIndicator color="#00D4AA" />
            </View>
          ) : (
            <>
              <IntegrationRow
                name="Strava"
                iconBg="#FC4C02"
                iconLabel="S"
                connected={connections?.connections?.strava?.connected ?? false}
                since={connections?.connections?.strava?.since}
                onConnect={connectStrava}
                onDisconnect={() =>
                  Alert.alert("Disconnect Strava?", "Future activities won't sync.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Disconnect", style: "destructive", onPress: () => disconnectMutation.mutate("strava") },
                  ])
                }
              />
              <IntegrationRow
                name="Garmin Connect"
                iconBg="#009CDE"
                iconLabel="G"
                connected={connections?.connections?.garmin?.connected ?? false}
                since={connections?.connections?.garmin?.since}
                onConnect={() => Alert.alert("Coming Soon", "Garmin Connect integration launching soon.")}
                onDisconnect={() => {}}
              />
              <IntegrationRow
                name="Apple Health"
                iconBg="#FF3A30"
                iconLabel="♥"
                connected={connections?.connections?.apple_health?.connected ?? false}
                since={connections?.connections?.apple_health?.since}
                onConnect={() => Alert.alert("Apple Health", "Enable sync in your iPhone Health app under Sources.")}
                onDisconnect={() => {}}
                last
              />
            </>
          )}
        </View>

        {/* Danger zone */}
        <SectionHeader label="Account" />
        <View className="mx-6 mb-10">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-bg-surface rounded-2xl py-4 items-center"
          >
            <Text className="text-red-400 text-base font-semibold">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <Text className="text-text-muted text-xs uppercase tracking-widest px-6 pb-2">
      {label}
    </Text>
  );
}

function SettingsRow({
  label, value, onPress, chevron,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
}) {
  const inner = (
    <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-bg-overlay">
      <Text className="text-white text-base">{label}</Text>
      <View className="flex-row items-center gap-2">
        {value && <Text className="text-text-secondary text-sm">{value}</Text>}
        {chevron && <Text className="text-text-muted">›</Text>}
      </View>
    </View>
  );
  return onPress ? (
    <TouchableOpacity onPress={onPress}>{inner}</TouchableOpacity>
  ) : (
    <View>{inner}</View>
  );
}

function IntegrationRow({
  name, iconBg, iconLabel, connected, since, onConnect, onDisconnect, last,
}: {
  name: string;
  iconBg: string;
  iconLabel: string;
  connected: boolean;
  since?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-center px-4 py-3.5 ${!last ? "border-b border-bg-overlay" : ""}`}>
      <View
        className="w-9 h-9 rounded-lg items-center justify-center mr-3"
        style={{ backgroundColor: iconBg }}
      >
        <Text className="text-white font-bold text-base">{iconLabel}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white text-base">{name}</Text>
        {connected && since ? (
          <Text className="text-text-muted text-xs">
            Connected {new Date(since).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        ) : (
          <Text className="text-text-muted text-xs">Not connected</Text>
        )}
      </View>
      {connected ? (
        <TouchableOpacity
          onPress={onDisconnect}
          className="bg-bg-overlay rounded-xl px-3 py-1.5"
        >
          <Text className="text-red-400 text-sm font-medium">Disconnect</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onConnect}
          className="bg-brand rounded-xl px-3 py-1.5"
        >
          <Text className="text-bg text-sm font-bold">Connect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
