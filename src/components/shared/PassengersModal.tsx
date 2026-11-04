import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { FC } from "react";
import React, { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import type { Passenger } from "../../api/journeys";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import { ConfirmModalHost } from "./ConfirmModal";
import { type ChatStatus, PassengerCard } from "./PassengerCard";
import { SegmentedControl, type SegmentOption } from "./SegmentedControl";

type Scope = "all" | "mine";

const SCOPES: SegmentOption<Scope>[] = [
	{ value: "all", label: "All passengers" },
	{ value: "mine", label: "My journeys" },
];

interface Props {
	visible: boolean;
	members: Passenger[];
	isLoading: boolean;
	/**
	 * Travellers on the journeys the caller has joined. Only passed when the page is opened
	 * from "Find Passengers"; its presence is what shows the All / My journeys filter.
	 */
	myJourneys?: { members: Passenger[]; isLoading: boolean };
	statusFor: (userId: string) => ChatStatus;
	isBusy?: (userId: string) => boolean;
	onAction: (member: Passenger) => void;
	onClose: () => void;
}

/** Two per row: any wider and the cards stretch, any narrower and the names clip. */
const COLUMNS = 2;

export const PassengersModal: FC<Props> = ({
	visible,
	members,
	isLoading,
	myJourneys,
	statusFor,
	isBusy,
	onAction,
	onClose,
}) => {
	const [query, setQuery] = useState("");
	const [scope, setScope] = useState<Scope>("all");
	const hasFilter = myJourneys !== undefined;

	// "Find Passengers" is asking about the people you travel with, so it opens there.
	useEffect(() => {
		if (visible) setScope(hasFilter ? "mine" : "all");
	}, [visible, hasFilter]);

	const showingMine = hasFilter && scope === "mine";
	const source = showingMine ? myJourneys.members : members;
	const loading = showingMine ? myJourneys.isLoading : isLoading;

	// displayName is already the alias for hidden profiles, so searching it can't reveal
	// a real name the traveller chose to hide.
	const filtered = useMemo(() => {
		const needle = query.trim().toLowerCase();
		if (!needle) return source;

		return source.filter((member) => member.displayName.toLowerCase().includes(needle));
	}, [source, query]);

	const handleClose = () => {
		setQuery("");
		onClose();
	};

	return (
		<Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
			{/* A Modal renders outside the app's provider, so it needs its own to get real insets. */}
			<SafeAreaProvider>
				<SafeAreaView style={styles.root} edges={["top", "bottom"]}>
					<View style={styles.header}>
						<View style={styles.headerText}>
							<Text style={styles.title}>Passengers</Text>
							<Text style={styles.subtitle}>
								{source.length} {source.length === 1 ? "traveller" : "travellers"}{" "}
								{showingMine ? "on your journeys" : "on these journeys"}
							</Text>
						</View>

						<Pressable
							style={styles.close}
							onPress={handleClose}
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

					{hasFilter && (
						<SegmentedControl
							options={SCOPES}
							value={scope}
							onChange={setScope}
							style={styles.scope}
						/>
					)}

					<View style={styles.searchRow}>
						<HugeiconsIcon
							icon={Search01Icon}
							size={18}
							strokeWidth={1.8}
							color={theme.textMuted}
						/>
						<TextInput
							value={query}
							onChangeText={setQuery}
							placeholder="Search passengers by name"
							placeholderTextColor={theme.textMuted}
							style={styles.searchInput}
							autoCorrect={false}
							autoCapitalize="none"
							returnKeyType="search"
							clearButtonMode="while-editing"
							accessibilityLabel="Search passengers"
						/>
					</View>

					{loading ? (
						<View style={styles.loading}>
							<ActivityIndicator size="large" color={brand.teal} />
						</View>
					) : (
						<FlatList
							data={filtered}
							keyExtractor={(item) => item.userId}
							numColumns={COLUMNS}
							columnWrapperStyle={styles.row}
							contentContainerStyle={styles.grid}
							keyboardShouldPersistTaps="handled"
							keyboardDismissMode="on-drag"
							ListEmptyComponent={
								<Text style={styles.empty}>
									{query.trim()
										? `No passengers match "${query.trim()}".`
										: showingMine
											? "No one else is on your upcoming journeys yet."
											: "No one has joined these journeys yet."}
								</Text>
							}
							renderItem={({ item }) => (
								<View style={styles.cell}>
									<PassengerCard
										member={item}
										status={statusFor(item.userId)}
										busy={isBusy?.(item.userId)}
										onPress={() => onAction(item)}
										variant="list"
									/>
								</View>
							)}
						/>
					)}
				</SafeAreaView>
				{/* iOS can't stack a sibling Modal over this one; confirms must render inside it. */}
				<ConfirmModalHost />
			</SafeAreaProvider>
		</Modal>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: theme.background,
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
	scope: {
		marginHorizontal: spacing.md,
		marginTop: spacing.md,
	},
	searchRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		marginHorizontal: spacing.md,
		marginTop: spacing.md,
		paddingHorizontal: spacing.md,
		height: 44,
		borderRadius: radius.md,
		borderWidth: 0.5,
		borderColor: theme.inputBorder,
		backgroundColor: theme.inputBackground,
	},
	searchInput: {
		flex: 1,
		fontSize: typography.base,
		color: theme.textPrimary,
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
