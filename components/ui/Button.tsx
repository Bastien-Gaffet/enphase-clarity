import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { useTheme } from "../../theme/useTheme";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = "primary", loading, disabled }: ButtonProps) {
  const { colors, space, radius } = useTheme();
  const isPrimary = variant === "primary";
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        backgroundColor: isPrimary ? colors.brand.accent : colors.surfaceRaised,
        borderWidth: isPrimary ? 0 : 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingVertical: space.md,
        alignItems: "center",
        opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#ffffff" : colors.textPrimary} />
      ) : (
        <Text style={{ color: isPrimary ? "#ffffff" : colors.textPrimary, fontWeight: "700", fontSize: 15 }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
