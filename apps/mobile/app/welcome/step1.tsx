import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { BRAND } from '@/lib/colors';

import { OnboardingScreen } from '@/components/layout/OnboardingScreen';

export default function WelcomeStep1Screen() {
  const router = useRouter();

  return (
    <OnboardingScreen
      title="Inventar im Chaos? Nie wieder."
      description="Materialien liegen verstreut in Excel-Listen, WhatsApp-Gruppen und Papierzetteln. Zentory bringt Ordnung rein."
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
          <Ionicons name="file-tray-stacked" size={80} color={BRAND.primary} />
        </View>
      }
      buttonText="Weiter"
      onButtonPress={() => router.push('/welcome/step2')}
      progressDots={3}
      currentStep={0}
    />
  );
}
