/**
 * Auth Client for React Native / Expo
 * Uses Better-Auth API via HTTP + local session store
 */

import * as Sentry from "@sentry/react-native";
import {
  setSession,
  getSession,
  useSession,
  type Session,
} from "./session-store";
import { isDemoMode } from "./demo/config";
import { DEMO_SESSION, DEMO_ORG_ID } from "./demo/data";
import { unregisterPushNotifications } from "./notifications";
import { clearQueue } from "./offline-queue";

export { useSession } from "./session-store";

const API_URL = process.env.EXPO_PUBLIC_APP_URL || "http://localhost:3003";

async function authFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const session = getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || res.statusText);
  }

  return res.json();
}

export async function signIn(email: string, password: string) {
  if (isDemoMode) {
    await setSession(DEMO_SESSION);
    return { user: DEMO_SESSION.user, token: DEMO_SESSION.token };
  }
  try {
    const res = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || res.statusText);
    }

    const data = await res.json();

    // Bearer plugin returns token in header; fallback to top-level body field
    const headerToken = res.headers.get("set-auth-token");
    const token = headerToken || data.token || "";

    await setSession({ user: data.user, token });
    return { user: data.user, token };
  } catch (error) {
    Sentry.captureException(error, { tags: { action: "sign_in" } });
    throw error;
  }
}

export async function signUp(
  email: string,
  password: string,
  name?: string
) {
  if (isDemoMode) {
    await setSession(DEMO_SESSION);
    return { user: DEMO_SESSION.user, token: DEMO_SESSION.token };
  }
  try {
    const res = await fetch(`${API_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || res.statusText);
    }

    const data = await res.json();

    // Bearer plugin returns token in header; fallback to top-level body field
    const headerToken = res.headers.get("set-auth-token");
    const token = headerToken || data.token || "";

    await setSession({ user: data.user, token });

    // Send welcome email (fire-and-forget)
    sendWelcomeEmail(name || "", email).catch(() => {});

    return { user: data.user, token };
  } catch (error) {
    Sentry.captureException(error, { tags: { action: "sign_up" } });
    throw error;
  }
}

export async function forgotPassword(email: string) {
  try {
    await authFetch<{ success: boolean }>("/api/auth/forget-password", {
      method: "POST",
      body: JSON.stringify({ email, redirectTo: `${API_URL}/reset-password` }),
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { action: "forgot_password" } });
    throw error;
  }
}

export async function signOut() {
  await clearQueue();
  if (isDemoMode) {
    await setSession(null);
    return;
  }

  // Deactivate the push token on the server before clearing the session so
  // we still have the auth token available for the API call.
  await unregisterPushNotifications();

  try {
    await authFetch("/api/auth/sign-out", { method: "POST" });
  } catch {
    // Best-effort server logout
  }
  await setSession(null);
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/**
 * Start a demo session — sets fake user + org, navigates to app.
 * Called from the "Demo Modus" button on the auth landing screen.
 */
export async function startDemoSession() {
  const { setOrgId } = await import("./org-store");
  await setSession(DEMO_SESSION);
  await setOrgId(DEMO_ORG_ID);
}

async function sendWelcomeEmail(name: string, email: string) {
  try {
    await fetch(`${API_URL}/api/email/welcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { action: "send_welcome_email" } });
  }
}
