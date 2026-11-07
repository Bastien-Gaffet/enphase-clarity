import React from "react";
import { ScrollView, View } from "react-native";
import { Txt } from "./Txt";
import { Button } from "./Controls";
import { colors } from "../../theme/colors";
import { radius, space } from "../../theme/spacing";

/**
 * Replaces expo-router's default production error screen, which renders
 * near-blank. A startup failure must always be readable on the device — it is
 * the only diagnostic available on an installed release build.
 */
export function AppErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.page }}
      contentContainerStyle={{ padding: space.xl, paddingTop: 72, gap: space.lg }}
    >
      <Txt variant="title">L'application a rencontré une erreur</Txt>
      <Txt variant="body" tone="secondary">
        Le message ci-dessous permet de corriger le problème.
      </Txt>

      <View
        style={{
          backgroundColor: colors.base,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.line.edge,
          padding: space.lg,
          gap: space.md,
        }}
      >
        <Txt variant="bodyStrong" tone="critical" selectable>
          {error?.name ? `${error.name}: ` : ""}
          {error?.message ?? "Erreur inconnue"}
        </Txt>
        {error?.stack ? (
          <Txt variant="caption" tone="faint" selectable>
            {error.stack}
          </Txt>
        ) : null}
      </View>

      <Button label="Réessayer" icon="refresh" onPress={() => retry()} />
    </ScrollView>
  );
}
