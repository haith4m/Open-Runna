import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../lib/store/auth";
import { useRouter, useSegments } from "expo-router";
import "../global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min
      retry: 1,
    },
  },
});

function AuthGuard() {
  const { isAuthenticated, loadStoredSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadStoredSession();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)");
    } else if (isAuthenticated && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthGuard />
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#0A0A0A" },
            animation: "fade",
          }}
        >
          <Stack.Screen name="(auth)" options={{ animation: "none" }} />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
          <Stack.Screen name="workout/[id]" options={{ presentation: "card", animation: "slide_from_right" }} />
          <Stack.Screen name="run/active" options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
