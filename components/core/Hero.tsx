import React from "react";
import { View } from "react-native";
import { Txt } from "./Txt";
import { Figure } from "./Figure";
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

      <Figure variant="hero" value={value} unit={unit} color={valueColor ?? colors.ink.primary} />

      {caption ? (
        <Txt variant="body" tone="secondary">
          {caption}
        </Txt>
      ) : null}

      {children}
    </View>
  );
}
