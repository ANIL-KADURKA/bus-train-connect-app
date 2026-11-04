import {
	BubbleChatIcon,
	Clock01Icon,
	MailReceive01Icon,
	UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react-native";
import type { FC } from "react";
import React from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Passenger } from "../../api/journeys";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import { genderLabel } from "../../utils/gender.utils";
import { GenderAvatar } from "./GenderAvatar";

/**
 * Where this traveller's chat stands, from the viewer's side:
 * - pending: you asked and they haven't answered
 * - incoming: they asked you
 * - accepted: either of you asked and the other said yes
 */
export type ChatStatus = "none" | "pending" | "incoming" | "accepted";

interface Props {
	member: Passenger;
	status: ChatStatus;
	/** One action per card; what it does depends on `status`, so the parent decides. */
	onPress: () => void;
	/** A request or withdrawal for this traveller is in flight: spinner in place of the icon. */
	busy?: boolean;
	/** Wide cards fill a list row; narrow ones sit in the carousel. */
	variant?: "carousel" | "list";
}

const AVATAR_SIZE = 64;

const ACTIONS: Record<
	ChatStatus,
	{ label: string; icon: IconSvgElement; tone: "request" | "chat" | "muted"; a11y: string }
> = {
	none: { label: "Request", icon: UserAdd01Icon, tone: "request", a11y: "Request chat with" },
	pending: {
		label: "Pending",
		icon: Clock01Icon,
		tone: "muted",
		a11y: "Chat request pending with",
	},
	incoming: {
		label: "Respond",
		icon: MailReceive01Icon,
		tone: "request",
		a11y: "Respond to chat request from",
	},
	accepted: { label: "Open chat", icon: BubbleChatIcon, tone: "chat", a11y: "Open chat with" },
};

export const PassengerCard: FC<Props> = ({
	member,
	status,
	onPress,
	busy = false,
	variant = "carousel",
}) => {
	const label = genderLabel(member.gender);
	const action = ACTIONS[status];
	const tint =
		action.tone === "chat"
			? theme.white
			: action.tone === "muted"
				? theme.textSecondary
				: brand.tealDeep;

	return (
		<View style={[styles.card, variant === "list" && styles.cardList]}>
			{member.profilePhotoUrl ? (
				<Image
					source={{ uri: member.profilePhotoUrl }}
					style={styles.photo}
					accessibilityIgnoresInvertColors
				/>
			) : (
				<GenderAvatar gender={member.gender} size={AVATAR_SIZE} />
			)}

			<View style={styles.identity}>
				<Text style={styles.name} numberOfLines={1}>
					{member.displayName}
				</Text>
				{label ? (
					<Text style={styles.gender} numberOfLines={1}>
						{label}
					</Text>
				) : null}
			</View>

			{member.isYou ? (
				<View style={[styles.action, styles.actionSelf]}>
					<Text style={styles.actionSelfText}>You</Text>
				</View>
			) : (
				<Pressable
					style={[
						styles.action,
						action.tone === "chat"
							? styles.actionChat
							: action.tone === "muted"
								? styles.actionMuted
								: styles.actionRequest,
					]}
					onPress={onPress}
					// Blocks a second tap from firing a duplicate request while the first is in flight.
					disabled={busy}
					accessibilityRole="button"
					accessibilityLabel={`${action.a11y} ${member.displayName}`}
					accessibilityState={{ busy, disabled: busy }}
				>
					{/* Same footprint as the 14px icon, so the button doesn't change size. */}
					{busy ? (
						<ActivityIndicator size="small" color={tint} style={styles.spinner} />
					) : (
						<HugeiconsIcon icon={action.icon} size={14} strokeWidth={1.8} color={tint} />
					)}
					<Text
						style={
							action.tone === "chat"
								? styles.actionChatText
								: action.tone === "muted"
									? styles.actionMutedText
									: styles.actionRequestText
						}
					>
						{action.label}
					</Text>
				</Pressable>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		width: 132,
		alignItems: "center",
		gap: spacing.sm,
		padding: spacing.sm,
		borderRadius: radius.lg,
		backgroundColor: theme.card,
		borderWidth: 1,
		borderColor: theme.border,
	},
	cardList: {
		width: "100%",
	},
	photo: {
		width: AVATAR_SIZE,
		height: AVATAR_SIZE,
		borderRadius: radius.full,
		backgroundColor: theme.surface,
	},
	identity: {
		alignItems: "center",
		gap: 2,
	},
	name: {
		fontSize: typography.base,
		fontWeight: typography.bold,
		color: theme.textPrimary,
		textAlign: "center",
	},
	gender: {
		fontSize: typography.sm,
		color: theme.textMuted,
	},
	action: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs,
		alignSelf: "stretch",
		paddingVertical: 7,
		borderRadius: radius.full,
	},
	actionRequest: {
		backgroundColor: brand.tealMuted,
		borderWidth: 1,
		borderColor: brand.tealBorder,
	},
	actionRequestText: {
		fontSize: typography.sm,
		fontWeight: typography.bold,
		color: brand.tealDeep,
	},
	spinner: {
		width: 14,
		height: 14,
		transform: [{ scale: 0.7 }],
	},
	actionMuted: {
		backgroundColor: theme.surface,
		borderWidth: 1,
		borderColor: theme.border,
	},
	actionMutedText: {
		fontSize: typography.sm,
		fontWeight: typography.bold,
		color: theme.textSecondary,
	},
	actionChat: {
		backgroundColor: brand.teal,
	},
	actionChatText: {
		fontSize: typography.sm,
		fontWeight: typography.bold,
		color: theme.white,
	},
	actionSelf: {
		backgroundColor: theme.surface,
	},
	actionSelfText: {
		fontSize: typography.sm,
		fontWeight: typography.medium,
		color: theme.textMuted,
	},
});
