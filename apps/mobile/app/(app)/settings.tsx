import { View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "@/lib/session-store";
import { signOut } from "@/lib/auth-client";

/**
 * Settings screen — replace with NativewindUI template
 */
export default function SettingsScreen() {
  const { data } = useSession();
  const router = useRouter();

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 60 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24 }}>
        Settings
      </Text>

      <View style={{ backgroundColor: "#f5f5f5", borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <Text style={{ fontWeight: "600", marginBottom: 4 }}>Account</Text>
        <Text style={{ color: "#666" }}>{data?.user.name || "—"}</Text>
        <Text style={{ color: "#666" }}>{data?.user.email || "—"}</Text>
      </View>

      <Pressable
        onPress={handleSignOut}
        style={{
          backgroundColor: "#dc2626",
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
          marginTop: 24,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>Sign Out</Text>
      </Pressable>
    </View>
  );
}
