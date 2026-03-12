/**
 * Better-Auth Client for React Native / Expo
 * Lazy-initialized to avoid module load errors in React Native
 * Falls back to mock client if better-auth/react is not available
 */

let authClientInstance: any = null;

function getAuthClient() {
  if (authClientInstance) return authClientInstance;

  try {
    const { createAuthClient } = require("better-auth/react");
    authClientInstance = createAuthClient({
      baseURL: process.env.EXPO_PUBLIC_APP_URL || "http://localhost:3003",
    });
  } catch (error) {
    console.warn(
      "Better-Auth client not available in React Native context, using mock:",
      error instanceof Error ? error.message : error
    );
    // Return mock client for React Native
    authClientInstance = {
      getSession: async () => null,
      signIn: async () => null,
      signUp: async () => null,
      signOut: async () => null,
    };
  }

  return authClientInstance;
}

export const authClient = getAuthClient();

// Export auth methods
export async function signIn(email: string, password: string) {
  return getAuthClient().signIn?.({ email, password });
}

export async function signUp(email: string, password: string, name?: string) {
  return getAuthClient().signUp?.({ email, password, name });
}

export async function signOut() {
  return getAuthClient().signOut?.();
}

// Mock useSession hook for React Native (better-auth/react hooks don't work in RN)
export function useSession() {
  return { data: null, status: "unauthenticated" };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  try {
    const session = await getAuthClient().getSession?.();
    return !!session;
  } catch {
    return false;
  }
}

/**
 * Get current user session
 */
export async function getCurrentSession() {
  try {
    return await getAuthClient().getSession?.();
  } catch {
    return null;
  }
}
