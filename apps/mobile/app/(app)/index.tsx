import { View, Text } from "react-native";
import { useSession } from "@/lib/session-store";

/**
 * Dashboard/Home screen — replace with NativewindUI template
 */
export default function HomeScreen() {
  const { data } = useSession();

  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 60 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
        Welcome{data?.user.name ? `, ${data.user.name}` : ""}
      </Text>
      <Text style={{ color: "#666", marginBottom: 24 }}>
        {data?.user.email}
      </Text>

      <View style={{ backgroundColor: "#f5f5f5", borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <Text style={{ fontWeight: "600", marginBottom: 4 }}>Subscription</Text>
        <Text style={{ color: "#666" }}>Free Plan</Text>
      </View>
    </View>
  );
}
