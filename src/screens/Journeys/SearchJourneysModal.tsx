import { ArrowDataTransferVerticalIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import type { JourneySearch } from "../../api/journeys";
import { Field } from "../../components/shared/Field";
import { PlaceInput, type SelectedPlace } from "../../components/shared/PlaceInput";
import { SegmentedControl, type SegmentOption } from "../../components/shared/SegmentedControl";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import type { TransportMode } from "../../store/modeStore";
import { toIsoDate } from "../../utils/date.utils";

type SearchTab = "route" | "registration";

const SEARCH_TABS: SegmentOption<SearchTab>[] = [
	{ value: "route", label: "By route" },
	{ value: "registration", label: "By number" },
];

interface SearchJourneysModalProps {
	visible: boolean;
	mode: TransportMode;
	/** The search currently applied on Home, so reopening resumes where it left off. */
	current: JourneySearch | null;
	onClose: () => void;
	onApply: (search: JourneySearch) => void;
	onClear: () => void;
}

/**
 * The two ways to find a journey group: by where you're travelling, or by the exact
 * vehicle you're on.
 *
 * A modal rather than a panel on Home because the route form needs room for two Places
 * dropdowns, and a form that tall would push the results list off the screen.
 */
export const SearchJourneysModal: React.FC<SearchJourneysModalProps> = ({
	visible,
	mode,
	current,
	onClose,
	onApply,
	onClear,
}) => {
	const isTrain = mode === "train";

	const [tab, setTab] = useState<SearchTab>(current?.kind ?? "route");
	const [source, setSource] = useState<SelectedPlace | null>(null);
	const [destination, setDestination] = useState<SelectedPlace | null>(null);
	const [journeyDate, setJourneyDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [registrationNumber, setRegistrationNumber] = useState("");
	// Remounts the Places inputs so their internal query text resets with the form.
	const [formKey, setFormKey] = useState(0);
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Reopening the sheet should show the search that is actually applied, not whatever
	// half-filled state was abandoned last time.
	useEffect(() => {
		if (!visible) {
			return;
		}

		setErrors({});
		setTab(current?.kind ?? "route");

		if (current?.kind === "route") {
			setSource(current.source);
			setDestination(current.destination);
			setJourneyDate(new Date(`${current.journeyDate}T00:00:00`));
			setRegistrationNumber("");
		} else if (current?.kind === "registration") {
			setSource(null);
			setDestination(null);
			setRegistrationNumber(current.registrationNumber);
		} else {
			setSource(null);
			setDestination(null);
			setRegistrationNumber("");
			setJourneyDate(new Date());
		}

		setFormKey((key) => key + 1);
	}, [visible, current]);

	const handleSearch = () => {
		if (tab === "registration") {
			const trimmed = registrationNumber.trim();

			if (!trimmed) {
				setErrors({
					registrationNumber: isTrain ? "Enter a train number" : "Enter a registration number",
				});
				return;
			}

			onApply({ kind: "registration", registrationNumber: trimmed });
			return;
		}

		const next: Record<string, string> = {};

		if (!source) next.source = "Pick a city from the suggestions";
		if (!destination) next.destination = "Pick a city from the suggestions";

		setErrors(next);

		if (!source || !destination) {
			return;
		}

		onApply({
			kind: "route",
			source,
			destination,
			journeyDate: toIsoDate(journeyDate),
		});
	};

	const handleSwapRoute = () => {
		setSource(destination);
		setDestination(source);
		setErrors({});
		setFormKey((key) => key + 1);
	};

	return (
		<Modal visible={visible} animationType="fade" onRequestClose={onClose} transparent>
			<View style={styles.backdrop}>
				<Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />

				<KeyboardAvoidingView
					style={styles.centerer}
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					pointerEvents="box-none"
				>
					<View style={styles.card}>
						<View style={styles.header}>
							<Text style={styles.title}>Find a {isTrain ? "train" : "bus"} journey</Text>
							<Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
								<HugeiconsIcon
									icon={Cancel01Icon}
									size={22}
									strokeWidth={1.8}
									color={theme.textMuted}
								/>
							</Pressable>
						</View>

						<View style={styles.tabs}>
							<SegmentedControl options={SEARCH_TABS} value={tab} onChange={setTab} />
						</View>

						<ScrollView
							style={styles.scroll}
							contentContainerStyle={styles.form}
							keyboardShouldPersistTaps="handled"
							showsVerticalScrollIndicator={false}
						>
							{tab === "route" ? (
								<>
									<Field label="From" error={errors.source}>
										<PlaceInput
											key={`source-${formKey}`}
											value={source}
											onChange={setSource}
											placeholder="Search boarding city"
										/>
									</Field>

									<View style={styles.swapRow}>
										<Pressable
											style={({ pressed }) => [
												styles.swapButton,
												pressed && styles.swapButtonPressed,
											]}
											onPress={handleSwapRoute}
											accessibilityRole="button"
											accessibilityLabel="Swap from and to"
										>
											<HugeiconsIcon
												icon={ArrowDataTransferVerticalIcon}
												size={18}
												strokeWidth={1.8}
												color={brand.tealDeep}
											/>
										</Pressable>
									</View>

									<Field label="To" error={errors.destination}>
										<PlaceInput
											key={`destination-${formKey}`}
											value={destination}
											onChange={setDestination}
											placeholder="Search drop city"
										/>
									</Field>

									<Field label="Date of travel">
										{Platform.OS === "ios" ? (
											<DateTimePicker
												value={journeyDate}
												mode="date"
												display="compact"
												minimumDate={new Date()}
												style={styles.iosDate}
												onChange={(_, selected) => {
													if (selected) setJourneyDate(selected);
												}}
											/>
										) : (
											<>
												<Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
													<Text style={styles.inputText}>{toIsoDate(journeyDate)}</Text>
												</Pressable>
												{showDatePicker ? (
													<DateTimePicker
														value={journeyDate}
														mode="date"
														display="default"
														minimumDate={new Date()}
														onChange={(event, selected) => {
															setShowDatePicker(false);
															if (event.type === "set" && selected) setJourneyDate(selected);
														}}
													/>
												) : null}
											</>
										)}
									</Field>
								</>
							) : (
								<Field
									label={isTrain ? "Train number" : "Registration number"}
									error={errors.registrationNumber}
									hint="Spaces and dashes don't matter"
								>
									<TextInput
										style={styles.input}
										placeholder={isTrain ? "e.g. 12723" : "e.g. TS07UB1234"}
										placeholderTextColor={theme.textMuted}
										value={registrationNumber}
										onChangeText={setRegistrationNumber}
										autoCapitalize="characters"
										autoCorrect={false}
										returnKeyType="search"
										onSubmitEditing={handleSearch}
										maxLength={50}
									/>
								</Field>
							)}

							<Pressable style={styles.submit} onPress={handleSearch} accessibilityRole="button">
								<Text style={styles.submitText}>Search</Text>
							</Pressable>

							{current ? (
								<Pressable style={styles.clearButton} onPress={onClear} accessibilityRole="button">
									<Text style={styles.clearText}>Clear search</Text>
								</Pressable>
							) : null}
						</ScrollView>
					</View>
				</KeyboardAvoidingView>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: `${theme.background}CC`, // 80% opacity
	},
	centerer: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.xxl,
	},
	card: {
		maxHeight: "100%",
		backgroundColor: theme.card,
		borderRadius: radius.lg + 4,
		borderWidth: 1,
		borderColor: theme.border,
		overflow: "hidden",
		...Platform.select({
			ios: {
				shadowColor: theme.black,
				shadowOpacity: 0.2,
				shadowRadius: 20,
				shadowOffset: { width: 0, height: 8 },
			},
			android: { elevation: 12 },
		}),
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.lg,
		paddingBottom: spacing.md,
	},
	title: {
		fontSize: typography.lg,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	tabs: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.md,
	},
	scroll: {
		flexGrow: 0,
	},
	form: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.lg,
	},
	input: {
		backgroundColor: theme.inputBackground,
		borderWidth: 1,
		borderColor: theme.inputBorder,
		borderRadius: radius.md,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm + 2,
		fontSize: typography.md,
		color: theme.textPrimary,
	},
	inputText: {
		fontSize: typography.md,
		color: theme.textPrimary,
	},
	iosDate: {
		alignSelf: "flex-start",
		marginLeft: -spacing.sm,
	},
	swapRow: {
		alignItems: "center",
		marginTop: -spacing.xs,
		marginBottom: spacing.xs,
	},
	swapButton: {
		width: 36,
		height: 36,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.full,
		backgroundColor: theme.surface,
		borderWidth: 1,
		borderColor: theme.border,
	},
	swapButtonPressed: {
		backgroundColor: theme.inputBackground,
	},
	submit: {
		backgroundColor: brand.teal,
		borderRadius: radius.md,
		paddingVertical: spacing.md,
		alignItems: "center",
		marginTop: spacing.md,
	},
	submitText: {
		fontSize: typography.md,
		fontWeight: typography.bold,
		color: theme.white,
	},
	clearButton: {
		paddingVertical: spacing.md,
		alignItems: "center",
	},
	clearText: {
		fontSize: typography.base,
		fontWeight: typography.bold,
		color: theme.textSecondary,
	},
});
