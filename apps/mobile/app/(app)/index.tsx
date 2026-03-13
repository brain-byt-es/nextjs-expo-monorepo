import { router } from "expo-router";
import { ScrollView, View } from "react-native";

import { Button } from "@/components/nativewindui/Button";
import { Card } from "@/components/nativewindui/Card";
import { LargeTitleHeader } from "@/components/nativewindui/LargeTitleHeader";
import { Text } from "@/components/nativewindui/Text";
import { useSession } from "@/lib/session-store";
import { SubscriptionBadge } from "@/components/subscription-badge";

const stats = [
  { label: "Active Users", value: "1,284", change: "+12%" },
  { label: "Revenue", value: "$8,430", change: "+5%" },
  { label: "Uptime", value: "99.9%", change: "" },
];

const activity = [
  { title: "New signup", description: "user@example.com joined", time: "2m ago" },
  { title: "Payment received", description: "Pro plan — $19.00", time: "1h ago" },
  { title: "Support ticket", description: "Issue #42 resolved", time: "3h ago" },
  { title: "Deployment", description: "v1.4.2 shipped to prod", time: "5h ago" },
];

export default function HomeScreen() {
  const { data } = useSession();
  const user = data?.user;

  return (
    <>
      <LargeTitleHeader title="Dashboard" backgroundColor="transparent" />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-4 pb-8 gap-4">
        {/* Welcome */}
        <Card className="p-4 gap-1">
          <Text variant="heading">
            Good morning{user?.name ? `, ${user.name}` : ""}!
          </Text>
          <Text className="text-muted-foreground text-sm">{user?.email}</Text>
        </Card>

        {/* Stats */}
        <View className="flex-row gap-3">
          {stats.map((s) => (
            <Card key={s.label} className="flex-1 p-3 gap-1 items-center">
              <Text className="text-xl font-bold">{s.value}</Text>
              {s.change ? (
                <Text className="text-xs text-green-500 font-medium">{s.change}</Text>
              ) : null}
              <Text className="text-xs text-muted-foreground text-center">{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* Subscription */}
        <Card className="p-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="heading">Subscription</Text>
            <SubscriptionBadge plan="Free" isActive={false} />
          </View>
          <Text className="text-muted-foreground text-sm">
            Upgrade to Pro to unlock unlimited projects, analytics, and priority support.
          </Text>
          <Button variant="tonal" onPress={() => router.push("/(app)/subscription")}>
            <Text>Upgrade to Pro</Text>
          </Button>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4 gap-3">
          <Text variant="heading">Recent Activity</Text>
          {activity.map((item, i) => (
            <View key={i} className="flex-row items-start gap-3">
              <View className="w-2 h-2 mt-1.5 rounded-full bg-primary" />
              <View className="flex-1">
                <Text className="text-sm font-medium">{item.title}</Text>
                <Text className="text-xs text-muted-foreground">{item.description}</Text>
              </View>
              <Text className="text-xs text-muted-foreground">{item.time}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </>
  );
}
