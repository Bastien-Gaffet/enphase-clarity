import React from "react";
import { Pressable, TextInput, View } from "react-native";
import { Txt } from "./Txt";
import { Icon } from "./Icon";
import { Button } from "./Controls";
import type { TouWindow } from "../../lib/calculations/types";
import { normaliseHhMm, totalHoursPerDay, validateWindows } from "../../lib/calculations/touWindows";
import { useTheme } from "../../theme/useTheme";

function TimeBox({
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
  const { colors, radius, space } = useTheme();

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onBlur={onBlur}
      placeholder="22:00"
      placeholderTextColor={colors.ink.faint}
      keyboardType="numbers-and-punctuation"
      autoCorrect={false}
      maxLength={5}
      style={{
        flex: 1,
        minWidth: 0,
        color: colors.ink.primary,
        backgroundColor: colors.raised,
        borderWidth: 1,
        borderColor: invalid ? colors.status.critical : colors.line.strong,
        borderRadius: radius.sm,
        paddingHorizontal: space.sm,
        paddingVertical: 11,
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
 * express them.
 */
export function TouWindowsEditor({
  windows,
  onChange,
}: {
  windows: TouWindow[];
  onChange: (windows: TouWindow[]) => void;
}) {
  const { colors, space } = useTheme();
  const issues = validateWindows(windows);
  const issueFor = (index: number) => issues.find((i) => i.index === index)?.message;
  const hoursPerDay = totalHoursPerDay(windows);

  const update = (index: number, patch: Partial<TouWindow>) =>
    onChange(windows.map((w, i) => (i === index ? { ...w, ...patch } : w)));

  const normalise = (index: number, field: "start" | "end") => {
    const normalised = normaliseHhMm(windows[index][field]);
    if (normalised) update(index, { [field]: normalised } as Partial<TouWindow>);
  };

  return (
    <View style={{ gap: space.md }}>
      {windows.map((window, index) => {
        const issue = issueFor(index);
        return (
          <View key={index} style={{ gap: 5 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Txt variant="caption" tone="faint" style={{ width: 14 }}>
                {index + 1}
              </Txt>
              <TimeBox
                value={window.start}
                onChangeText={(v) => update(index, { start: v })}
                onBlur={() => normalise(index, "start")}
                invalid={!!issue}
              />
              <Icon name="arrow-forward" size={14} color={colors.ink.faint} />
              <TimeBox
                value={window.end}
                onChangeText={(v) => update(index, { end: v })}
                onBlur={() => normalise(index, "end")}
                invalid={!!issue}
              />
              <Pressable
                onPress={() => onChange(windows.filter((_, i) => i !== index))}
                disabled={windows.length === 1}
                hitSlop={10}
                style={{ opacity: windows.length === 1 ? 0.25 : 1, padding: 2 }}
              >
                <Icon name="trash-outline" size={17} color={colors.ink.muted} />
              </Pressable>
            </View>
            {issue ? (
              <Txt variant="caption" tone="critical" style={{ marginLeft: 22 }}>
                {issue}
              </Txt>
            ) : null}
          </View>
        );
      })}

      <Button
        label="Ajouter une plage"
        variant="quiet"
        icon="add"
        onPress={() => onChange([...windows, { start: "12:00", end: "14:00" }])}
      />

      <Txt variant="caption" tone="faint">
        {issues.length > 0
          ? "Corrige les plages en rouge pour que le calcul soit juste."
          : `${hoursPerDay.toFixed(1)} h d'heures creuses par jour. Une plage peut passer minuit (22:00 → 06:00).`}
      </Txt>
    </View>
  );
}
