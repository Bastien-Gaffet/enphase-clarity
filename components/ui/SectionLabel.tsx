import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../theme/useTheme";

export function SectionLabel({ children, right }: { children: string; right?: React.ReactNode }) {
  const { colors, type, space } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: space.sm,
        marginBottom: space.sm,
      }}
    >
      <Text style={[type.label, { color: colors.textMuted, flexShrink: 1 }]} numberOfLines={2}>
        {children.toUpperCase()}
      </Text>
      {right}
    </View>
  );
}
