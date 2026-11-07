import { Link, Stack } from "expo-router";
import { View } from "react-native";
import { Txt } from "@/components/core/Txt";
import { useTheme } from "@/theme/useTheme";

export default function NotFoundScreen() {
  const { colors, space } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Introuvable" }} />
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: space.xl,
          gap: space.md,
          backgroundColor: colors.page,
        }}
      >
        <Txt variant="heading">Cet écran n'existe pas.</Txt>
        <Link href="/">
          <Txt variant="bodyStrong" tone="highlight">
            Retour au tableau de bord
          </Txt>
        </Link>
      </View>
    </>
  );
}
