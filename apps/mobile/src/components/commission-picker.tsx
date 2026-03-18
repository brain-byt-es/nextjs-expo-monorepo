import { useEffect, useState } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  FlatList,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { toast } from "burnt";

import { ActivityIndicator } from "@/components/nativewindui/ActivityIndicator";
import { Text } from "@/components/nativewindui/Text";
import { type Commission, getCommissions } from "@/lib/api";
import { addToCommission } from "@/lib/scan-actions";

export interface CommissionPickerItem {
  type: "material" | "tool";
  id: string;
  quantity: number;
}

interface CommissionPickerProps {
  item: CommissionPickerItem | null;
  onDismiss: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
};

const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  open: { text: "#0d9488", bg: "#f0fdfa" },
  in_progress: { text: "#f97316", bg: "#fff7ed" },
};

export function CommissionPicker({ item, onDismiss }: CommissionPickerProps) {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const visible = item !== null;

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getCommissions(["open", "in_progress"])
      .then((res) => setCommissions(res.data))
      .catch(() => setCommissions([]))
      .finally(() => setLoading(false));
  }, [visible]);

  async function handleSelect(commission: Commission) {
    if (!item || adding) return;

    setAdding(commission.id);
    try {
      await addToCommission(commission.id, item.type, item.id, item.quantity);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast({
        title: "Hinzugefügt",
        message: `${item.quantity}× zu „${commission.name}" hinzugefügt`,
        preset: "done",
      });
      onDismiss();
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast({
        title: "Fehler",
        message: err instanceof Error ? err.message : "Unbekannter Fehler",
        preset: "error",
      });
    } finally {
      setAdding(null);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet} className="bg-card">
        {/* Handle */}
        <View className="w-10 h-1 rounded-full bg-muted-foreground/30 self-center mb-4" />

        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text variant="title2" className="font-bold">
            Lieferschein wählen
          </Text>
          <TouchableOpacity onPress={onDismiss} hitSlop={12}>
            <Ionicons name="close-circle-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="items-center py-10 gap-3">
            <ActivityIndicator />
            <Text className="text-muted-foreground text-sm">Lade Lieferscheine…</Text>
          </View>
        ) : commissions.length === 0 ? (
          <View className="items-center py-10 gap-3">
            <Ionicons name="document-text-outline" size={40} color="#6b7280" />
            <Text className="text-muted-foreground text-center text-sm">
              Keine offenen Lieferscheine vorhanden.
            </Text>
          </View>
        ) : (
          <FlatList
            data={commissions}
            keyExtractor={(c) => c.id}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View className="h-px bg-border mx-1" />
            )}
            renderItem={({ item: commission }) => {
              const isAdding = adding === commission.id;
              const statusStyle = STATUS_COLOR[commission.status] ?? {
                text: "#6b7280",
                bg: "#f3f4f6",
              };

              return (
                <TouchableOpacity
                  onPress={() => handleSelect(commission)}
                  disabled={!!adding}
                  className="flex-row items-center justify-between py-3.5 px-1 active:opacity-60"
                >
                  <View className="flex-1 gap-0.5 mr-3">
                    <Text className="font-semibold text-base" numberOfLines={1}>
                      {commission.name}
                    </Text>
                    {(commission.number ?? commission.manualNumber) ? (
                      <Text className="text-xs text-muted-foreground">
                        #{commission.manualNumber ?? commission.number}
                      </Text>
                    ) : null}
                    {commission.customerName ? (
                      <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                        {commission.customerName}
                      </Text>
                    ) : null}
                  </View>

                  <View className="flex-row items-center gap-2">
                    <View
                      className="rounded-full px-2.5 py-0.5"
                      style={{ backgroundColor: statusStyle.bg }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: statusStyle.text }}
                      >
                        {STATUS_LABEL[commission.status] ?? commission.status}
                      </Text>
                    </View>
                    {isAdding ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color="#6b7280" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        <TouchableOpacity onPress={onDismiss} className="mt-4 py-3 items-center">
          <Text className="text-muted-foreground text-sm">Abbrechen</Text>
        </TouchableOpacity>
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
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
});
