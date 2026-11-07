import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Txt } from "../core/Txt";
import { colors } from "../../theme/colors";
import { radius, space } from "../../theme/spacing";

/** Ring meter with the figure in the middle. */
export function Dial({
  progress,
  size = 132,
  stroke = 11,
  color,
  value,
  label,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color: string;
  value: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  // A non-finite progress would make strokeDashoffset NaN and the ring vanish.
  const clamped = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line.hairline} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Txt variant="title" tabular>
        {value}
      </Txt>
      {label ? (
        <Txt variant="overline" tone="muted" style={{ marginTop: 2 }}>
          {label.toUpperCase()}
        </Txt>
      ) : null}
    </View>
  );
}

export interface Segment {
  label: string;
  value: number;
  color: string;
}

/**
 * Part-to-whole with direct labels. Two isolated bars force the eye to compare
 * separate baselines; a single stacked bar does not.
 */
export function SplitMeter({ segments, unit = "" }: { segments: Segment[]; unit?: string }) {
  const safe = segments.map((s) => ({
    ...s,
    value: Number.isFinite(s.value) ? Math.max(0, s.value) : 0,
  }));
  const total = safe.reduce((sum, s) => sum + s.value, 0);

  return (
    <View style={{ gap: space.md }}>
      <View
        style={{
          flexDirection: "row",
          height: 12,
          borderRadius: radius.pill,
          overflow: "hidden",
          backgroundColor: colors.sunken,
          gap: 2,
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

      <View style={{ gap: space.sm }}>
        {safe.map((s) => (
          <View key={s.label} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
            <Txt variant="body" tone="secondary" numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
              {s.label}
            </Txt>
            <Txt variant="bodyStrong" tabular numberOfLines={1}>
              {s.value.toFixed(s.value >= 100 ? 0 : 1)}
              {unit ? ` ${unit}` : ""}
            </Txt>
            <Txt variant="caption" tone="faint" tabular style={{ width: 40, textAlign: "right" }}>
              {total > 0 ? `${Math.round((s.value / total) * 100)}%` : "—"}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Thin progress track for the payback bar. */
export function Meter({ progress, color }: { progress: number; color: string }) {
  const clamped = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  return (
    <View
      style={{
        height: 10,
        borderRadius: radius.pill,
        backgroundColor: colors.sunken,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.line.hairline,
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

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
      {items.map((item) => (
        <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: item.color }} />
          <Txt variant="caption" tone="muted">
            {item.label}
          </Txt>
        </View>
      ))}
    </View>
  );
}
