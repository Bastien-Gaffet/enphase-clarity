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
    // minWidth 0 lets the tile shrink inside a row instead of forcing its
    // sibling off the card edge.
    <View style={{ flex: 1, minWidth: 0 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
        {color ? (
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
        ) : null}
        <Text
          style={[type.label, { color: colors.textMuted, flexShrink: 1, fontSize: 11 }]}
          numberOfLines={2}
        >
          {label.toUpperCase()}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: space.xs }}>
        <Text
          style={[type.h1, { color: colors.textPrimary, fontVariant: ["tabular-nums"], flexShrink: 1 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {value}
        </Text>
        {unit ? (
          <Text style={[type.body, { color: colors.textSecondary, marginLeft: 3 }]} numberOfLines={1}>
            {unit}
          </Text>
        ) : null}
      </View>

      {caption ? (
        <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}
