import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export function DemoBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <View
      style={{ bottom: 90, zIndex: 999 }}
      className="absolute right-3"
      pointerEvents="box-none"
    >
      <Pressable
        onPress={() => setVisible(false)}
        style={{
          backgroundColor: "rgba(0,0,0,0.35)",
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        }}
      >
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: "#F59E0B",
          }}
        />
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>
          Demo
        </Text>
      </Pressable>
    </View>
  );
}
