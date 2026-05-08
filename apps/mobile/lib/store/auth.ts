import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "../api";

interface AuthState {
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  email: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.login(email, password);
      await AsyncStorage.multiSet([
        ["accessToken", data.accessToken],
        ["refreshToken", data.refreshToken],
        ["userId", data.user.id],
        ["email", data.user.email],
      ]);
      set({ userId: data.user.id, email: data.user.email, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Login failed", isLoading: false });
      throw err;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.register(email, password);
      await AsyncStorage.multiSet([
        ["accessToken", data.accessToken],
        ["refreshToken", data.refreshToken],
        ["userId", data.user.id],
        ["email", data.user.email],
      ]);
      set({ userId: data.user.id, email: data.user.email, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? "Registration failed", isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {}
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userId", "email"]);
    set({ userId: null, email: null, isAuthenticated: false });
  },

  loadStoredSession: async () => {
    const [userId, email, accessToken] = await AsyncStorage.multiGet([
      "userId", "email", "accessToken"
    ]);
    if (userId[1] && email[1] && accessToken[1]) {
      set({ userId: userId[1], email: email[1], isAuthenticated: true });
    }
  },

  clearError: () => set({ error: null }),
}));
