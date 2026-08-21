import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../theme/useTheme";

export interface SplitSegment {
  label: string;
  value: number;
  color: string;
}

/**
 * Part-to-whole across a couple of categories. A stacked bar with direct
 * labels reads this far better than isolated bars, which force the eye to
 * compare two separate baselines.
 */
export function SplitBar({ segments, unit = "" }: { segments: SplitSegment[]; unit?: string }) {
  const { colors, type, space, radius } = useTheme();

  const safe = segments.map((s) => ({ ...s, value: Number.isFinite(s.value) ? Math.max(0, s.value) : 0 }));
  const total = safe.reduce((sum, s) => sum + s.value, 0);

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          height: 14,
          borderRadius: radius.pill,
          overflow: "hidden",
          backgroundColor: colors.hairline,
          gap: 2, // surface gap keeps adjacent fills legible
        }}
      >
        {total > 0
          ? safe.map((s) => (
              <View
                key={s.label}
                style={{ flex: s.value, backgroundColor: s.color, borderRadius: radius.pill }}
              />
            ))
          : null}
      </View>

      <View style={{ gap: space.sm, marginTop: space.md }}>
        {safe.map((s) => (
          <View key={s.label} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
            <Text style={[type.body, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
              {s.label}
            </Text>
            <Text
              style={[type.bodyStrong, { color: colors.textPrimary, fontVariant: ["tabular-nums"] }]}
              numberOfLines={1}
            >
              {s.value.toFixed(1)}
              {unit ? ` ${unit}` : ""}
            </Text>
            <Text
              style={[
                type.caption,
                { color: colors.textMuted, width: 42, textAlign: "right", fontVariant: ["tabular-nums"] },
              ]}
            >
              {total > 0 ? `${Math.round((s.value / total) * 100)}%` : "—"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
