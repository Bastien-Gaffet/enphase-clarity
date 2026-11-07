import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Txt } from "../core/Txt";
import { IconBadge, IconName } from "../core/Icon";
import { useTheme } from "../../theme/useTheme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Horizontal node positions as a fraction of the diagram width. */
const NODE_X = { solar: 0.17, grid: 0.83, home: 0.5 };

const BADGE = 40;
const LABEL_W = 98;
const LABEL_H = 34;
const LABEL_GAP = 5;

/**
 * Vertical geometry derived from the content rather than a ratio: the top row
 * carries a caption above its badge and the home node one below, so a guessed
 * height let the bottom caption spill out of the card.
 */
function geometry(width: number) {
  const run = Math.max(74, Math.round(width * 0.3)); // diagonal drop between rows
  const topY = LABEL_H + BADGE / 2;
  const height = LABEL_H + BADGE + run + BADGE + LABEL_GAP + LABEL_H;
  const homeY = height - LABEL_H - LABEL_GAP - BADGE / 2;
  return { height, topY, homeY };
}

type NodeKey = "solar" | "grid" | "home";

interface Link {
  key: string;
  from: NodeKey;
  to: NodeKey;
  color: string;
  /** 0 = idle (drawn faint, still), >0 = flowing. */
  kw: number;
}

/** Straight link, pulled back from both node badges so it never runs under them. */
function linkPath(
  centres: Record<NodeKey, { x: number; y: number }>,
  from: NodeKey,
  to: NodeKey
): string {
  const a = centres[from];
  const b = centres[to];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const inset = BADGE / 2 + 7;
  const ux = dx / len;
  const uy = dy / len;
  return `M${(a.x + ux * inset).toFixed(1)},${(a.y + uy * inset).toFixed(1)} L${(
    b.x - ux * inset
  ).toFixed(1)},${(b.y - uy * inset).toFixed(1)}`;
}

function FlowLine({ d, color, active }: { d: string; color: string; active: boolean }) {
  const { colors } = useTheme();
  const march = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.timing(march, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        // SVG props are not supported by the native driver.
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => {
      loop.stop();
      march.setValue(0);
    };
  }, [active, march]);

  // Marching dashes read as direction of travel; an idle link is a still hairline.
  const dashoffset = march.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

  if (!active) {
    return <Path d={d} stroke={colors.line.strong} strokeWidth={2} strokeLinecap="round" fill="none" />;
  }

  return (
    <>
      <Path d={d} stroke={`${color}33`} strokeWidth={3} strokeLinecap="round" fill="none" />
      <AnimatedPath
        d={d}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        strokeDasharray="5 13"
        strokeDashoffset={dashoffset}
      />
    </>
  );
}

function Node({
  x,
  y,
  width,
  icon,
  color,
  label,
  value,
  dim,
  labelAbove,
}: {
  x: number;
  y: number;
  width: number;
  icon: IconName;
  color: string;
  label: string;
  value: string;
  dim: boolean;
  /** Top nodes put their caption above the badge so it never sits on a link. */
  labelAbove?: boolean;
}) {
  const { colors } = useTheme();
  const left = Math.max(0, Math.min(width - LABEL_W, x - LABEL_W / 2));

  const caption = (
    <>
      <Txt variant="overline" tone="muted" numberOfLines={1}>
        {label.toUpperCase()}
      </Txt>
      <Txt variant="bodyStrong" tabular numberOfLines={1}>
        {value}
      </Txt>
    </>
  );

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left,
        top: labelAbove ? y - BADGE / 2 - LABEL_H : y - BADGE / 2,
        width: LABEL_W,
        alignItems: "center",
        opacity: dim ? 0.45 : 1,
      }}
    >
      {labelAbove ? <View style={{ alignItems: "center", height: LABEL_H }}>{caption}</View> : null}
      {/* Opaque disc behind the badge so links pass behind it, not through it. */}
      <View style={{ backgroundColor: colors.base, borderRadius: 999 }}>
        <IconBadge name={icon} color={color} size={BADGE} />
      </View>
      {labelAbove ? null : (
        <View style={{ alignItems: "center", marginTop: 5 }}>{caption}</View>
      )}
    </View>
  );
}

/**
 * Sun → house → grid, with each path lit in the direction power is actually
 * travelling. This is the view that makes a solar install legible at a glance,
 * and the app had nothing equivalent.
 */
export function EnergyFlow({
  width,
  productionKw,
  consumptionKw,
  gridKw,
}: {
  width: number;
  /** Positive = importing from the grid, negative = exporting. */
  productionKw: number;
  consumptionKw: number;
  gridKw: number;
}) {
  const { colors } = useTheme();
  const { height, topY, homeY } = geometry(width);
  const centres: Record<NodeKey, { x: number; y: number }> = {
    solar: { x: NODE_X.solar * width, y: topY },
    grid: { x: NODE_X.grid * width, y: topY },
    home: { x: NODE_X.home * width, y: homeY },
  };

  const importing = gridKw > 0.05;
  const exporting = gridKw < -0.05;
  const selfConsumedKw = Math.max(0, Math.min(productionKw, consumptionKw));

  const links: Link[] = [
    { key: "solar-home", from: "solar", to: "home", color: colors.energy.production, kw: selfConsumedKw },
    {
      key: "solar-grid",
      from: "solar",
      to: "grid",
      color: colors.energy.surplus,
      kw: exporting ? -gridKw : 0,
    },
    {
      key: "grid-home",
      from: "grid",
      to: "home",
      color: colors.energy.grid,
      kw: importing ? gridKw : 0,
    },
  ];

  const fmt = (kw: number) => `${(Number.isFinite(kw) ? kw : 0).toFixed(2)} kW`;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {links.map((l) => (
          <FlowLine
            key={l.key}
            d={linkPath(centres, l.from, l.to)}
            color={l.color}
            active={l.kw > 0.05}
          />
        ))}
      </Svg>

      <Node
        x={centres.solar.x}
        y={centres.solar.y}
        width={width}
        icon="sunny"
        color={colors.energy.production}
        label="Solaire"
        value={fmt(productionKw)}
        dim={productionKw <= 0.05}
        labelAbove
      />
      <Node
        x={centres.grid.x}
        y={centres.grid.y}
        width={width}
        icon={exporting ? "arrow-up-circle" : "flash"}
        color={exporting ? colors.energy.surplus : colors.energy.grid}
        label={exporting ? "Revendu" : "Réseau"}
        value={fmt(Math.abs(gridKw))}
        dim={!importing && !exporting}
        labelAbove
      />
      <Node
        x={centres.home.x}
        y={centres.home.y}
        width={width}
        icon="home"
        color={colors.ink.secondary}
        label="Maison"
        value={fmt(consumptionKw)}
        dim={false}
      />
    </View>
  );
}
