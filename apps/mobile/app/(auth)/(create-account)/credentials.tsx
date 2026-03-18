import * as Burnt from "burnt";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import * as React from "react";
import { Platform, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardController,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/nativewindui/Button";
import { Form, FormItem, FormSection } from "@/components/nativewindui/Form";
import { Text } from "@/components/nativewindui/Text";
import { TextField } from "@/components/nativewindui/TextField";
import { Logo } from "@/components/Logo";
import { signUp } from "@/lib/auth-client";

export default function CredentialsScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const insets = useSafeAreaInsets();

  // Guard: if name is missing (e.g. deep link), redirect back
  if (!name) {
    router.replace("/(auth)/(create-account)");
    return null;
  }
  const [focusedTextField, setFocusedTextField] = React.useState<
    "email" | "password" | "confirm-password" | null
  >(null);
  const [error, setError] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit() {
    if (!email) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      setError("E-Mail ist erforderlich");
      return;
    }
    if (!password) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      setError("Passwort ist erforderlich");
      return;
    }
    if (!confirmPassword) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      setError("Bestätigung ist erforderlich");
      return;
    }
    if (password !== confirmPassword) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      setError("Passwörter stimmen nicht überein");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await signUp(email, password, name);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      router.replace("/(app)");
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      const message = raw.includes("already") || raw.includes("exists")
        ? "Diese E-Mail ist bereits registriert"
        : "Registrierung fehlgeschlagen";
      setError(message);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      Burnt.toast({
        title: "Registrierung fehlgeschlagen",
        message,
        preset: "error",
        haptic: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      className="ios:bg-card flex-1"
      style={{ paddingBottom: insets.bottom }}
    >
      <KeyboardAwareScrollView
        bottomOffset={Platform.select({ ios: 8 })}
        bounces={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="ios:pt-12 pt-20"
      >
        <View className="ios:px-12 flex-1 px-8">
          <View className="items-center pb-1">
            <Logo size={40} showText={false} />
            <Text
              variant="title1"
              className="ios:font-bold pb-1 pt-4 text-center"
            >
              {Platform.select({
                ios: "Zugangsdaten einrichten",
                default: "Konto erstellen",
              })}
            </Text>
            {Platform.OS !== "ios" && (
              <Text className="ios:text-sm text-muted-foreground text-center">
                Zugangsdaten einrichten
              </Text>
            )}
          </View>
          <View className="ios:pt-4 pt-6">
            <Form className="gap-2">
              <FormSection className="ios:bg-background">
                <FormItem>
                  <TextField
                    onChangeText={setEmail}
                    placeholder={Platform.select({
                      ios: "E-Mail",
                      default: "",
                    })}
                    label={Platform.select({
                      ios: undefined,
                      default: "E-Mail",
                    })}
                    onSubmitEditing={() =>
                      KeyboardController.setFocusTo("next")
                    }
                    submitBehavior="submit"
                    autoFocus
                    onFocus={() => setFocusedTextField("email")}
                    onBlur={() => setFocusedTextField(null)}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoCapitalize="none"
                    returnKeyType="next"
                    errorMessage={
                      error.includes("E-Mail") ? error : undefined
                    }
                  />
                </FormItem>
                <FormItem>
                  <TextField
                    onChangeText={setPassword}
                    placeholder={Platform.select({
                      ios: "Passwort",
                      default: "",
                    })}
                    label={Platform.select({
                      ios: undefined,
                      default: "Passwort",
                    })}
                    onSubmitEditing={() =>
                      KeyboardController.setFocusTo("next")
                    }
                    onFocus={() => setFocusedTextField("password")}
                    onBlur={() => setFocusedTextField(null)}
                    submitBehavior="submit"
                    secureTextEntry
                    returnKeyType="next"
                    textContentType="newPassword"
                    errorMessage={
                      error.includes("Passwort") &&
                      !error.includes("Bestätigung") &&
                      !error.includes("stimmen")
                        ? error
                        : undefined
                    }
                  />
                </FormItem>
                <FormItem>
                  <TextField
                    onChangeText={setConfirmPassword}
                    placeholder={Platform.select({
                      ios: "Passwort bestätigen",
                      default: "",
                    })}
                    label={Platform.select({
                      ios: undefined,
                      default: "Passwort bestätigen",
                    })}
                    onFocus={() => setFocusedTextField("confirm-password")}
                    onBlur={() => setFocusedTextField(null)}
                    onSubmitEditing={onSubmit}
                    secureTextEntry
                    returnKeyType="done"
                    textContentType="newPassword"
                    errorMessage={
                      error.includes("Bestätigung") || error.includes("stimmen")
                        ? error
                        : undefined
                    }
                  />
                </FormItem>
              </FormSection>
            </Form>
          </View>
        </View>
      </KeyboardAwareScrollView>
      <KeyboardStickyView
        offset={{ closed: 0, opened: insets.bottom }}
      >
        {Platform.OS === "ios" ? (
          <View className="px-12 py-4">
            <Button size="lg" onPress={onSubmit} disabled={loading}>
              <Text>{loading ? "Wird erstellt..." : "Registrieren"}</Text>
            </Button>
          </View>
        ) : (
          <View className="flex-row justify-end py-4 pl-6 pr-8">
            <Button
              disabled={loading}
              onPress={() => {
                if (focusedTextField !== "confirm-password") {
                  KeyboardController.setFocusTo("next");
                  return;
                }
                KeyboardController.dismiss();
                onSubmit();
              }}
            >
              <Text className="text-sm">
                {focusedTextField !== "confirm-password" ? "Weiter" : "Registrieren"}
              </Text>
            </Button>
          </View>
        )}
      </KeyboardStickyView>
    </View>
  );
}
