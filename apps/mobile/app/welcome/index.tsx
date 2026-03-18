import * as Haptics from 'expo-haptics';
import { Link, router } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { Logo } from '@/components/Logo';

const ONBOARDING_KEY = '@logistikapp/onboarding-complete';

const FEATURES = [
  {
    icon: 'cube-outline' as const,
    label: 'Materialverwaltung',
    description: 'Behalte den Überblick über alle Materialien und Bestände.',
  },
  {
    icon: 'construct-outline' as const,
    label: 'Werkzeug-Tracking',
    description: 'Werkzeuge zuweisen, verfolgen und nie wieder verlieren.',
  },
  {
    icon: 'barcode-outline' as const,
    label: 'Barcode-Scanner',
    description: 'Materialien blitzschnell per Barcode erfassen.',
  },
  {
    icon: 'document-text-outline' as const,
    label: 'Lieferscheine',
    description: 'Lieferscheine digital erstellen und verwalten.',
  },
];

function lightHaptic() {
  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export default function WelcomeIndexScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bgAccent} />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <Logo size={48} />
          <Text style={styles.tagline}>LogistikApp hilft dir, dein Lager effizient zu verwalten.</Text>
        </View>

        {/* Feature list */}
        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={f.icon} size={22} color="#F97316" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDescription}>{f.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Link href="/welcome/step1" asChild>
            <Button
              size={Platform.select({ ios: 'lg', default: 'md' })}
              onPressOut={lightHaptic}
            >
              <Text className="text-white font-semibold">Weiter</Text>
            </Button>
          </Link>
          <Button
            variant="plain"
            size={Platform.select({ ios: 'lg', default: 'md' })}
            onPress={async () => {
              lightHaptic();
              try { await AsyncStorage.setItem(ONBOARDING_KEY, 'true'); } catch {}
              router.replace('/(auth)');
            }}
          >
            <Text className="text-primary font-medium">Anmelden / Registrieren</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bgAccent: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FFF4EC',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 16,
    justifyContent: Platform.OS === 'ios' ? 'flex-end' : 'center',
  },
  logoArea: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    gap: 10,
  },
  tagline: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  featureList: {
    gap: 16,
    marginBottom: 36,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFF4EC',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  featureDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  buttons: {
    gap: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
  },
});
