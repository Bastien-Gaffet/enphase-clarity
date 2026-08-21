import React from "react";
import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/theme/useTheme";

function TabIcon(name: React.ComponentProps<typeof Ionicons>["name"]) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.highlight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.hairline,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Tableau de bord", tabBarLabel: "Accueil", tabBarIcon: TabIcon("flash") }}
      />
      <Tabs.Screen
        name="economies"
        options={{ title: "Économies", tabBarIcon: TabIcon("wallet") }}
      />
      <Tabs.Screen
        name="charge"
        options={{ title: "Charge VE", tabBarIcon: TabIcon("car-sport") }}
      />
      <Tabs.Screen
        name="simulation"
        options={{ title: "Simulation", tabBarIcon: TabIcon("options") }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Réglages", tabBarIcon: TabIcon("settings") }}
      />
    </Tabs>
  );
}
