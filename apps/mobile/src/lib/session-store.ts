import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isDemoMode } from "./demo/config";
import { DEMO_SESSION } from "./demo/data";

const SESSION_KEY = "auth_session";

export interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    image?: string;
  };
  token: string;
}

type SessionListener = (session: Session | null) => void;

const listeners = new Set<SessionListener>();
let currentSession: Session | null = null;
let loaded = false;

// Demo mode: session is set on-demand via startDemoSession(), not at module init

function notify() {
  for (const listener of listeners) {
    listener(currentSession);
  }
}

export async function loadSession(): Promise<Session | null> {
  if (loaded) return currentSession;
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    currentSession = raw ? JSON.parse(raw) : null;
  } catch {
    currentSession = null;
  }
  loaded = true;
  notify();
  return currentSession;
}

export async function setSession(session: Session | null) {
  currentSession = session;
  if (!isDemoMode) {
    if (session) {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      await AsyncStorage.removeItem(SESSION_KEY);
    }
  }
  notify();
}

export function getSession(): Session | null {
  return currentSession;
}

/**
 * React hook — reactive session state
 */
export function useSession() {
  const [session, setLocal] = useState<Session | null>(currentSession);
  const [isPending, setIsPending] = useState(!loaded);

  useEffect(() => {
    const listener: SessionListener = (s) => {
      setLocal(s);
      setIsPending(false);
    };
    listeners.add(listener);

    // Ensure session is loaded
    if (!loaded) {
      loadSession().then(() => {
        setLocal(currentSession);
        setIsPending(false);
      });
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const refresh = useCallback(async () => {
    setIsPending(true);
    loaded = false;
    await loadSession();
  }, []);

  return {
    data: session ? { user: session.user } : null,
    session,
    isPending,
    refresh,
  };
}
