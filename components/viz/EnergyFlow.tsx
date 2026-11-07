import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Txt } from "../core/Txt";
import { IconBadge, IconName } from "../core/Icon";
import { colors } from "../../theme/colors";

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Node centres as a fraction of the diagram box. */
const NODES = {
  solar: { x: 0.17, y: 0.3 },
  grid: { x: 0.83, y: 0.3 },
  home: { x: 0.5, y: 0.82 },
};

const BADGE = 40;
const LABEL_W = 98;
const LABEL_H = 34;

interface Link {
  key: string;
  from: keyof typeof NODES;
  to: keyof typeof NODES;
  color: string;
  /** 0 = idle (drawn faint, still), >0 = flowing. */
  kw: number;
}

/** Straight link, pulled back from both node badges so it never runs under them. */
function linkPath(w: number, h: number, from: keyof typeof NODES, to: keyof typeof NODES): string {
  const a = { x: NODES[from].x * w, y: NODES[from].y * h };
  const b = { x: NODES[to].x * w, y: NODES[to].y * h };
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
  const height = Math.round(width * 0.8);

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
            d={linkPath(width, height, l.from, l.to)}
            color={l.color}
            active={l.kw > 0.05}
          />
        ))}
      </Svg>

      <Node
        x={NODES.solar.x * width}
        y={NODES.solar.y * height}
        width={width}
        icon="sunny"
        color={colors.energy.production}
        label="Solaire"
        value={fmt(productionKw)}
        dim={productionKw <= 0.05}
        labelAbove
      />
      <Node
        x={NODES.grid.x * width}
        y={NODES.grid.y * height}
        width={width}
        icon={exporting ? "arrow-up-circle" : "flash"}
        color={exporting ? colors.energy.surplus : colors.energy.grid}
        label={exporting ? "Revendu" : "Réseau"}
        value={fmt(Math.abs(gridKw))}
        dim={!importing && !exporting}
        labelAbove
      />
      <Node
        x={NODES.home.x * width}
        y={NODES.home.y * height}
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
