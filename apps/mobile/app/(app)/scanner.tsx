import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

import { LargeTitleHeader } from "@/components/nativewindui/LargeTitleHeader";
import { ActivityIndicator } from "@/components/nativewindui/ActivityIndicator";
import { Text } from "@/components/nativewindui/Text";
import { BarcodeCamera } from "@/components/barcode-camera";
import { ScanResultSheet } from "@/components/scan-result-sheet";
import { CommissionPicker, type CommissionPickerItem } from "@/components/commission-picker";
import { scanBarcode, type ScanResult } from "@/lib/api";

export default function ScannerScreen() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isLooking, setIsLooking] = useState(false);
  const [pickCommissionFor, setPickCommissionFor] =
    useState<CommissionPickerItem | null>(null);

  const handleScanned = useCallback(
    async (barcode: string) => {
      if (isLooking || scanResult !== null) return;

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsLooking(true);

      try {
        const result = await scanBarcode(barcode);
        setScanResult(result);
      } catch {
        setScanResult({ type: null, item: null });
      } finally {
        setIsLooking(false);
      }
    },
    [isLooking, scanResult]
  );

  function handleDismiss() {
    setScanResult(null);
  }

  function handleAddToCommission(
    itemType: "material" | "tool",
    itemId: string,
    quantity: number
  ) {
    // Dismiss the scan sheet first, then open the commission picker
    setScanResult(null);
    setPickCommissionFor({ type: itemType, id: itemId, quantity });
  }

  function handleCommissionPickerDismiss() {
    setPickCommissionFor(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LargeTitleHeader title="Scanner" backgroundColor="transparent" />
      </View>

      <BarcodeCamera
        onScanned={handleScanned}
        isActive={!isLooking && scanResult === null && pickCommissionFor === null}
      />

      {/* Loading indicator during lookup */}
      {isLooking && (
        <View style={styles.lookingOverlay}>
          <View className="bg-black/70 rounded-2xl px-6 py-4 items-center gap-2">
            <ActivityIndicator color="white" />
            <Text className="text-white text-sm">Suche…</Text>
          </View>
        </View>
      )}

      <ScanResultSheet
        result={scanResult}
        onDismiss={handleDismiss}
        onAddToCommission={handleAddToCommission}
      />

      <CommissionPicker
        item={pickCommissionFor}
        onDismiss={handleCommissionPickerDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  lookingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
});
