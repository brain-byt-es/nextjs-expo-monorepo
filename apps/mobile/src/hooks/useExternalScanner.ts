import { useEffect, useRef, useCallback } from "react";
import { DeviceEventEmitter, Platform, NativeEventEmitter, NativeModules } from "react-native";

// ---------------------------------------------------------------------------
// useExternalScanner — detect barcode scans from Bluetooth / USB-OTG scanners
// ---------------------------------------------------------------------------
// Hardware barcode scanners in "keyboard-wedge" mode fire rapid key events
// followed by an Enter key. We detect this pattern by checking inter-keystroke
// timing (<50ms between chars = scanner, not human typing).
// ---------------------------------------------------------------------------

interface ExternalScannerOptions {
  /** Minimum barcode length to accept (default 4) */
  minLength?: number;
  /** Max interval in ms between keystrokes to count as scanner input (default 50) */
  maxKeystrokeInterval?: number;
  /** Whether the hook is active (default true) */
  enabled?: boolean;
}

/**
 * Hook that listens for external barcode scanner input (Bluetooth / USB-OTG).
 *
 * Works on both Android and iOS by intercepting rapid keystroke sequences
 * that end with Enter — the hallmark of a hardware barcode scanner in
 * keyboard-wedge mode.
 *
 * @param onScan Callback fired with the scanned barcode string
 * @param options Configuration for detection sensitivity
 */
export function useExternalScanner(
  onScan: (barcode: string) => void,
  options: ExternalScannerOptions = {}
) {
  const {
    minLength = 4,
    maxKeystrokeInterval = 50,
    enabled = true,
  } = options;

  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScanRef = useRef(onScan);

  // Keep callback ref fresh without re-subscribing
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const resetBuffer = useCallback(() => {
    bufferRef.current = "";
    lastKeyTimeRef.current = 0;
  }, []);

  const processKey = useCallback(
    (key: string) => {
      if (!enabled) return;

      const now = Date.now();
      const elapsed = now - lastKeyTimeRef.current;

      // If too much time has passed since the last keystroke, start fresh
      if (lastKeyTimeRef.current > 0 && elapsed > maxKeystrokeInterval) {
        resetBuffer();
      }

      lastKeyTimeRef.current = now;

      // Enter key signals end of barcode
      if (key === "Enter" || key === "\n" || key === "\r") {
        const barcode = bufferRef.current.trim();
        if (barcode.length >= minLength) {
          onScanRef.current(barcode);
        }
        resetBuffer();
        return;
      }

      // Only accept printable characters
      if (key.length === 1) {
        bufferRef.current += key;
      }

      // Safety: clear buffer after timeout in case Enter is never received
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        resetBuffer();
      }, 300);
    },
    [enabled, maxKeystrokeInterval, minLength, resetBuffer]
  );

  useEffect(() => {
    if (!enabled) return;

    // ── Android: Listen to hardware key events via DeviceEventEmitter ──
    // Many RN keyboard-event libraries dispatch "hardwareKeyPress" or
    // similar events. We also listen for the generic "keyPress" event
    // from TextInput's onKeyPress forwarded via the emitter.
    const subscriptions: Array<{ remove: () => void }> = [];

    if (Platform.OS === "android") {
      // Standard hardware keyboard event (from react-native-keyevent or similar)
      const sub1 = DeviceEventEmitter.addListener(
        "onKeyDown",
        (event: { keyCode?: number; pressedKey?: string }) => {
          const key = event.pressedKey ?? "";
          processKey(key);
        }
      );
      subscriptions.push(sub1);

      // Fallback: some scanner libraries emit "onBarcodeScanned" directly
      const sub2 = DeviceEventEmitter.addListener(
        "onBarcodeScanned",
        (event: { barcode?: string; data?: string }) => {
          const barcode = event.barcode ?? event.data ?? "";
          if (barcode.length >= minLength) {
            onScanRef.current(barcode);
          }
        }
      );
      subscriptions.push(sub2);
    }

    // ── iOS: Bluetooth scanner events come through the keyboard system ──
    if (Platform.OS === "ios") {
      // iOS hardware keyboards (including BT scanners) dispatch key commands.
      // We listen via DeviceEventEmitter for libraries that bridge these events.
      const sub = DeviceEventEmitter.addListener(
        "onKeyDown",
        (event: { keyCode?: number; pressedKey?: string }) => {
          const key = event.pressedKey ?? "";
          processKey(key);
        }
      );
      subscriptions.push(sub);
    }

    return () => {
      subscriptions.forEach((s) => s.remove());
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, processKey, minLength]);

  return { resetBuffer };
}

// ---------------------------------------------------------------------------
// useHiddenTextInputScanner — fallback approach using a hidden TextInput
// ---------------------------------------------------------------------------
// Some scanners work better with a focused TextInput. This hook provides the
// props to spread onto a hidden <TextInput> that captures scanner input.
// ---------------------------------------------------------------------------

interface HiddenInputScannerResult {
  /** Props to spread onto a hidden TextInput */
  inputProps: {
    value: string;
    onChangeText: (text: string) => void;
    onSubmitEditing: () => void;
    autoFocus: boolean;
    showSoftInputOnFocus: boolean;
    blurOnSubmit: boolean;
    caretHidden: boolean;
    style: { position: "absolute"; opacity: number; width: number; height: number };
  };
}

/**
 * Fallback scanner hook using a hidden TextInput.
 *
 * Usage:
 * ```tsx
 * const { inputProps } = useHiddenTextInputScanner((barcode) => {
 *   console.log("Scanned:", barcode);
 * });
 *
 * return <TextInput {...inputProps} />;
 * ```
 */
export function useHiddenTextInputScanner(
  onScan: (barcode: string) => void,
  options: { minLength?: number; enabled?: boolean } = {}
): HiddenInputScannerResult {
  const { minLength = 4, enabled = true } = options;
  const bufferRef = useRef("");
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const onChangeText = useCallback(
    (text: string) => {
      if (!enabled) return;
      bufferRef.current = text;
    },
    [enabled]
  );

  const onSubmitEditing = useCallback(() => {
    const barcode = bufferRef.current.trim();
    if (barcode.length >= minLength) {
      onScanRef.current(barcode);
    }
    bufferRef.current = "";
  }, [minLength]);

  return {
    inputProps: {
      value: bufferRef.current,
      onChangeText,
      onSubmitEditing,
      autoFocus: enabled,
      showSoftInputOnFocus: false, // Don't show software keyboard
      blurOnSubmit: false,
      caretHidden: true,
      style: { position: "absolute" as const, opacity: 0, width: 1, height: 1 },
    },
  };
}
