import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";
import type { EnphaseCredentials } from "../lib/enphase/types";

const KEY = "enphase-clarity-credentials";

/**
 * SecureStore has no web implementation (no Keychain/Keystore in a browser),
 * so the web target falls back to AsyncStorage. Each method is wrapped in an
 * arrow rather than passed by reference — a detached reference loses `this`
 * and throws at call time on native.
 */
const secureStorage = {
  getItem: (key: string) =>
    Platform.OS === "web" ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    Platform.OS === "web" ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
  removeItem: (key: string) =>
    Platform.OS === "web" ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key),
};

interface CredentialsState {
  credentials: EnphaseCredentials | null;
  /** True once a load attempt has finished — success or failure. Never gates rendering. */
  loaded: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (creds: EnphaseCredentials) => Promise<void>;
  clear: () => Promise<void>;
}

export const useCredentialsStore = create<CredentialsState>((set) => ({
  credentials: null,
  loaded: false,
  error: null,

  load: async () => {
    // Must always land on loaded: true — a stored-credentials failure is never
    // a reason to leave the app in a pre-load state.
    try {
      const raw = await secureStorage.getItem(KEY);
      set({ credentials: raw ? JSON.parse(raw) : null, loaded: true, error: null });
    } catch (err) {
      set({
        credentials: null,
        loaded: true,
        error: err instanceof Error ? err.message : "Lecture des identifiants impossible.",
      });
    }
  },

  save: async (credentials) => {
    await secureStorage.setItem(KEY, JSON.stringify(credentials));
    set({ credentials, error: null });
  },

  clear: async () => {
    await secureStorage.removeItem(KEY);
    set({ credentials: null, error: null });
  },
}));
