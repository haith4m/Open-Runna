import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, SafeAreaView, TouchableOpacity, Alert,
  StatusBar,
} from "react-native";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { runsApi, workoutsApi } from "../../lib/api";
import { LiveMetrics } from "../../components/run/LiveMetrics";
import { useRunStore } from "../../lib/store/run";
import { formatDuration } from "../../lib/utils/pace";

const GPS_UPDATE_INTERVAL_MS = 2000;
const API_SYNC_INTERVAL_MS  = 15000;

export default function ActiveRunScreen() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const { liveState, updateLiveState, setActiveRunId, activeRunId, resetRun } = useRunStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const lastSyncMetrics = useRef({ distance: 0, duration: 0 });

  const [isPaused, setIsPaused] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [lapStartDistance, setLapStartDistance] = useState(0);

  const { mutateAsync: startRun } = useMutation({
    mutationFn: runsApi.start,
  });

  const { mutateAsync: syncLive } = useMutation({
    mutationFn: ({ runId, data }: { runId: string; data: any }) =>
      runsApi.updateLive(runId, data),
  });

  const { mutateAsync: finishRun } = useMutation({
    mutationFn: ({ runId, data }: { runId: string; data: any }) =>
      runsApi.finish(runId, data),
  });

  // ─── Start run on mount ──────────────────────────────────────────────────
  useEffect(() => {
    initRun();
    return () => cleanup();
  }, []);

  async function initRun() {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Location Required",
        "Open Runna needs location access to track your run.",
        [{ text: "OK", onPress: () => router.back() }]
      );
      return;
    }

    // Start the server-side run record
    let pos = undefined;
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      pos = { startLatitude: loc.coords.latitude, startLongitude: loc.coords.longitude };
      setHasLocation(true);
    } catch {}

    const { data } = await startRun({ workoutId, ...pos });
    setActiveRunId(data.runId);
    startTimeRef.current = new Date();

    updateLiveState({ status: "running" });

    // Start GPS subscription
    locationSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,   // update every 5m
        timeInterval: GPS_UPDATE_INTERVAL_MS,
      },
      (location) => onLocationUpdate(location)
    );

    // Wall clock timer
    timerRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = Math.round((Date.now() - startTimeRef.current.getTime()) / 1000);
      updateLiveState({ elapsedSeconds: elapsed });
    }, 1000);

    // API sync
    syncRef.current = setInterval(() => syncToServer(), API_SYNC_INTERVAL_MS);
  }

  const distanceRef = useRef(0);
  const movingSecsRef = useRef(0);
  const prevLocRef = useRef<{ lat: number; lng: number; ts: number } | null>(null);

  function onLocationUpdate(location: Location.LocationObject) {
    const { latitude, longitude, speed } = location.coords;
    const now = location.timestamp;

    if (prevLocRef.current) {
      const dMeters = haversineDistance(
        prevLocRef.current.lat, prevLocRef.current.lng,
        latitude, longitude
      );
      const dtSecs = (now - prevLocRef.current.ts) / 1000;

      // Only count if moving (>0.5 m/s = ~30min/km)
      if (speed != null ? speed > 0.3 : dMeters / dtSecs > 0.5) {
        distanceRef.current += dMeters;
        movingSecsRef.current += dtSecs;
      }

      const instantPace = speed && speed > 0.3
        ? 1000 / (speed * 60)   // sec/km
        : liveState.currentPaceSecPerKm;

      const avgPace = movingSecsRef.current > 0
        ? (movingSecsRef.current / 60) / (distanceRef.current / 1000)
        : 0;

      // Lap detection (every 1000m)
      if (distanceRef.current >= lapStartDistance + 1000) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLapStartDistance((prev) => prev + 1000);
        updateLiveState((state: any) => ({ lapCount: (state.lapCount ?? 1) + 1, currentLapDistanceMeters: 0 }));
      }

      updateLiveState({
        distanceMeters: distanceRef.current,
        movingSeconds: movingSecsRef.current,
        currentPaceSecPerKm: instantPace,
        averagePaceSecPerKm: avgPace * 60,
        currentLapDistanceMeters: distanceRef.current - lapStartDistance,
      });
    }

    prevLocRef.current = { lat: latitude, lng: longitude, ts: now };
  }

  async function syncToServer() {
    if (!activeRunId) return;
    const metrics = {
      totalDistanceMeters: distanceRef.current,
      durationSeconds: movingSecsRef.current,
      averagePaceSecPerKm: liveState.averagePaceSecPerKm,
    };
    if (
      Math.abs(metrics.totalDistanceMeters - lastSyncMetrics.current.distance) < 50 &&
      Math.abs(metrics.durationSeconds - lastSyncMetrics.current.duration) < 15
    ) {
      return; // No significant change, skip sync
    }
    lastSyncMetrics.current = { distance: metrics.totalDistanceMeters, duration: metrics.durationSeconds };
    await syncLive({ runId: activeRunId, data: metrics }).catch(() => {});
  }

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (syncRef.current) clearInterval(syncRef.current);
    locationSub.current?.remove();
  }

  function handlePauseResume() {
    setIsPaused((p) => !p);
    if (!isPaused) {
      startTimeRef.current = null;
      updateLiveState({ status: "paused" });
    } else {
      startTimeRef.current = new Date(Date.now() - liveState.elapsedSeconds * 1000);
      updateLiveState({ status: "running" });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleFinish() {
    Alert.alert("Finish Run?", `You've run ${(distanceRef.current / 1000).toFixed(2)} km`, [
      { text: "Keep Going", style: "cancel" },
      {
        text: "Finish", style: "destructive",
        onPress: async () => {
          cleanup();
          if (!activeRunId) { resetRun(); router.back(); return; }

          await finishRun({
            runId: activeRunId,
            data: {
              totalDistanceMeters: distanceRef.current,
              durationSeconds: movingSecsRef.current,
              elapsedSeconds: liveState.elapsedSeconds,
              averagePaceSecPerKm: liveState.averagePaceSecPerKm,
            },
          });

          resetRun();
          router.replace("/(tabs)");
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <StatusBar hidden />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-6 py-3">
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          <Text className="text-brand text-sm font-semibold">
            {isPaused ? "PAUSED" : "RECORDING"}
          </Text>
        </View>
        <Text className="text-white text-xl font-bold font-mono">
          {formatDuration(liveState.elapsedSeconds)}
        </Text>
      </View>

      {/* Main metrics */}
      <LiveMetrics />

      {/* Control buttons */}
      <View className="px-6 pb-8 flex-row gap-4 items-center justify-center">
        <TouchableOpacity
          onPress={handlePauseResume}
          className="w-16 h-16 rounded-full bg-bg-elevated items-center justify-center"
        >
          <Text className="text-white text-2xl">{isPaused ? "▶" : "⏸"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleFinish}
          className="flex-1 h-16 rounded-2xl bg-brand items-center justify-center"
          activeOpacity={0.85}
        >
          <Text className="text-bg text-base font-bold">Finish Run</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Haversine formula for GPS distance
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
