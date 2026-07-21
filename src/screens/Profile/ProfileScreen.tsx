import {
	BirthdayCakeIcon,
	Note01Icon,
	Package01Icon,
	PackageDeliveredIcon,
	PencilEdit01Icon,
	Route01Icon,
	SmartPhone01Icon,
	UserCircleIcon,
	ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import { useCurrentUser, useSignOut } from "../../hooks/useUser";
import { EditProfileModal } from "./EditProfileModal";

/**
 * Placeholder counts — the parcels and journey-history endpoints don't exist yet.
 * Swap `value` for real data when those APIs land.
 */
const STATS: { key: string; label: string; value: number; icon: IconSvgElement }[] = [
	{ key: "journeys", label: "Journeys", value: 0, icon: Route01Icon },
	{ key: "parcelsSent", label: "Parcels sent", value: 0, icon: Package01Icon },
	{ key: "parcelsCarried", label: "Parcels carried", value: 0, icon: PackageDeliveredIcon },
];

const DetailRow: React.FC<{
	icon: IconSvgElement;
	label: string;
	value: string;
	divided?: boolean;
}> = ({ icon, label, value, divided }) => (
	<View style={[styles.row, divided && styles.rowDivided]}>
		<HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} color={theme.textMuted} />
		<Text style={styles.rowLabel}>{label}</Text>
		<Text style={styles.rowValue} numberOfLines={1}>
			{value}
		</Text>
	</View>
);

export const ProfileScreen: React.FC = () => {
	const { data: user } = useCurrentUser();
	const signOutUser = useSignOut();
	const [editing, setEditing] = useState(false);

	const handleSignOut = async () => {
		try {
			await signOutUser();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Something went wrong.";
			Alert.alert("Sign out failed", message);
		}
	};

	if (!user) {
		return <SafeAreaView style={styles.root} edges={["top"]} />;
	}

	// Your own photo and name are always shown here — isProfileHidden only changes what
	// *other* riders see, so masking them on your own profile just looks broken.
	const name = user.displayName ?? "—";

	return (
		<SafeAreaView style={styles.root} edges={["top"]}>
			<View style={styles.headerRow}>
				<Text style={styles.header}>Profile</Text>
				<Pressable
					style={styles.editButton}
					onPress={() => setEditing(true)}
					accessibilityRole="button"
					accessibilityLabel="Edit profile"
				>
					<HugeiconsIcon
						icon={PencilEdit01Icon}
						size={16}
						strokeWidth={1.9}
						color={brand.tealDeep}
					/>
					<Text style={styles.editText}>Edit</Text>
				</Pressable>
			</View>

			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				{/* Photo left, identity beside it. */}
				<View style={styles.identity}>
					<View style={styles.avatar}>
						{user.profilePhotoUrl ? (
							<Image source={{ uri: user.profilePhotoUrl }} style={styles.avatarImage} />
						) : (
							<Text style={styles.avatarInitial}>{name.trim().charAt(0).toUpperCase() || "?"}</Text>
						)}
					</View>

					<View style={styles.identityText}>
						<Text style={styles.name} numberOfLines={1}>
							{name}
						</Text>
						{user.isProfileHidden ? (
							<View style={styles.hiddenPill}>
								<HugeiconsIcon
									icon={ViewOffSlashIcon}
									size={13}
									strokeWidth={1.9}
									color={brand.tealDeep}
								/>
								<Text style={styles.hiddenText}>
									Others see “{user.anonymousAlias ?? "Anonymous"}”
								</Text>
							</View>
						) : null}
					</View>
				</View>

				<View style={styles.card}>
					<DetailRow icon={SmartPhone01Icon} label="Mobile" value={user.mobileNumber} />
					<DetailRow
						icon={BirthdayCakeIcon}
						label="Age"
						value={user.age ? String(user.age) : "Not set"}
						divided
					/>
					<DetailRow
						icon={UserCircleIcon}
						label="Gender"
						value={user.gender ?? "Not set"}
						divided
					/>
					<DetailRow icon={Note01Icon} label="Bio" value={user.bio || "Not set"} divided />
				</View>

				<View style={styles.card}>
					{STATS.map((stat, index) => (
						<DetailRow
							key={stat.key}
							icon={stat.icon}
							label={stat.label}
							value={String(stat.value)}
							divided={index > 0}
						/>
					))}
				</View>

				<Pressable style={styles.signOut} onPress={handleSignOut} accessibilityRole="button">
					<Text style={styles.signOutText}>Sign out</Text>
				</Pressable>
			</ScrollView>

			<EditProfileModal visible={editing} user={user} onClose={() => setEditing(false)} />
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: theme.background,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.md,
	},
	header: {
		fontSize: typography.xl,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	editButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: radius.full,
		backgroundColor: brand.tealMuted,
	},
	editText: {
		fontSize: typography.base,
		fontWeight: typography.bold,
		color: brand.tealDeep,
	},
	content: {
		padding: spacing.xl,
		gap: spacing.md,
	},
	identity: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
	},
	avatar: {
		width: 72,
		height: 72,
		borderRadius: radius.full,
		backgroundColor: brand.tealMuted,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	avatarImage: {
		width: 72,
		height: 72,
	},
	avatarInitial: {
		fontSize: typography.xl,
		fontWeight: typography.bold,
		color: brand.tealDeep,
	},
	identityText: {
		flex: 1,
		gap: spacing.xs,
	},
	name: {
		fontSize: typography.lg,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	hiddenPill: {
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "flex-start",
		gap: spacing.xs,
		paddingHorizontal: spacing.sm,
		paddingVertical: 3,
		borderRadius: radius.full,
		backgroundColor: brand.tealMuted,
	},
	hiddenText: {
		fontSize: typography.xs,
		fontWeight: typography.medium,
		color: brand.tealDeep,
	},
	card: {
		borderRadius: radius.lg,
		backgroundColor: theme.card,
		borderWidth: 1,
		borderColor: theme.border,
		paddingHorizontal: spacing.md,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm + 2,
		paddingVertical: spacing.md,
	},
	rowDivided: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: theme.divider,
	},
	rowLabel: {
		fontSize: typography.base,
		color: theme.textSecondary,
	},
	rowValue: {
		flex: 1,
		textAlign: "right",
		fontSize: typography.base,
		fontWeight: typography.medium,
		color: theme.textPrimary,
	},
	signOut: {
		paddingVertical: spacing.md,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: theme.border,
		alignItems: "center",
	},
	signOutText: {
		fontSize: typography.md,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
});
