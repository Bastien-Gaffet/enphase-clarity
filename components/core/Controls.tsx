import React, { useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";
import Slider from "@react-native-community/slider";
import { Txt } from "./Txt";
import { Icon, IconName } from "./Icon";
import { colors } from "../../theme/colors";
import { radius, space } from "../../theme/spacing";

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "quiet";
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isPrimary = variant === "primary";
  const isQuiet = variant === "quiet";
  const off = disabled || loading;
  const fg = isPrimary ? colors.ink.onAccent : isQuiet ? colors.brand.highlight : colors.ink.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: space.sm,
        backgroundColor: isPrimary ? colors.brand.accent : isQuiet ? "transparent" : colors.raised,
        borderWidth: isQuiet ? 1 : isPrimary ? 0 : 1,
        borderColor: isQuiet ? colors.line.edge : colors.line.strong,
        borderStyle: isQuiet ? "dashed" : "solid",
        borderRadius: radius.md,
        paddingVertical: 13,
        opacity: off ? 0.45 : pressed ? 0.82 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {icon ? <Icon name={icon} size={16} color={fg} /> : null}
          <Txt variant="bodyStrong" color={fg}>
            {label}
          </Txt>
        </>
      )}
    </Pressable>
  );
}

const inputStyle = {
  color: colors.ink.primary,
  backgroundColor: colors.raised,
  borderWidth: 1,
  borderColor: colors.line.strong,
  borderRadius: radius.sm,
  paddingHorizontal: space.md,
  paddingVertical: 11,
  fontSize: 15,
  minWidth: 0,
} as const;

/** Numeric field. The unit rides in the label so it never steals input width. */
export function NumberField({
  label,
  value,
  unit,
  onChangeValue,
}: {
  label: string;
  value: number;
  unit?: string;
  onChangeValue: (value: number) => void;
}) {
  const [text, setText] = useState(String(value));

  return (
    <View style={{ minWidth: 0, gap: 6 }}>
      <Txt variant="overline" tone="muted" numberOfLines={2}>
        {(unit ? `${label} (${unit})` : label).toUpperCase()}
      </Txt>
      <TextInput
        value={text}
        onChangeText={(t) => {
          setText(t);
          const parsed = Number(t.replace(",", "."));
          if (!Number.isNaN(parsed)) onChangeValue(parsed);
        }}
        onBlur={() => setText(String(value))}
        keyboardType="decimal-pad"
        placeholderTextColor={colors.ink.faint}
        style={[inputStyle, { width: "100%", fontVariant: ["tabular-nums"] }]}
      />
    </View>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secure?: boolean;
}) {
  return (
    <View style={{ minWidth: 0, gap: 6 }}>
      <Txt variant="overline" tone="muted">
        {label.toUpperCase()}
      </Txt>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink.faint}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        style={[inputStyle, { width: "100%" }]}
      />
    </View>
  );
}

export function SliderField({
  label,
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  format,
}: {
  label: string;
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onValueChange: (value: number) => void;
  format: (value: number) => string;
}) {
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Txt variant="overline" tone="muted" style={{ flexShrink: 1 }} numberOfLines={1}>
          {label.toUpperCase()}
        </Txt>
        <Txt variant="heading" tabular color={colors.brand.highlight}>
          {format(value)}
        </Txt>
      </View>
      <Slider
        style={{ height: 34 }}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={colors.brand.accent}
        maximumTrackTintColor={colors.line.strong}
        thumbTintColor={colors.brand.highlight}
      />
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.sunken,
        borderRadius: radius.md,
        padding: 4,
        borderWidth: 1,
        borderColor: colors.line.hairline,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              minWidth: 0,
              paddingVertical: 9,
              borderRadius: radius.sm,
              alignItems: "center",
              backgroundColor: active ? colors.brand.accent : "transparent",
            }}
          >
            <Txt
              variant="bodyStrong"
              color={active ? colors.ink.onAccent : colors.ink.muted}
              numberOfLines={1}
              style={{ fontSize: 13.5 }}
            >
              {opt.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
