import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSession } from "@/lib/session-store";

const ONBOARDING_KEY = "@logistikapp/onboarding-complete";

export default function Index() {
  const { data, isPending } = useSession();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) =>
      setOnboardingDone(val === "true")
    );
  }, []);

  if (isPending || onboardingDone === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!onboardingDone) {
    return <Redirect href="/welcome" />;
  }

  if (data) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)" />;
}
