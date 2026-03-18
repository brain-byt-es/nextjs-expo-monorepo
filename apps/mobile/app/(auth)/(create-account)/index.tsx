import * as Haptics from "expo-haptics";
import { Link, router } from "expo-router";
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

export default function InfoScreen() {
  const [error, setError] = React.useState("");
  const insets = useSafeAreaInsets();
  const [focusedTextField, setFocusedTextField] = React.useState<
    "first-name" | "last-name" | null
  >(null);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");

  function onSubmit() {
    if (!firstName) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      setError("Vorname ist erforderlich");
      return;
    }
    if (!lastName) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      setError("Nachname ist erforderlich");
      return;
    }
    setError("");
    router.push({
      pathname: "/(auth)/(create-account)/credentials",
      params: { name: `${firstName} ${lastName}` },
    });
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
                ios: "Wie heisst du?",
                default: "Konto erstellen",
              })}
            </Text>
            {Platform.OS !== "ios" && (
              <Text className="ios:text-sm text-muted-foreground text-center">
                Wie heisst du?
              </Text>
            )}
          </View>
          <View className="ios:pt-4 pt-6">
            <Form className="gap-2">
              <FormSection className="ios:bg-background">
                <FormItem>
                  <TextField
                    onChangeText={setFirstName}
                    placeholder={Platform.select({
                      ios: "Vorname",
                      default: "",
                    })}
                    label={Platform.select({
                      ios: undefined,
                      default: "Vorname",
                    })}
                    onSubmitEditing={() =>
                      KeyboardController.setFocusTo("next")
                    }
                    submitBehavior="submit"
                    autoFocus
                    onFocus={() => setFocusedTextField("first-name")}
                    onBlur={() => setFocusedTextField(null)}
                    textContentType="givenName"
                    returnKeyType="next"
                    errorMessage={
                      error.includes("Vorname") ? error : undefined
                    }
                  />
                </FormItem>
                <FormItem>
                  <TextField
                    onChangeText={setLastName}
                    placeholder={Platform.select({
                      ios: "Nachname",
                      default: "",
                    })}
                    label={Platform.select({
                      ios: undefined,
                      default: "Nachname",
                    })}
                    onFocus={() => setFocusedTextField("last-name")}
                    onBlur={() => setFocusedTextField(null)}
                    textContentType="familyName"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={onSubmit}
                    errorMessage={
                      error.includes("Nachname") ? error : undefined
                    }
                  />
                </FormItem>
              </FormSection>
            </Form>
          </View>
        </View>
      </KeyboardAwareScrollView>
      <KeyboardStickyView
        offset={{
          closed: 0,
          opened: Platform.select({
            ios: insets.bottom + 30,
            default: insets.bottom,
          }),
        }}
      >
        {Platform.OS === "ios" ? (
          <View className="px-12 py-4">
            <Button size="lg" onPress={onSubmit}>
              <Text>Weiter</Text>
            </Button>
          </View>
        ) : (
          <View className="flex-row justify-between py-4 pl-6 pr-8">
            <Link href="/(auth)/(login)" asChild replace>
              <Button variant="plain" className="px-2">
                <Text className="text-primary text-sm">
                  Bereits registriert?
                </Text>
              </Button>
            </Link>
            <Button
              onPress={() => {
                if (focusedTextField === "first-name") {
                  KeyboardController.setFocusTo("next");
                  return;
                }
                KeyboardController.dismiss();
                onSubmit();
              }}
            >
              <Text className="text-sm">Weiter</Text>
            </Button>
          </View>
        )}
      </KeyboardStickyView>
      {Platform.OS === "ios" && (
        <Link href="/(auth)/(login)" asChild replace>
          <Button variant="plain">
            <Text className="text-primary text-sm">
              Bereits registriert?
            </Text>
          </Button>
        </Link>
      )}
    </View>
  );
}
