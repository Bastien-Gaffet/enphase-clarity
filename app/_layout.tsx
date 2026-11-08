import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useTheme } from "@/theme/useTheme";
import { useCredentialsStore } from "@/store/useCredentialsStore";
import { useAppFonts } from "@/hooks/useAppFonts";
import { useEnergyPolling } from "@/hooks/useEnergyPolling";
import { useHistorySync } from "@/hooks/useHistorySync";
import { AppErrorBoundary } from "@/components/core/AppErrorBoundary";

export const ErrorBoundary = AppErrorBoundary;

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const loadCredentials = useCredentialsStore((s) => s.load);
  const fontsReady = useAppFonts();

  // Credentials load in the background: the app opens in demo mode and never
  // waits on stored credentials to render — a storage failure must not be able
  // to leave the user on a blank screen.
  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  // Fonts are the one thing worth holding the splash for: rendering before
  // they arrive shows empty boxes where every icon should be. `fontsReady`
  // also turns true on failure, so this can never hang.
  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady]);

  if (!fontsReady) return null;
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { colors, scheme } = useTheme();
  useEnergyPolling(10000);
  useHistorySync();

  return (
    <>
      {/* Status bar glyphs must contrast with the page, so they invert too. */}
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.page },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
