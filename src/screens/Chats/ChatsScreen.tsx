import { Bus01Icon, Message01Icon, SentIcon, Train01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "../../components/shared/Badge";
import { ConversationRow } from "../../components/shared/ConversationRow";
import { SegmentedControl, type SegmentOption } from "../../components/shared/SegmentedControl";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import { useAllJourneys } from "../../hooks/useJourneys";
import type { MainTabParamList } from "../../navigation/MainTabNavigator";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useBadgeStore } from "../../store/badgeStore";
import { useGroupChatStore } from "../../store/groupChatStore";

type ChatsTab = "journeys" | "dms";

const TABS: SegmentOption<ChatsTab>[] = [
	{ value: "journeys", label: "Journeys" },
	{ value: "dms", label: "DMs" },
];

export interface DirectChat {
	id: string;
	displayName: string;
	avatarUrl?: string;
	lastMessage?: string;
	unreadCount: number;
	timestamp?: string;
}

type ChatsNavigation = CompositeNavigationProp<
	BottomTabNavigationProp<MainTabParamList, "Chats">,
	NativeStackNavigationProp<RootStackParamList>
>;

const journeyChatTitle = (journey: { serviceNumber: string; serviceName?: string }): string =>
	journey.serviceName ? `${journey.serviceNumber} · ${journey.serviceName}` : journey.serviceNumber;

const EmptyState: React.FC<{ title: string; body: string }> = ({ title, body }) => (
	<View style={styles.empty}>
		<HugeiconsIcon icon={Message01Icon} size={40} strokeWidth={1.4} color={theme.textMuted} />
		<Text style={styles.emptyTitle}>{title}</Text>
		<Text style={styles.emptyBody}>{body}</Text>
	</View>
);

export const ChatsScreen: React.FC = () => {
	const navigation = useNavigation<ChatsNavigation>();
	const [tab, setTab] = useState<ChatsTab>("journeys");
	const pendingChatRequests = useBadgeStore((state) => state.pendingChatRequests);
	const unreadByJourney = useGroupChatStore((state) => state.unreadByJourney);
	const { data: journeys, isLoading: journeysLoading } = useAllJourneys();

	const journeyChats = (journeys ?? []).filter((journey) => journey.isMember);
	// Populated once the backend exposes private chats.
	const directChats: DirectChat[] = [];

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
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<ConversationRow
							title={item.displayName}
							subtitle={item.lastMessage}
							timestamp={item.timestamp}
							unreadCount={item.unreadCount}
							avatarUrl={item.avatarUrl}
						/>
					)}
					// Pending requests sit above the accepted conversations, per the spec.
					ListHeaderComponent={
						pendingChatRequests > 0 ? (
							<Pressable style={styles.requestsRow} accessibilityRole="button">
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
						) : null
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
