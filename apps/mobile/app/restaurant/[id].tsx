import { useLayoutEffect } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useLocalSearchParams, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Screen, SectionTitle, EmptyState, ActivityIndicator } from "../../src/components/ui";
import { useRestaurant } from "../../src/hooks/use-api";
import { brand, spacing, radius, type, usePalette } from "../../src/theme/tokens";

function oneParam(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

const bookingModeLabel = {
  WALK_IN_ONLY: "Walk-in only",
  TIME_SLOT: "Book by time slot",
  REQUEST_BASED: "Request to book",
};

export default function RestaurantDetailScreen() {
  const p = usePalette();
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const restaurantId = oneParam(id);
  const { data: r, isLoading, isError } = useRestaurant(restaurantId);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerBackTitle: "Back",
      title: r ? r.name : "Restaurant",
      headerStyle: { backgroundColor: p.surface },
      headerTintColor: p.text,
    });
  }, [navigation, r, p.surface, p.text]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: p.bg, justifyContent: "center" }}>
        <ActivityIndicator color={p.accent} />
      </SafeAreaView>
    );
  }

  if (isError || !r) {
    return (
      <Screen>
        <EmptyState icon="!" title="Restaurant not found" body="It may have been removed." />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ height: 180, backgroundColor: p.surfaceAlt, marginHorizontal: -spacing.lg, marginTop: -spacing.lg }}>
        {r.coverUrl && r.coverUrl.startsWith("http") ? (
          <Image source={{ uri: r.coverUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 56 }}>FOOD</Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md }}>
        <Text style={[type.title, { color: p.text, flex: 1 }]}>{r.name}</Text>
        {r.isVerified ? (
          <View style={{ backgroundColor: p.accent, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={[type.micro, { color: p.bg }]}>VERIFIED</Text>
          </View>
        ) : null}
      </View>
      <Text style={[type.caption, { color: p.mutedText, marginTop: 2 }]}>{r.category}</Text>

      <SectionTitle>Branches</SectionTitle>
      {r.branches.map((b) => (
        <Card key={b.id} style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, marginRight: spacing.md }}>
              <Text style={[type.heading, { color: p.text }]}>{b.branchName}</Text>
              <Text style={[type.caption, { color: p.mutedText, marginTop: 2 }]}>{b.address}</Text>
              {b.phone ? (
                <Text style={[type.caption, { color: p.mutedText, marginTop: 2 }]}>Phone: {b.phone}</Text>
              ) : null}
              <View style={{ flexDirection: "row", marginTop: spacing.sm }}>
                <Text style={[type.micro, { color: p.accent }]}>
                  {b.bookingConfig ? bookingModeLabel[b.bookingConfig.bookingMode] : "Booking unavailable"}
                </Text>
                {b.bookingConfig ? (
                  <Text style={[type.micro, { color: p.mutedText, marginLeft: spacing.sm }]}>
                    Max {b.bookingConfig.maxGuestPerTable}/table
                  </Text>
                ) : null}
              </View>
            </View>
            {b.bookingConfig && b.bookingConfig.bookingMode !== "WALK_IN_ONLY" ? (
              <Link href={{ pathname: "/booking/[branchId]", params: { branchId: b.id, branchName: b.branchName } }} asChild>
                <Pressable
                  style={{
                    backgroundColor: p.primary,
                    borderRadius: radius.md,
                    paddingVertical: 10,
                    paddingHorizontal: spacing.md,
                  }}
                >
                  <Text style={[type.caption, { color: p.onPrimary, fontWeight: "700" }]}>Book</Text>
                </Pressable>
              </Link>
            ) : (
              <View style={{ paddingVertical: 10, paddingHorizontal: spacing.md, opacity: 0.6 }}>
                <Ionicons name="walk" size={20} color={p.mutedText} />
              </View>
            )}
          </View>
        </Card>
      ))}

      <SectionTitle>Menu</SectionTitle>
      {Object.keys(r.menuByCategory).length === 0 ? (
        <Text style={[type.caption, { color: p.mutedText }]}>No menu listed yet.</Text>
      ) : (
        Object.entries(r.menuByCategory).map((entry) => {
          const cat = entry[0];
          const items = entry[1];
          return (
            <View key={cat} style={{ marginBottom: spacing.lg }}>
              <Text style={[type.heading, { color: p.text, marginBottom: spacing.sm }]}>{cat}</Text>
              {items.map((it) => (
                <View key={it.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
                  <View style={{ flex: 1, marginRight: spacing.md }}>
                    <Text style={[type.body, { color: p.text }]}>{it.name}</Text>
                    {it.description ? (
                      <Text style={[type.caption, { color: p.mutedText }]} numberOfLines={2}>
                        {it.description}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[type.body, { color: p.accent, fontWeight: "600" }]}>
                    {it.price} ETB
                  </Text>
                </View>
              ))}
            </View>
          );
        })
      )}
    </Screen>
  );
}