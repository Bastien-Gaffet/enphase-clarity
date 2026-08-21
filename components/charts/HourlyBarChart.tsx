import React from "react";
import { View } from "react-native";
import Svg, { Line, Rect } from "react-native-svg";
import { useTheme } from "../../theme/useTheme";

export interface HourlyBar {
  hour: number;
  value: number;
  color: string;
  highlighted?: boolean;
}

interface HourlyBarChartProps {
  data: HourlyBar[];
  width?: number;
  height?: number;
  barGap?: number;
}

export function HourlyBarChart({ data, width = 320, height = 120, barGap = 2 }: HourlyBarChartProps) {
  const { colors } = useTheme();
  const max = Math.max(1e-6, ...data.map((d) => d.value));
  const barWidth = width / data.length - barGap;

  return (
    <View>
      <Svg width={width} height={height + 4}>
        <Line x1={0} y1={height} x2={width} y2={height} stroke={colors.baseline} strokeWidth={1} />
        {data.map((d, i) => {
          const barHeight = Math.max(2, (d.value / max) * height);
          const x = i * (barWidth + barGap);
          const y = height - barHeight;
          return (
            <Rect
              key={d.hour}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={3}
              fill={d.color}
              opacity={d.highlighted ? 1 : 0.32}
              stroke={d.highlighted ? d.color : "none"}
              strokeWidth={d.highlighted ? 1 : 0}
            />
          );
        })}
      </Svg>
    </View>
  );
}
