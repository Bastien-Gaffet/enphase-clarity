import React from "react";
import { View, ViewProps, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";
import { radius, space } from "../../theme/spacing";

type Level = "base" | "raised" | "overlay" | "ghost";

interface SurfaceProps extends ViewProps {
  level?: Level;
  padded?: boolean;
  /** Vertical rhythm between children. */
  gap?: number;
  style?: ViewStyle | ViewStyle[];
}

const FILLS: Record<Level, string | undefined> = {
  base: colors.base,
  raised: colors.raised,
  overlay: colors.overlay,
  ghost: undefined,
};

/**
 * The one card primitive. `ghost` carries the padding and rhythm without the
 * fill, for blocks that should sit directly on the page — the contrast between
 * filled and ghost blocks is what gives a screen its hierarchy.
 */
export function Surface({
  level = "base",
  padded = true,
  gap,
  style,
  children,
  ...rest
}: SurfaceProps) {
  return (
    <View
      style={[
        {
          backgroundColor: FILLS[level],
          borderRadius: level === "ghost" ? 0 : radius.lg,
          borderWidth: level === "ghost" ? 0 : 1,
          borderColor: colors.line.edge,
          padding: padded ? space.lg : 0,
          gap,
        },
        style as ViewStyle,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
