import { BubbleChatIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { FC } from "react";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Passenger } from "../../api/journeys";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import { genderLabel } from "../../utils/gender.utils";
import { GenderAvatar } from "./GenderAvatar";

/**
 * Where this traveller's chat stands. The backend already models a third state —
 * chat_requests rows go pending before they are accepted or rejected — so this union
 * is the seam that grows when the request flow is wired up; nothing else needs to move.
 */
export type ChatStatus = "none" | "accepted";

interface Props {
	member: Passenger;
	status: ChatStatus;
	onRequestChat: () => void;
	onOpenChat: () => void;
	/** Wide cards fill a list row; narrow ones sit in the carousel. */
	variant?: "carousel" | "list";
}

const AVATAR_SIZE = 64;

export const PassengerCard: FC<Props> = ({
	member,
	status,
	onRequestChat,
	onOpenChat,
	variant = "carousel",
}) => {
	const label = genderLabel(member.gender);
	const accepted = status === "accepted";

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
					style={[styles.action, accepted ? styles.actionChat : styles.actionRequest]}
					onPress={accepted ? onOpenChat : onRequestChat}
					accessibilityRole="button"
					accessibilityLabel={
						accepted ? `Chat with ${member.displayName}` : `Request chat with ${member.displayName}`
					}
				>
					<HugeiconsIcon
						icon={accepted ? BubbleChatIcon : UserAdd01Icon}
						size={14}
						strokeWidth={1.8}
						color={accepted ? theme.white : brand.tealDeep}
					/>
					<Text style={accepted ? styles.actionChatText : styles.actionRequestText}>
						{accepted ? "Chat" : "Request"}
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
