import React, { ReactNode } from 'react';
import { Platform, View } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';

type OnboardingScreenProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  buttonText: string;
  onButtonPress: () => void;
  progressDots: number;
  currentStep: number;
  children?: ReactNode;
};

export function OnboardingScreen({
  title,
  description,
  icon,
  buttonText,
  onButtonPress,
  progressDots,
  currentStep,
  children,
}: OnboardingScreenProps) {
  return (
    <View className="p-safe flex-1 bg-background">
      <View className="mx-auto max-w-sm flex-1 justify-between p-6">
        <View className="pt-4">
          <View className="flex-row justify-center gap-1.5">
            {Array.from({ length: progressDots }).map((_, index) => (
              <View
                key={index}
                className={`h-1.5 w-1.5 rounded-full ${
                  index === currentStep ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </View>
        </View>
        <View className="flex-1 justify-center">
          <View className="items-center">
            {icon && <View className="mb-8">{icon}</View>}
            <View className="gap-4">
              <Text variant="title1" className="text-3xl font-bold text-center">
                {title}
              </Text>
              <Text className="text-base text-foreground/80 dark:text-foreground/70 text-center">
                {description}
              </Text>
            </View>
            {children}
          </View>
        </View>
        <View className="pb-2">
          <Button
            size={Platform.select({ ios: 'lg', default: 'md' })}
            onPress={onButtonPress}
          >
            <Text>{buttonText}</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
