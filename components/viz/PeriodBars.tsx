import React from "react";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import { useTheme } from "../../theme/useTheme";

export interface Bar {
  label: string;
  value: number;
}

/**
 * Bars for a period's buckets. Labels thin out automatically rather than
 * overlapping: a month of days cannot show 31 legible captions at phone width.
 */
export function PeriodBars({
  data,
  width,
  height = 130,
  color,
}: {
  data: Bar[];
  width: number;
  height?: number;
  color: string;
}) {
  const { colors } = useTheme();
  if (data.length === 0) return null;

  const AXIS = 16;
  const plotH = height - AXIS;
  const values = data.map((d) => (Number.isFinite(d.value) ? d.value : 0));
  const max = Math.max(1e-6, ...values);
  const gap = data.length > 40 ? 1 : 2;
  const barW = Math.max(1, width / data.length - gap);

  // Aim for at most ~7 captions, on round indices.
  const step = Math.max(1, Math.ceil(data.length / 7));

  return (
    <Svg width={width} height={height}>
      {data.map((d, i) => {
        const value = values[i];
        const barH = Math.max(2, (value / max) * plotH);
        const x = i * (barW + gap);
        return (
          <Rect
            key={`${d.label}-${i}`}
            x={x}
            y={plotH - barH}
            width={barW}
            height={barH}
            rx={Math.min(3, barW / 2)}
            fill={color}
            opacity={value > 0 ? 1 : 0.25}
          />
        );
      })}

      <Line x1={0} y1={plotH} x2={width} y2={plotH} stroke={colors.line.strong} strokeWidth={1} />

      {data.map((d, i) =>
        d.label && i % step === 0 ? (
          <SvgText
            key={`label-${i}`}
            x={i * (barW + gap) + barW / 2}
            y={height - 3}
            fill={colors.ink.faint}
            fontSize={9.5}
            textAnchor="middle"
          >
            {d.label}
          </SvgText>
        ) : null
      )}
    </Svg>
  );
}
