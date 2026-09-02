import { Text, View, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, SectionTitle } from "../../src/components/ui";
import { useAuthStore } from "../../src/stores/auth-store";
import { brand, spacing, radius, type, usePalette } from "../../src/theme/tokens";

export default function ProfileScreen() {
  const p = usePalette();
  const { user, signOut, status } = useAuthStore();

  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={[type.title, { color: brand.gold }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.heading, { color: brand.ivory }]} numberOfLines={1}>
            {user?.email ?? user?.phone ?? "Account"}
          </Text>
          <Text style={[type.micro, { color: "rgba(248,245,240,0.6)" }]}>
            {user?.role ?? ""}
          </Text>
        </View>
      </View>

      <SectionTitle>Bookings</SectionTitle>
      <Link href="/reservations" asChild>
        <Pressable style={[styles.navRow, { backgroundColor: p.surface, borderColor: p.border }]}>
          <Ionicons name="calendar-outline" size={20} color={p.text} />
          <Text style={[type.body, { color: p.text, flex: 1, marginLeft: spacing.md }]}>My reservations</Text>
          <Ionicons name="chevron-forward" size={18} color={p.mutedText} />
        </Pressable>
      </Link>

      <SectionTitle>Session</SectionTitle>
      <Card style={{ marginBottom: spacing.md }}>
        <Text style={[type.body, { color: p.text }]}>
          Signed in{user?.language ? ` · language ${user.language}` : ""}
        </Text>
        <Text style={[type.caption, { color: p.mutedText, marginTop: 4 }]}>
          Tokens are stored in Keychain/Keystore via SecureStore. Expired access
          tokens refresh automatically.
        </Text>
      </Card>

      <SectionTitle>Edit profile & preferences</SectionTitle>
      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[type.body, { color: p.mutedText }]}>
          Profile editing and dietary/allergy preferences ship next (FE-2
          remainder).
        </Text>
      </Card>

      <Button
        label={status === "signedIn" ? "Sign out" : "Sign out"}
        variant="ghost"
        onPress={() => void signOut()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: brand.navy,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: brand.ivory,
    alignItems: "center",
    justifyContent: "center",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
});
