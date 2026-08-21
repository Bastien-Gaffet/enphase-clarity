import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../theme/useTheme";

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  const { colors, type, space } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md, marginTop: space.sm }}>
      {items.map((item) => (
        <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
          <Text style={[type.caption, { color: colors.textSecondary }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
