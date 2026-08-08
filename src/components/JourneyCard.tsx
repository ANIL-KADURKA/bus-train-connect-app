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
import { formatShortDate } from "../utils/date.utils";

/**
 * How far this journey's endpoint is from what the user searched for. Only a route
 * search produces distances, and "0.4 km" reads better than "0.0 km" for a direct hit.
 */
const formatDistance = (km: number): string => (km < 0.5 ? "here" : `${km.toFixed(1)} km`);

interface JourneyCardProps {
	journey: JourneyListItem;
	onJoin: (journey: JourneyListItem) => void;
	joining?: boolean;
}

export const JourneyCard: React.FC<JourneyCardProps> = ({ journey, onJoin, joining = false }) => {
	const isMember = journey.isMember === true;
	const { sourceDistanceKm, destinationDistanceKm } = journey;
	const showDistances = sourceDistanceKm !== undefined && destinationDistanceKm !== undefined;

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
					{journey.registrationNumber}
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

			{showDistances ? (
				<Text style={styles.distance}>
					{formatDistance(sourceDistanceKm)} from your boarding city ·{" "}
					{formatDistance(destinationDistanceKm)} from your drop city
				</Text>
			) : null}

			<View style={styles.metaRow}>
				<View style={styles.meta}>
					<HugeiconsIcon
						icon={Calendar03Icon}
						size={14}
						strokeWidth={1.8}
						color={theme.textMuted}
					/>
					<Text style={styles.metaText}>{formatShortDate(journey.journeyDate)}</Text>
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
	distance: {
		fontSize: typography.sm,
		color: brand.tealDeep,
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
