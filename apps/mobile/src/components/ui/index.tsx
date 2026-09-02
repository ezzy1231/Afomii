import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { brand, spacing, radius, type, usePalette, type Palette } from "../../theme/tokens";

// Re-export commonly used primitives so screens can grab them from one place.
export { ActivityIndicator } from "react-native";

export function Screen({
  children,
  scroll = true,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const p = usePalette();
  const baseStyle = [styles.screen, { backgroundColor: p.bg }, style];
  if (scroll)
    return (
      <ScrollView style={baseStyle} contentContainerStyle={[styles.content, contentStyle]}>
        {children}
      </ScrollView>
    );
  return <View style={baseStyle}>{children}</View>;
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const p = usePalette();
  return (
    <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }, style]}>
      {children}
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const p = usePalette();
  return <Text style={[type.micro, { color: p.mutedText, marginBottom: spacing.sm }]}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = "primary",
}: {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "accent" | "ghost";
}) {
  const p = usePalette();
  const isDisabled = disabled || loading;
  const bg = variant === "ghost" ? "transparent" : variant === "accent" ? p.accent : p.primary;
  const fg = variant === "ghost" ? p.text : variant === "accent" ? p.bg : p.onPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[type.heading, { color: fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry,
  autoCapitalize = "none",
  keyboardType = "default",
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string | null;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words";
  keyboardType?: "default" | "email-address";
  placeholder?: string;
}) {
  const p = usePalette();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[type.caption, { color: p.mutedText, marginBottom: 6 }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={p.mutedText}
        style={[
          styles.input,
          {
            backgroundColor: p.surfaceAlt,
            borderColor: error ? brand.danger : p.border,
            color: p.text,
          },
        ]}
      />
      {error ? (
        <Text style={[type.micro, { color: brand.danger, marginTop: 4 }]}>{error}</Text>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  const p = usePalette();
  return (
    <Card style={styles.empty}>
      <Text style={{ fontSize: 40 }}>{icon}</Text>
      <Text style={[type.heading, { color: p.text, marginTop: spacing.sm }]}>{title}</Text>
      <Text style={[type.caption, { color: p.mutedText, textAlign: "center", marginTop: spacing.xs }]}>
        {body}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  button: {
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  empty: { alignItems: "center", paddingVertical: spacing.xxl },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
  },
});