import { Bus01Icon, Search01Icon, Train01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ModeSwitcher } from "../components/ModeSwitcher";
import { brand, radius, spacing, theme, typography } from "../constants/theme";
import { useModeStore } from "../store/modeStore";

export const HomeScreen: React.FC = () => {
	const mode = useModeStore((state) => state.mode);
	const modeLabel = mode === "train" ? "train" : "bus";

	// Scoped to `mode`. Populated once the journeys API exists.
	const activeJourneys: unknown[] = [];
	const upcomingJourneys: unknown[] = [];

	return (
		<SafeAreaView style={styles.root} edges={["top"]}>
			{/* Fixed above the search bar — always visible, never behind a menu. */}
			<ModeSwitcher />

			<View style={styles.searchWrap}>
				<Pressable style={styles.search} accessibilityRole="search">
					<HugeiconsIcon icon={Search01Icon} size={18} strokeWidth={1.8} color={theme.textMuted} />
					<Text style={styles.searchPlaceholder}>Search {modeLabel} number, route or PNR</Text>
				</Pressable>
			</View>

			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<Text style={styles.sectionTitle}>Active journey</Text>
				{activeJourneys.length === 0 ? (
					<View style={styles.placeholderCard}>
						<HugeiconsIcon
							icon={mode === "train" ? Train01Icon : Bus01Icon}
							size={28}
							strokeWidth={1.5}
							color={brand.tealDeep}
						/>
						<Text style={styles.placeholderTitle}>No active {modeLabel} journey</Text>
						<Text style={styles.placeholderBody}>
							Upload a ticket or add a journey to join its group.
						</Text>
					</View>
				) : null}

				<Text style={styles.sectionTitle}>Upcoming</Text>
				{upcomingJourneys.length === 0 ? (
					<Text style={styles.emptyLine}>
						Nothing upcoming. Your next {modeLabel} trip will show here.
					</Text>
				) : null}
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: theme.background,
	},
	searchWrap: {
		paddingHorizontal: spacing.xl,
		paddingBottom: spacing.md,
	},
	search: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		height: 44,
		paddingHorizontal: spacing.md,
		borderRadius: radius.md,
		backgroundColor: theme.inputBackground,
		borderWidth: 1,
		borderColor: theme.inputBorder,
	},
	searchPlaceholder: {
		fontSize: typography.base,
		color: theme.textMuted,
	},
	content: {
		paddingHorizontal: spacing.xl,
		paddingBottom: spacing.xxl,
		gap: spacing.md,
	},
	sectionTitle: {
		fontSize: typography.md,
		fontWeight: typography.bold,
		color: theme.textPrimary,
		marginTop: spacing.sm,
	},
	placeholderCard: {
		padding: spacing.xl,
		borderRadius: radius.lg,
		backgroundColor: theme.card,
		borderWidth: 1,
		borderColor: theme.border,
		alignItems: "center",
		gap: spacing.xs,
	},
	placeholderTitle: {
		fontSize: typography.base,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	placeholderBody: {
		fontSize: typography.base,
		color: theme.textSecondary,
		textAlign: "center",
	},
	emptyLine: {
		fontSize: typography.base,
		color: theme.textSecondary,
	},
});
