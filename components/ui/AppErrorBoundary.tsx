import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Button } from "./Button";
import { tokens } from "../../theme/colors";

/**
 * Replaces expo-router's default production error screen, which renders
 * near-blank. A startup failure must always be readable on the device —
 * that is the only diagnostic available on an installed release build.
 */
export function AppErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  const colors = tokens("dark");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.page }}
      contentContainerStyle={{ padding: 24, paddingTop: 72, gap: 16 }}
    >
      <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: "700" }}>
        L'application a rencontré une erreur
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
        Message d'erreur ci-dessous — utile pour corriger le problème.
      </Text>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
        }}
      >
        <Text selectable style={{ color: colors.status.critical, fontSize: 13, fontWeight: "600" }}>
          {error?.name ? `${error.name}: ` : ""}
          {error?.message ?? "Erreur inconnue"}
        </Text>
        {error?.stack ? (
          <Text selectable style={{ color: colors.textMuted, fontSize: 11, marginTop: 12 }}>
            {error.stack}
          </Text>
        ) : null}
      </View>

      <Button label="Réessayer" onPress={() => retry()} />
    </ScrollView>
  );
}
