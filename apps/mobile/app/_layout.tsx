import { useEffect } from "react";
import { Slot } from "expo-router";
import * as Sentry from "@sentry/react-native";
import { PostHogProvider } from "posthog-react-native";
import { loadSession } from "@/lib/session-store";
import { initializeRevenueCat } from "@/lib/revenue-cat";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
});

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || "";
const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

function RootLayout() {
  useEffect(() => {
    loadSession();
    initializeRevenueCat();
  }, []);

  return <Slot />;
}

function App() {
  if (POSTHOG_KEY) {
    return (
      <PostHogProvider apiKey={POSTHOG_KEY} options={{ host: POSTHOG_HOST }}>
        <RootLayout />
      </PostHogProvider>
    );
  }

  return <RootLayout />;
}

export default Sentry.wrap(App);
