/**
 * Pure-JS shim for the `burnt` native module — works in Expo Go.
 * Uses ToastAndroid on Android, and a global event emitter for iOS.
 */
import { Platform, ToastAndroid } from "react-native";
import { EventEmitter } from "events";

export interface ToastOptions {
  title: string;
  message?: string;
  preset?: "done" | "error" | "none" | "spinner";
  duration?: number;
}

export const toastEmitter = new EventEmitter();

export function toast(options: ToastOptions) {
  const text = options.message
    ? `${options.title}\n${options.message}`
    : options.title;

  if (Platform.OS === "android") {
    ToastAndroid.show(text, ToastAndroid.SHORT);
  } else {
    // iOS: emit event for ToastProvider to show
    toastEmitter.emit("toast", options);
  }
}

export default { toast };
