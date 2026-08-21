import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";
import type { EnphaseCredentials } from "../lib/enphase/types";

const KEY = "enphase-clarity-credentials";

// SecureStore has no web implementation (no Keychain/Keystore in a browser);
// fall back to AsyncStorage there so the web target doesn't crash on load.
const secureStorage = {
  getItem: Platform.OS === "web" ? AsyncStorage.getItem : SecureStore.getItemAsync,
  setItem: Platform.OS === "web" ? AsyncStorage.setItem : SecureStore.setItemAsync,
  removeItem: Platform.OS === "web" ? AsyncStorage.removeItem : SecureStore.deleteItemAsync,
};

interface CredentialsState {
  credentials: EnphaseCredentials | null;
  loaded: boolean;
  load: () => Promise<void>;
  save: (creds: EnphaseCredentials) => Promise<void>;
  clear: () => Promise<void>;
}

export const useCredentialsStore = create<CredentialsState>((set) => ({
  credentials: null,
  loaded: false,
  load: async () => {
    const raw = await secureStorage.getItem(KEY);
    set({ credentials: raw ? JSON.parse(raw) : null, loaded: true });
  },
  save: async (credentials) => {
    await secureStorage.setItem(KEY, JSON.stringify(credentials));
    set({ credentials });
  },
  clear: async () => {
    await secureStorage.removeItem(KEY);
    set({ credentials: null });
  },
}));
