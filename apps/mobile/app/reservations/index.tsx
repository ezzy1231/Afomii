import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Screen, SectionTitle, Button, ActivityIndicator, EmptyState } from "../../src/components/ui";
import { useMyReservations } from "../../src/hooks/use-api";
import { cancelReservation } from "../../src/api/endpoints/reservations";
import { brand, spacing, radius, type, usePalette } from "../../src/theme/tokens";

const statusColor: Record<string, string> = {
  CONFIRMED: brand.success,
  PENDING: brand.warning,
  CANCELLED: "rgba(120,120,120,0.7)",
  COMPLETED: brand.success,
  REJECTED: brand.danger,
};

const statusLabel: Record<string, string> = {
  CONFIRMED: "Confirmed",
  PENDING: "Pending",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

function prettyDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    const [y, m, day] = iso.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function MyReservationsScreen() {
  const p = usePalette();
  const router = useRouter();
  const { data: env, isLoading, isError, refetch } = useMyReservations();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const reservations = env?.data ?? [];

  const onCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await cancelReservation(id);
      refetch();
    } catch (e: any) {
      // surface error minimally
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={["top"]}>
      <View style={{ padding: spacing.lg }}>
        <Text style={[type.title, { color: p.text }]}>My reservations</Text>
      </View>

      <Screen scroll style={{ paddingTop: 0 }}>
        {isLoading ? (
          <Card><ActivityIndicator color={p.accent} /></Card>
        ) : isError ? (
          <Card><Text style={[type.heading, { color: brand.danger }]}>Couldn't load reservations</Text></Card>
        ) : reservations.length === 0 ? (
          <EmptyState icon="🗓️" title="No reservations yet" body="Book a table from the Reserve tab." />
        ) : (
          reservations.map((r) => {
            const cancellable = r.status === "CONFIRMED" || r.status === "PENDING";
            return (
              <Card key={r.id} style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, marginRight: spacing.md }}>
                    <Text style={[type.heading, { color: p.text }]}>{r.branch.business?.name || r.branch.branchName}</Text>
                    <Text style={[type.caption, { color: p.mutedText, marginTop: 2 }]}>{r.branch.branchName}</Text>
                    <Text style={[type.caption, { color: p.mutedText, marginTop: 2 }]}>
                      {prettyDate(r.reservationDate)} · {r.timeSlot || "Requested"}
                    </Text>
                    <Text style={[type.caption, { color: p.mutedText, marginTop: 2 }]}>{r.guestCount} guests</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: (statusColor[r.status] || p.mutedText) + "22" }]}>
                    <Text style={[type.micro, { color: statusColor[r.status] || p.mutedText }]}>{statusLabel[r.status] || r.status}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm }}>
                  <Text style={[type.micro, { color: p.mutedText }]}>CODE: {r.reservationCode}</Text>
                  {cancellable ? (
                    <Button
                      label={cancellingId === r.id ? "Cancelling…" : "Cancel"}
                      variant="ghost"
                      onPress={() => onCancel(r.id)}
                    />
                  ) : null}
                </View>
              </Card>
            );
          })
        )}
      </Screen>
    </SafeAreaView>
  );
}

const styles = {
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
};
