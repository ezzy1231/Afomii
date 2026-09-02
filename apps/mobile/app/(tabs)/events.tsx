import { Text } from "react-native";
import { Card, Screen } from "../../src/components/ui";
import { type, usePalette } from "../../src/theme/tokens";

export default function EventsScreen() {
  const p = usePalette();
  return (
    <Screen>
      <Text style={[type.title, { color: p.text, marginBottom: 12 }]}>Events & tickets</Text>
      <Card>
        <Text style={[type.body, { color: p.mutedText }]}>
          Event discovery, hold countdown and QR wallet ship in M3 (FE-4).
        </Text>
      </Card>
    </Screen>
  );
}
