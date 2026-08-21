import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";

export default function NotFoundScreen() {
  const { colors, type, space } = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: "Introuvable" }} />
      <View style={[styles.container, { backgroundColor: colors.page }]}>
        <Text style={[type.h2, { color: colors.textPrimary }]}>Cet écran n'existe pas.</Text>
        <Link href="/" style={{ marginTop: space.lg }}>
          <Text style={[type.body, { color: colors.energy.grid }]}>Retour au tableau de bord</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
});
