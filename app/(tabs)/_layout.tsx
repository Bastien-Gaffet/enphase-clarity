import React from "react";
import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import { tabBarHeight } from "@/theme/spacing";

function TabIcon(name: React.ComponentProps<typeof Ionicons>["name"]) {
  return ({ color }: { color: string }) => <Ionicons name={name} size={20} color={color} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.highlight,
        tabBarInactiveTintColor: colors.ink.faint,
        // Icon (20) + label (~13) + gaps must clear the navigator's own 5px
        // item padding, or the labels get clipped off the bottom.
        tabBarStyle: {
          backgroundColor: colors.base,
          borderTopColor: colors.line.hairline,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 10),
          height: tabBarHeight + insets.bottom,
        },
        tabBarItemStyle: { paddingHorizontal: 0 },
        // Five tabs on a 360dp screen leave ~72dp each, so the labels stay short.
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: 1 },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Direct", tabBarLabel: "Direct", tabBarIcon: TabIcon("flash") }}
      />
      <Tabs.Screen
        name="economies"
        options={{ title: "Économies", tabBarLabel: "Gains", tabBarIcon: TabIcon("trending-up") }}
      />
      <Tabs.Screen
        name="charge"
        options={{ title: "Charge", tabBarLabel: "Charge", tabBarIcon: TabIcon("car-sport") }}
      />
      <Tabs.Screen
        name="simulation"
        options={{ title: "Simulation", tabBarLabel: "Simuler", tabBarIcon: TabIcon("options") }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Réglages", tabBarLabel: "Réglages", tabBarIcon: TabIcon("settings") }}
      />
    </Tabs>
  );
}
