import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { BRAND } from '@/lib/colors';

import { OnboardingScreen } from '@/components/layout/OnboardingScreen';

export default function WelcomeStep3Screen() {
  const router = useRouter();

  async function handleComplete() {
    try {
      await AsyncStorage.setItem('@zentory/onboarding-complete', 'true');
    } catch {
      // Non-fatal: onboarding will show again next launch
    }
    router.replace('/(auth)');
  }

  return (
    <OnboardingScreen
      title="Scan. Track. Fertig."
      description="Barcode scannen, Material erfassen, Lieferschein erstellen — in Sekunden. Dein Lager. Immer im Griff."
      icon={
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: '#FFF4EC',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="qr-code" size={80} color={BRAND.primary} />
        </View>
      }
      buttonText="Los geht's"
      onButtonPress={handleComplete}
      progressDots={3}
      currentStep={2}
    />
  );
}
