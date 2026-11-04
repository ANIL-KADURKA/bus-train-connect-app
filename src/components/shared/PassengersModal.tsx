import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { FC } from "react";
import React from "react";
import {
	ActivityIndicator,
	FlatList,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Passenger } from "../../api/journeys";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import { type ChatStatus, PassengerCard } from "./PassengerCard";

interface Props {
	visible: boolean;
	members: Passenger[];
	isLoading: boolean;
	statusFor: (userId: string) => ChatStatus;
	onRequestChat: (member: Passenger) => void;
	onOpenChat: (member: Passenger) => void;
	onClose: () => void;
}

/** Two per row: any wider and the cards stretch, any narrower and the names clip. */
const COLUMNS = 2;

export const PassengersModal: FC<Props> = ({
	visible,
	members,
	isLoading,
	statusFor,
	onRequestChat,
	onOpenChat,
	onClose,
}) => (
	<Modal visible={visible} animationType="slide" onRequestClose={onClose}>
		<SafeAreaView style={styles.root} edges={["top", "bottom"]}>
			<View style={styles.header}>
				<View style={styles.headerText}>
					<Text style={styles.title}>Passengers</Text>
					<Text style={styles.subtitle}>
						{members.length} {members.length === 1 ? "traveller" : "travellers"} on this journey
					</Text>
				</View>

				<Pressable
					style={styles.close}
					onPress={onClose}
					accessibilityRole="button"
					accessibilityLabel="Close passengers"
				>
					<HugeiconsIcon
						icon={Cancel01Icon}
						size={20}
						strokeWidth={1.8}
						color={theme.textPrimary}
					/>
				</Pressable>
			</View>

			{isLoading ? (
				<View style={styles.loading}>
					<ActivityIndicator size="large" color={brand.teal} />
				</View>
			) : (
				<FlatList
					data={members}
					keyExtractor={(item) => item.userId}
					numColumns={COLUMNS}
					columnWrapperStyle={styles.row}
					contentContainerStyle={styles.grid}
					ListEmptyComponent={<Text style={styles.empty}>No one has joined this journey yet.</Text>}
					renderItem={({ item }) => (
						<View style={styles.cell}>
							<PassengerCard
								member={item}
								status={statusFor(item.userId)}
								onRequestChat={() => onRequestChat(item)}
								onOpenChat={() => onOpenChat(item)}
								variant="list"
							/>
						</View>
					)}
				/>
			)}
		</SafeAreaView>
	</Modal>
);

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: theme.background,
		marginTop: spacing.md,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: theme.border,
	},
	headerText: {
		flex: 1,
	},
	title: {
		fontSize: typography.lg,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	subtitle: {
		fontSize: typography.sm,
		color: theme.textMuted,
		marginTop: 2,
	},
	close: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.full,
		backgroundColor: theme.surface,
	},
	loading: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	grid: {
		padding: spacing.md,
		gap: spacing.sm,
	},
	row: {
		gap: spacing.sm,
	},
	cell: {
		flex: 1 / COLUMNS,
	},
	empty: {
		paddingVertical: spacing.xxl,
		textAlign: "center",
		fontSize: typography.base,
		color: theme.textMuted,
	},
});
