import React from "react";
import { Text as RNText, TextProps, TextStyle } from "react-native";
import { useTheme } from "../../theme/useTheme";
import { type as typeScale, TypeToken } from "../../theme/typography";

type Tone =
  | "primary"
  | "secondary"
  | "muted"
  | "faint"
  | "accent"
  | "highlight"
  | "good"
  | "warning"
  | "critical";

interface TxtProps extends TextProps {
  variant?: TypeToken;
  tone?: Tone;
  /** Lock digits to equal width — for anything that updates live or sits in a column. */
  tabular?: boolean;
  color?: string;
  align?: TextStyle["textAlign"];
}

/**
 * Every piece of text goes through here so the scale and the ink tones stay
 * the only sources of size and colour.
 */
export function Txt({
  variant = "body",
  tone = "primary",
  tabular,
  color,
  align,
  style,
  ...rest
}: TxtProps) {
  const { colors } = useTheme();

  // Resolved per render, not at module load: a frozen map would keep whichever
  // scheme happened to be active when the file was first imported.
  const tones: Record<Tone, string> = {
    primary: colors.ink.primary,
    secondary: colors.ink.secondary,
    muted: colors.ink.muted,
    faint: colors.ink.faint,
    accent: colors.brand.accent,
    highlight: colors.brand.highlight,
    good: colors.status.good,
    warning: colors.status.warning,
    critical: colors.status.critical,
  };

  return (
    <RNText
      style={[
        typeScale[variant],
        { color: color ?? tones[tone] },
        tabular ? typeScale.tabular : null,
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}
