import React from "react";
import { View } from "react-native";
import { Txt } from "./Txt";
import { Figure } from "./Figure";
import { Icon, IconBadge, IconName } from "./Icon";
import { useTheme } from "../../theme/useTheme";

/** A labelled figure. Used in pairs or triples inside a Surface. */
export function StatBlock({
  label,
  value,
  unit,
  color,
  caption,
}: {
  label: string;
  value: string;
  unit?: string;
  color?: string;
  caption?: string;
}) {
  const { space } = useTheme();

  return (
    <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {color ? (
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
        ) : null}
        <Txt variant="overline" tone="muted" numberOfLines={2} style={{ flexShrink: 1 }}>
          {label.toUpperCase()}
        </Txt>
      </View>

      <Figure variant="display" value={value} unit={unit} unitVariant="body" />

      {caption ? (
        <Txt variant="caption" tone="muted" numberOfLines={2}>
          {caption}
        </Txt>
      ) : null}
    </View>
  );
}

/** Icon · label · value, for list-like readouts. */
export function DataRow({
  icon,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: IconName;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
}) {
  const { space } = useTheme();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      <IconBadge name={icon} color={iconColor} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt variant="bodyStrong" numberOfLines={1}>
          {label}
        </Txt>
        {sub ? (
          <Txt variant="caption" tone="muted" numberOfLines={1}>
            {sub}
          </Txt>
        ) : null}
      </View>
      <Txt variant="heading" tabular numberOfLines={1}>
        {value}
      </Txt>
    </View>
  );
}

/** Small status marker. */
export function Chip({
  label,
  color,
  icon,
}: {
  label: string;
  color?: string;
  icon?: IconName;
}) {
  const { colors } = useTheme();
  const tone = color ?? colors.ink.muted;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 11,
        borderRadius: 999,
        backgroundColor: `${tone}14`,
        borderWidth: 1,
        borderColor: `${tone}3D`,
      }}
    >
      {icon ? (
        <Icon name={icon} size={12} color={tone} />
      ) : (
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tone }} />
      )}
      <Txt variant="overline" color={tone}>
        {label.toUpperCase()}
      </Txt>
    </View>
  );
}

/** Section marker inside a Surface. */
export function SectionHeader({
  children,
  right,
  icon,
}: {
  children: string;
  right?: React.ReactNode;
  icon?: IconName;
}) {
  const { colors, space } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: space.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7, flexShrink: 1 }}>
        {icon ? <Icon name={icon} size={13} color={colors.ink.muted} /> : null}
        <Txt variant="overline" tone="muted" numberOfLines={2} style={{ flexShrink: 1 }}>
          {children.toUpperCase()}
        </Txt>
      </View>
      {right}
    </View>
  );
}
