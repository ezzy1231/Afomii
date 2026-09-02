import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../src/stores/auth-store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (status === "hydrating") return;
    const inAuth = segments[0] === "(auth)";
    if (status === "signedOut" && !inAuth) {
      router.replace("/(auth)/sign-in");
    } else if (status === "signedIn" && user && inAuth) {
      router.replace("/(tabs)");
    }
  }, [status, user, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthGate>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="restaurant/[id]" options={{ headerShown: true, headerBackTitle: "Back" }} />
            <Stack.Screen name="reservations/index" options={{ headerShown: true, title: "My reservations", headerBackTitle: "Back" }} />
          </Stack>
        </AuthGate>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}