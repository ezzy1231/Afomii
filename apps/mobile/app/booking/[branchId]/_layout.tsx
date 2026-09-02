import { Stack } from "expo-router";

export default function BookingLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ title: "Book a table" }} />
      <Stack.Screen name="review" options={{ title: "Review" }} />
      <Stack.Screen name="success" options={{ title: "Confirmation", headerLeft: () => null }} />
    </Stack>
  );
}
