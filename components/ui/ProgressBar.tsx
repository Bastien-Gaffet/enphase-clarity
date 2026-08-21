import React from "react";
import { View } from "react-native";
import { useTheme } from "../../theme/useTheme";

export function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const { colors, radius } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={{
        height: 10,
        borderRadius: radius.pill,
        backgroundColor: colors.hairline,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: "100%",
          borderRadius: radius.pill,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
