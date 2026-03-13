import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";

/**
 * Login screen — replace with NativewindUI template
 */
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/(app)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 32, textAlign: "center" }}>
        Sign In
      </Text>

      {error ? (
        <Text style={{ color: "red", marginBottom: 16, textAlign: "center" }}>{error}</Text>
      ) : null}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 24 }}
      />

      <Pressable
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: "#000",
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "600" }}>Sign In</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)/signup")} style={{ marginTop: 16 }}>
        <Text style={{ textAlign: "center", color: "#666" }}>
          Don't have an account? <Text style={{ color: "#000", fontWeight: "600" }}>Sign Up</Text>
        </Text>
      </Pressable>
    </View>
  );
}
