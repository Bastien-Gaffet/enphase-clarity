import React from "react";
import { Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { useTheme } from "../../theme/useTheme";

interface SliderFieldProps {
  label: string;
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  unit?: string;
  onValueChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export function SliderField({
  label,
  value,
  minimumValue,
  maximumValue,
  step = 1,
  unit = "",
  onValueChange,
  formatValue,
}: SliderFieldProps) {
  const { colors, type, space } = useTheme();
  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={[type.label, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
        <Text style={[type.bodyStrong, { color: colors.textPrimary, fontVariant: ["tabular-nums"] }]}>
          {formatValue ? formatValue(value) : `${value}${unit}`}
        </Text>
      </View>
      <Slider
        style={{ height: 36, marginTop: space.xs }}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={colors.brand.accent}
        maximumTrackTintColor={colors.hairline}
        thumbTintColor={colors.brand.highlight}
      />
    </View>
  );
}
