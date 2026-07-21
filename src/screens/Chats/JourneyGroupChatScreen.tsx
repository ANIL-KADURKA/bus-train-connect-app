import {
	ArrowLeft01Icon,
	Bus01Icon,
	Message01Icon,
	Train01Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import type { RootStackParamList } from "../../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "JourneyGroupChat">;

const titleFor = (journey: Props["route"]["params"]["journey"]): string =>
	journey.serviceName
		? `${journey.serviceNumber} · ${journey.serviceName}`
		: journey.serviceNumber;

export const JourneyGroupChatScreen: React.FC<Props> = ({ navigation, route }) => {
	const { journey } = route.params;

	return (
		<SafeAreaView style={styles.root} edges={["top"]}>
			<View style={styles.header}>
				<Pressable
					style={styles.backButton}
					onPress={() => navigation.goBack()}
					accessibilityRole="button"
					accessibilityLabel="Back to chats"
				>
					<HugeiconsIcon icon={ArrowLeft01Icon} size={22} strokeWidth={1.8} color={theme.textPrimary} />
				</Pressable>

				<View style={styles.avatar}>
					<HugeiconsIcon
						icon={journey.transportType === "train" ? Train01Icon : Bus01Icon}
						size={22}
						strokeWidth={1.8}
						color={brand.tealDeep}
					/>
				</View>

				<View style={styles.headerText}>
					<Text style={styles.title} numberOfLines={1}>
						{titleFor(journey)}
					</Text>
				</View>
			</View>

			<View style={styles.tripCard}>
				<Text style={styles.tripLabel}>Journey group</Text>
				<View style={styles.tripRoute}>
					<Text style={styles.tripRouteText}>From: {journey.sourceLocation}</Text>
					<Text style={styles.tripRouteText}>To: {journey.destinationLocation}</Text>
				</View>
				<View style={styles.metaRow}>
					<Text style={styles.metaText}>{journey.journeyDate}</Text>
					<View style={styles.members}>
						<HugeiconsIcon icon={UserGroupIcon} size={14} strokeWidth={1.8} color={theme.textMuted} />
						<Text style={styles.metaText}>
							{journey.memberCount} {journey.memberCount === 1 ? "traveller" : "travellers"}
						</Text>
					</View>
				</View>
			</View>

			<View style={styles.empty}>
				<HugeiconsIcon icon={Message01Icon} size={40} strokeWidth={1.4} color={theme.textMuted} />
				<Text style={styles.emptyTitle}>Group chat is ready</Text>
				<Text style={styles.emptyBody}>Messages will appear here once chat messaging is wired up.</Text>
			</View>
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
		paddingVertical: spacing.md,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: theme.border,
		backgroundColor: theme.card,
	},
	backButton: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.full,
	},
	avatar: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.full,
		backgroundColor: brand.tealMuted,
	},
	headerText: {
		flex: 1,
	},
	headerRoute: {
		gap: 2,
	},
	title: {
		fontSize: typography.md,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	subtitle: {
		fontSize: typography.sm,
		color: theme.textSecondary,
	},
	tripCard: {
		margin: spacing.xl,
		padding: spacing.md,
		borderRadius: radius.lg,
		backgroundColor: theme.card,
		borderWidth: 1,
		borderColor: theme.border,
		gap: spacing.xs,
	},
	tripLabel: {
		fontSize: typography.sm,
		fontWeight: typography.bold,
		color: theme.textMuted,
		textTransform: "uppercase",
	},
	tripRoute: {
		gap: spacing.xs,
	},
	tripRouteText: {
		fontSize: typography.base,
		fontWeight: typography.medium,
		color: theme.textPrimary,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.md,
	},
	members: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
	},
	metaText: {
		fontSize: typography.sm,
		color: theme.textMuted,
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
