import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useTheme } from "../../theme/useTheme";

interface NumberFieldProps {
  label: string;
  value: number;
  onChangeValue: (value: number) => void;
  unit?: string;
}

export function NumberField({ label, value, onChangeValue, unit }: NumberFieldProps) {
  const { colors, type, space, radius } = useTheme();
  const [text, setText] = useState(String(value));

  // The unit rides in the label rather than beside the input: in a two-column
  // row a trailing unit steals the width the input needs on a narrow phone.
  const labelText = unit ? `${label} (${unit})` : label;

  return (
    <View style={{ minWidth: 0 }}>
      <Text
        style={[type.label, { color: colors.textMuted, marginBottom: space.xs, fontSize: 11 }]}
        numberOfLines={2}
      >
        {labelText.toUpperCase()}
      </Text>
      <TextInput
        value={text}
        onChangeText={(t) => {
          setText(t);
          const parsed = Number(t.replace(",", "."));
          if (!Number.isNaN(parsed)) onChangeValue(parsed);
        }}
        onBlur={() => setText(String(value))}
        keyboardType="decimal-pad"
        style={{
          width: "100%",
          minWidth: 0,
          color: colors.textPrimary,
          backgroundColor: colors.surfaceRaised,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
          fontSize: 15,
          fontVariant: ["tabular-nums"],
        }}
      />
    </View>
  );
}
