import { Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, EmptyState, SectionTitle } from "../../src/components/ui";
import { useRestaurants } from "../../src/hooks/use-api";
import { brand, spacing, type, usePalette } from "../../src/theme/tokens";

export default function HomeScreen() {
  const p = usePalette();
  const { data: env, isLoading, isError, refetch } = useRestaurants();
  const restaurants = env?.data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={["top"]}>
      <View style={styles.hero}>
        <Text style={[type.display, { color: brand.ivory }]}>UrbanExplore</Text>
        <Text style={[type.caption, { color: "rgba(248,245,240,0.7)" }]}>
          Tables · Events · Rides — one app
        </Text>
      </View>

      <SectionTitle>Nearby restaurants</SectionTitle>

      {isLoading && (
        <Card><Text style={[type.body, { color: p.mutedText }]}>Loading…</Text></Card>
      )}

      {isError && (
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[type.heading, { color: brand.danger }]}>API unreachable</Text>
          <Text style={[type.caption, { color: p.mutedText, marginTop: 4 }]}>
            Is the backend running on :4000? Pull to retry.
          </Text>
        </Card>
      )}

      {!isLoading && !isError && (restaurants?.length ?? 0) === 0 && (
        <EmptyState
          icon="🍽️"
          title="No restaurants yet"
          body="Seed data lands with BE-0.6. The API connection itself is live."
        />
      )}

      {restaurants?.map((r) => (
        <Card key={r.id} style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: p.surfaceAlt,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 20 }}>🍽️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.heading, { color: p.text }]} numberOfLines={1}>
                {r.name} {r.isVerified ? "✅" : ""}
              </Text>
              <Text style={[type.caption, { color: p.mutedText }]}>
                {r.category} · {r.branches.length} branch{r.branches.length === 1 ? "" : "es"}
              </Text>
            </View>
          </View>
        </Card>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: brand.navy,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
});