import { signOut } from "firebase/auth";
import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { brand, isDarkMode, radius, spacing, theme, typography } from "../constants/theme";
import { auth } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";

export const HomeScreen: React.FC = () => {
	const { user, phone, reset } = useAuthStore();

	const handleSignOut = async () => {
		try {
			await signOut(auth);
			reset();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Something went wrong.";
			Alert.alert("Error", message);
		}
	};

	return (
		<View style={styles.root}>
			<View style={styles.hero}>
				<View style={styles.avatar}>
					<Text style={styles.avatarIcon}>👤</Text>
				</View>
				<Text style={styles.heroTitle}>You're in!</Text>
				<View style={styles.statusPill}>
					<Text style={styles.statusDot}>●</Text>
					<Text style={styles.statusText}>{phone || user?.phoneNumber}</Text>
				</View>
			</View>

			<View style={styles.cards}>
				<View style={styles.card}>
					<Text style={styles.label}>Phone</Text>
					<Text style={styles.value}>{user?.phoneNumber ?? phone ?? "—"}</Text>
				</View>

				<View style={styles.providerCard}>
					<View style={styles.providerBadge}>
						<Text style={styles.providerBadgeText}>✓</Text>
					</View>
					<View>
						<Text style={styles.providerLabel}>Auth provider</Text>
						<Text style={styles.providerValue}>Firebase Phone Auth</Text>
					</View>
				</View>
			</View>

			<View style={styles.signOutWrap}>
				<Pressable onPress={handleSignOut} style={styles.signOutButton}>
					<Text style={styles.signOutText}>Sign Out</Text>
				</Pressable>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: theme.background,
	},
	hero: {
		backgroundColor:  theme.background,
		borderBottomLeftRadius: 40,
		borderBottomRightRadius: 40,
		paddingTop: 64,
		paddingBottom: 48,
		paddingHorizontal: spacing.xl,
		alignItems: "center",
		gap: 8,
		borderBottomWidth: isDarkMode ? 0 : 1,
		borderBottomColor: theme.border,
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 999,
		backgroundColor: isDarkMode ? "rgba(255,255,255,0.18)" : theme.surface,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarIcon: {
		fontSize: 38,
	},
	heroTitle: {
		color: isDarkMode ? theme.white : theme.textPrimary,
		fontSize: typography.lg,
		fontWeight: typography.bold,
	},
	statusPill: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: isDarkMode ? "rgba(255,255,255,0.12)" : theme.surface,
		paddingVertical: 4,
		paddingHorizontal: spacing.md,
		borderRadius: radius.full,
		gap: 6,
	},
	statusDot: {
		color: "#22C55E",
		fontSize: 12,
	},
	statusText: {
		color: isDarkMode ? "rgba(255,255,255,0.82)" : theme.textSecondary,
		fontSize: typography.sm,
	},
	cards: {
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.xl,
		gap: 12,
	},
	card: {
		backgroundColor: theme.card,
		borderColor: theme.border,
		borderWidth: 1,
		borderRadius: radius.lg,
		padding: spacing.md,
		gap: 4,
	},
	label: {
		color: theme.textMuted,
		fontSize: typography.xs,
		fontWeight: typography.bold,
		textTransform: "uppercase",
		letterSpacing: typography.wide,
	},
	mono: {
		color: theme.textPrimary,
		fontSize: typography.sm,
		fontFamily: "monospace",
	},
	value: {
		color: theme.textPrimary,
		fontSize: typography.sm,
		fontWeight: typography.medium,
	},
	providerCard: {
		backgroundColor: isDarkMode ? "#1B2736" : "#F3F8FF",
		borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : brand.tealBorder,
		borderWidth: 1,
		borderRadius: radius.lg,
		padding: spacing.md,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	providerBadge: {
		width: 36,
		height: 36,
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.background,
	},
	providerBadgeText: {
		color: theme.white,
		fontSize: typography.base,
		fontWeight: typography.bold,
	},
	providerLabel: {
		color: isDarkMode ? "#A78BFA" : brand.tealDeep,
		fontSize: typography.xs,
		fontWeight: typography.bold,
		textTransform: "uppercase",
		letterSpacing: typography.wide,
	},
	providerValue: {
		color: theme.textPrimary,
		fontSize: typography.sm,
		fontWeight: typography.bold,
	},
	signOutWrap: {
		marginTop: "auto",
		paddingHorizontal: spacing.xl,
		paddingBottom: 48,
	},
	signOutButton: {
		height: 56,
		borderRadius: radius.lg,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: isDarkMode ? "rgba(248,113,113,0.25)" : "rgba(248,113,113,0.18)",
		backgroundColor: isDarkMode ? "rgba(127,29,29,0.16)" : "#FFF1F2",
	},
	signOutText: {
		color: "#E11D48",
		fontSize: typography.base,
		fontWeight: typography.bold,
	},
});
