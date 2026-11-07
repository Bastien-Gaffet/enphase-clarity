import React from "react";
import Svg, { Defs, LinearGradient, Line, Path, Rect, Stop, Text as SvgText, Circle } from "react-native-svg";
import { colors } from "../../theme/colors";

export interface Series {
  values: number[];
  color: string;
  filled?: boolean;
}

interface DayCurveProps {
  series: Series[];
  width: number;
  height?: number;
  /** Samples per hour — 4 for the app's 15-minute intervals. */
  samplesPerHour?: number;
  /** Shade the hours outside this range as night. */
  daylight?: { from: number; to: number };
}

const AXIS = 18;
const HOURS = [0, 6, 12, 18, 24];

function buildLine(values: number[], w: number, h: number, max: number, totalSlots: number): string {
  if (values.length === 0) return "";
  const stepX = w / Math.max(1, totalSlots - 1);
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = h - (max > 0 ? (v / max) * h : 0);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/**
 * The day's power curve with the context the first version lacked: hour ticks,
 * a night band, and a marker on the latest reading so "where am I now" is
 * answerable at a glance.
 */
export function DayCurve({
  series,
  width,
  height = 150,
  samplesPerHour = 4,
  daylight = { from: 7, to: 20 },
}: DayCurveProps) {
  const plotH = height - AXIS;
  const slots = 24 * samplesPerHour;
  const max = Math.max(1e-6, ...series.flatMap((s) => s.values));
  const xOf = (slot: number) => (slot / Math.max(1, slots - 1)) * width;

  const nightEnd = xOf(daylight.from * samplesPerHour);
  const nightStart = xOf(daylight.to * samplesPerHour);

  const lead = series[0];
  const leadIndex = lead && lead.values.length > 0 ? lead.values.length - 1 : -1;

  return (
    <Svg width={width} height={height}>
      <Defs>
        {series.map((s, i) =>
          s.filled ? (
            <LinearGradient key={i} id={`fill${i}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={s.color} stopOpacity={0.32} />
              <Stop offset="1" stopColor={s.color} stopOpacity={0.02} />
            </LinearGradient>
          ) : null
        )}
      </Defs>

      {/* Night bands, so the shape of the solar day is readable even at a glance. */}
      <Rect x={0} y={0} width={nightEnd} height={plotH} fill={colors.sunken} opacity={0.55} />
      <Rect
        x={nightStart}
        y={0}
        width={Math.max(0, width - nightStart)}
        height={plotH}
        fill={colors.sunken}
        opacity={0.55}
      />

      {HOURS.map((hour) => {
        const x = Math.min(width - 1, xOf(hour * samplesPerHour));
        return (
          <React.Fragment key={hour}>
            <Line x1={x} y1={0} x2={x} y2={plotH} stroke={colors.line.hairline} strokeWidth={1} />
            <SvgText
              x={Math.min(width - 10, Math.max(8, x))}
              y={height - 4}
              fill={colors.ink.faint}
              fontSize={10}
              textAnchor={hour === 0 ? "start" : hour === 24 ? "end" : "middle"}
            >
              {`${hour}h`}
            </SvgText>
          </React.Fragment>
        );
      })}

      <Line x1={0} y1={plotH} x2={width} y2={plotH} stroke={colors.line.strong} strokeWidth={1} />

      {series.map((s, i) => {
        const line = buildLine(s.values, width, plotH, max, slots);
        // An empty series would emit a `d` with no initial moveto — invalid SVG.
        if (!line) return null;
        const lastX = xOf(s.values.length - 1);
        return (
          <React.Fragment key={i}>
            {s.filled ? (
              <Path d={`${line} L${lastX.toFixed(1)},${plotH} L0,${plotH} Z`} fill={`url(#fill${i})`} />
            ) : null}
            <Path d={line} stroke={s.color} strokeWidth={2} fill="none" strokeLinejoin="round" />
          </React.Fragment>
        );
      })}

      {/* "Now" marker on the leading series. */}
      {lead && leadIndex >= 0 ? (
        <>
          <Line
            x1={xOf(leadIndex)}
            y1={0}
            x2={xOf(leadIndex)}
            y2={plotH}
            stroke={colors.brand.highlight}
            strokeWidth={1}
            strokeDasharray="2 3"
            opacity={0.6}
          />
          <Circle
            cx={xOf(leadIndex)}
            cy={plotH - (max > 0 ? (lead.values[leadIndex] / max) * plotH : 0)}
            r={3.5}
            fill={lead.color}
            stroke={colors.base}
            strokeWidth={2}
          />
        </>
      ) : null}
    </Svg>
  );
}
