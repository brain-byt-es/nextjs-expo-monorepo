import { Stack } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";

export default function AuthLayout() {
  const { colors } = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(login)" options={{ presentation: "modal" }} />
      <Stack.Screen name="(create-account)" options={{ presentation: "modal" }} />
    </Stack>
  );
}
