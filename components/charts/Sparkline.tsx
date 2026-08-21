import React from "react";
import { View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { useTheme } from "../../theme/useTheme";

export interface SparklineSeries {
  values: number[];
  color: string;
  /** Fill the area under this series (use for one primary series only). */
  filled?: boolean;
}

interface SparklineProps {
  series: SparklineSeries[];
  width?: number;
  height?: number;
}

function buildPath(values: number[], width: number, height: number, max: number): string {
  if (values.length === 0) return "";
  const stepX = width / Math.max(1, values.length - 1);
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - (max > 0 ? (v / max) * height : 0);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function Sparkline({ series, width = 320, height = 96 }: SparklineProps) {
  const { colors } = useTheme();
  const max = Math.max(1e-6, ...series.flatMap((s) => s.values));

  return (
    <View>
      <Svg width={width} height={height}>
        <Line x1={0} y1={height} x2={width} y2={height} stroke={colors.baseline} strokeWidth={1} />
        {series.map((s, idx) => {
          const linePath = buildPath(s.values, width, height, max);
          const areaPath = s.filled ? `${linePath} L${width},${height} L0,${height} Z` : null;
          return (
            <React.Fragment key={idx}>
              {areaPath ? <Path d={areaPath} fill={s.color} opacity={0.1} /> : null}
              <Path d={linePath} stroke={s.color} strokeWidth={2} fill="none" strokeLinejoin="round" />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
