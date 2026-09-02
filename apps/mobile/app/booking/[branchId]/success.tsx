import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Screen, Button } from "../../../src/components/ui";
import { useBookingStore } from "../../../src/stores/booking-store";
import { brand, spacing, radius, type, usePalette } from "../../../src/theme/tokens";

function prettyDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export default function BookingSuccessScreen() {
  const p = usePalette();
  const router = useRouter();
  const created = useBookingStore((s) => s.created);
  const reset = useBookingStore((s) => s.reset);

  if (!created) {
    return (
      <Screen>
        <Card>
          <Text style={[type.body, { color: p.mutedText }]}>No booking to show.</Text>
        </Card>
      </Screen>
    );
  }

  const done = () => {
    reset();
    router.replace({ pathname: "/(tabs)" });
  };

  const viewReservations = () => {
    reset();
    router.replace({ pathname: "/reservations" });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={["top", "bottom"]}>
      <Screen scroll>
        <View style={{ alignItems: "center", marginTop: spacing.xl }}>
          <View style={[styles.badge, { backgroundColor: brand.success }]}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
          <Text style={[type.display, { color: p.text, marginTop: spacing.md }]}>Booking confirmed</Text>
          <Text style={[type.caption, { color: p.mutedText, marginTop: 4 }]}>
            {created.status === "PENDING" ? "Your request was sent to the restaurant." : "Your table is reserved."}
          </Text>
        </View>

        <Card style={{ marginTop: spacing.xl }}>
          <Text style={[type.micro, { color: p.mutedText, marginBottom: 4 }]}>RESERVATION CODE</Text>
          <Text style={[type.title, { color: p.accent, letterSpacing: 1 }]}>{created.code}</Text>
          <View style={{ height: 1, backgroundColor: p.border, marginVertical: spacing.md }} />
          <Row label="Branch" value={created.branchName} />
          <Row label="Date" value={prettyDate(created.date)} />
          <Row label="Time" value={created.timeSlot || "Requested"} />
          <Row label="Guests" value={String(created.guestCount)} />
        </Card>

        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          <Button label="View my reservations" onPress={viewReservations} />
          <Button label="Back to explore" variant="ghost" onPress={done} />
        </View>
      </Screen>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
      <Text style={[type.caption, { color: p.mutedText }]}>{label}</Text>
      <Text style={[type.body, { color: p.text, flex: 1, textAlign: "right", marginLeft: spacing.md }]}>{value}</Text>
    </View>
  );
}

const styles = {
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
};
