import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { toastEmitter, ToastOptions } from "@/lib/burnt-shim";

export function ToastOverlay() {
  const [current, setCurrent] = useState<ToastOptions | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (opts: ToastOptions) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCurrent(opts);
      opacity.setValue(0);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(opts.duration ?? 2000),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setCurrent(null));
    };

    toastEmitter.on("toast", handler);
    return () => { toastEmitter.off("toast", handler); };
  }, [opacity]);

  if (!current) return null;

  const isError = current.preset === "error";

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      <View style={[styles.toast, isError && styles.toastError]}>
        <Text style={styles.title}>{current.title}</Text>
        {current.message ? (
          <Text style={styles.message} numberOfLines={2}>{current.message}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
    pointerEvents: "none",
  },
  toast: {
    backgroundColor: "rgba(30,30,30,0.92)",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxWidth: 360,
    width: "100%",
    gap: 2,
  },
  toastError: {
    backgroundColor: "rgba(180,30,30,0.92)",
  },
  title: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  message: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
  },
});
