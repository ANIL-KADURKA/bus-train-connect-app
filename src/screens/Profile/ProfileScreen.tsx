import React from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import { useCurrentUser, useSignOut } from "../../hooks/useUser";

export const ProfileScreen: React.FC = () => {
	const { data: user } = useCurrentUser();
	const signOutUser = useSignOut();

	const handleSignOut = async () => {
		try {
			await signOutUser();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Something went wrong.";
			Alert.alert("Sign out failed", message);
		}
	};

	// Hidden profiles show the alias instead of the real name and photo; age stays visible.
	const hidden = user?.isProfileHidden ?? false;
	const shownName = hidden ? (user?.anonymousAlias ?? "Anonymous") : (user?.displayName ?? "—");

	return (
		<SafeAreaView style={styles.root} edges={["top"]}>
			<Text style={styles.header}>Profile</Text>

			<View style={styles.card}>
				<View style={styles.avatar}>
					{!hidden && user?.profilePhotoUrl ? (
						<Image source={{ uri: user.profilePhotoUrl }} style={styles.avatarImage} />
					) : (
						<Text style={styles.avatarInitial}>
							{shownName.trim().charAt(0).toUpperCase() || "?"}
						</Text>
					)}
				</View>

				<Text style={styles.name}>{shownName}</Text>
				{user?.mobileNumber ? <Text style={styles.meta}>{user.mobileNumber}</Text> : null}

				<View style={styles.chips}>
					{user?.age ? <Text style={styles.chip}>{user.age}</Text> : null}
					{user?.gender ? <Text style={styles.chip}>{user.gender}</Text> : null}
					{hidden ? <Text style={styles.chip}>Hidden profile</Text> : null}
				</View>

				{user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
			</View>

			<Pressable style={styles.signOut} onPress={handleSignOut} accessibilityRole="button">
				<Text style={styles.signOutText}>Sign out</Text>
			</Pressable>
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
	card: {
		margin: spacing.xl,
		padding: spacing.xl,
		borderRadius: radius.lg,
		backgroundColor: theme.card,
		borderWidth: 1,
		borderColor: theme.border,
		alignItems: "center",
		gap: spacing.sm,
	},
	avatar: {
		width: 88,
		height: 88,
		borderRadius: radius.full,
		backgroundColor: brand.tealMuted,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	avatarImage: {
		width: 88,
		height: 88,
	},
	avatarInitial: {
		fontSize: typography.xl,
		fontWeight: typography.bold,
		color: brand.tealDeep,
	},
	name: {
		fontSize: typography.lg,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	meta: {
		fontSize: typography.base,
		color: theme.textSecondary,
	},
	chips: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.sm,
		justifyContent: "center",
	},
	chip: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
		borderRadius: radius.full,
		backgroundColor: brand.tealMuted,
		color: brand.tealDeep,
		fontSize: typography.sm,
		fontWeight: typography.medium,
		overflow: "hidden",
	},
	bio: {
		fontSize: typography.base,
		color: theme.textSecondary,
		textAlign: "center",
	},
	signOut: {
		marginHorizontal: spacing.xl,
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
