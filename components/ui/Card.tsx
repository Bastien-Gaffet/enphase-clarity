import React from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "../../theme/useTheme";

export function Card({ style, children, ...rest }: ViewProps) {
  const { colors, space, radius } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: space.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
