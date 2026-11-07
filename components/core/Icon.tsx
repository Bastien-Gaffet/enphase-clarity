import React from "react";
import { View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/spacing";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

/**
 * Replaces the emoji the first version used for energy flows — emoji render
 * differently on every OS and read as placeholder art.
 */
export function Icon({
  name,
  size = 18,
  color = colors.ink.secondary,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
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
