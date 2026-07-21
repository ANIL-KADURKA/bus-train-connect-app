import { Package01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, theme, typography } from "../../constants/theme";
import { useModeStore } from "../../store/modeStore";

export const ParcelsScreen: React.FC = () => {
	const mode = useModeStore((state) => state.mode);

	return (
		<SafeAreaView style={styles.root} edges={["top"]}>
			<Text style={styles.header}>Parcels</Text>

			<View style={styles.empty}>
				<HugeiconsIcon icon={Package01Icon} size={40} strokeWidth={1.4} color={theme.textMuted} />
				<Text style={styles.emptyTitle}>No parcel requests</Text>
				<Text style={styles.emptyBody}>
					Parcel requests from your {mode} journeys will appear here.
				</Text>
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
		fontSize: typography.xl,
		fontWeight: typography.bold,
		color: theme.textPrimary,
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.md,
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
