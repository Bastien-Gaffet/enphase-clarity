import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../theme/useTheme";
import type { TouWindow } from "../../lib/calculations/types";
import { normaliseHhMm, totalHoursPerDay, validateWindows } from "../../lib/calculations/touWindows";

interface TouWindowsEditorProps {
  windows: TouWindow[];
  onChange: (windows: TouWindow[]) => void;
}

function TimeInput({
  value,
  onChangeText,
  onBlur,
  invalid,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onBlur: () => void;
  invalid: boolean;
}) {
  const { colors, space, radius } = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onBlur={onBlur}
      placeholder="22:00"
      placeholderTextColor={colors.textMuted}
      keyboardType="numbers-and-punctuation"
      autoCorrect={false}
      maxLength={5}
      style={{
        flex: 1,
        minWidth: 0,
        color: colors.textPrimary,
        backgroundColor: colors.surfaceRaised,
        borderWidth: 1,
        borderColor: invalid ? colors.status.critical : colors.border,
        borderRadius: radius.sm,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
        fontSize: 15,
        textAlign: "center",
        fontVariant: ["tabular-nums"],
      }}
    />
  );
}

/**
 * Most French time-of-use contracts split heures creuses across two or more
 * ranges (a night block plus a midday one), so a single start/end pair cannot
 * represent them.
 */
export function TouWindowsEditor({ windows, onChange }: TouWindowsEditorProps) {
  const { colors, type, space, radius } = useTheme();
  const issues = validateWindows(windows);
  const issueFor = (index: number) => issues.find((i) => i.index === index)?.message;
  const hoursPerDay = totalHoursPerDay(windows);

  const update = (index: number, patch: Partial<TouWindow>) => {
    onChange(windows.map((w, i) => (i === index ? { ...w, ...patch } : w)));
  };

  const normalise = (index: number, field: "start" | "end") => {
    const normalised = normaliseHhMm(windows[index][field]);
    if (normalised) update(index, { [field]: normalised } as Partial<TouWindow>);
  };

  return (
    <View style={{ gap: space.md }}>
      {windows.map((window, index) => {
        const issue = issueFor(index);
        return (
          <View key={index} style={{ gap: space.xs }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Text style={[type.caption, { color: colors.textMuted, width: 18 }]}>{index + 1}</Text>

              <TimeInput
                value={window.start}
                onChangeText={(v) => update(index, { start: v })}
                onBlur={() => normalise(index, "start")}
                invalid={!!issue}
              />
              <Text style={{ color: colors.textMuted }}>→</Text>
              <TimeInput
                value={window.end}
                onChangeText={(v) => update(index, { end: v })}
                onBlur={() => normalise(index, "end")}
                invalid={!!issue}
              />

              <Pressable
                onPress={() => onChange(windows.filter((_, i) => i !== index))}
                disabled={windows.length === 1}
                hitSlop={8}
                style={{ opacity: windows.length === 1 ? 0.3 : 1, padding: 4 }}
              >
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            {issue ? (
              <Text style={[type.caption, { color: colors.status.critical, marginLeft: 26 }]}>
                {issue}
              </Text>
            ) : null}
          </View>
        );
      })}

      <Pressable
        onPress={() => onChange([...windows, { start: "12:00", end: "14:00" }])}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: space.sm,
          paddingVertical: space.md,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: colors.border,
          borderStyle: "dashed",
        }}
      >
        <Ionicons name="add" size={16} color={colors.brand.highlight} />
        <Text style={[type.bodyStrong, { color: colors.brand.highlight }]}>Ajouter une plage</Text>
      </Pressable>

      <Text style={[type.caption, { color: colors.textMuted }]}>
        {issues.length > 0
          ? "Corrige les plages en rouge pour que le calcul soit juste."
          : `${hoursPerDay.toFixed(1)} h d'heures creuses par jour. Une plage peut passer minuit (ex. 22:00 → 06:00).`}
      </Text>
    </View>
  );
}
