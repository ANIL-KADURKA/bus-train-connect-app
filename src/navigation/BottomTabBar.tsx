import { BubbleChatIcon, Home01Icon, Package01Icon, User02Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge } from "../components/shared/Badge";
import { brand, spacing, theme, typography } from "../constants/theme";
import { selectChatsUnread, useBadgeStore } from "../store/badgeStore";

const ICONS: Record<string, IconSvgElement> = {
	Home: Home01Icon,
	Chats: BubbleChatIcon,
	Parcels: Package01Icon,
	Profile: User02Icon,
};

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
	const insets = useSafeAreaInsets();
	const chatsUnread = useBadgeStore(selectChatsUnread);
	const activeParcels = useBadgeStore((badges) => badges.activeParcels);

	const badgeFor = (routeName: string): number => {
		if (routeName === "Chats") return chatsUnread;
		if (routeName === "Parcels") return activeParcels;

		return 0;
	};

	return (
		<View
			style={[
				styles.bar,
				// Sit above the iOS home indicator without adding dead space on Android.
				{ paddingBottom: Math.max(insets.bottom, spacing.sm) },
			]}
		>
			{state.routes.map((route, index) => {
				const { options } = descriptors[route.key];
				const label = options.title ?? route.name;
				const focused = state.index === index;

				const onPress = () => {
					const event = navigation.emit({
						type: "tabPress",
						target: route.key,
						canPreventDefault: true,
					});

					if (!focused && !event.defaultPrevented) {
						navigation.navigate(route.name);
					}
				};

				return (
					<Pressable
						key={route.key}
						style={styles.tab}
						onPress={onPress}
						accessibilityRole="button"
						accessibilityState={{ selected: focused }}
						accessibilityLabel={label}
					>
						<View>
							<HugeiconsIcon
								icon={ICONS[route.name] ?? Home01Icon}
								size={24}
								// No solid variants in the free icon set, so the active tab is
								// carried by colour plus a heavier stroke.
								strokeWidth={focused ? 2.4 : 1.6}
								color={focused ? brand.teal : theme.textMuted}
							/>
							<Badge count={badgeFor(route.name)} style={styles.badge} />
						</View>

						<Text style={[styles.label, focused ? styles.labelActive : styles.labelInactive]}>
							{label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	bar: {
		flexDirection: "row",
		backgroundColor: theme.card,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: theme.border,
		paddingTop: spacing.sm,
		// Subtle elevation only — the design system avoids heavy shadows.
		...Platform.select({
			ios: {
				shadowColor: theme.black,
				shadowOpacity: 0.06,
				shadowRadius: 8,
				shadowOffset: { width: 0, height: -2 },
			},
			android: { elevation: 8 },
		}),
	},
	tab: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs,
	},
	badge: {
		position: "absolute",
		top: -4,
		right: -10,
	},
	label: {
		fontSize: typography.sm,
	},
	labelActive: {
		color: brand.teal,
		fontWeight: typography.bold,
	},
	labelInactive: {
		color: theme.textMuted,
		fontWeight: typography.medium,
	},
});
