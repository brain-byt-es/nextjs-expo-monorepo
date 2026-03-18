import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useState, useEffect } from "react";

let currentlyOnline = true;

type ConnectivityListener = (isOnline: boolean) => void;
const listeners = new Set<ConnectivityListener>();

// Subscribe to NetInfo at module level
NetInfo.addEventListener((state: NetInfoState) => {
  const online = !!(state.isConnected && state.isInternetReachable !== false);
  if (online !== currentlyOnline) {
    currentlyOnline = online;
    for (const listener of listeners) {
      listener(online);
    }
  }
});

export function isOnline(): boolean {
  return currentlyOnline;
}

export function onConnectivityChange(callback: ConnectivityListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function useIsOnline(): boolean {
  const [online, setOnline] = useState(currentlyOnline);
  useEffect(() => {
    const unsub = onConnectivityChange(setOnline);
    return unsub;
  }, []);
  return online;
}
