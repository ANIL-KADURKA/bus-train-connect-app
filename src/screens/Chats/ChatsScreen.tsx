import { Bus01Icon, Message01Icon, SentIcon, Train01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { type CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ChatRequest } from "../../api/chatRequests";
import { Badge } from "../../components/shared/Badge";
import { ConversationRow } from "../../components/shared/ConversationRow";
import { SegmentedControl, type SegmentOption } from "../../components/shared/SegmentedControl";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import { useChatRequests } from "../../hooks/useChatRequests";
import { useAllJourneys } from "../../hooks/useJourneys";
import type { MainTabParamList } from "../../navigation/MainTabNavigator";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useAuthStore } from "../../store/authStore";
import { useBadgeStore } from "../../store/badgeStore";
import { useGroupChatStore } from "../../store/groupChatStore";

type ChatsTab = "journeys" | "dms";

const TABS: SegmentOption<ChatsTab>[] = [
	{ value: "journeys", label: "Journeys" },
	{ value: "dms", label: "DMs" },
];

type ChatsNavigation = CompositeNavigationProp<
	BottomTabNavigationProp<MainTabParamList, "Chats">,
	NativeStackNavigationProp<RootStackParamList>
>;

const journeyChatTitle = (journey: { registrationNumber: string; serviceName?: string }): string =>
	journey.serviceName
		? `${journey.registrationNumber} · ${journey.serviceName}`
		: journey.registrationNumber;

const EmptyState: React.FC<{ title: string; body: string }> = ({ title, body }) => (
	<View style={styles.empty}>
		<HugeiconsIcon icon={Message01Icon} size={40} strokeWidth={1.4} color={theme.textMuted} />
		<Text style={styles.emptyTitle}>{title}</Text>
		<Text style={styles.emptyBody}>{body}</Text>
	</View>
);

const lastActivity = (chat: ChatRequest): number =>
	new Date(chat.lastMessage?.sentAt ?? chat.respondedAt ?? chat.createdAt).getTime();

/** "4:05 PM" for today, "Yesterday", otherwise a short date — the usual inbox convention. */
const inboxTime = (iso: string): string => {
	const sent = new Date(iso);
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);

	if (sent.toDateString() === today.toDateString()) {
		return sent.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
	}
	if (sent.toDateString() === yesterday.toDateString()) {
		return "Yesterday";
	}

	return sent.toLocaleDateString([], { day: "numeric", month: "short" });
};

export const ChatsScreen: React.FC = () => {
	const navigation = useNavigation<ChatsNavigation>();
	const [tab, setTab] = useState<ChatsTab>("journeys");
	const pendingChatRequests = useBadgeStore((state) => state.pendingChatRequests);
	const unreadByJourney = useGroupChatStore((state) => state.unreadByJourney);
	const { data: journeys, isLoading: journeysLoading } = useAllJourneys();

	const { data: requests = [] } = useChatRequests();
	const currentUserId = useAuthStore((state) => state.user?.userId);

	const journeyChats = (journeys ?? []).filter((journey) => journey.isMember);
	// Every accepted request is a private chat, including ones since declined — those stay
	// listed (history is still readable) and say so in their subtitle. Most recent activity
	// first; a chat with no messages yet sorts by when it was accepted.
	const directChats = requests
		.filter(
			(request): request is ChatRequest & { chatId: string } =>
				request.status === "accepted" && Boolean(request.chatId),
		)
		.sort((left, right) => lastActivity(right) - lastActivity(left));

	const dmSubtitle = (chat: ChatRequest): string => {
		if (chat.declinedByMe) return "You declined this chat";
		if (chat.declinedByThem) return "Messaging paused";
		if (!chat.lastMessage) return "Say hello";

		return chat.lastMessage.senderId === currentUserId
			? `You: ${chat.lastMessage.text}`
			: chat.lastMessage.text;
	};

	return (
		<SafeAreaView style={styles.root} edges={["top"]}>
			<Text style={styles.header}>Chats</Text>

			<View style={styles.tabsWrapper}>
				<SegmentedControl options={TABS} value={tab} onChange={setTab} />
			</View>

			{tab === "journeys" ? (
				<FlatList
					data={journeyChats}
					keyExtractor={(item) => item.journeyId}
					renderItem={({ item }) => (
						<ConversationRow
							title={journeyChatTitle(item)}
							subtitle={`${item.sourceLocation} to ${item.destinationLocation}`}
							timestamp={item.journeyDate}
							unreadCount={unreadByJourney[item.journeyId] ?? 0}
							icon={item.transportType === "train" ? Train01Icon : Bus01Icon}
							onPress={() => navigation.navigate("JourneyGroupChat", { journey: item })}
						/>
					)}
					ListEmptyComponent={
						journeysLoading ? (
							<View style={styles.loading}>
								<ActivityIndicator size="large" color={brand.teal} />
							</View>
						) : (
							<EmptyState
								title="No journey chats yet"
								body="Join a journey and its group chat will appear here."
							/>
						)
					}
					contentContainerStyle={journeyChats.length === 0 && styles.emptyContainer}
				/>
			) : (
				<FlatList
					data={directChats}
					keyExtractor={(item) => item.chatId}
					renderItem={({ item }) => (
						<ConversationRow
							title={item.otherUser.displayName}
							subtitle={dmSubtitle(item)}
							timestamp={item.lastMessage ? inboxTime(item.lastMessage.sentAt) : undefined}
							unreadCount={item.unreadCount ?? 0}
							avatarUrl={item.otherUser.profilePhotoUrl}
							onPress={() =>
								navigation.navigate("DirectChat", {
									chatId: item.chatId,
									otherUser: item.otherUser,
								})
							}
						/>
					)}
					// Pending requests sit above the accepted conversations, per the spec.
					ListHeaderComponent={
						pendingChatRequests > 0 ? (
							<Pressable
								style={styles.requestsRow}
								onPress={() => navigation.navigate("ChatRequests")}
								accessibilityRole="button"
							>
								<View style={styles.requestsIcon}>
									<HugeiconsIcon
										icon={SentIcon}
										size={20}
										strokeWidth={1.8}
										color={brand.tealDeep}
									/>
								</View>
								<Text style={styles.requestsText}>
									{pendingChatRequests} new chat request
									{pendingChatRequests === 1 ? "" : "s"}
								</Text>
								<Badge count={pendingChatRequests} />
							</Pressable>
						) : undefined
					}
					ListEmptyComponent={
						<EmptyState
							title="No direct messages"
							body="Private chats open once a chat request is accepted."
						/>
					}
					contentContainerStyle={directChats.length === 0 && styles.emptyContainer}
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
		fontSize: typography.xl,
		fontWeight: typography.bold,
		color: theme.textPrimary,
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.md,
	},
	tabsWrapper: {
		paddingHorizontal: spacing.xl,
		paddingVertical: spacing.md,
	},
	requestsRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		paddingHorizontal: spacing.xl,
		paddingVertical: spacing.md,
		backgroundColor: brand.tealMuted,
	},
	requestsIcon: {
		width: 36,
		height: 36,
		borderRadius: radius.full,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.card,
	},
	requestsText: {
		flex: 1,
		fontSize: typography.base,
		fontWeight: typography.medium,
		color: theme.textPrimary,
	},
	emptyContainer: {
		flexGrow: 1,
	},
	loading: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	empty: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
		paddingHorizontal: spacing.xxl,
	},
	emptyTitle: {
		fontSize: typography.md,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	emptyBody: {
		fontSize: typography.base,
		color: theme.textSecondary,
		textAlign: "center",
	},
});
