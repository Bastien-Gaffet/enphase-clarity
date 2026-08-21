import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { tokens } from "@/theme/colors";
import { useCredentialsStore } from "@/store/useCredentialsStore";
import { useEnergyPolling } from "@/hooks/useEnergyPolling";
import { useHistorySync } from "@/hooks/useHistorySync";

export {
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadCredentials = useCredentialsStore((s) => s.load);
  const credentialsLoaded = useCredentialsStore((s) => s.loaded);

  useEffect(() => {
    loadCredentials().finally(() => SplashScreen.hideAsync());
  }, [loadCredentials]);

  if (!credentialsLoaded) return null;
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme() === "light" ? "light" : "dark";
  const colors = tokens(colorScheme);
  useEnergyPolling(10000);
  useHistorySync();

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
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
