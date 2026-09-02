import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Screen, SectionTitle, Button, TextField } from "../../../src/components/ui";
import { createReservation } from "../../../src/api/endpoints/reservations";
import { useBookingStore } from "../../../src/stores/booking-store";
import { brand, spacing, radius, type, usePalette } from "../../../src/theme/tokens";

function prettyDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export default function BookingReviewScreen() {
  const p = usePalette();
  const router = useRouter();
  const rawBranchId = useLocalSearchParams<{ branchId: string }>().branchId;
  const branchId = Array.isArray(rawBranchId) ? rawBranchId[0] ?? "" : rawBranchId ?? "";
  const draft = useBookingStore();
  const { setCreated, setDraft } = draft;

  const [requests, setRequests] = useState(draft.specialRequests || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await createReservation({
        branchId,
        reservationDate: draft.date!,
        timeSlot: draft.timeSlot,
        guestCount: draft.guestCount,
        specialRequests: requests.trim() || undefined,
      });
      setDraft({ specialRequests: requests.trim() });
      setCreated({
        code: res.reservationCode,
        status: res.status,
        date: res.reservationDate,
        timeSlot: res.timeSlot,
        guestCount: res.guestCount,
        branchName: res.branch.branchName,
        businessName: res.branch.business?.name ?? "",
        cancellationPolicyText: undefined,
      });
      router.push({ pathname: "/booking/[branchId]/success", params: { branchId } });
    } catch (e: any) {
      setError(e?.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <SectionTitle>Review your booking</SectionTitle>
      <Card style={{ marginBottom: spacing.md }}>
        <Row label="Branch" value={draft.branchName || "—"} />
        <Row label="Date" value={prettyDate(draft.date || "")} />
        <Row label="Time" value={draft.timeSlot || "Requested (no fixed slot)"} />
        <Row label="Guests" value={String(draft.guestCount)} />
      </Card>

      <SectionTitle>Special requests</SectionTitle>
      <TextField
        label="Anything we should know?"
        value={requests}
        onChangeText={setRequests}
        placeholder="e.g. window seat, high chair"
      />

      {error ? (
        <Card style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="alert-circle" size={18} color={brand.danger} />
            <Text style={[type.caption, { color: brand.danger, marginLeft: 8, flex: 1 }]}>{error}</Text>
          </View>
        </Card>
      ) : null}

      <View style={{ marginTop: spacing.md }}>
        <Button label={loading ? "Confirming…" : "Confirm booking"} onPress={confirm} loading={loading} />
      </View>
    </Screen>
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