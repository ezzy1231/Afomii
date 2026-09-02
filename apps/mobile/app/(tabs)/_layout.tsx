import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { brand, usePalette } from "../../src/theme/tokens";

export default function TabsLayout() {
  const p = usePalette();

  const iconFor = (name: keyof typeof Ionicons.glyphMap) =>
    function TabIcon({ color, size }: { focused: boolean; color: ColorValue; size: number }) {
      return <Ionicons name={name} size={size} color={color} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.accent,
        tabBarInactiveTintColor: p.mutedText,
        tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.border },
        sceneStyle: { backgroundColor: p.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: iconFor("home") }} />
      <Tabs.Screen name="reserve" options={{ title: "Reserve", tabBarIcon: iconFor("restaurant") }} />
      <Tabs.Screen name="events" options={{ title: "Events", tabBarIcon: iconFor("ticket") }} />
      <Tabs.Screen name="rides" options={{ title: "Rides", tabBarIcon: iconFor("car-sport") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: iconFor("person-circle") }} />
    </Tabs>
  );
}