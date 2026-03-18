import { Stack } from "expo-router";
import * as React from "react";
import { Platform, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Form, FormItem, FormSection } from "@/components/nativewindui/Form";
import { Icon } from "@/components/nativewindui/Icon";
import { Text } from "@/components/nativewindui/Text";
import { cn } from "@/lib/cn";
import { useColorScheme, type ThemePreference } from "@/lib/useColorScheme";

const THEMES: { name: string; value: ThemePreference }[] = [
  { name: "System", value: "system" },
  { name: "Hell", value: "light" },
  { name: "Dunkel", value: "dark" },
];

export default function AppearanceScreen() {
  const insets = useSafeAreaInsets();
  const { themePreference, setColorScheme } = useColorScheme();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Darstellung",
          headerBackTitle: "Zurück",
          ...(Platform.OS === "ios"
            ? { headerTransparent: true, headerBlurEffect: "systemMaterial" }
            : {}),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        <Form className="gap-5 px-4 pt-8">
          <FormSection footnote="Wähle wie die App aussehen soll. 'System' übernimmt die Einstellung deines Geräts.">
            {THEMES.map((theme, index) => (
              <FormItem
                key={theme.value}
                className={cn(
                  index !== THEMES.length - 1 && "border-b border-border/20"
                )}
              >
                <Pressable
                  onPress={() => setColorScheme(theme.value)}
                  className="flex-row items-center justify-between p-3 active:opacity-70"
                >
                  <Text className="text-lg">{theme.name}</Text>
                  {themePreference === theme.value && (
                    <Icon name="checkmark" className="text-primary" />
                  )}
                </Pressable>
              </FormItem>
            ))}
          </FormSection>
        </Form>
      </ScrollView>
    </>
  );
}
