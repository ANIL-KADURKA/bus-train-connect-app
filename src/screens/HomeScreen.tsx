import { Bus01Icon, Cancel01Icon, Search01Icon, Train01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { type CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Modal,
	Pressable,
	RefreshControl,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { JourneyListItem, JourneySearch } from "../api/journeys";
import { Fab } from "../components/Fab";
import { JourneyCard } from "../components/JourneyCard";
import { ModeSwitcher } from "../components/ModeSwitcher";
import { type QuickAction, QuickActionsMenu } from "../components/QuickActionsMenu";
import { brand, radius, spacing, theme, typography } from "../constants/theme";
import { useJoinJourney, useJourneys } from "../hooks/useJourneys";
import type { MainTabParamList } from "../navigation/MainTabNavigator";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useModeStore } from "../store/modeStore";
import { formatShortDate } from "../utils/date.utils";
import { CreateJourneyModal } from "./Journeys/CreateJourneyModal";
import { SearchJourneysModal } from "./Journeys/SearchJourneysModal";

type HomeNavigation = CompositeNavigationProp<
	BottomTabNavigationProp<MainTabParamList, "Home">,
	NativeStackNavigationProp<RootStackParamList>
>;

/** "Hyderabad, Telangana, India" -> "Hyderabad", so the search bar stays readable. */
const shortPlace = (text: string): string => text.split(",")[0].trim();

const searchSummary = (search: JourneySearch): string =>
	search.kind === "registration"
		? search.registrationNumber
		: `${shortPlace(search.source.text)} → ${shortPlace(search.destination.text)} · ${formatShortDate(search.journeyDate)}`;

export const HomeScreen: React.FC = () => {
	const navigation = useNavigation<HomeNavigation>();
	const mode = useModeStore((state) => state.mode);
	const modeLabel = mode === "train" ? "train" : "bus";
	const [actionsOpen, setActionsOpen] = useState(false);
	const [createJourneyOpen, setCreateJourneyOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [search, setSearch] = useState<JourneySearch | null>(null);
	const [journeyToJoin, setJourneyToJoin] = useState<JourneyListItem | null>(null);

	const {
		data: journeys,
		isLoading,
		isRefetching,
		refetch,
		error,
	} = useJourneys(mode, search ?? undefined);
	const { mutate: join, isPending: joining, variables: joiningId } = useJoinJourney();
	const searchActive = search !== null;
	const results = journeys ?? [];

	const openJourneyChat = (journey: JourneyListItem) => {
		navigation.navigate("JourneyGroupChat", { journey });
	};

	const handleJoinPress = (journey: JourneyListItem) => {
		if (journey.isMember) {
			openJourneyChat(journey);
			return;
		}

		setJourneyToJoin(journey);
	};

	const handleConfirmJoin = () => {
		if (!journeyToJoin) {
			return;
		}

		const journey = journeyToJoin;

		join(journey.journeyId, {
			onSuccess: () => {
				setJourneyToJoin(null);
				openJourneyChat({
					...journey,
					isMember: true,
					memberCount: journey.memberCount + 1,
				});
			},
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
				<Pressable
					style={styles.search}
					onPress={() => setSearchOpen(true)}
					accessibilityRole="search"
					accessibilityLabel={`Search ${modeLabel} journeys`}
				>
					<HugeiconsIcon icon={Search01Icon} size={18} strokeWidth={1.8} color={theme.textMuted} />
					<Text
						style={[styles.searchText, !searchActive && styles.searchPlaceholder]}
						numberOfLines={1}
					>
						{search ? searchSummary(search) : `Search by route or ${modeLabel} number`}
					</Text>
					{searchActive ? (
						<Pressable
							style={styles.clearSearchButton}
							onPress={() => setSearch(null)}
							accessibilityRole="button"
							accessibilityLabel="Clear search"
							hitSlop={8}
						>
							<HugeiconsIcon
								icon={Cancel01Icon}
								size={16}
								strokeWidth={1.8}
								color={theme.textMuted}
							/>
						</Pressable>
					) : null}
				</Pressable>
			</View>

			{isLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" color={brand.teal} />
				</View>
			) : (
				<FlatList
					data={results}
					keyExtractor={(item) => item.journeyId}
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={brand.teal} />
					}
					ListHeaderComponent={
						<Text style={styles.sectionTitle}>
							{searchActive ? "Matching" : "Upcoming"} {modeLabel} journeys
							{results.length ? ` (${results.length})` : ""}
						</Text>
					}
					renderItem={({ item }) => (
						<JourneyCard
							journey={item}
							onJoin={handleJoinPress}
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
								{error
									? "Couldn't load journeys"
									: searchActive
										? "No matching journeys"
										: `No upcoming ${modeLabel} journeys`}
							</Text>
							<Text style={styles.placeholderBody}>
								{error
									? "Pull down to try again."
									: search?.kind === "route"
										? "No journey found for that route and date. Try another date, or add the journey yourself."
										: search?.kind === "registration"
											? `No upcoming journey for that ${modeLabel} number yet. Tap + to add it.`
											: "Tap + to add one — fellow passengers on the same vehicle will join you."}
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

			<Modal
				visible={journeyToJoin !== null}
				transparent
				animationType="fade"
				onRequestClose={() => setJourneyToJoin(null)}
			>
				<View style={styles.modalOverlay}>
					<Pressable style={styles.modalBackdrop} onPress={() => setJourneyToJoin(null)} />
					<View style={styles.joinModal} accessibilityViewIsModal>
						<Text style={styles.modalTitle}>Join chat?</Text>

						{journeyToJoin ? (
							<View style={styles.detailList}>
								<View style={styles.detailRow}>
									<Text style={styles.detailLabel}>{mode === "train" ? "Train" : "Bus"}</Text>
									<Text style={styles.detailValue}>
										{journeyToJoin.serviceName
											? `${journeyToJoin.registrationNumber} · ${journeyToJoin.serviceName}`
											: journeyToJoin.registrationNumber}
									</Text>
								</View>

								<View style={styles.detailRow}>
									<Text style={styles.detailLabel}>Source</Text>
									<Text style={styles.detailValue}>{journeyToJoin.sourceLocation}</Text>
								</View>

								<View style={styles.detailRow}>
									<Text style={styles.detailLabel}>Destination</Text>
									<Text style={styles.detailValue}>{journeyToJoin.destinationLocation}</Text>
								</View>

								<View style={styles.detailRow}>
									<Text style={styles.detailLabel}>Date</Text>
									<Text style={styles.detailValue}>{journeyToJoin.journeyDate}</Text>
								</View>
							</View>
						) : null}

						<View style={styles.modalActions}>
							<Pressable
								style={[styles.modalButton, styles.cancelButton]}
								onPress={() => setJourneyToJoin(null)}
								disabled={joining}
								accessibilityRole="button"
							>
								<Text style={styles.cancelButtonText}>Cancel</Text>
							</Pressable>

							<Pressable
								style={[styles.modalButton, styles.confirmButton]}
								onPress={handleConfirmJoin}
								disabled={joining}
								accessibilityRole="button"
							>
								{joining ? (
									<ActivityIndicator size="small" color={theme.white} />
								) : (
									<Text style={styles.confirmButtonText}>Join</Text>
								)}
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>

			<CreateJourneyModal visible={createJourneyOpen} onClose={() => setCreateJourneyOpen(false)} />

			<SearchJourneysModal
				visible={searchOpen}
				mode={mode}
				current={search}
				onClose={() => setSearchOpen(false)}
				onApply={(next) => {
					setSearch(next);
					setSearchOpen(false);
				}}
				onClear={() => {
					setSearch(null);
					setSearchOpen(false);
				}}
			/>
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
	searchText: {
		flex: 1,
		fontSize: typography.base,
		color: theme.textPrimary,
	},
	searchPlaceholder: {
		color: theme.textMuted,
	},
	clearSearchButton: {
		width: 28,
		height: 28,
		alignItems: "center",
		justifyContent: "center",
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
	modalOverlay: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.xl,
		backgroundColor: "rgba(13,27,42,0.38)",
	},
	modalBackdrop: {
		...StyleSheet.absoluteFillObject,
	},
	joinModal: {
		width: "100%",
		maxWidth: 360,
		padding: spacing.lg,
		borderRadius: radius.lg,
		backgroundColor: theme.card,
		borderWidth: 1,
		borderColor: theme.border,
		gap: spacing.md,
	},
	modalTitle: {
		fontSize: typography.lg,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	detailList: {
		gap: spacing.md,
	},
	detailRow: {
		gap: spacing.xs,
	},
	detailLabel: {
		fontSize: typography.sm,
		fontWeight: typography.bold,
		color: theme.textMuted,
		textTransform: "uppercase",
	},
	detailValue: {
		fontSize: typography.base,
		color: theme.textPrimary,
	},
	modalActions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: spacing.sm,
	},
	modalButton: {
		minWidth: 92,
		height: 42,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.md,
		paddingHorizontal: spacing.md,
	},
	cancelButton: {
		backgroundColor: theme.inputBackground,
		borderWidth: 1,
		borderColor: theme.inputBorder,
	},
	confirmButton: {
		backgroundColor: brand.teal,
	},
	cancelButtonText: {
		fontSize: typography.base,
		fontWeight: typography.bold,
		color: theme.textSecondary,
	},
	confirmButtonText: {
		fontSize: typography.base,
		fontWeight: typography.bold,
		color: theme.white,
	},
});
