import React from "react";
import { View } from "react-native";
import { Txt } from "./Txt";
import { type as typeScale } from "../../theme/typography";
import { splitFigure } from "../../lib/format/figure";

/**
 * A number set the way an instrument sets one: the whole part at full size,
 * the decimals smaller behind it.
 *
 * Two reasons, and the first is a defect. SpaceMono is fixed-width by
 * construction, so the decimal point takes a full advance like any digit —
 * at 52 px that is a 30 px hole, and "0.70" reads as "0 . 70". Negative
 * letter-spacing closes the gaps between digits too, so it cannot fix the
 * separator alone. Shrinking the fractional run shrinks its separator with it.
 *
 * The second is hierarchy: the cents of a daily saving are noise next to the
 * euros, and at equal size they compete for the same attention.
 */
const FRACTION_SCALE = 0.62;

export function Figure({
  value,
  variant,
  color,
  unit,
  unitVariant = "title",
}: {
  value: string;
  variant: "hero" | "display";
  color?: string;
  unit?: string;
  unitVariant?: "title" | "body";
}) {
  const [whole, fraction] = splitFigure(value);
  const base = typeScale[variant];
  const size = base.fontSize as number;
  const lineHeight = base.lineHeight as number;
  const spacing = (base.letterSpacing as number) ?? 0;

  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: variant === "hero" ? 6 : 3 }}>
      <Txt
        variant={variant}
        tabular
        color={color}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
        style={{ flexShrink: 1 }}
      >
        {whole}
      </Txt>
      {fraction ? (
        <Txt
          variant={variant}
          tabular
          color={color}
          numberOfLines={1}
          style={{
            fontSize: Math.round(size * FRACTION_SCALE),
            lineHeight: Math.round(lineHeight * FRACTION_SCALE),
            letterSpacing: spacing * FRACTION_SCALE,
            // Negative margin closes the gap the row's own baseline spacing
            // would otherwise add between a number and its own decimals.
            marginLeft: variant === "hero" ? -8 : -5,
          }}
        >
          {fraction}
        </Txt>
      ) : null}
      {unit ? (
        <Txt
          variant={unitVariant}
          tone="muted"
          numberOfLines={1}
          style={unitVariant === "title" ? { fontWeight: "600" } : undefined}
        >
          {unit}
        </Txt>
      ) : null}
    </View>
  );
}
