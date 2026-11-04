import type { FC } from "react";
import React from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { Passenger } from "../../api/journeys";
import { brand, spacing, theme, typography } from "../../constants/theme";
import { type ChatStatus, PassengerCard } from "./PassengerCard";

interface Props {
	members: Passenger[];
	isLoading: boolean;
	statusFor: (userId: string) => ChatStatus;
	isBusy?: (userId: string) => boolean;
	onAction: (member: Passenger) => void;
	onViewAll: () => void;
}

/**
 * How many cards the carousel shows before deferring to "View all". Enough that a small
 * group is fully visible inline, few enough that a large one does not become a scrolling
 * chore in a strip this short.
 */
const PREVIEW_COUNT = 8;

export const PassengersSection: FC<Props> = ({
	members,
	isLoading,
	statusFor,
	isBusy,
	onAction,
	onViewAll,
}) => {
	const preview = members.slice(0, PREVIEW_COUNT);

	return (
		<View style={styles.section}>
			<View style={styles.header}>
				<Text style={styles.title}>
					Passengers
					{members.length > 0 ? <Text style={styles.count}> · {members.length}</Text> : null}
				</Text>

				<Pressable
					onPress={onViewAll}
					accessibilityRole="button"
					accessibilityLabel="View all passengers"
				>
					<Text style={styles.viewAll}>View all</Text>
				</Pressable>
			</View>

			{isLoading ? (
				<View style={styles.loading}>
					<ActivityIndicator size="small" color={brand.teal} />
				</View>
			) : members.length === 0 ? (
				<Text style={styles.empty}>No one else has joined yet.</Text>
			) : (
				<FlatList
					horizontal
					data={preview}
					keyExtractor={(item) => item.userId}
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.carousel}
					renderItem={({ item }) => (
						<PassengerCard
							member={item}
							status={statusFor(item.userId)}
							busy={isBusy?.(item.userId)}
							onPress={() => onAction(item)}
						/>
					)}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	section: {
		paddingTop: spacing.sm,
		paddingBottom: spacing.md,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		// Matches Home's gutter: the section is rendered edge-to-edge so the carousel can
		// scroll out past it, and pads its own contents back to the same alignment.
		paddingHorizontal: spacing.xl,
		paddingBottom: spacing.sm,
	},
	title: {
		fontSize: typography.sm,
		fontWeight: typography.bold,
		color: theme.textMuted,
		textTransform: "uppercase",
		letterSpacing: typography.wide,
	},
	count: {
		color: theme.textSecondary,
	},
	viewAll: {
		fontSize: typography.sm,
		fontWeight: typography.bold,
		color: brand.tealDeep,
	},
	carousel: {
		gap: spacing.sm,
		paddingHorizontal: spacing.xl,
	},
	loading: {
		paddingVertical: spacing.lg,
		alignItems: "center",
	},
	empty: {
		paddingHorizontal: spacing.xl,
		paddingVertical: spacing.md,
		fontSize: typography.base,
		color: theme.textMuted,
	},
});
