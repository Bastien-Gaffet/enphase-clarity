import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../theme/useTheme";

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors, type, space } = useTheme();
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text style={[type.h1, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? (
        <Text style={[type.body, { color: colors.textSecondary, marginTop: 2 }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
