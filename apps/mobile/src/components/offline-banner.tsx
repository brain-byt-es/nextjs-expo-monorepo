import { View } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { Ionicons } from "@expo/vector-icons";
import { useIsOnline } from "@/lib/connectivity";
import { useQueue } from "@/lib/offline-queue";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function OfflineBanner() {
  const online = useIsOnline();
  const { pendingCount } = useQueue();
  const insets = useSafeAreaInsets();

  if (online && pendingCount === 0) return null;

  const message = !online
    ? "Offline — Änderungen werden gespeichert"
    : `Synchronisiere... (${pendingCount})`;
  const bgColor = !online ? "#F59E0B" : "#3B82F6";
  const icon = !online ? "cloud-offline" : "sync";

  return (
    <View
      style={{
        position: "absolute",
        top: insets.top,
        left: 0,
        right: 0,
        zIndex: 999,
        backgroundColor: bgColor,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 6,
        gap: 6,
      }}
      pointerEvents="none"
    >
      <Ionicons name={icon as any} size={14} color="#fff" />
      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
        {message}
      </Text>
    </View>
  );
}
