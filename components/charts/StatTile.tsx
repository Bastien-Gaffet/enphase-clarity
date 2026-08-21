import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../theme/useTheme";

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  color?: string;
  caption?: string;
}

export function StatTile({ label, value, unit, color, caption }: StatTileProps) {
  const { colors, type, space } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
        {color ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} /> : null}
        <Text style={[type.label, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: space.xs }}>
        <Text style={[type.h1, { color: colors.textPrimary, fontVariant: ["tabular-nums"] }]}>{value}</Text>
        {unit ? <Text style={[type.body, { color: colors.textSecondary, marginLeft: 4 }]}>{unit}</Text> : null}
      </View>
      {caption ? (
        <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>{caption}</Text>
      ) : null}
    </View>
  );
}
