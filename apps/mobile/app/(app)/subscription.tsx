import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
} from "@/lib/revenue-cat";

/**
 * Subscription/Paywall screen — replace with NativewindUI template
 */
export default function SubscriptionScreen() {
  const [loading, setLoading] = useState(false);

  async function handlePurchase(packageId: string) {
    setLoading(true);
    try {
      await purchasePackage(packageId);
      Alert.alert("Success", "Subscription activated!");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setLoading(true);
    try {
      await restorePurchases();
      Alert.alert("Success", "Purchases restored");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Restore failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 60 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
        Upgrade
      </Text>
      <Text style={{ color: "#666", marginBottom: 32 }}>
        Unlock all features with a Pro subscription.
      </Text>

      <Pressable
        onPress={() => handlePurchase("$rc_monthly")}
        disabled={loading}
        style={{
          backgroundColor: "#000",
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 12,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "600" }}>Subscribe Monthly</Text>
        )}
      </Pressable>

      <Pressable
        onPress={handleRestore}
        disabled={loading}
        style={{ marginTop: 24, alignItems: "center" }}
      >
        <Text style={{ color: "#666" }}>Restore Purchases</Text>
      </Pressable>
    </View>
  );
}
