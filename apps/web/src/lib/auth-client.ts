import { createAuthClient } from "better-auth/react";

const realAuthClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const authClient = realAuthClient;
export const signIn = realAuthClient.signIn;
export const signUp = realAuthClient.signUp;
export const signOut = realAuthClient.signOut;
export const useSession = () => realAuthClient.useSession();

/**
 * Update user profile (name and/or avatar image as base64 data URL)
 */
export async function updateProfile(data: { name?: string; image?: string | null }) {
  return await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/update-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  })
    .then((res) => res.json())
}

/**
 * Change user password
 */
export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}) {
  return await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  })
    .then((res) => res.json())
}
