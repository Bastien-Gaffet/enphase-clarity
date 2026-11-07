import React from "react";
import Svg, { Path, G } from "react-native-svg";
import { useTheme } from "../../theme/useTheme";

interface LogoProps {
  size?: number;
  /** Colour showing through the panel grid and outlining the bolt — set to the surface it sits on. */
  background?: string;
  panelColor?: string;
  boltColor?: string;
}

/**
 * Brand mark: a solar panel in perspective with a lightning bolt striking
 * through it. The grid lines and the bolt outline are painted in the
 * background colour rather than a fixed dark, so the mark stays crisp on any
 * surface it is placed on.
 */
export function Logo({ size = 32, background, panelColor, boltColor }: LogoProps) {
  const { colors } = useTheme();
  const bg = background ?? colors.page;
  const panel = panelColor ?? colors.brand.accent;
  const bolt = boltColor ?? colors.brand.highlight;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <G>
        <Path d="M8 50 L20 34 L56 34 L44 50 Z" fill={panel} />
        <Path d="M16.5 42 L50 42" stroke={bg} strokeWidth={1.8} />
        <Path d="M32 34 L20 50" stroke={bg} strokeWidth={1.8} />
        <Path d="M44 34 L32 50" stroke={bg} strokeWidth={1.8} />
      </G>
      <Path
        d="M36 4 L20 28 L30 28 L28 46 L45 20 L34 20 Z"
        fill={bolt}
        stroke={bg}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
