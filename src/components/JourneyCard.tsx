import {
	ArrowRight01Icon,
	Bus01Icon,
	Calendar03Icon,
	Train01Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { JourneyListItem } from "../api/journeys";
import { brand, radius, spacing, theme, typography } from "../constants/theme";

/** "2026-07-21" -> "21 Jul". Kept local so no date library is needed. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDate = (isoDate: string): string => {
	const [year, month, day] = isoDate.split("-").map(Number);

	if (!year || !month || !day) {
		return isoDate;
	}

	return `${day} ${MONTHS[month - 1]}`;
};

interface JourneyCardProps {
	journey: JourneyListItem;
	onJoin: (journey: JourneyListItem) => void;
	joining?: boolean;
}

export const JourneyCard: React.FC<JourneyCardProps> = ({ journey, onJoin, joining = false }) => {
	const isMember = journey.isMember === true;
	console.log("JourneyCard isMember:", isMember, "journey:", journey);

	return (
		<View style={styles.card}>
			<View style={styles.topRow}>
				<HugeiconsIcon
					icon={journey.transportType === "train" ? Train01Icon : Bus01Icon}
					size={18}
					strokeWidth={1.8}
					color={brand.tealDeep}
				/>
				<Text style={styles.service} numberOfLines={1}>
					{journey.serviceNumber}
					{journey.serviceName ? ` · ${journey.serviceName}` : ""}
				</Text>
			</View>

			<View style={styles.route}>
				<Text style={styles.place} numberOfLines={1}>
					{journey.sourceLocation}
				</Text>
				<HugeiconsIcon
					icon={ArrowRight01Icon}
					size={16}
					strokeWidth={1.8}
					color={theme.textMuted}
				/>
				<Text style={styles.place} numberOfLines={1}>
					{journey.destinationLocation}
				</Text>
			</View>

			<View style={styles.metaRow}>
				<View style={styles.meta}>
					<HugeiconsIcon icon={Calendar03Icon} size={14} strokeWidth={1.8} color={theme.textMuted} />
					<Text style={styles.metaText}>{formatDate(journey.journeyDate)}</Text>
				</View>

				<View style={styles.meta}>
					<HugeiconsIcon icon={UserGroupIcon} size={14} strokeWidth={1.8} color={theme.textMuted} />
					<Text style={styles.metaText}>
						{journey.memberCount} {journey.memberCount === 1 ? "traveller" : "travellers"}
					</Text>
				</View>

				<Pressable
					style={[styles.joinButton, isMember && styles.joinedButton]}
					onPress={() => onJoin(journey)}
					disabled={joining}
					accessibilityRole="button"
					accessibilityLabel={isMember ? "Open chat" : "Join chat"}
				>
					{joining ? (
						<ActivityIndicator size="small" color={theme.white} />
					) : (
						<Text style={[styles.joinText, isMember && styles.joinedText]}>
							{isMember ? "Open chat" : "Join chat"}
						</Text>
					)}
				</Pressable>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		padding: spacing.md,
		borderRadius: radius.lg,
		backgroundColor: theme.card,
		borderWidth: 1,
		borderColor: theme.border,
		gap: spacing.sm,
	},
	topRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	service: {
		flex: 1,
		fontSize: typography.base,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	route: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	place: {
		flex: 1,
		fontSize: typography.base,
		color: theme.textSecondary,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
	},
	meta: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
	},
	metaText: {
		fontSize: typography.sm,
		color: theme.textMuted,
	},
	joinButton: {
		marginLeft: "auto",
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
		borderRadius: radius.full,
		backgroundColor: brand.teal,
		minWidth: 92,
		alignItems: "center",
	},
	joinedButton: {
		backgroundColor: brand.tealMuted,
	},
	joinText: {
		fontSize: typography.sm,
		fontWeight: typography.bold,
		color: theme.white,
	},
	joinedText: {
		color: brand.tealDeep,
	},
});
