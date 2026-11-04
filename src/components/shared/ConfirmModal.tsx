import type { FC } from "react";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import type { ConfirmOptions } from "../../store/confirmStore";

interface ConfirmModalProps extends Omit<ConfirmOptions, "onConfirm"> {
	visible: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

/** Small centred dialog with a title, optional message and two buttons. */
export const ConfirmModal: FC<ConfirmModalProps> = ({
	visible,
	title,
	message,
	confirmLabel,
	cancelLabel = "Cancel",
	tone = "default",
	onConfirm,
	onCancel,
}) => (
	<Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
		<View style={styles.overlay}>
			<Pressable
				style={StyleSheet.absoluteFill}
				onPress={onCancel}
				accessibilityRole="button"
				accessibilityLabel={cancelLabel}
			/>
			<View style={styles.card} accessibilityViewIsModal>
				<Text style={styles.title}>{title}</Text>
				{message ? <Text style={styles.message}>{message}</Text> : null}

				<View style={styles.actions}>
					<Pressable
						style={[styles.button, styles.cancelButton]}
						onPress={onCancel}
						accessibilityRole="button"
					>
						<Text style={styles.cancelText}>{cancelLabel}</Text>
					</Pressable>
					<Pressable
						style={[
							styles.button,
							tone === "destructive" ? styles.destructiveButton : styles.confirmButton,
						]}
						onPress={onConfirm}
						accessibilityRole="button"
					>
						<Text style={styles.confirmText}>{confirmLabel}</Text>
					</Pressable>
				</View>
			</View>
		</View>
	</Modal>
);

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.xl,
		backgroundColor: "rgba(13,27,42,0.38)",
	},
	card: {
		width: "100%",
		maxWidth: 340,
		padding: spacing.lg,
		borderRadius: radius.lg,
		backgroundColor: theme.card,
		borderWidth: 1,
		borderColor: theme.border,
		gap: spacing.sm,
	},
	title: {
		fontSize: typography.lg,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	message: {
		fontSize: typography.base,
		color: theme.textSecondary,
		lineHeight: 20,
	},
	actions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: spacing.sm,
		marginTop: spacing.sm,
	},
	button: {
		minWidth: 92,
		height: 42,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.md,
		paddingHorizontal: spacing.md,
	},
	cancelButton: {
		backgroundColor: theme.inputBackground,
		borderWidth: 1,
		borderColor: theme.inputBorder,
	},
	cancelText: {
		fontSize: typography.base,
		fontWeight: typography.bold,
		color: theme.textSecondary,
	},
	confirmButton: {
		backgroundColor: brand.teal,
	},
	destructiveButton: {
		backgroundColor: brand.danger,
	},
	confirmText: {
		fontSize: typography.base,
		fontWeight: typography.bold,
		color: theme.white,
	},
});
