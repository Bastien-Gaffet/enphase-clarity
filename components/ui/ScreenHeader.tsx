import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../theme/useTheme";
import { Logo } from "../brand/Logo";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  const { colors, type, space } = useTheme();

  return (
    <View style={{ marginBottom: space.xs }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <Logo size={26} background={colors.page} />
        <Text style={[type.label, { color: colors.textMuted, letterSpacing: 1.2 }]}>
          ENPHASE CLARITY
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: space.md,
          marginTop: space.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={[type.h1, { color: colors.textPrimary }]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[type.body, { color: colors.textSecondary, marginTop: 2 }]}>{subtitle}</Text>
          ) : null}
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
}
