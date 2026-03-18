import Svg, { Rect, Circle } from 'react-native-svg';
import { Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';

import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

/**
 * LogoMark — matches the web app SVG in apps/web/src/components/logo.tsx
 * Warehouse grid icon with location pin accent.
 */
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Outer rounded square — primary brand orange */}
      <Rect width="32" height="32" rx="8" fill="#F97316" />

      {/* Warehouse grid — stacked inventory boxes */}
      {/* Top row: 2 boxes */}
      <Rect x="6" y="6" width="8" height="8" rx="1.5" fill="white" fillOpacity={0.3} />
      <Rect x="18" y="6" width="8" height="8" rx="1.5" fill="white" fillOpacity={0.9} />

      {/* Middle row: wide bar */}
      <Rect x="6" y="17" width="20" height="4" rx="1.5" fill="white" fillOpacity={0.65} />

      {/* Bottom row */}
      <Rect x="6" y="24" width="12" height="2" rx="1" fill="white" fillOpacity={0.9} />

      {/* Location pin dot — teal secondary accent */}
      <Circle cx="25" cy="25" r="2.5" fill="#2C9FA6" />
    </Svg>
  );
}

export function Logo({ className, size = 28, showText = true }: LogoProps) {
  const { colorScheme } = useColorScheme();

  return (
    <View className={cn('flex-row items-center gap-2', className)}>
      <LogoMark size={size} />
      {showText && (
        <Text
          style={{ fontSize: size * 0.58 }}
          className={cn(
            'font-semibold tracking-tight',
            colorScheme === 'dark' ? 'text-gray-50' : 'text-gray-900'
          )}
        >
          Logistik
          <Text style={{ color: '#F97316' }}>App</Text>
        </Text>
      )}
    </View>
  );
}
