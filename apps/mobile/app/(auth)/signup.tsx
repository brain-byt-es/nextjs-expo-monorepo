import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { signUp } from "@/lib/auth-client";

/**
 * Signup screen — replace with NativewindUI template
 */
export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError("");
    setLoading(true);
    try {
      await signUp(email, password, name);
      router.replace("/(app)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 32, textAlign: "center" }}>
        Create Account
      </Text>

      {error ? (
        <Text style={{ color: "red", marginBottom: 16, textAlign: "center" }}>{error}</Text>
      ) : null}

      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 }}
      />

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
        onPress={handleSignup}
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
          <Text style={{ color: "#fff", fontWeight: "600" }}>Create Account</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
        <Text style={{ textAlign: "center", color: "#666" }}>
          Already have an account? <Text style={{ color: "#000", fontWeight: "600" }}>Sign In</Text>
        </Text>
      </Pressable>
    </View>
  );
}
