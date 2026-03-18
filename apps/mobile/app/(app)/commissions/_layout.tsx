import { Stack } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";

export default function CommissionsLayout() {
  const { colors } = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: "Lieferschein", headerBackTitle: "Zurück" }} />
      <Stack.Screen
        name="scan-modal"
        options={{
          title: "Artikel scannen",
          presentation: "modal",
          headerBackTitle: "Abbrechen",
        }}
      />
    </Stack>
  );
}
