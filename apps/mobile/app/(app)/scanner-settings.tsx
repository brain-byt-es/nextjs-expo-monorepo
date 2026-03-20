import { useState, useCallback, useEffect } from "react";
import {
  View,
  ScrollView,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Text } from "@/components/nativewindui/Text";
import { useColorScheme } from "@/lib/useColorScheme";
import { useExternalScanner } from "@/hooks/useExternalScanner";

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
  enabled: "scanner_external_enabled",
  sound: "scanner_sound_enabled",
  autoLookup: "scanner_auto_lookup",
} as const;

// ---------------------------------------------------------------------------
// Scanner Settings Screen — /scanner-settings
// ---------------------------------------------------------------------------
export default function ScannerSettingsScreen() {
  const { colors } = useColorScheme();

  // ── State ──────────────────────────────────────────────────────────────
  const [enabled, setEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoLookup, setAutoLookup] = useState(true);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // ── Load persisted settings ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [e, s, a] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.enabled),
          AsyncStorage.getItem(STORAGE_KEYS.sound),
          AsyncStorage.getItem(STORAGE_KEYS.autoLookup),
        ]);
        if (e !== null) setEnabled(e === "true");
        if (s !== null) setSoundEnabled(s === "true");
        if (a !== null) setAutoLookup(a === "true");
      } catch {
        // ignore — use defaults
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // ── Persist on change ──────────────────────────────────────────────────
  const toggle = useCallback(
    async (
      key: keyof typeof STORAGE_KEYS,
      value: boolean,
      setter: (v: boolean) => void
    ) => {
      setter(value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        await AsyncStorage.setItem(STORAGE_KEYS[key], String(value));
      } catch {
        // ignore
      }
    },
    []
  );

  // ── External scanner hook ──────────────────────────────────────────────
  const handleScan = useCallback(
    (barcode: string) => {
      setLastScan(barcode);
      if (soundEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [soundEnabled]
  );

  useExternalScanner(handleScan, { enabled });

  if (!loaded) return null;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Handscanner",
          headerLargeTitle: true,
          headerStyle: { backgroundColor: colors.background },
        }}
      />
      <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-12"
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* ── Einstellungen ──────────────────────────────────────── */}
          <View className="mt-6 mx-4 rounded-xl bg-card overflow-hidden">
            <View className="px-4 py-3 border-b border-border">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Scanner-Einstellungen
              </Text>
            </View>

            {/* Toggle: Externen Scanner aktivieren */}
            <SettingRow
              icon="scan-outline"
              label="Externen Scanner aktivieren"
              description="Erkennt Bluetooth- und USB-OTG-Scanner automatisch"
              value={enabled}
              onValueChange={(v) => toggle("enabled", v, setEnabled)}
              colors={colors}
            />

            <Divider />

            {/* Toggle: Piepton bei Scan */}
            <SettingRow
              icon="volume-high-outline"
              label="Piepton bei Scan"
              description="Haptisches Feedback bei erkanntem Scan"
              value={soundEnabled}
              onValueChange={(v) => toggle("sound", v, setSoundEnabled)}
              disabled={!enabled}
              colors={colors}
            />

            <Divider />

            {/* Toggle: Automatische Produkterkennung */}
            <SettingRow
              icon="search-outline"
              label="Automatische Produkterkennung"
              description="Barcode wird nach dem Scan automatisch nachgeschlagen"
              value={autoLookup}
              onValueChange={(v) => toggle("autoLookup", v, setAutoLookup)}
              disabled={!enabled}
              colors={colors}
            />
          </View>

          {/* ── Testbereich ───────────────────────────────────────── */}
          <View className="mt-6 mx-4 rounded-xl bg-card overflow-hidden">
            <View className="px-4 py-3 border-b border-border">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Scanner testen
              </Text>
            </View>

            <View className="p-6 items-center">
              {lastScan ? (
                <>
                  <View className="w-14 h-14 rounded-full bg-green-500/10 items-center justify-center mb-3">
                    <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
                  </View>
                  <Text className="text-lg font-semibold mb-1">
                    Scan erkannt!
                  </Text>
                  <Text
                    className="text-2xl font-mono tracking-wider mb-4"
                    style={{ color: colors.primary }}
                  >
                    {lastScan}
                  </Text>
                  <View
                    className="rounded-lg px-4 py-2"
                    style={{ backgroundColor: colors.grey5 ?? colors.card }}
                  >
                    <Text
                      className="text-sm font-medium"
                      onPress={() => setLastScan(null)}
                      style={{ color: colors.primary }}
                    >
                      Zurücksetzen
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    <Ionicons
                      name="barcode-outline"
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                  <Text className="text-lg font-medium text-muted-foreground mb-1">
                    Scannen Sie einen Barcode
                  </Text>
                  <Text className="text-sm text-muted-foreground text-center px-8">
                    {enabled
                      ? "Scanner-Erkennung ist aktiv. Scannen Sie einen Barcode zum Testen."
                      : "Scanner-Erkennung ist deaktiviert. Aktivieren Sie sie oben."}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* ── Unterstützte Scanner ──────────────────────────────── */}
          <View className="mt-6 mx-4 rounded-xl bg-card overflow-hidden">
            <View className="px-4 py-3 border-b border-border">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Unterstützte Scanner
              </Text>
            </View>

            {SUPPORTED_SCANNERS.map((scanner, idx) => (
              <View key={scanner.brand}>
                <View className="px-4 py-3">
                  <Text className="text-sm font-semibold">{scanner.brand}</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {scanner.models}
                  </Text>
                </View>
                {idx < SUPPORTED_SCANNERS.length - 1 && <Divider />}
              </View>
            ))}
          </View>

          {/* ── Hinweis ───────────────────────────────────────────── */}
          <View
            className="mt-6 mx-4 rounded-xl p-4"
            style={{ backgroundColor: `${colors.primary}10` }}
          >
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons
                name="information-circle"
                size={18}
                color={colors.primary}
              />
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.primary }}
              >
                Hinweis
              </Text>
            </View>
            <Text className="text-sm text-muted-foreground leading-5">
              Verbinden Sie Ihren Scanner per Bluetooth oder USB-OTG mit Ihrem
              Gerät. Der Scanner muss im{" "}
              <Text className="font-semibold">Keyboard-Wedge-Modus</Text>{" "}
              arbeiten und nach jedem Scan eine Enter-Taste senden.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SUPPORTED_SCANNERS = [
  { brand: "Zebra", models: "DS2208, DS3608, LI4278 und weitere" },
  { brand: "Honeywell", models: "Voyager 1200g, Granit 1981i und weitere" },
  { brand: "Datalogic", models: "QuickScan QD2500, Gryphon GD4500 und weitere" },
  { brand: "Symbol / Motorola", models: "LS2208, DS4308 und weitere" },
];

function Divider() {
  return <View className="h-px bg-border ml-4" />;
}

function SettingRow({
  icon,
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  colors,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  colors: Record<string, string>;
}) {
  return (
    <View
      className="flex-row items-center px-4 py-3.5"
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={colors.primary}
        style={{ marginRight: 12 }}
      />
      <View className="flex-1 mr-3">
        <Text className="text-sm font-medium">{label}</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: Platform.OS === "ios" ? undefined : "#767577",
          true: colors.primary,
        }}
        thumbColor={Platform.OS === "android" ? "#fff" : undefined}
      />
    </View>
  );
}
