import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../theme/useTheme";

interface PillProps {
  label: string;
  tone?: "good" | "warning" | "critical" | "neutral";
}

export function Pill({ label, tone = "neutral" }: PillProps) {
  const { colors, type, space, radius } = useTheme();
  const toneColor =
    tone === "good"
      ? colors.status.good
      : tone === "warning"
      ? colors.status.warning
      : tone === "critical"
      ? colors.status.critical
      : colors.textMuted;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: space.xs,
        paddingVertical: 6,
        paddingHorizontal: space.md,
        borderRadius: radius.pill,
        backgroundColor: colors.surfaceRaised,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: toneColor }} />
      <Text style={[type.label, { color: colors.textPrimary }]}>{label}</Text>
    </View>
  );
}
