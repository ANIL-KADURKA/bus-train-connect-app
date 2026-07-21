import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { brand, radius, theme, typography } from "../../constants/theme";

interface BadgeProps {
	count: number;
	style?: ViewStyle;
}

/** Numeric unread pill. Renders nothing at zero so callers can pass counts directly. */
export const Badge: React.FC<BadgeProps> = ({ count, style }) => {
	if (count <= 0) {
		return null;
	}

	return (
		<View style={[styles.badge, style]}>
			<Text style={styles.text} numberOfLines={1}>
				{count > 99 ? "99+" : count}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	badge: {
		minWidth: 18,
		height: 18,
		paddingHorizontal: 5,
		borderRadius: radius.full,
		backgroundColor: brand.amber,
		alignItems: "center",
		justifyContent: "center",
	},
	text: {
		color: theme.white,
		fontSize: typography.xs,
		fontWeight: typography.bold,
	},
});
