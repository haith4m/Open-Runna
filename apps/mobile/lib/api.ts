import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:3000/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → refresh token flow
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await AsyncStorage.setItem("accessToken", data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
        // Navigation to login is handled by the auth store
      }
    }
    return Promise.reject(error);
  }
);

// ─── API Functions ────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (email: string, password: string) =>
    api.post("/auth/register", { email, password }),
  logout: (refreshToken: string) =>
    api.post("/auth/logout", { refreshToken }),
};

export const profileApi = {
  get: () => api.get("/profile"),
  update: (data: Record<string, unknown>) => api.put("/profile", data),
  recalculateVdot: () => api.post("/profile/recalculate-vdot"),
  logInjury: (data: Record<string, unknown>) => api.post("/profile/injuries", data),
};

export const plansApi = {
  generate: (data: Record<string, unknown>) => api.post("/plans/generate", data),
  getActive: () => api.get("/plans/active"),
  getCurrentWeek: () => api.get("/plans/active/current-week"),
  list: () => api.get("/plans"),
  adapt: (planId: string, data: Record<string, unknown>) =>
    api.post(`/plans/${planId}/adapt`, data),
};

export const workoutsApi = {
  getToday: () => api.get("/workouts/today"),
  getUpcoming: (days?: number) => api.get("/workouts/upcoming", { params: { days } }),
  get: (workoutId: string) => api.get(`/workouts/${workoutId}`),
  updateStatus: (workoutId: string, status: string, reason?: string) =>
    api.patch(`/workouts/${workoutId}/status`, { status, skippedReason: reason }),
};

export const runsApi = {
  start: (data?: Record<string, unknown>) => api.post("/runs/start", data),
  updateLive: (runId: string, data: Record<string, unknown>) =>
    api.patch(`/runs/${runId}/live`, data),
  finish: (runId: string, data: Record<string, unknown>) =>
    api.post(`/runs/${runId}/finish`, data),
  list: (limit?: number, offset?: number) =>
    api.get("/runs", { params: { limit, offset } }),
  get: (runId: string) => api.get(`/runs/${runId}`),
};

export const coachApi = {
  chat: (message: string, contextType?: string, workoutId?: string) =>
    api.post("/coach/chat", { message, contextType, workoutId }),
  getWeekSummary: () => api.get("/coach/week-summary"),
  getHistory: (limit?: number) => api.get("/coach/history", { params: { limit } }),
};

export const analyticsApi = {
  weeklyMileage: (weeks?: number) =>
    api.get("/analytics/weekly-mileage", { params: { weeks } }),
  paceProgression: (days?: number) =>
    api.get("/analytics/pace-progression", { params: { days } }),
  fitnessTrend: () => api.get("/analytics/fitness-trend"),
  racePredictions: () => api.get("/analytics/race-predictions"),
  trainingLoad: (days?: number) =>
    api.get("/analytics/training-load", { params: { days } }),
  consistency: () => api.get("/analytics/consistency"),
};
