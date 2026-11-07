import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Txt } from "./Txt";
import { Logo } from "../brand/Logo";
import { useTheme } from "../../theme/useTheme";

interface ScreenProps {
  title: string;
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}

/**
 * Shared shell: brand line, safe-area insets, and bottom padding that clears
 * the tab bar — without it the last block hides behind the navigation.
 */
export function Screen({ title, children, onRefresh, refreshing }: ScreenProps) {
  const { colors, space, gutter, tabBarHeight } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.page }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: gutter,
          paddingTop: insets.top + space.lg,
          paddingBottom: tabBarHeight + insets.bottom + space.xxl,
          gap: space.lg,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={colors.ink.muted}
            />
          ) : undefined
        }
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: space.xs,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Logo size={22} background={colors.page} />
            <Txt variant="overline" tone="faint">
              ENPHASE CLARITY
            </Txt>
          </View>
          <Txt variant="overline" tone="faint">
            {title.toUpperCase()}
          </Txt>
        </View>

        {children}
      </ScrollView>
    </View>
  );
}
