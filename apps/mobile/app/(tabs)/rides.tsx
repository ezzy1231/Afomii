import { Text } from "react-native";
import { Card, Screen } from "../../src/components/ui";
import { type, usePalette } from "../../src/theme/tokens";

export default function RidesScreen() {
  const p = usePalette();
  return (
    <Screen>
      <Text style={[type.title, { color: p.text, marginBottom: 12 }]}>Rides</Text>
      <Card>
        <Text style={[type.body, { color: p.mutedText }]}>
          Estimate comparison and dispatch handoff ship in M4 (FE-5).
        </Text>
      </Card>
    </Screen>
  );
}
