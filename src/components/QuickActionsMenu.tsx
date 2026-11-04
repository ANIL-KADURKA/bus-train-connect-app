import {
	PackageAddIcon,
	Route01Icon,
	Ticket01Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { brand, radius, spacing, theme, typography } from "../constants/theme";
import { FAB_INSET, FAB_SIZE } from "./Fab";

export type QuickAction = "createJourney" | "parcelRequest" | "findPassengers" | "sellTicket";

interface ActionItem {
	key: QuickAction;
	label: string;
	icon: IconSvgElement;
}

const ACTIONS: ActionItem[] = [
	{ key: "createJourney", label: "Create Journey", icon: Route01Icon },
	{ key: "parcelRequest", label: "Parcel Request", icon: PackageAddIcon },
	{ key: "findPassengers", label: "Find Passengers", icon: UserGroupIcon },
	{ key: "sellTicket", label: "Sell Ticket", icon: Ticket01Icon },
];

const ANIMATION_MS = 160;

interface QuickActionsMenuProps {
	visible: boolean;
	onClose: () => void;
	onSelect: (action: QuickAction) => void;
}

/**
 * Compact popup anchored directly above the FAB.
 *
 * Deliberately not a Modal: it stays inside the Home screen's view tree so it lines up
 * with the FAB's coordinates, and it is small enough that dimming the whole app would be
 * heavier than the interaction deserves.
 */
export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
	visible,
	onClose,
	onSelect,
}) => {
	const progress = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.timing(progress, {
			toValue: visible ? 1 : 0,
			duration: ANIMATION_MS,
			easing: Easing.out(Easing.ease),
			useNativeDriver: true,
		}).start();
	}, [visible, progress]);

	if (!visible) {
		return null;
	}

	return (
		<>
			{/* Catches taps anywhere else on the screen to dismiss. */}
			<Pressable
				style={StyleSheet.absoluteFill}
				onPress={onClose}
				accessibilityRole="button"
				accessibilityLabel="Close menu"
			/>

			<Animated.View
				style={[
					styles.menu,
					{
						opacity: progress,
						transform: [
							{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
							{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
						],
					},
				]}
			>
				{ACTIONS.map((action, index) => (
					<Pressable
						key={action.key}
						style={({ pressed }) => [
							styles.row,
							index > 0 && styles.rowDivided,
							pressed && styles.rowPressed,
						]}
						onPress={() => onSelect(action.key)}
						accessibilityRole="button"
						accessibilityLabel={action.label}
					>
						<View style={styles.iconWrap}>
							<HugeiconsIcon
								icon={action.icon}
								size={17}
								strokeWidth={1.9}
								color={brand.tealDeep}
							/>
						</View>
						<Text style={styles.label}>{action.label}</Text>
					</Pressable>
				))}
			</Animated.View>
		</>
	);
};

const styles = StyleSheet.create({
	menu: {
		position: "absolute",
		right: FAB_INSET,
		// Sits just above the FAB, sharing its right edge.
		bottom: FAB_INSET + FAB_SIZE + spacing.sm,
		minWidth: 196,
		backgroundColor: theme.card,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: theme.border,
		paddingVertical: spacing.xs,
		...Platform.select({
			ios: {
				shadowColor: theme.black,
				shadowOpacity: 0.14,
				shadowRadius: 12,
				shadowOffset: { width: 0, height: 4 },
			},
			android: { elevation: 8 },
		}),
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm + 2,
		paddingVertical: spacing.sm + 2,
		paddingHorizontal: spacing.md,
	},
	rowDivided: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: theme.divider,
	},
	rowPressed: {
		backgroundColor: theme.surface,
	},
	iconWrap: {
		width: 30,
		height: 30,
		borderRadius: radius.full,
		backgroundColor: brand.tealMuted,
		alignItems: "center",
		justifyContent: "center",
	},
	label: {
		fontSize: typography.base,
		fontWeight: typography.medium,
		color: theme.textPrimary,
	},
});
