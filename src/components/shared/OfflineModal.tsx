import { WifiOff01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { FC } from "react";
import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";

interface OfflineModalProps {
	visible: boolean;
	onRetry: () => void;
}

/** How long Retry shows a spinner: enough for a probe to land, short enough not to stall. */
const RETRY_FEEDBACK_MS = 1200;

/**
 * Blocks the whole app while there's no internet. Everything here — journeys, chats,
 * sign-in — needs the server, so letting people tap around would only produce errors.
 * There is deliberately no close button: it lifts by itself when the connection returns.
 */
export const OfflineModal: FC<OfflineModalProps> = ({ visible, onRetry }) => {
	const [retrying, setRetrying] = useState(false);

	const handleRetry = () => {
		setRetrying(true);
		onRetry();
		setTimeout(() => setRetrying(false), RETRY_FEEDBACK_MS);
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			// Android back button: there is nothing to go back to while offline.
			onRequestClose={() => {}}
		>
			<View style={styles.overlay}>
				<View style={styles.card} accessibilityViewIsModal accessibilityLiveRegion="assertive">
					<View style={styles.iconWrap}>
						<HugeiconsIcon
							icon={WifiOff01Icon}
							size={30}
							strokeWidth={1.6}
							color={brand.tealDeep}
						/>
					</View>
					<Text style={styles.title}>You're offline</Text>
					<Text style={styles.message}>
						Transit Connect needs an internet connection. Check your Wi-Fi or mobile data — we'll
						pick up where you left off as soon as you're back.
					</Text>
					<Pressable
						style={styles.button}
						onPress={handleRetry}
						disabled={retrying}
						accessibilityRole="button"
						accessibilityLabel="Retry connection"
					>
						{retrying ? (
							<ActivityIndicator size="small" color={theme.white} />
						) : (
							<Text style={styles.buttonText}>Try again</Text>
						)}
					</Pressable>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.xl,
		// Darker than the confirm dialog's scrim: the app behind is unusable, and should look it.
		backgroundColor: "rgba(13,27,42,0.6)",
	},
	card: {
		width: "100%",
		maxWidth: 340,
		alignItems: "center",
		gap: spacing.sm,
		padding: spacing.lg,
		borderRadius: radius.lg,
		backgroundColor: theme.card,
		borderWidth: 1,
		borderColor: theme.border,
	},
	iconWrap: {
		width: 60,
		height: 60,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.full,
		backgroundColor: brand.tealMuted,
		marginBottom: spacing.xs,
	},
	title: {
		fontSize: typography.lg,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	message: {
		fontSize: typography.base,
		color: theme.textSecondary,
		textAlign: "center",
		lineHeight: 20,
	},
	button: {
		alignSelf: "stretch",
		height: 44,
		alignItems: "center",
		justifyContent: "center",
		marginTop: spacing.sm,
		borderRadius: radius.md,
		backgroundColor: brand.teal,
	},
	buttonText: {
		fontSize: typography.base,
		fontWeight: typography.bold,
		color: theme.white,
	},
});
