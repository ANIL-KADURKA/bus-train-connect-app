import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet } from "react-native";
import { brand, radius, spacing, theme } from "../constants/theme";

/** Exported so anything anchoring to the FAB (the quick-actions menu) stays aligned. */
export const FAB_SIZE = 56;
export const FAB_INSET = spacing.xl;

interface FabProps {
	onPress: () => void;
	/** Rotates the plus into a cross while the sheet it opens is showing. */
	active?: boolean;
	accessibilityLabel?: string;
}

export const Fab: React.FC<FabProps> = ({
	onPress,
	active = false,
	accessibilityLabel = "Open actions",
}) => {
	const rotation = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.timing(rotation, {
			toValue: active ? 1 : 0,
			duration: 180,
			easing: Easing.out(Easing.ease),
			useNativeDriver: true,
		}).start();
	}, [active, rotation]);

	return (
		<Pressable
			style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
		>
			<Animated.View
				style={{
					transform: [
						{
							rotate: rotation.interpolate({
								inputRange: [0, 1],
								outputRange: ["0deg", "45deg"],
							}),
						},
					],
				}}
			>
				<HugeiconsIcon icon={Add01Icon} size={26} strokeWidth={2.2} color={theme.white} />
			</Animated.View>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	fab: {
		position: "absolute",
		right: FAB_INSET,
		bottom: FAB_INSET,
		width: FAB_SIZE,
		height: FAB_SIZE,
		borderRadius: radius.full,
		backgroundColor: brand.teal,
		alignItems: "center",
		justifyContent: "center",
		...Platform.select({
			ios: {
				shadowColor: theme.black,
				shadowOpacity: 0.18,
				shadowRadius: 8,
				shadowOffset: { width: 0, height: 4 },
			},
			android: { elevation: 6 },
		}),
	},
	fabPressed: {
		opacity: 0.85,
	},
});
