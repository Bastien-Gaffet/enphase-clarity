import React from "react";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import { useTheme } from "../../theme/useTheme";

export interface HourCell {
  hour: number;
  value: number;
  color: string;
  /** Part of the recommended plan — drawn at full strength. */
  selected?: boolean;
}

const AXIS = 16;

/**
 * 24 hourly cells, the selected ones at full strength. Replaces the previous
 * bar chart, whose unselected bars sat at 0.32 opacity of a saturated hue and
 * were hard to tell apart from the selected ones.
 */
export function HourStrip({
  data,
  width,
  height = 92,
}: {
  data: HourCell[];
  width: number;
  height?: number;
}) {
  const { colors } = useTheme();
  if (data.length === 0) return null;

  const plotH = height - AXIS;
  const max = Math.max(1e-6, ...data.map((d) => (Number.isFinite(d.value) ? d.value : 0)));
  const gap = 2;
  const cellW = Math.max(1, width / data.length - gap);

  return (
    <Svg width={width} height={height}>
      {data.map((d, i) => {
        const value = Number.isFinite(d.value) ? d.value : 0;
        const barH = Math.max(3, (value / max) * plotH);
        const x = i * (cellW + gap);
        return (
          <React.Fragment key={d.hour}>
            {/* Track behind each bar keeps the 24h grid readable where values are low. */}
            <Rect x={x} y={0} width={cellW} height={plotH} rx={3} fill={colors.sunken} />
            <Rect
              x={x}
              y={plotH - barH}
              width={cellW}
              height={barH}
              rx={3}
              fill={d.color}
              opacity={d.selected ? 1 : 0.26}
            />
            {d.selected ? (
              <Rect x={x} y={plotH + 3} width={cellW} height={2} rx={1} fill={colors.brand.highlight} />
            ) : null}
          </React.Fragment>
        );
      })}

      {[0, 6, 12, 18].map((hour) => (
        <SvgText
          key={hour}
          x={hour * (cellW + gap) + cellW / 2}
          y={height - 2}
          fill={colors.ink.faint}
          fontSize={9.5}
          textAnchor="middle"
        >
          {`${hour}h`}
        </SvgText>
      ))}
      <Line x1={0} y1={plotH} x2={width} y2={plotH} stroke={colors.line.hairline} strokeWidth={1} />
    </Svg>
  );
}
