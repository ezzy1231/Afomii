import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Screen, EmptyState, ActivityIndicator } from "../../src/components/ui";
import { useRestaurants } from "../../src/hooks/use-api";
import { brand, spacing, radius, type, usePalette } from "../../src/theme/tokens";

export default function ReserveScreen() {
  const p = usePalette();
  const [search, setSearch] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [category, setCategory] = useState<string | null>(null);

  const { data: env, isLoading, isError } = useRestaurants();
  const restaurants = env?.data ?? [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => set.add(r.category));
    return Array.from(set);
  }, [restaurants]);

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      if (category && r.category !== category) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !r.name.toLowerCase().includes(q) &&
          !r.category.toLowerCase().includes(q)
        )
          return false;
      }
      if (openNow && !r.branches.some((b) => b.isOpenNow)) return false;
      return true;
    });
  }, [restaurants, category, search, openNow]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={["top"]}>
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <Text style={[type.title, { color: p.text, marginBottom: 12 }]}>Reserve a table</Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: p.surface,
            borderRadius: radius.pill,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: p.border,
            paddingHorizontal: spacing.md,
            marginBottom: spacing.sm,
          }}
        >
          <Ionicons name="search" size={18} color={p.mutedText} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search restaurants or cuisine"
            placeholderTextColor={p.mutedText}
            style={{ flex: 1, color: p.text, paddingVertical: 10, paddingLeft: 8, fontSize: 15 }}
          />
          {search ? (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={p.mutedText} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 4 }}>
          <Chip active={!category} label="All" onPress={() => setCategory(null)} />
          <Chip active={openNow} label="Open now" onPress={() => setOpenNow((v) => !v)} accent />
          {categories.map((c) => (
            <Chip key={c} active={category === c} label={c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>
      </View>

      <Screen scroll style={{ paddingTop: 0 }}>
        {isLoading ? (
          <Card>
            <ActivityIndicator color={p.accent} />
            <Text style={[type.caption, { color: p.mutedText, textAlign: "center", marginTop: 8 }]}>
              Finding restaurants…
            </Text>
          </Card>
        ) : isError ? (
          <Card>
            <Text style={[type.heading, { color: brand.danger }]}>Couldn't load restaurants</Text>
            <Text style={[type.caption, { color: p.mutedText, marginTop: 4 }]}>Is the backend on :4000?</Text>
          </Card>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔍" title="Nothing here" body="Try a different search or filter." />
        ) : (
          filtered.map((r) => (
            <Link key={r.id} href={{ pathname: "/restaurant/[id]", params: { id: r.id } }} asChild>
              <Pressable>
                <Card style={{ marginBottom: spacing.md, padding: 0, overflow: "hidden" }}>
                  <View style={{ height: 120, backgroundColor: p.surfaceAlt }}>
                    {r.coverUrl && r.coverUrl.startsWith("http") ? (
                      <Image source={{ uri: r.coverUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 40 }}>🍽️</Text>
                      </View>
                    )}
                    {r.isVerified ? (
                      <View style={{ position: "absolute", top: 10, right: 10, backgroundColor: p.accent, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={[type.micro, { color: p.bg }]}>VERIFIED</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={{ padding: spacing.md }}>
                    <Text style={[type.heading, { color: p.text }]} numberOfLines={1}>
                      {r.name}
                    </Text>
                    <Text style={[type.caption, { color: p.mutedText, marginTop: 2 }]}>
                      {r.category} · {r.branches.length} branch{r.branches.length === 1 ? "" : "es"}
                    </Text>
                    {r.branches.some((b) => b.isOpenNow) ? (
                      <Text style={[type.micro, { color: brand.success, marginTop: 6 }]}>● Open now</Text>
                    ) : null}
                  </View>
                </Card>
              </Pressable>
            </Link>
          ))
        )}
      </Screen>
    </SafeAreaView>
  );
}

function Chip({
  label,
  active,
  onPress,
  accent,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accent?: boolean;
}) {
  const p = usePalette();
  const bg = active ? (accent ? brand.success : p.primary) : p.surface;
  const fg = active ? (accent ? "#fff" : p.onPrimary) : p.mutedText;
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: radius.pill,
        backgroundColor: bg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: p.border,
      }}
    >
      <Text style={[type.caption, { color: fg, fontWeight: "600" }]}>{label}</Text>
    </Pressable>
  );
}