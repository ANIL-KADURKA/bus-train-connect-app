import { Bus01Icon, Search01Icon, Train01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Pressable,
	RefreshControl,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fab } from "../components/Fab";
import { JourneyCard } from "../components/JourneyCard";
import { ModeSwitcher } from "../components/ModeSwitcher";
import { type QuickAction, QuickActionsMenu } from "../components/QuickActionsMenu";
import { brand, radius, spacing, theme, typography } from "../constants/theme";
import { useJoinJourney, useJourneys } from "../hooks/useJourneys";
import { useModeStore } from "../store/modeStore";
import { CreateJourneyModal } from "./Journeys/CreateJourneyModal";

export const HomeScreen: React.FC = () => {
	const mode = useModeStore((state) => state.mode);
	const modeLabel = mode === "train" ? "train" : "bus";
	const [actionsOpen, setActionsOpen] = useState(false);
	const [createJourneyOpen, setCreateJourneyOpen] = useState(false);

	const { data: journeys, isLoading, isRefetching, refetch, error } = useJourneys(mode);
	const { mutate: join, isPending: joining, variables: joiningId } = useJoinJourney();

	const handleJoin = (journeyId: string) => {
		join(journeyId, {
			onError: (cause: unknown) => {
				const message = cause instanceof Error ? cause.message : "Something went wrong.";
				Alert.alert("Could not join", message);
			},
		});
	};

	const handleAction = (action: QuickAction) => {
		setActionsOpen(false);

		if (action === "createJourney") {
			setCreateJourneyOpen(true);
			return;
		}

		// Parcels, co-passenger search and ticket resale land with their own features.
		Alert.alert("Coming soon", "This isn't built yet.");
	};

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

			{isLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" color={brand.teal} />
				</View>
			) : (
				<FlatList
					data={journeys ?? []}
					keyExtractor={(item) => item.journeyId}
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={brand.teal} />
					}
					ListHeaderComponent={
						<Text style={styles.sectionTitle}>
							Upcoming {modeLabel} journeys
							{journeys?.length ? ` (${journeys.length})` : ""}
						</Text>
					}
					renderItem={({ item }) => (
						<JourneyCard
							journey={item}
							onJoin={handleJoin}
							// Only the row being joined shows a spinner.
							joining={joining && joiningId === item.journeyId}
						/>
					)}
					ListEmptyComponent={
						<View style={styles.placeholderCard}>
							<HugeiconsIcon
								icon={mode === "train" ? Train01Icon : Bus01Icon}
								size={28}
								strokeWidth={1.5}
								color={brand.tealDeep}
							/>
							<Text style={styles.placeholderTitle}>
								{error ? "Couldn't load journeys" : `No upcoming ${modeLabel} journeys`}
							</Text>
							<Text style={styles.placeholderBody}>
								{error
									? "Pull down to try again."
									: "Tap + to add one — fellow passengers on the same service will join you."}
							</Text>
						</View>
					}
				/>
			)}

			{/* Menu renders before the FAB so the FAB stays tappable to dismiss. */}
			<QuickActionsMenu
				visible={actionsOpen}
				onClose={() => setActionsOpen(false)}
				onSelect={handleAction}
			/>

			<Fab
				onPress={() => setActionsOpen((open) => !open)}
				active={actionsOpen}
				accessibilityLabel="Create journey, parcel request and more"
			/>

			<CreateJourneyModal visible={createJourneyOpen} onClose={() => setCreateJourneyOpen(false)} />
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
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	content: {
		paddingHorizontal: spacing.xl,
		// Clears the FAB (56px tall, spacing.xl from the bottom) so the last card in a
		// scrolled list is never hidden behind it.
		paddingBottom: 56 + spacing.xl * 2,
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
});
