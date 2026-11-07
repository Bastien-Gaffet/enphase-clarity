import React from "react";
import { View } from "react-native";
import { Txt } from "./Txt";
import { useTheme } from "../../theme/useTheme";

/**
 * The focal block of a screen: one oversized figure, its unit, and a line of
 * context. Sits on the page without card chrome so it outweighs everything
 * below it.
 */
export function Hero({
  value,
  unit,
  label,
  caption,
  valueColor,
  children,
}: {
  value: string;
  unit?: string;
  label: string;
  caption?: string;
  valueColor?: string;
  /** Rendered under the caption — a chart or chip row. */
  children?: React.ReactNode;
}) {
  const { colors, space } = useTheme();

  return (
    <View style={{ gap: space.sm }}>
      <Txt variant="overline" tone="muted">
        {label.toUpperCase()}
      </Txt>

      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        <Txt
          variant="hero"
          tabular
          color={valueColor ?? colors.ink.primary}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          style={{ flexShrink: 1 }}
        >
          {value}
        </Txt>
        {unit ? (
          <Txt variant="title" tone="muted" style={{ fontWeight: "600" }}>
            {unit}
          </Txt>
        ) : null}
      </View>

      {caption ? (
        <Txt variant="body" tone="secondary">
          {caption}
        </Txt>
      ) : null}

      {children}
    </View>
  );
}
