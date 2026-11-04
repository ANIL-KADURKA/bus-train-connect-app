import { Female02Icon, Male02Icon, User02Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { FC } from "react";
import React from "react";
import { StyleSheet, View } from "react-native";
import type { Gender } from "../../api/journeys";
import { radius, theme } from "../../constants/theme";

interface Props {
	gender?: Gender;
	size?: number;
}

/**
 * Avatar for a traveller who has no photo — a gendered figure, so a members list reads
 * at a glance instead of as a column of identical placeholders.
 *
 * 'other' and 'prefer_not_to_say' share the neutral figure with an unset gender. That
 * is deliberate: the icon is a visual aid, and inventing a distinct glyph for people
 * who declined to say would turn a non-answer into a label they never chose.
 */
const APPEARANCE: Record<string, { icon: IconSvgElement; tint: string; background: string }> = {
	female: { icon: Female02Icon, tint: "#C2185B", background: "rgba(194,24,91,0.10)" },
	male: { icon: Male02Icon, tint: "#1565C0", background: "rgba(21,101,192,0.10)" },
};

const NEUTRAL = {
	icon: User02Icon,
	tint: theme.textSecondary,
	background: theme.surface,
};

export const GenderAvatar: FC<Props> = ({ gender, size = 40 }) => {
	const appearance = (gender && APPEARANCE[gender]) ?? NEUTRAL;

	return (
		<View
			style={[
				styles.avatar,
				{
					width: size,
					height: size,
					backgroundColor: appearance.background,
				},
			]}
		>
			<HugeiconsIcon
				icon={appearance.icon}
				size={Math.round(size * 0.55)}
				strokeWidth={1.8}
				color={appearance.tint}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	avatar: {
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.full,
	},
});
