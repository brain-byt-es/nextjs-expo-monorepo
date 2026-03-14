import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import type { Auth } from "better-auth";

// Construct the full auth type from better-auth's exported Auth generic,
// parameterised with the plugins we actually use. No runtime variable needed.
type AuthInstance = Auth<{
  plugins: [ReturnType<typeof nextCookies>, ReturnType<typeof admin>];
  database: { type: "postgres"; url: string };
}>;

let authInstance: AuthInstance | null = null;

function initAuth(): AuthInstance {
  if (authInstance) return authInstance;

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  authInstance = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3003",
    basePath: "/api/auth",
    secret: process.env.BETTER_AUTH_SECRET || "dev-secret-key",
    plugins: [
      nextCookies(),
      admin(),
    ],
    database: {
      type: "postgres",
      url: databaseUrl,
    },
  }) as unknown as AuthInstance;

  return authInstance;
}

export const auth = new Proxy({} as AuthInstance, {
  get(_, prop) {
    return (initAuth() as Record<string | symbol, unknown>)[prop];
  },
  has(_, prop) {
    return prop in initAuth();
  },
});

export function getAuth() {
  return auth;
}

export type Session = NonNullable<Awaited<ReturnType<AuthInstance["api"]["getSession"]>>>;
