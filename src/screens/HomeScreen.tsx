import { Bus01Icon, Train01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { type CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
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
import { JourneySearchForm } from "../components/shared/JourneySearchForm";
import type { ChatStatus } from "../components/shared/PassengerCard";
import { PassengersModal } from "../components/shared/PassengersModal";
import { PassengersSection } from "../components/shared/PassengersSection";
import { brand, radius, spacing, theme, typography } from "../constants/theme";
import { useJoinJourney, useJourneys, usePassengers } from "../hooks/useJourneys";
import type { MainTabParamList } from "../navigation/MainTabNavigator";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useModeStore } from "../store/modeStore";
import { CreateJourneyModal } from "./Journeys/CreateJourneyModal";

type HomeNavigation = CompositeNavigationProp<
	BottomTabNavigationProp<MainTabParamList, "Home">,
	NativeStackNavigationProp<RootStackParamList>
>;

export const HomeScreen: React.FC = () => {
	const navigation = useNavigation<HomeNavigation>();
	const mode = useModeStore((state) => state.mode);
	const modeLabel = mode === "train" ? "train" : "bus";
	const [actionsOpen, setActionsOpen] = useState(false);
	const [createJourneyOpen, setCreateJourneyOpen] = useState(false);
	const [search, setSearch] = useState<JourneySearch | null>(null);
	const [journeyToJoin, setJourneyToJoin] = useState<JourneyListItem | null>(null);
	const [passengersOpen, setPassengersOpen] = useState(false);
	// Local-only for now: tapping Request flips a traveller straight to accepted so both
	// button states are reachable while the chat_requests endpoints are still to come.
	const [chatStatuses, setChatStatuses] = useState<Record<string, ChatStatus>>({});

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
	// Passengers follow whatever the list is showing, so switching mode or searching
	// narrows the carousel to the people actually on those journeys.
	const journeyIds = useMemo(() => results.map((item) => item.journeyId), [results]);
	const { data: passengers = [], isLoading: passengersLoading } = usePassengers(journeyIds);

	const statusFor = (userId: string): ChatStatus => chatStatuses[userId] ?? "none";

	const toggleChatStatus = (userId: string) =>
		setChatStatuses((current) => ({
			...current,
			[userId]: current[userId] === "accepted" ? "none" : "accepted",
		}));

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
			{/* Fixed above the list — always visible, never behind a menu. */}
			<ModeSwitcher />

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
						<RefreshControl
							refreshing={isRefetching}
							onRefresh={() => {
								refetch();
							}}
							tintColor={brand.teal}
						/>
					}
					ListHeaderComponent={
						<>
							<JourneySearchForm
								mode={mode}
								current={search}
								onApply={setSearch}
								onClear={() => setSearch(null)}
							/>

							{/* Rendered edge-to-edge so the carousel scrolls past the list gutter; the
							    section pads its own contents back into alignment. */}
							<View style={styles.bleed}>
								<PassengersSection
									members={passengers}
									isLoading={passengersLoading}
									statusFor={statusFor}
									onRequestChat={(passenger) => toggleChatStatus(passenger.userId)}
									onOpenChat={(passenger) => toggleChatStatus(passenger.userId)}
									onViewAll={() => setPassengersOpen(true)}
								/>
							</View>

							<Text style={styles.sectionTitle}>
								{searchActive ? "Matching" : "Upcoming"} {modeLabel} journeys
								{results.length ? ` (${results.length})` : ""}
							</Text>
						</>
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

			<PassengersModal
				visible={passengersOpen}
				members={passengers}
				isLoading={passengersLoading}
				statusFor={statusFor}
				onRequestChat={(passenger) => toggleChatStatus(passenger.userId)}
				onOpenChat={(passenger) => toggleChatStatus(passenger.userId)}
				onClose={() => setPassengersOpen(false)}
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
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	content: {
		paddingHorizontal: spacing.xl,
		// The search form is the first thing in the list header, so the breathing room the
		// old search bar had above it now belongs to the list itself.
		paddingTop: spacing.md,
		// Clears the FAB (56px tall, spacing.xl from the bottom) so the last card in a
		// scrolled list is never hidden behind it.
		paddingBottom: 56 + spacing.xl * 2,
		gap: spacing.md,
	},
	bleed: {
		marginHorizontal: -spacing.xl,
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
		...StyleSheet.absoluteFill,
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
