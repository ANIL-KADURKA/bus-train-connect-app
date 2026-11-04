import { ArrowLeft01Icon, SentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FC } from "react";
import React, { useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Image,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MAX_DIRECT_MESSAGE_LENGTH } from "../../api/directChats";
import { GenderAvatar } from "../../components/shared/GenderAvatar";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import {
	useAcceptDirectChat,
	useDeclineDirectChat,
	useDirectChat,
	useDirectMessages,
	useSendDirectMessage,
} from "../../hooks/useDirectChat";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useAuthStore } from "../../store/authStore";
import { confirm } from "../../store/confirmStore";
import { getApiErrorMessage } from "../../utils/errorhandler.utils";

type Props = NativeStackScreenProps<RootStackParamList, "DirectChat">;

const AVATAR_SIZE = 36;

const formatTime = (iso: string): string =>
	new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export const DirectChatScreen: FC<Props> = ({ navigation, route }) => {
	const { chatId, otherUser: previewUser } = route.params;
	const currentUserId = useAuthStore((state) => state.user?.userId);
	const { data: chat, isLoading: chatLoading } = useDirectChat(chatId);
	const { data: messages = [], isLoading: messagesLoading } = useDirectMessages(chatId);
	const send = useSendDirectMessage();
	const decline = useDeclineDirectChat();
	const accept = useAcceptDirectChat();
	const [draft, setDraft] = useState("");

	// The route carries the person so the header renders before the chat has loaded.
	const person = chat?.otherUser ?? previewUser;
	const name = person?.displayName ?? "Chat";
	const canMessage = chat?.canMessage ?? false;
	const canSend = canMessage && draft.trim().length > 0 && !send.isPending;
	// Inverted list: newest at the bottom, next to the composer, and it stays pinned there.
	const newestFirst = useMemo(() => [...messages].reverse(), [messages]);

	const handleSend = () => {
		const text = draft.trim();
		if (!canSend) return;

		setDraft("");
		send.mutate(
			{ chatId, text },
			{
				onError: (cause) => {
					// Most likely the chat was declined a moment ago; keep what they typed.
					setDraft(text);
					Alert.alert("Message not sent", getApiErrorMessage(cause));
				},
			},
		);
	};

	const handleDecline = () => {
		confirm({
			title: "Decline this chat?",
			message: `Neither of you will be able to send messages until you accept again. ${name} will see that you declined.`,
			cancelLabel: "Keep chatting",
			confirmLabel: "Decline",
			tone: "destructive",
			onConfirm: () =>
				decline.mutate(chatId, {
					onError: (cause) => Alert.alert("Could not decline", getApiErrorMessage(cause)),
				}),
		});
	};

	const handleAccept = () => {
		accept.mutate(chatId, {
			onError: (cause) => Alert.alert("Could not accept", getApiErrorMessage(cause)),
		});
	};

	const banner = (() => {
		if (!chat || chat.canMessage) return null;

		if (chat.declinedByMe) {
			return {
				text: chat.declinedByThem
					? `You both declined this chat. Accepting again reopens your side; ${name} would need to accept too.`
					: "You declined this chat. Accept again to start messaging.",
				action: true,
			};
		}

		return {
			text: `${name} declined this chat. You can't send messages unless they accept again.`,
			action: false,
		};
	})();

	return (
		<SafeAreaView style={styles.root} edges={["top", "bottom"]}>
			<KeyboardAvoidingView
				style={styles.root}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<View style={styles.header}>
					<Pressable
						style={styles.iconButton}
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

					{person?.profilePhotoUrl ? (
						<Image
							source={{ uri: person.profilePhotoUrl }}
							style={styles.avatar}
							accessibilityIgnoresInvertColors
						/>
					) : (
						<GenderAvatar gender={person?.gender} size={AVATAR_SIZE} />
					)}

					<View style={styles.headerText}>
						<Text style={styles.title} numberOfLines={1}>
							{name}
						</Text>
						<Text style={styles.subtitle} numberOfLines={1}>
							{chat ? (chat.canMessage ? "Private chat" : "Messaging paused") : " "}
						</Text>
					</View>

					{/* Declining is always available to you while your side is open. */}
					{chat && !chat.declinedByMe ? (
						<Pressable
							style={styles.declineButton}
							onPress={handleDecline}
							disabled={decline.isPending}
							accessibilityRole="button"
							accessibilityLabel={`Decline chat with ${name}`}
						>
							{decline.isPending ? (
								<ActivityIndicator size="small" color={brand.danger} />
							) : (
								<Text style={styles.declineText}>Decline</Text>
							)}
						</Pressable>
					) : null}
				</View>

				{banner ? (
					<View style={styles.banner}>
						<Text style={styles.bannerText}>{banner.text}</Text>
						{banner.action ? (
							<Pressable
								style={styles.bannerButton}
								onPress={handleAccept}
								disabled={accept.isPending}
								accessibilityRole="button"
							>
								{accept.isPending ? (
									<ActivityIndicator size="small" color={theme.white} />
								) : (
									<Text style={styles.bannerButtonText}>Accept again</Text>
								)}
							</Pressable>
						) : null}
					</View>
				) : null}

				{chatLoading || messagesLoading ? (
					<View style={styles.centered}>
						<ActivityIndicator size="large" color={brand.teal} />
					</View>
				) : (
					<FlatList
						inverted
						style={styles.list}
						data={newestFirst}
						keyExtractor={(item) => item.messageId}
						contentContainerStyle={[styles.messages, messages.length === 0 && styles.grow]}
						keyboardShouldPersistTaps="handled"
						keyboardDismissMode="interactive"
						renderItem={({ item }) => {
							const mine = item.senderId === currentUserId;

							return (
								<View style={[styles.messageRow, mine && styles.messageRowMine]}>
									<View style={[styles.bubble, mine && styles.bubbleMine]}>
										<Text style={[styles.messageText, mine && styles.messageTextMine]}>
											{item.text}
										</Text>
										<Text style={[styles.time, mine && styles.timeMine]}>
											{formatTime(item.sentAt)}
										</Text>
									</View>
								</View>
							);
						}}
						ListEmptyComponent={
							// Inverted lists flip their empty component too; flip it back.
							<View style={[styles.empty, styles.flip]}>
								<Text style={styles.emptyTitle}>No messages yet</Text>
								<Text style={styles.emptyBody}>
									{canMessage ? `Say hello to ${name}.` : "Messages will appear here."}
								</Text>
							</View>
						}
					/>
				)}

				<View style={styles.composer}>
					<TextInput
						style={[styles.input, !canMessage && styles.inputDisabled]}
						value={draft}
						onChangeText={setDraft}
						editable={canMessage}
						placeholder={canMessage ? "Message" : "Messaging is paused"}
						placeholderTextColor={theme.textMuted}
						multiline
						maxLength={MAX_DIRECT_MESSAGE_LENGTH}
						accessibilityLabel="Message"
					/>
					<Pressable
						style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
						onPress={handleSend}
						disabled={!canSend}
						accessibilityRole="button"
						accessibilityLabel="Send message"
					>
						{send.isPending ? (
							<ActivityIndicator size="small" color={theme.white} />
						) : (
							<HugeiconsIcon icon={SentIcon} size={20} strokeWidth={1.8} color={theme.white} />
						)}
					</Pressable>
				</View>
			</KeyboardAvoidingView>
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
	iconButton: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.full,
	},
	avatar: {
		width: AVATAR_SIZE,
		height: AVATAR_SIZE,
		borderRadius: radius.full,
		backgroundColor: theme.surface,
	},
	headerText: {
		flex: 1,
	},
	title: {
		fontSize: typography.base,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	subtitle: {
		fontSize: typography.sm,
		color: theme.textMuted,
	},
	declineButton: {
		minWidth: 72,
		height: 32,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: spacing.sm,
		borderRadius: radius.full,
		borderWidth: 1,
		borderColor: brand.danger,
	},
	declineText: {
		fontSize: typography.sm,
		fontWeight: typography.bold,
		color: brand.danger,
	},
	banner: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		margin: spacing.md,
		marginBottom: 0,
		padding: spacing.sm + 2,
		borderRadius: radius.md,
		backgroundColor: theme.surface,
		borderWidth: 1,
		borderColor: theme.border,
	},
	bannerText: {
		flex: 1,
		fontSize: typography.sm,
		color: theme.textSecondary,
		lineHeight: 18,
	},
	bannerButton: {
		minWidth: 104,
		height: 34,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: spacing.sm,
		borderRadius: radius.full,
		backgroundColor: brand.teal,
	},
	bannerButtonText: {
		fontSize: typography.sm,
		fontWeight: typography.bold,
		color: theme.white,
	},
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	list: {
		flex: 1,
	},
	messages: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		gap: spacing.sm,
	},
	grow: {
		flexGrow: 1,
	},
	messageRow: {
		flexDirection: "row",
		justifyContent: "flex-start",
	},
	messageRowMine: {
		justifyContent: "flex-end",
	},
	bubble: {
		maxWidth: "82%",
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: radius.lg,
		backgroundColor: theme.card,
		borderWidth: 1,
		borderColor: theme.border,
		gap: 2,
	},
	bubbleMine: {
		backgroundColor: brand.teal,
		borderColor: brand.teal,
	},
	messageText: {
		fontSize: typography.base,
		color: theme.textPrimary,
	},
	messageTextMine: {
		color: theme.white,
	},
	time: {
		alignSelf: "flex-end",
		fontSize: typography.xs,
		color: theme.textMuted,
	},
	timeMine: {
		color: "rgba(255,255,255,0.75)",
	},
	empty: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs,
		paddingHorizontal: spacing.xl,
	},
	flip: {
		transform: [{ scaleY: -1 }],
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
	composer: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: spacing.sm,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: theme.border,
		backgroundColor: theme.card,
	},
	input: {
		flex: 1,
		minHeight: 44,
		maxHeight: 120,
		paddingHorizontal: spacing.md,
		paddingTop: 12,
		paddingBottom: 12,
		borderRadius: radius.md,
		backgroundColor: theme.inputBackground,
		borderWidth: 1,
		borderColor: theme.inputBorder,
		fontSize: typography.base,
		color: theme.textPrimary,
	},
	inputDisabled: {
		opacity: 0.6,
	},
	sendButton: {
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.full,
		backgroundColor: brand.teal,
	},
	sendButtonDisabled: {
		opacity: 0.45,
	},
});
