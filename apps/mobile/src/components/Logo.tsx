import { Image } from 'react-native';
import { Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';

import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

/**
 * LogoMark — uses the official Zentory logo cube.
 * On mobile we use a pre-rendered PNG since the full SVG is 161KB.
 */
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/images/icon.png')}
      style={{ width: size, height: size, borderRadius: size * 0.2 }}
      resizeMode="contain"
    />
  );
}

export function Logo({ className, size = 28, showText = true }: LogoProps) {
  const { colorScheme } = useColorScheme();

  return (
    <View className={cn('flex-row items-center gap-2', className)}>
      <LogoMark size={size} />
      {showText && (
        <Text
          style={{ fontSize: size * 0.58, textTransform: 'uppercase', letterSpacing: -0.3 }}
          className={cn(
            'tracking-tight',
            colorScheme === 'dark' ? 'text-gray-50' : 'text-gray-900'
          )}
        >
          <Text style={{ fontWeight: '700' }}>ZEN</Text>
          <Text style={{ fontWeight: '400' }}>TORY</Text>
        </Text>
      )}
    </View>
  );
}
