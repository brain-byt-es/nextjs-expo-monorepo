import { View, Text } from "react-native";

interface SubscriptionBadgeProps {
  plan: string | null;
  isActive: boolean;
}

export function SubscriptionBadge({ plan, isActive }: SubscriptionBadgeProps) {
  return (
    <View
      style={{
        backgroundColor: isActive ? "#dcfce7" : "#f3f4f6",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: isActive ? "#166534" : "#6b7280",
        }}
      >
        {isActive ? plan || "Pro" : "Free"}
      </Text>
    </View>
  );
}
