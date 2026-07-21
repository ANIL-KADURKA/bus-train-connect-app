import type { IconSvgElement } from "@hugeicons/react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useEffect, useRef, useState } from "react";
import {
	Animated,
	Easing,
	type LayoutChangeEvent,
	Pressable,
	StyleSheet,
	Text,
	View,
	type ViewStyle,
} from "react-native";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";

/** Minimum comfortable touch target height. */
const SEGMENT_HEIGHT = 44;
const SLIDE_DURATION_MS = 180;

export interface SegmentOption<T extends string> {
	value: T;
	label: string;
	icon?: IconSvgElement;
}

interface SegmentedControlProps<T extends string> {
	options: SegmentOption<T>[];
	value: T;
	onChange: (value: T) => void;
	style?: ViewStyle;
}

/**
 * Pill-shaped segmented control with a filled indicator that slides between options.
 *
 * The indicator is positioned from a measured track width rather than percentages so it
 * stays aligned when the control is given an explicit width by its parent.
 */
export function SegmentedControl<T extends string>({
	options,
	value,
	onChange,
	style,
}: SegmentedControlProps<T>) {
	const [trackWidth, setTrackWidth] = useState(0);
	const selectedIndex = Math.max(
		0,
		options.findIndex((option) => option.value === value),
	);
	const slide = useRef(new Animated.Value(selectedIndex)).current;

	useEffect(() => {
		Animated.timing(slide, {
			toValue: selectedIndex,
			duration: SLIDE_DURATION_MS,
			easing: Easing.out(Easing.ease),
			useNativeDriver: true,
		}).start();
	}, [selectedIndex, slide]);

	const handleLayout = (event: LayoutChangeEvent) => {
		setTrackWidth(event.nativeEvent.layout.width);
	};

	const segmentWidth = trackWidth / options.length;

	return (
		<View style={[styles.track, style]} onLayout={handleLayout}>
			{trackWidth > 0 && (
				<Animated.View
					pointerEvents="none"
					style={[
						styles.indicator,
						{
							width: segmentWidth,
							transform: [
								{
									translateX: slide.interpolate({
										inputRange: [0, 1],
										outputRange: [0, segmentWidth],
									}),
								},
							],
						},
					]}
				/>
			)}

			{options.map((option) => {
				const active = option.value === value;

				return (
					<Pressable
						key={option.value}
						style={styles.segment}
						onPress={() => onChange(option.value)}
						accessibilityRole="tab"
						accessibilityState={{ selected: active }}
						accessibilityLabel={option.label}
					>
						{option.icon && (
							<HugeiconsIcon
								icon={option.icon}
								size={18}
								// The free icon set has no solid variants, so weight carries the
								// active state alongside colour.
								strokeWidth={active ? 2.2 : 1.6}
								color={active ? theme.white : theme.textSecondary}
							/>
						)}
						<Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
							{option.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	track: {
		flexDirection: "row",
		backgroundColor: theme.surface,
		borderRadius: radius.full,
		padding: 3,
		position: "relative",
	},
	indicator: {
		position: "absolute",
		top: 3,
		left: 3,
		bottom: 3,
		backgroundColor: brand.teal,
		borderRadius: radius.full,
	},
	segment: {
		flex: 1,
		height: SEGMENT_HEIGHT,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs + 2,
	},
	label: {
		fontSize: typography.base,
		fontWeight: typography.medium,
	},
	labelActive: {
		color: theme.white,
		fontWeight: typography.bold,
	},
	labelInactive: {
		color: theme.textSecondary,
	},
});
