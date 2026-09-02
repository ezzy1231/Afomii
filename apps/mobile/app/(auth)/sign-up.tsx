import { useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { Link, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, TextField } from "../../src/components/ui";
import { useAuthStore } from "../../src/stores/auth-store";
import { ApiError } from "../../src/api/client";
import { brand, spacing, type, usePalette } from "../../src/theme/tokens";

export default function SignUpScreen() {
  const p = usePalette();
  const { signup, status, user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "signedIn" && user) return <Redirect href="/(tabs)" />;

  async function submit() {
    setError(null);
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await signup(email.trim(), password);
    } catch (e) {
      const err = e as ApiError;
      setError(
        err.code === "UNKNOWN" && err.statusCode === 0
          ? "Network error - is the API running?"
          : err.message || "Could not create account."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={styles.hero}>
        <Text style={[type.display, { color: brand.ivory }]}>Create account</Text>
        <Text style={[type.caption, { color: "rgba(248,245,240,0.7)" }]}>
          Join UrbanExplore in seconds
        </Text>
      </View>

      <Card style={{ marginHorizontal: spacing.lg }}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
        />
        <TextField
          label="Password (min 8 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextField
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />
        {error ? (
          <Text style={[type.caption, { color: brand.danger, marginBottom: spacing.md }]}>
            {error}
          </Text>
        ) : null}
        <Button label="Create account" onPress={submit} loading={busy} variant="accent" />
        <Link href="/(auth)/sign-in" style={{ marginTop: spacing.lg, textAlign: "center" }}>
          <Text style={[type.body, { color: p.accent }]}>Already registered? Sign in</Text>
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
