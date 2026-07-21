import type { IconSvgElement } from "@hugeicons/react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import {
  brand,
  radius,
  spacing,
  theme,
  typography,
} from "../../constants/theme";
import { Badge } from "./Badge";

interface ConversationRowProps {
  title: string;
  subtitle?: string;
  timestamp?: string;
  unreadCount?: number;
  /** Journey rows lead with a transport icon. */
  icon?: IconSvgElement;
  /** DM rows lead with an avatar; falls back to the initial when absent. */
  avatarUrl?: string;
  onPress?: () => void;
}

/**
 * Shared row for both Chats sub-tabs. Journeys and DMs differ only in the leading
 * element and metadata, so the layout lives here once.
 */
export const ConversationRow: React.FC<ConversationRowProps> = ({
  title,
  subtitle,
  timestamp,
  unreadCount = 0,
  icon,
  avatarUrl,
  onPress,
}) => (
  <Pressable
    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    onPress={onPress}
    accessibilityRole="button"
  >
    <View style={styles.leading}>
      {icon ? (
        <HugeiconsIcon
          icon={icon}
          size={22}
          strokeWidth={1.8}
          color={brand.tealDeep}
        />
      ) : avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <Text style={styles.initial}>
          {title.trim().charAt(0).toUpperCase() || "?"}
        </Text>
      )}
    </View>

    <View style={styles.body}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>

    <View style={styles.meta}>
      {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
      <Badge count={unreadCount} />
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  rowPressed: {
    backgroundColor: theme.surface,
  },
  leading: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: brand.tealMuted,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatar: {
    width: 44,
    height: 44,
  },
  initial: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: brand.tealDeep,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.md,
    fontWeight: typography.medium,
    color: theme.textPrimary,
  },
  subtitle: {
    fontSize: typography.base,
    color: theme.textSecondary,
  },
  meta: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  timestamp: {
    fontSize: typography.xs,
    color: theme.textMuted,
  },
});
