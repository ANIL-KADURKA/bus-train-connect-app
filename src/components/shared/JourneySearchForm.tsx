import { ArrowDataTransferVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { JourneySearch } from "../../api/journeys";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import type { TransportMode } from "../../store/modeStore";
import { toIsoDate } from "../../utils/date.utils";
import { Field } from "./Field";
import { PlaceInput, type SelectedPlace } from "./PlaceInput";
import { SegmentedControl, type SegmentOption } from "./SegmentedControl";

type SearchTab = "route" | "registration";

const SEARCH_TABS: SegmentOption<SearchTab>[] = [
	{ value: "route", label: "By route" },
	{ value: "registration", label: "By number" },
];

interface Props {
	mode: TransportMode;
	/** The search currently applied, so the form always reflects what the list is showing. */
	current: JourneySearch | null;
	onApply: (search: JourneySearch) => void;
	onClear: () => void;
}

/**
 * The two ways to find a journey group: by where you're travelling, or by the exact
 * vehicle you're on.
 *
 * Laid out in normal flow with no scroll container of its own, so it can sit inside a
 * list header. PlaceInput's suggestions render inline rather than as an overlay, which
 * is what makes that safe — the form grows downward while a dropdown is open instead of
 * clipping it against a parent bound.
 */
export const JourneySearchForm: React.FC<Props> = ({ mode, current, onApply, onClear }) => {
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

	// Follows the applied search rather than the other way round: clearing from anywhere
	// empties the fields, so the form can never claim a filter the list isn't using.
	useEffect(() => {
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
	}, [current]);

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
		<View style={styles.form}>
			<SegmentedControl options={SEARCH_TABS} value={tab} onChange={setTab} />

			{tab === "route" ? (
				<>
					{/* From and To stack in a narrowed column with the swap button beside them,
					    rather than on a row of its own between the two — the button is 36pt tall
					    and a full row of it cost more vertical space than the fields it separated. */}
					<View style={styles.routeRow}>
						<View style={styles.routeFields}>
							<Field label="From" error={errors.source}>
								<PlaceInput
									key={`source-${formKey}`}
									value={source}
									onChange={setSource}
									placeholder="Search boarding city"
								/>
							</Field>

							<Field label="To" error={errors.destination}>
								<PlaceInput
									key={`destination-${formKey}`}
									value={destination}
									onChange={setDestination}
									placeholder="Search drop city"
								/>
							</Field>
						</View>

						<View style={styles.swapColumn}>
							<Pressable
								style={({ pressed }) => [styles.swapButton, pressed && styles.swapButtonPressed]}
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
					</View>

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

			<View style={styles.actions}>
				<Pressable style={styles.submit} onPress={handleSearch} accessibilityRole="button">
					<Text style={styles.submitText}>Search</Text>
				</Pressable>

				{current ? (
					<Pressable style={styles.clearButton} onPress={onClear} accessibilityRole="button">
						<Text style={styles.clearText}>Clear</Text>
					</Pressable>
				) : null}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	form: {
		padding: spacing.md,
		borderRadius: radius.lg,
		backgroundColor: theme.card,
		borderWidth: 1,
		borderColor: theme.border,
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
	routeRow: {
		flexDirection: "row",
		gap: spacing.sm,
	},
	routeFields: {
		flex: 1,
	},
	swapColumn: {
		justifyContent: "center",
		// Cancels the trailing Field margin so the button centres on the gap between the
		// two inputs rather than on the whole stack, which would sit it visibly high.
		paddingBottom: spacing.md,
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
	actions: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		marginTop: spacing.sm,
	},
	submit: {
		flex: 1,
		backgroundColor: brand.teal,
		borderRadius: radius.md,
		paddingVertical: spacing.md,
		alignItems: "center",
	},
	submitText: {
		fontSize: typography.md,
		fontWeight: typography.bold,
		color: theme.white,
	},
	clearButton: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		borderRadius: radius.md,
		backgroundColor: theme.surface,
		borderWidth: 1,
		borderColor: theme.border,
	},
	clearText: {
		fontSize: typography.base,
		fontWeight: typography.bold,
		color: theme.textSecondary,
	},
});
