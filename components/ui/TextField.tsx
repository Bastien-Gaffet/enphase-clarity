import React from "react";
import { Text, TextInput, View } from "react-native";
import { useTheme } from "../../theme/useTheme";

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secure?: boolean;
}

export function TextField({ label, value, onChangeText, placeholder, secure }: TextFieldProps) {
  const { colors, type, space, radius } = useTheme();
  return (
    <View>
      <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>{label.toUpperCase()}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          color: colors.textPrimary,
          backgroundColor: colors.surfaceRaised,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
          fontSize: 15,
        }}
      />
    </View>
  );
}
