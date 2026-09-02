import { useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { Link, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, TextField } from "../../src/components/ui";
import { useAuthStore } from "../../src/stores/auth-store";
import { ApiError } from "../../src/api/client";
import { brand, spacing, type, usePalette } from "../../src/theme/tokens";

export default function SignInScreen() {
  const p = usePalette();
  const { login, status, user } = useAuthStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "signedIn" && user) return <Redirect href="/(tabs)" />;

  async function submit() {
    setError(null);
    if (!identifier.trim() || !password) {
      setError("Enter your email or phone and password.");
      return;
    }
    setBusy(true);
    try {
      await login(identifier.trim(), password);
    } catch (e) {
      const err = e as ApiError;
      setError(err.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={styles.hero}>
        <Text style={[type.display, { color: brand.ivory }]}>Welcome back</Text>
        <Text style={[type.caption, { color: "rgba(248,245,240,0.7)" }]}>
          Sign in to UrbanExplore
        </Text>
      </View>

      <Card style={{ marginHorizontal: spacing.lg }}>
        <TextField
          label="Email or phone"
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="you@example.com"
          keyboardType="email-address"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        {error ? (
          <Text style={[type.caption, { color: brand.danger, marginBottom: spacing.md }]}>
            {error}
          </Text>
        ) : null}
        <Button label="Sign in" onPress={submit} loading={busy} variant="accent" />
        <Link href="/(auth)/sign-up" style={{ marginTop: spacing.lg, textAlign: "center" }}>
          <Text style={[type.body, { color: p.accent }]}>No account yet? Create one</Text>
        </Link>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: brand.navy,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: spacing.xl,
  },
});
