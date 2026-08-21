import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/useTheme";
import { ScreenHeader } from "./ScreenHeader";

interface ScreenProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Rendered on the header row, opposite the title. */
  headerRight?: React.ReactNode;
}

/**
 * Shared screen shell: brand header, safe-area insets, and — critically —
 * bottom padding that clears the tab bar. Without it the last card's text is
 * hidden behind the navigation bar.
 */
export function Screen({ title, subtitle, children, onRefresh, refreshing, headerRight }: ScreenProps) {
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.page }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingTop: insets.top + space.xl,
          // tab bar (56) + its safe-area inset + breathing room
          paddingBottom: 56 + insets.bottom + space.xxl,
          gap: space.lg,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh
            ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.textMuted} />
            : undefined
        }
      >
        <ScreenHeader title={title} subtitle={subtitle} right={headerRight} />
        {children}
      </ScrollView>
    </View>
  );
}
