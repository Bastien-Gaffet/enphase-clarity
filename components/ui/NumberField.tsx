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

  return (
    <View>
      <Text style={[type.label, { color: colors.textMuted, marginBottom: space.xs }]}>{label.toUpperCase()}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
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
            flex: 1,
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
        {unit ? <Text style={{ color: colors.textSecondary }}>{unit}</Text> : null}
      </View>
    </View>
  );
}
