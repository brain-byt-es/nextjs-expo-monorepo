import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { ScrollView, View, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ActivityIndicator } from "@/components/nativewindui/ActivityIndicator";
import { Button } from "@/components/nativewindui/Button";
import { Card } from "@/components/nativewindui/Card";
import { Text } from "@/components/nativewindui/Text";
import { useSession } from "@/lib/session-store";
import { getDashboardStats, type DashboardStats } from "@/lib/api";

export default function HomeScreen() {
  const { data } = useSession();
  const user = data?.user;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch {
      // Keep showing last known data or null
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]} className="bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Title — matches iOS Large Title style */}
        <Text variant="largeTitle" className="font-bold">
          Übersicht
        </Text>

        {/* Greeting */}
        <Card className="p-4">
          <Text variant="heading">
            {firstName ? `Hallo, ${firstName}!` : "Willkommen!"}
          </Text>
          <Text className="text-muted-foreground text-sm mt-0.5">
            {user?.email}
          </Text>
        </Card>

        {/* Quick Actions */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Button
            variant="tonal"
            className="flex-1"
            onPress={() => router.push("/(app)/scanner")}
          >
            <Ionicons name="barcode-outline" size={18} />
            <Text>Scannen</Text>
          </Button>
          <Button
            variant="tonal"
            className="flex-1"
            onPress={() => router.push("/(app)/commissions")}
          >
            <Ionicons name="add-outline" size={18} />
            <Text>Lieferschein</Text>
          </Button>
        </View>

        {/* KPI Cards */}
        {loading ? (
          <View className="items-center py-8">
            <ActivityIndicator />
          </View>
        ) : stats ? (
          <>
            <View className="gap-3">
              <View className="flex-row gap-3">
                <KpiCard label="Materialien" value={stats.materials} icon="cube" color="#f97316" bg="#fff7ed" />
                <KpiCard label="Werkzeuge" value={stats.tools} icon="construct" color="#0d9488" bg="#f0fdfa" />
              </View>
              <View className="flex-row gap-3">
                <KpiCard label="Schlüssel" value={stats.keys} icon="key" color="#6366f1" bg="#eef2ff" />
                <KpiCard label="Benutzer" value={`${stats.users}/${stats.maxUsers}`} icon="people" color="#64748b" bg="#f8fafc" />
              </View>
            </View>

            {/* Alerts */}
            {(stats.lowStockCount > 0 || stats.expiringCount > 0 || stats.overdueToolsCount > 0) && (
              <Card className="p-4 gap-2">
                <Text variant="subhead" className="font-semibold mb-1">Hinweise</Text>
                {stats.lowStockCount > 0 && (
                  <AlertRow label="Meldebestand" count={stats.lowStockCount} icon="warning" color="#ef4444" />
                )}
                {stats.expiringCount > 0 && (
                  <AlertRow label="Läuft ab" count={stats.expiringCount} icon="time" color="#f97316" />
                )}
                {stats.overdueToolsCount > 0 && (
                  <AlertRow label="Überfällige Werkzeuge" count={stats.overdueToolsCount} icon="alert-circle" color="#8b5cf6" />
                )}
              </Card>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function KpiCard({ label, value, icon, color, bg }: {
  label: string;
  value: number | string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  bg: string;
}) {
  return (
    <View className="flex-1">
      <Card className="p-4 gap-1.5">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: bg }}
        >
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text className="text-2xl font-bold tabular-nums">{value}</Text>
        <Text className="text-xs text-muted-foreground">{label}</Text>
      </Card>
    </View>
  );
}

function AlertRow({ label, count, icon, color }: {
  label: string;
  count: number;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return (
    <View className="flex-row items-center gap-3 py-1">
      <Ionicons name={icon} size={18} color={color} />
      <Text className="flex-1 text-sm">{label}</Text>
      <View style={{ backgroundColor: color + "18" }} className="px-2 py-0.5 rounded-full">
        <Text style={{ color }} className="text-xs font-semibold">{count}</Text>
      </View>
    </View>
  );
}
