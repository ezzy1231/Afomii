import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Screen, SectionTitle, Button, ActivityIndicator, EmptyState } from "../../../src/components/ui";
import { useAvailability } from "../../../src/hooks/use-api";

function oneParam(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}
import { useBookingStore } from "../../../src/stores/booking-store";
import { brand, spacing, radius, type, usePalette } from "../../../src/theme/tokens";

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextDays(n: number): Date[] {
  const out: Date[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(d);
  }
  return out;
}

export default function BookingIndexScreen() {
  const p = usePalette();
  const router = useRouter();
  const params = useLocalSearchParams<{ branchId: string; branchName: string }>();
  const branchId = oneParam(params.branchId);
  const branchName = oneParam(params.branchName);
  const setDraft = useBookingStore((s) => s.setDraft);

  const days = useMemo(() => nextDays(14), []);
  const [date, setDate] = useState(isoDate(days[0]));
  const [guestCount, setGuestCount] = useState(2);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data: avail, isLoading, isError } = useAvailability(
    branchId || "",
    date,
    guestCount,
    !!branchId && !!date
  );

  const maxGuests = avail?.maxGuestPerTable ?? 12;
  const isTimeSlot = avail?.bookingMode === "TIME_SLOT";
  const isRequest = avail?.bookingMode === "REQUEST_BASED";

  const goReview = () => {
    setDraft({
      branchId: branchId || undefined,
      branchName: branchName || undefined,
      date,
      timeSlot: isTimeSlot ? selectedSlot || undefined : undefined,
      guestCount,
    });
    router.push({ pathname: "/booking/[branchId]/review", params: { branchId: branchId! } });
  };

  return (
    <Screen>
      {branchName ? (
        <Text style={[type.heading, { color: p.text, marginBottom: spacing.sm }]}>{branchName}</Text>
      ) : null}

      <SectionTitle>Date</SectionTitle>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg }}>
        {days.map((d) => {
          const iso = isoDate(d);
          const active = iso === date;
          const wd = d.toLocaleDateString("en-US", { weekday: "short" });
          const dn = d.getDate();
          return (
            <Pressable
              key={iso}
              onPress={() => { setDate(iso); setSelectedSlot(null); }}
              style={{
                width: 56,
                paddingVertical: 10,
                borderRadius: radius.md,
                backgroundColor: active ? p.primary : p.surface,
                borderWidth: 1,
                borderColor: p.border,
                alignItems: "center",
              }}
            >
              <Text style={[type.micro, { color: active ? p.onPrimary : p.mutedText }]}>{wd}</Text>
              <Text style={[type.heading, { color: active ? p.onPrimary : p.text }]}>{dn}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>Guests</SectionTitle>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.lg }}>
        <Pressable
          onPress={() => setGuestCount((g) => Math.max(1, g - 1))}
          style={[styles.stepper, { backgroundColor: p.surface, borderColor: p.border }]}
        >
          <Ionicons name="remove" size={20} color={p.text} />
        </Pressable>
        <Text style={[type.title, { color: p.text, marginHorizontal: spacing.lg }]}>{guestCount}</Text>
        <Pressable
          onPress={() => setGuestCount((g) => Math.min(maxGuests, g + 1))}
          style={[styles.stepper, { backgroundColor: p.surface, borderColor: p.border }]}
        >
          <Ionicons name="add" size={20} color={p.text} />
        </Pressable>
        <Text style={[type.caption, { color: p.mutedText, marginLeft: spacing.sm }]}>max {maxGuests}</Text>
      </View>

      {isLoading ? (
        <Card><ActivityIndicator color={p.accent} /><Text style={[type.caption, { color: p.mutedText, textAlign: "center", marginTop: 8 }]}>Checking availability…</Text></Card>
      ) : isError ? (
        <Card><Text style={[type.heading, { color: brand.danger }]}>Couldn't load availability</Text></Card>
      ) : isRequest ? (
        <Card>
          <Text style={[type.body, { color: p.text }]}>This branch accepts booking requests. Choose a date and we'll send your request to the restaurant.</Text>
        </Card>
      ) : (
        <>
          <SectionTitle>Available times</SectionTitle>
          {!avail?.slots || avail.slots.length === 0 ? (
            <EmptyState icon="🕒" title="No slots" body="Try another date or guest count." />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {avail.slots.map((slot) => {
                const active = slot.time === selectedSlot;
                const disabled = !slot.available;
                return (
                  <Pressable
                    key={slot.time}
                    disabled={disabled}
                    onPress={() => setSelectedSlot(slot.time)}
                    style={[
                      styles.slot,
                      {
                        backgroundColor: disabled ? p.surfaceAlt : active ? p.primary : p.surface,
                        borderColor: p.border,
                        opacity: disabled ? 0.4 : 1,
                      },
                    ]}
                  >
                    <Text style={[type.caption, { color: disabled ? p.mutedText : active ? p.onPrimary : p.text, fontWeight: "600" }]}>
                      {slot.time}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}

      <View style={{ marginTop: spacing.xl }}>
        <Button
          label={isRequest ? "Continue to request" : "Continue"}
          onPress={goReview}
          disabled={isTimeSlot && !selectedSlot}
        />
      </View>
    </Screen>
  );
}

const styles = {
  stepper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  slot: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 72,
    alignItems: "center" as const,
  },
};