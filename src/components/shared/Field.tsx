import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { brand, spacing, theme, typography } from "../../constants/theme";

export function Field({
	label,
	error,
	hint,
	children,
}: {
	label: string;
	error?: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<View style={styles.field}>
			<Text style={styles.label}>{label}</Text>
			{children}
			{hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
			{error ? <Text style={styles.error}>{error}</Text> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	field: {
		marginBottom: spacing.md,
	},
	label: {
		fontSize: typography.sm,
		fontWeight: typography.medium,
		color: theme.textSecondary,
		marginBottom: spacing.xs,
		letterSpacing: typography.wide,
		textTransform: "uppercase",
		paddingHorizontal: spacing.xs,
	},
	hint: {
		fontSize: typography.xs,
		color: theme.textMuted,
		marginTop: spacing.xs,
		paddingHorizontal: spacing.xs,
	},
	error: {
		fontSize: typography.xs,
		color: brand.amberDeep,
		marginTop: spacing.xs,
		paddingHorizontal: spacing.xs,
	},
});
