import React from "react";
import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/useTheme";

function TabIcon(name: React.ComponentProps<typeof Ionicons>["name"]) {
  return ({ color }: { color: string }) => <Ionicons name={name} size={20} color={color} />;
}

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.highlight,
        tabBarInactiveTintColor: colors.textMuted,
        // Icon (20) + label (~13) + gap must clear the navigator's own 5px item
        // padding; too little height here clips the labels off the bottom.
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.hairline,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 10),
          height: 66 + insets.bottom,
        },
        tabBarItemStyle: { paddingHorizontal: 0 },
        // Five tabs on a 360dp screen leave ~72dp each: the labels have to be
        // short enough to fit without the ellipsis truncation they had before.
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 1,
          includeFontPadding: false,
        },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Tableau de bord", tabBarLabel: "Accueil", tabBarIcon: TabIcon("flash") }}
      />
      <Tabs.Screen
        name="economies"
        options={{ title: "Économies", tabBarLabel: "Gains", tabBarIcon: TabIcon("wallet") }}
      />
      <Tabs.Screen
        name="charge"
        options={{ title: "Charge du véhicule", tabBarLabel: "Charge", tabBarIcon: TabIcon("car-sport") }}
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
