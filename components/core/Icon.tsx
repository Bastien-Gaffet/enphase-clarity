import React from "react";
import { View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../theme/useTheme";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

/**
 * Replaces the emoji the first version used for energy flows — emoji render
 * differently on every OS and read as placeholder art.
 */
export function Icon({
  name,
  size = 18,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={color ?? colors.ink.secondary} />;
}

/** Icon in a tinted round chip — used to mark each row of the energy flow. */
export function IconBadge({
  name,
  color,
  size = 36,
}: {
  name: IconName;
  color: string;
  size?: number;
}) {
  const { radius } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `${color}1F`,
        borderWidth: 1,
        borderColor: `${color}4D`,
      }}
    >
      <Icon name={name} size={size * 0.5} color={color} />
    </View>
  );
}
