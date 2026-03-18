import { useState } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { toast } from "burnt";

import { Button } from "@/components/nativewindui/Button";
import { Text } from "@/components/nativewindui/Text";
import { TextField } from "@/components/nativewindui/TextField";
import { ActivityIndicator } from "@/components/nativewindui/ActivityIndicator";
import { createMaterial } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EanData {
  found: boolean;
  barcode?: string;
  name?: string;
  manufacturer?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  source?: string;
}

interface CreateMaterialSheetProps {
  visible: boolean;
  barcode: string;
  eanData: EanData | null;
  onCreated: (id: string, name: string) => void;
  onDismiss: () => void;
}

// ── Unit options ──────────────────────────────────────────────────────────────

const UNITS = ["Stk", "m", "kg", "l", "Paar", "Packung"] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateMaterialSheet({
  visible,
  barcode,
  eanData,
  onCreated,
  onDismiss,
}: CreateMaterialSheetProps) {
  const [loading, setLoading] = useState(false);

  // Form state — pre-fill from EAN data when available
  const [name, setName] = useState(() => eanData?.name ?? "");
  const [articleNumber, setArticleNumber] = useState(() => barcode);
  const [unit, setUnit] = useState<string>("Stk");
  const [manufacturer, setManufacturer] = useState(
    () => eanData?.manufacturer ?? ""
  );
  const [notes, setNotes] = useState("");

  // Re-init fields when the sheet opens with new data
  // (using key prop on the outer Modal to remount — see usage in scanner)
  const hasEan = !!eanData?.found;

  function handleDismiss() {
    if (loading) return;
    onDismiss();
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast({ title: "Name erforderlich", preset: "error" });
      return;
    }

    setLoading(true);
    try {
      const result = await createMaterial({
        name: trimmedName,
        number: articleNumber.trim() || undefined,
        unit: unit || undefined,
        barcode: barcode || undefined,
        manufacturer: manufacturer.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast({ title: "Material angelegt", preset: "done" });
      onCreated(result.id, result.name);
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast({
        title: "Fehler",
        message: err instanceof Error ? err.message : "Unbekannter Fehler",
        preset: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet} className="bg-card">
        {/* Handle */}
        <View className="w-10 h-1 rounded-full bg-muted-foreground/30 self-center mb-4" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center">
              <Ionicons name="add-circle-outline" size={22} color="#f97316" />
            </View>
            <View className="flex-1">
              <Text variant="title2" className="font-bold">
                Neues Material anlegen
              </Text>
              {barcode ? (
                <Text className="text-xs text-muted-foreground mt-0.5">
                  Barcode: {barcode}
                </Text>
              ) : null}
            </View>
          </View>

          {/* EAN badge */}
          {hasEan && (
            <View className="flex-row items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-4">
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text className="text-sm text-green-700 font-medium">
                EAN erkannt
                {eanData?.source ? ` · ${eanData.source}` : ""}
              </Text>
              {eanData?.category ? (
                <Text className="text-xs text-green-600 ml-auto">
                  {eanData.category}
                </Text>
              ) : null}
            </View>
          )}

          {/* Form fields */}
          <View className="gap-4">
            {/* Name */}
            <View className="gap-1">
              <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Name *
              </Text>
              <TextField
                label="Materialname"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                editable={!loading}
              />
            </View>

            {/* Artikelnummer */}
            <View className="gap-1">
              <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Artikelnummer
              </Text>
              <TextField
                label="Artikelnummer"
                value={articleNumber}
                onChangeText={setArticleNumber}
                autoCapitalize="characters"
                returnKeyType="next"
                editable={!loading}
              />
            </View>

            {/* Einheit picker */}
            <View className="gap-1">
              <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Einheit
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    onPress={() => !loading && setUnit(u)}
                    className={[
                      "px-4 py-2 rounded-xl border",
                      unit === u
                        ? "bg-orange-500 border-orange-500"
                        : "bg-muted/40 border-border",
                    ].join(" ")}
                    accessibilityRole="button"
                    accessibilityState={{ selected: unit === u }}
                  >
                    <Text
                      className={[
                        "text-sm font-medium",
                        unit === u ? "text-white" : "text-foreground",
                      ].join(" ")}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Hersteller */}
            <View className="gap-1">
              <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Hersteller
              </Text>
              <TextField
                label="Hersteller"
                value={manufacturer}
                onChangeText={setManufacturer}
                autoCapitalize="words"
                returnKeyType="next"
                editable={!loading}
              />
            </View>

            {/* Notizen */}
            <View className="gap-1">
              <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notizen (optional)
              </Text>
              <TextField
                label="Notizen"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                returnKeyType="done"
                editable={!loading}
                className={Platform.OS === "ios" ? "min-h-[72px]" : undefined}
              />
            </View>
          </View>

          {/* Save button */}
          <View className="mt-6">
            {loading ? (
              <View className="items-center py-4">
                <ActivityIndicator />
              </View>
            ) : (
              <Button onPress={handleSave}>
                <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                <Text className="text-white ml-2 font-semibold">Speichern</Text>
              </Button>
            )}
          </View>

          {/* Dismiss link */}
          <TouchableOpacity
            onPress={handleDismiss}
            disabled={loading}
            className="mt-3 py-3 items-center"
          >
            <Text className="text-muted-foreground text-sm">Abbrechen</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
});
