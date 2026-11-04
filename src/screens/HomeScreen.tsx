import { BubbleChatAddIcon, Bus01Icon, Train01Icon } from "@hugeicons/core-free-icons";
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
import type { JourneyListItem, JourneySearch, Passenger } from "../api/journeys";
import { Fab } from "../components/Fab";
import { JourneyCard } from "../components/JourneyCard";
import { ModeSwitcher } from "../components/ModeSwitcher";
import { type QuickAction, QuickActionsMenu } from "../components/QuickActionsMenu";
import { Badge } from "../components/shared/Badge";
import { JourneySearchForm } from "../components/shared/JourneySearchForm";
import { PassengersModal } from "../components/shared/PassengersModal";
import { PassengersSection } from "../components/shared/PassengersSection";
import { brand, radius, spacing, theme, typography } from "../constants/theme";
import {
	useChatStatuses,
	useSendChatRequest,
	useWithdrawChatRequest,
} from "../hooks/useChatRequests";
import { useAllJourneys, useJoinJourney, useJourneys, usePassengers } from "../hooks/useJourneys";
import type { MainTabParamList } from "../navigation/MainTabNavigator";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useBadgeStore } from "../store/badgeStore";
import { confirm } from "../store/confirmStore";
import { useModeStore } from "../store/modeStore";
import { getApiErrorMessage } from "../utils/errorhandler.utils";
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
	// "browse" is View all from the carousel; "find" is the + menu, which adds the My journeys filter.
	const [passengersView, setPassengersView] = useState<"browse" | "find" | null>(null);
	const { statusFor, requestFor } = useChatStatuses();
	const sendRequest = useSendChatRequest();
	const withdrawRequest = useWithdrawChatRequest();
	const pendingChatRequests = useBadgeStore((state) => state.pendingChatRequests);

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

	// Across both modes, not just the active one: "my journeys" means every trip you've joined.
	// Only fetched once Find Passengers is opened, so plain browsing costs nothing extra.
	const findingPassengers = passengersView === "find";
	const { data: allJourneys, isLoading: allJourneysLoading } = useAllJourneys(findingPassengers);
	const myJourneyIds = useMemo(
		() => (allJourneys ?? []).filter((item) => item.isMember).map((item) => item.journeyId),
		[allJourneys],
	);
	const { data: myJourneyPassengers = [], isLoading: myJourneyPassengersLoading } = usePassengers(
		myJourneyIds,
		findingPassengers,
	);

	const openChatRequests = () => {
		// The Passengers sheet is a Modal and would stay on top of the pushed screen.
		setPassengersView(null);
		navigation.navigate("ChatRequests");
	};

	// The mutations stay pending until the refetch they trigger lands (useChatRequests
	// returns that promise), so the spinner hands straight over to the new label.
	const isBusy = (userId: string): boolean =>
		(sendRequest.isPending && sendRequest.variables === userId) ||
		(withdrawRequest.isPending && withdrawRequest.variables === requestFor(userId)?.requestId);

	/** One card button, four meanings — see ChatStatus. */
	const handlePassengerAction = (passenger: Passenger) => {
		const status = statusFor(passenger.userId);
		const request = requestFor(passenger.userId);

		if (status === "none") {
			sendRequest.mutate(passenger.userId, {
				onError: (cause) => Alert.alert("Could not send request", getApiErrorMessage(cause)),
			});
			return;
		}

		if (status === "pending" && request) {
			confirm({
				title: "Chat request pending",
				message: `${passenger.displayName} hasn't replied yet. Withdraw your request?`,
				cancelLabel: "Leave as is",
				confirmLabel: "Withdraw",
				tone: "destructive",
				onConfirm: () =>
					withdrawRequest.mutate(request.requestId, {
						onError: (cause) => Alert.alert("Could not withdraw", getApiErrorMessage(cause)),
					}),
			});
			return;
		}

		if (status === "incoming") {
			openChatRequests();
			return;
		}

		// Accepted. Opens even if one of you has since declined: the chat screen explains that
		// and is where it can be undone.
		if (request?.chatId) {
			// The Passengers sheet is a Modal and would stay on top of the pushed screen.
			setPassengersView(null);
			navigation.navigate("DirectChat", { chatId: request.chatId, otherUser: request.otherUser });
		}
	};

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

		if (action === "findPassengers") {
			setPassengersView("find");
			return;
		}

		// Parcels and ticket resale land with their own features.
		Alert.alert("Coming soon", "This isn't built yet.");
	};

	return (
		<SafeAreaView style={styles.root} edges={["top"]}>
			{/* Fixed above the list — always visible, never behind a menu. */}
			<ModeSwitcher
				trailing={
					<Pressable
						style={styles.requestsButton}
						onPress={openChatRequests}
						accessibilityRole="button"
						accessibilityLabel={
							pendingChatRequests > 0
								? `Chat requests, ${pendingChatRequests} new`
								: "Chat requests"
						}
					>
						<HugeiconsIcon
							icon={BubbleChatAddIcon}
							size={22}
							strokeWidth={1.8}
							color={brand.tealDeep}
						/>
						<Badge count={pendingChatRequests} style={styles.requestsBadge} />
					</Pressable>
				}
			/>

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
									isBusy={isBusy}
									onAction={handlePassengerAction}
									onViewAll={() => setPassengersView("browse")}
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
				visible={passengersView !== null}
				members={passengers}
				isLoading={passengersLoading}
				myJourneys={
					findingPassengers
						? {
								members: myJourneyPassengers,
								// No joined journeys means usePassengers never runs, so only the journey
								// lookup itself counts as loading.
								isLoading:
									allJourneysLoading || (myJourneyIds.length > 0 && myJourneyPassengersLoading),
							}
						: undefined
				}
				statusFor={statusFor}
				isBusy={isBusy}
				onAction={handlePassengerAction}
				onClose={() => setPassengersView(null)}
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
	requestsButton: {
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.full,
		backgroundColor: brand.tealMuted,
		borderWidth: 1,
		borderColor: brand.tealBorder,
	},
	requestsBadge: {
		position: "absolute",
		top: -4,
		right: -4,
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
