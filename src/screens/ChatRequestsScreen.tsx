import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { FC } from "react";
import React, { useMemo } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	RefreshControl,
	SectionList,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ChatRequest } from "../api/chatRequests";
import { GenderAvatar } from "../components/shared/GenderAvatar";
import { brand, radius, spacing, theme, typography } from "../constants/theme";
import {
	useChatRequests,
	useRespondToChatRequest,
	useWithdrawChatRequest,
} from "../hooks/useChatRequests";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { confirm } from "../store/confirmStore";
import { getApiErrorMessage } from "../utils/errorhandler.utils";
import { genderLabel } from "../utils/gender.utils";

const AVATAR_SIZE = 44;

type SectionKind = "received" | "sent" | "accepted" | "rejected";

type Section = { title: string; kind: SectionKind; data: ChatRequest[] };

/** The line under each person's name, so a row explains itself without its section. */
const describe = (kind: SectionKind, request: ChatRequest): string => {
	switch (kind) {
		case "received":
			return "Wants to chat with you";
		case "sent":
			return "Waiting for a reply";
		case "accepted":
			return request.direction === "incoming" ? "You accepted" : "Accepted your request";
		case "rejected":
			return "You declined";
	}
};

export const ChatRequestsScreen: FC = () => {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { data: requests = [], isLoading, isRefetching, refetch } = useChatRequests();
	const respond = useRespondToChatRequest();
	const withdraw = useWithdrawChatRequest();

	const sections = useMemo<Section[]>(() => {
		const where = (status: ChatRequest["status"], direction?: ChatRequest["direction"]) =>
			requests.filter(
				(request) =>
					request.status === status && (direction === undefined || request.direction === direction),
			);

		return (
			[
				{ title: "Received", kind: "received", data: where("pending", "incoming") },
				{ title: "Sent", kind: "sent", data: where("pending", "outgoing") },
				{ title: "Accepted", kind: "accepted", data: where("accepted") },
				// Only the ones you declined: you can reverse those. A sender is never shown a
				// rejection — their card simply offers Request again.
				{ title: "Declined", kind: "rejected", data: where("rejected", "incoming") },
			] satisfies Section[]
		).filter((section) => section.data.length > 0);
	}, [requests]);

	const busyId = respond.isPending
		? respond.variables?.requestId
		: withdraw.isPending
			? withdraw.variables
			: undefined;

	const handleRespond = (request: ChatRequest, action: "accept" | "reject") => {
		respond.mutate(
			{ requestId: request.requestId, action },
			{ onError: (cause) => Alert.alert("Could not update request", getApiErrorMessage(cause)) },
		);
	};

	const handleWithdraw = (request: ChatRequest) => {
		confirm({
			title: "Withdraw request?",
			message: `${request.otherUser.displayName} won't see your chat request any more.`,
			cancelLabel: "Leave as is",
			confirmLabel: "Withdraw",
			tone: "destructive",
			onConfirm: () =>
				withdraw.mutate(request.requestId, {
					onError: (cause) => Alert.alert("Could not withdraw", getApiErrorMessage(cause)),
				}),
		});
	};

	// Undoing an accept closes a chat the other person can already see, so it asks first.
	// Accepting a declined request needs no confirmation — it only opens a door.
	const handleRevokeAccept = (request: ChatRequest) => {
		confirm({
			title: "Reject this chat?",
			message: `${request.otherUser.displayName} will no longer be able to open a chat with you. You can accept again later.`,
			cancelLabel: "Keep chat",
			confirmLabel: "Reject",
			tone: "destructive",
			onConfirm: () => handleRespond(request, "reject"),
		});
	};

	const renderAction = (kind: SectionKind, request: ChatRequest) => {
		const name = request.otherUser.displayName;

		switch (kind) {
			case "received":
				return (
					<View style={styles.actions}>
						<Pressable
							style={[styles.button, styles.rejectButton]}
							onPress={() => handleRespond(request, "reject")}
							accessibilityRole="button"
							accessibilityLabel={`Reject chat request from ${name}`}
						>
							<Text style={styles.rejectText}>Reject</Text>
						</Pressable>
						<Pressable
							style={[styles.button, styles.acceptButton]}
							onPress={() => handleRespond(request, "accept")}
							accessibilityRole="button"
							accessibilityLabel={`Accept chat request from ${name}`}
						>
							<Text style={styles.acceptText}>Accept</Text>
						</Pressable>
					</View>
				);
			case "sent":
				return (
					<Pressable
						style={[styles.button, styles.rejectButton]}
						onPress={() => handleWithdraw(request)}
						accessibilityRole="button"
						accessibilityLabel={`Withdraw chat request to ${name}`}
					>
						<Text style={styles.rejectText}>Withdraw</Text>
					</Pressable>
				);
			case "accepted":
				// Only the person who accepted can change their mind; the sender has nothing to undo.
				return request.direction === "incoming" ? (
					<Pressable
						style={[styles.button, styles.rejectButton]}
						onPress={() => handleRevokeAccept(request)}
						accessibilityRole="button"
						accessibilityLabel={`Reject chat with ${name}`}
					>
						<Text style={styles.rejectText}>Reject</Text>
					</Pressable>
				) : null;
			case "rejected":
				return (
					<Pressable
						style={[styles.button, styles.acceptButton]}
						onPress={() => handleRespond(request, "accept")}
						accessibilityRole="button"
						accessibilityLabel={`Accept chat request from ${name}`}
					>
						<Text style={styles.acceptText}>Accept</Text>
					</Pressable>
				);
		}
	};

	return (
		<SafeAreaView style={styles.root} edges={["top", "bottom"]}>
			<View style={styles.header}>
				<Pressable
					style={styles.backButton}
					onPress={() => navigation.goBack()}
					accessibilityRole="button"
					accessibilityLabel="Back"
				>
					<HugeiconsIcon
						icon={ArrowLeft01Icon}
						size={22}
						strokeWidth={1.8}
						color={theme.textPrimary}
					/>
				</Pressable>
				<Text style={styles.title}>Chat requests</Text>
			</View>

			{isLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" color={brand.teal} />
				</View>
			) : (
				<SectionList
					sections={sections}
					keyExtractor={(item) => item.requestId}
					contentContainerStyle={styles.content}
					stickySectionHeadersEnabled={false}
					refreshControl={
						<RefreshControl
							refreshing={isRefetching}
							onRefresh={() => {
								refetch();
							}}
							tintColor={brand.teal}
						/>
					}
					renderSectionHeader={({ section }) => (
						<Text style={styles.sectionTitle}>
							{section.title} · {section.data.length}
						</Text>
					)}
					renderItem={({ item, section }) => {
						const busy = busyId === item.requestId;
						const person = item.otherUser;
						const subtitle = genderLabel(person.gender);

						return (
							<View style={styles.row}>
								{person.profilePhotoUrl ? (
									<Image
										source={{ uri: person.profilePhotoUrl }}
										style={styles.photo}
										accessibilityIgnoresInvertColors
									/>
								) : (
									<GenderAvatar gender={person.gender} size={AVATAR_SIZE} />
								)}

								<View style={styles.identity}>
									<Text style={styles.name} numberOfLines={1}>
										{person.displayName}
									</Text>
									<Text style={styles.meta} numberOfLines={1}>
										{describe(section.kind, item)}
										{subtitle ? ` · ${subtitle}` : ""}
									</Text>
								</View>

								{busy ? (
									<ActivityIndicator size="small" color={brand.teal} />
								) : (
									renderAction(section.kind, item)
								)}
							</View>
						);
					}}
					ListEmptyComponent={
						<View style={styles.empty}>
							<Text style={styles.emptyTitle}>No chat requests</Text>
							<Text style={styles.emptyBody}>
								Tap Request on a fellow passenger to start one. Requests sent to you show up here.
							</Text>
						</View>
					}
				/>
			)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: theme.background,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: theme.border,
	},
	backButton: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.full,
	},
	title: {
		fontSize: typography.lg,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	content: {
		padding: spacing.md,
		gap: spacing.sm,
		flexGrow: 1,
	},
	sectionTitle: {
		fontSize: typography.sm,
		fontWeight: typography.bold,
		color: theme.textMuted,
		textTransform: "uppercase",
		letterSpacing: typography.wide,
		marginTop: spacing.md,
		marginBottom: spacing.xs,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm + 2,
		padding: spacing.sm + 2,
		borderRadius: radius.lg,
		backgroundColor: theme.card,
		borderWidth: 1,
		borderColor: theme.border,
	},
	photo: {
		width: AVATAR_SIZE,
		height: AVATAR_SIZE,
		borderRadius: radius.full,
		backgroundColor: theme.surface,
	},
	identity: {
		flex: 1,
		gap: 2,
	},
	name: {
		fontSize: typography.base,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	meta: {
		fontSize: typography.sm,
		color: theme.textMuted,
	},
	actions: {
		flexDirection: "row",
		gap: spacing.xs,
	},
	button: {
		paddingHorizontal: spacing.sm + 4,
		paddingVertical: 7,
		borderRadius: radius.full,
	},
	acceptButton: {
		backgroundColor: brand.teal,
	},
	acceptText: {
		fontSize: typography.sm,
		fontWeight: typography.bold,
		color: theme.white,
	},
	rejectButton: {
		backgroundColor: theme.surface,
		borderWidth: 1,
		borderColor: theme.border,
	},
	rejectText: {
		fontSize: typography.sm,
		fontWeight: typography.bold,
		color: theme.textSecondary,
	},
	empty: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs,
		paddingHorizontal: spacing.xl,
	},
	emptyTitle: {
		fontSize: typography.base,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	emptyBody: {
		fontSize: typography.sm,
		color: theme.textMuted,
		textAlign: "center",
	},
});
