import { Bus01Icon, Train01Icon } from "@hugeicons/core-free-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "../constants/theme";
import { type TransportMode, useModeStore } from "../store/modeStore";
import { SegmentedControl, type SegmentOption } from "./shared/SegmentedControl";

const MODE_OPTIONS: SegmentOption<TransportMode>[] = [
	{ value: "bus", label: "Buses", icon: Bus01Icon },
	{ value: "train", label: "Trains", icon: Train01Icon },
];

/**
 * Global transport context switch. This is not a filter chip — changing it re-scopes
 * every journey list and search below it, and the choice survives app restarts.
 */
export const ModeSwitcher: React.FC = () => {
	const mode = useModeStore((state) => state.mode);
	const setMode = useModeStore((state) => state.setMode);

	return (
		<View style={styles.container}>
			<SegmentedControl
				options={MODE_OPTIONS}
				value={mode}
				onChange={setMode}
				style={styles.control}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.sm,
		paddingBottom: spacing.md,
	},
	control: {
		// Roughly 60% of the screen, per the spec, without hardcoding a pixel width.
		width: "62%",
	},
});
