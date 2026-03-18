import * as Haptics from "expo-haptics";
import { Link } from "expo-router";
import * as React from "react";
import { Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/nativewindui/Button";
import { Text } from "@/components/nativewindui/Text";
import { Logo } from "@/components/Logo";

const FEATURES = [
  { icon: "cube-outline" as const, label: "Materialverwaltung" },
  { icon: "construct-outline" as const, label: "Werkzeug-Tracking" },
  { icon: "document-text-outline" as const, label: "Lieferscheine" },
];

function lightHaptic() {
  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export default function AuthIndexScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background">
      <View className="flex-1 justify-center px-8 py-6">
        {/* Logo + Headline */}
        <View className="items-center pb-4">
          <Logo size={56} showText={false} className="mb-4" />
          <Text className="text-center text-2xl font-bold tracking-tight text-foreground">
            LogistikApp
          </Text>
          <Text className="text-center text-sm text-muted-foreground pt-2">
            Dein Lager. Immer im Griff.
          </Text>
        </View>

        {/* Feature chips */}
        <View className="flex-row flex-wrap justify-center gap-2 pb-8">
          {FEATURES.map((f) => (
            <View
              key={f.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: "#FFF4EC",
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: "#FED7AA",
              }}
            >
              <Ionicons name={f.icon} size={15} color="#F97316" />
              <Text style={{ fontSize: 13, color: "#0F172A", fontWeight: "500" }}>
                {f.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Primary CTA */}
        <Link href="/(auth)/(create-account)" asChild>
          <Button
            size={Platform.select({ ios: "lg", default: "md" })}
            onPressOut={lightHaptic}
          >
            <Text className="text-white font-semibold">Mit E-Mail fortfahren</Text>
          </Button>
        </Link>

        {/* Divider */}
        <View className="flex-row items-center py-6">
          <View className="flex-1 border-t border-border" />
          <Text className="px-3 text-sm text-muted-foreground">ODER</Text>
          <View className="flex-1 border-t border-border" />
        </View>

        {/* Login link */}
        <View className="items-center">
          <Text className="text-sm text-muted-foreground">
            Bereits registriert?
          </Text>
          <Link href="/(auth)/(login)" asChild>
            <Button variant="plain" onPressOut={lightHaptic}>
              <Text className="text-primary font-medium">Anmelden</Text>
            </Button>
          </Link>
        </View>

        {/* Terms */}
        <View className="items-center pt-8">
          <Text className="text-center text-xs text-muted-foreground px-4">
            Mit der Nutzung stimmst du unseren AGB und Datenschutzrichtlinien zu.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
