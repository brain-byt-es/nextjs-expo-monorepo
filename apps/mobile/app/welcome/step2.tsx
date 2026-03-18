import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { OnboardingScreen } from '@/components/layout/OnboardingScreen';

export default function WelcomeStep2Screen() {
  const router = useRouter();

  return (
    <OnboardingScreen
      title="Alles an einem Ort."
      description="Materialien, Werkzeuge, Schlüssel und Lieferscheine — zentral verwaltet. Immer aktuell, immer griffbereit."
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
          <Ionicons name="layers" size={80} color="#F97316" />
        </View>
      }
      buttonText="Weiter"
      onButtonPress={() => router.push('/welcome/step3')}
      progressDots={3}
      currentStep={1}
    />
  );
}
