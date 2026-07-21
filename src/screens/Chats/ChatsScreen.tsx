import { Bus01Icon, Message01Icon, SentIcon, Train01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "../../components/shared/Badge";
import { ConversationRow } from "../../components/shared/ConversationRow";
import { SegmentedControl, type SegmentOption } from "../../components/shared/SegmentedControl";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import { useBadgeStore } from "../../store/badgeStore";

type ChatsTab = "journeys" | "dms";

const TABS: SegmentOption<ChatsTab>[] = [
	{ value: "journeys", label: "Journeys" },
	{ value: "dms", label: "DMs" },
];

export interface JourneyChat {
	id: string;
	transportType: "bus" | "train";
	routeName: string;
	lastMessage?: string;
	unreadCount: number;
	timestamp?: string;
}

export interface DirectChat {
	id: string;
	displayName: string;
	avatarUrl?: string;
	lastMessage?: string;
	unreadCount: number;
	timestamp?: string;
}

const EmptyState: React.FC<{ title: string; body: string }> = ({ title, body }) => (
	<View style={styles.empty}>
		<HugeiconsIcon icon={Message01Icon} size={40} strokeWidth={1.4} color={theme.textMuted} />
		<Text style={styles.emptyTitle}>{title}</Text>
		<Text style={styles.emptyBody}>{body}</Text>
	</View>
);

export const ChatsScreen: React.FC = () => {
	const [tab, setTab] = useState<ChatsTab>("journeys");
	const pendingChatRequests = useBadgeStore((state) => state.pendingChatRequests);

	// Populated once the backend exposes journey group chats and private chats.
	const journeyChats: JourneyChat[] = [];
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
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<ConversationRow
							title={item.routeName}
							subtitle={item.lastMessage}
							timestamp={item.timestamp}
							unreadCount={item.unreadCount}
							icon={item.transportType === "train" ? Train01Icon : Bus01Icon}
						/>
					)}
					ListEmptyComponent={
						<EmptyState
							title="No journey chats yet"
							body="Join a journey and its group chat will appear here."
						/>
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
