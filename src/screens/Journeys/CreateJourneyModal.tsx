import { Cancel01Icon, DocumentValidationIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
	Alert,
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
import { Field } from "../../components/shared/Field";
import { PlaceInput, type SelectedPlace } from "../../components/shared/PlaceInput";
import { SegmentedControl, type SegmentOption } from "../../components/shared/SegmentedControl";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import { useCreateJourney } from "../../hooks/useJourneys";
import { useModeStore } from "../../store/modeStore";
import { toIsoDate } from "../../utils/date.utils";

type CreationMode = "manual" | "ocr";

const CREATION_TABS: SegmentOption<CreationMode>[] = [
	{ value: "manual", label: "Manual" },
	{ value: "ocr", label: "Scan ticket" },
];

interface CreateJourneyModalProps {
	visible: boolean;
	onClose: () => void;
}

export const CreateJourneyModal: React.FC<CreateJourneyModalProps> = ({ visible, onClose }) => {
	const mode = useModeStore((state) => state.mode);
	const isTrain = mode === "train";

	const [creationMode, setCreationMode] = useState<CreationMode>("manual");
	const [registrationNumber, setRegistrationNumber] = useState("");
	const [serviceName, setServiceName] = useState("");
	const [journeyDate, setJourneyDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [source, setSource] = useState<SelectedPlace | null>(null);
	const [destination, setDestination] = useState<SelectedPlace | null>(null);
	const [pnr, setPnr] = useState("");
	// Remounts the Places inputs so their internal query text clears with the form.
	const [formKey, setFormKey] = useState(0);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const { mutate: submit, isPending } = useCreateJourney();

	const reset = () => {
		setRegistrationNumber("");
		setServiceName("");
		setJourneyDate(new Date());
		setSource(null);
		setDestination(null);
		setPnr("");
		setErrors({});
		setFormKey((key) => key + 1);
	};

	const handleSubmit = () => {
		const next: Record<string, string> = {};

		if (!registrationNumber.trim()) {
			next.registrationNumber = isTrain
				? "Train number is required"
				: "Registration number is required";
		}
		if (!source) next.source = "Pick a source from the suggestions";
		if (!destination) next.destination = "Pick a destination from the suggestions";

		setErrors(next);

		// Narrowed here rather than in a validate() helper so TypeScript can see that the
		// places are non-null below.
		if (!source || !destination || Object.keys(next).length > 0) return;

		submit(
			{
				transportType: mode,
				registrationNumber: registrationNumber.trim(),
				serviceName: serviceName.trim() || undefined,
				journeyDate: toIsoDate(journeyDate),
				sourceLocation: source.text,
				sourcePlaceId: source.placeId,
				sourceLatitude: source.latitude,
				sourceLongitude: source.longitude,
				destinationLocation: destination.text,
				destinationPlaceId: destination.placeId,
				destinationLatitude: destination.latitude,
				destinationLongitude: destination.longitude,
				pnr: isTrain && pnr.trim() ? pnr.trim() : undefined,
				creationMethod: "manual",
			},
			{
				onSuccess: (result) => {
					reset();
					onClose();
					Alert.alert(
						result.joinedExisting ? "Joined journey" : "Journey created",
						result.joinedExisting
							? "Someone already added this service — you've joined their group."
							: "You're in. Fellow passengers who add this service will join you.",
					);
				},
				onError: (error: unknown) => {
					const message = error instanceof Error ? error.message : "Something went wrong.";
					Alert.alert("Could not create journey", message);
				},
			},
		);
	};

	return (
		<Modal visible={visible} animationType="fade" onRequestClose={onClose} transparent>
			<View style={styles.backdrop}>
				{/* Tap outside the card to dismiss. */}
				<Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />

				{/* Lifts the whole card when the keyboard opens; the ScrollView inside then
				    handles anything that still doesn't fit. */}
				<KeyboardAvoidingView
					style={styles.centerer}
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					pointerEvents="box-none"
				>
					<View style={styles.card}>
						<View style={styles.header}>
							<Text style={styles.title}>Add {isTrain ? "train" : "bus"} journey</Text>
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
							<SegmentedControl
								options={CREATION_TABS}
								value={creationMode}
								onChange={setCreationMode}
							/>
						</View>

						{creationMode === "ocr" ? (
							<View style={styles.comingSoon}>
								<HugeiconsIcon
									icon={DocumentValidationIcon}
									size={40}
									strokeWidth={1.4}
									color={theme.textMuted}
								/>
								<Text style={styles.comingSoonTitle}>Scan ticket — coming soon</Text>
								<Text style={styles.comingSoonBody}>
									Upload a ticket and we'll read the details for you. For now, add them manually.
								</Text>
								<Pressable style={styles.linkButton} onPress={() => setCreationMode("manual")}>
									<Text style={styles.linkText}>Enter manually</Text>
								</Pressable>
							</View>
						) : (
							<ScrollView
								style={styles.scroll}
								contentContainerStyle={styles.form}
								keyboardShouldPersistTaps="handled"
								showsVerticalScrollIndicator={false}
							>
								<Field
									label={isTrain ? "Train number" : "Registration number"}
									error={errors.registrationNumber}
									hint="This is what matches you with other passengers"
								>
									<TextInput
										style={styles.input}
										placeholder={isTrain ? "e.g. 12723" : "e.g. TS07UB1234"}
										placeholderTextColor={theme.textMuted}
										value={registrationNumber}
										onChangeText={setRegistrationNumber}
										autoCapitalize="characters"
										maxLength={50}
									/>
								</Field>

								<Field label={isTrain ? "Train name (optional)" : "Bus name (optional)"}>
									<TextInput
										style={styles.input}
										placeholder={isTrain ? "e.g. Charminar Express" : "e.g. VRL Travels"}
										placeholderTextColor={theme.textMuted}
										value={serviceName}
										onChangeText={setServiceName}
										maxLength={120}
									/>
								</Field>

								<Field label="From" error={errors.source}>
									<PlaceInput
										key={`source-${formKey}`}
										value={source}
										onChange={setSource}
										placeholder="Search boarding point"
									/>
								</Field>

								<Field label="To" error={errors.destination}>
									<PlaceInput
										key={`destination-${formKey}`}
										value={destination}
										onChange={setDestination}
										placeholder="Search drop point"
									/>
								</Field>

								{isTrain ? (
									<Field label="PNR (optional)">
										<TextInput
											style={styles.input}
											placeholder="10-digit PNR"
											placeholderTextColor={theme.textMuted}
											value={pnr}
											onChangeText={setPnr}
											keyboardType="number-pad"
											maxLength={20}
										/>
									</Field>
								) : null}

								<Field label="Date of travel">
									{Platform.OS === "ios" ? (
										// "compact" is the small pill that opens its own overlay and closes
										// itself, so there is no visibility state to manage and it stays tiny.
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
														// Always dismiss: Android fires for both "set" and
														// "dismissed", and leaving it mounted keeps it on screen.
														setShowDatePicker(false);
														if (event.type === "set" && selected) setJourneyDate(selected);
													}}
												/>
											) : null}
										</>
									)}
								</Field>
								<Pressable
									style={[styles.submit, isPending && styles.submitDisabled]}
									onPress={handleSubmit}
									disabled={isPending}
								>
									<Text style={styles.submitText}>
										{isPending ? "Saving..." : "Create journey"}
									</Text>
								</Pressable>
							</ScrollView>
						)}
					</View>
				</KeyboardAvoidingView>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: theme.background + "CC", // 80% opacity
	},
	centerer: {
		flex: 1,
		justifyContent: "center",
		// The gaps that make this read as a dialog rather than a sheet.
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.xxl,
	},
	card: {
		// Never taller than the visible area, so the ScrollView inside always has a bound
		// to scroll within once the keyboard shrinks the frame.
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
		// Compact pickers stretch to fill by default; keep it to its natural pill width.
		alignSelf: "flex-start",
		marginLeft: -spacing.sm,
	},
	submit: {
		backgroundColor: brand.teal,
		borderRadius: radius.md,
		paddingVertical: spacing.md,
		alignItems: "center",
		marginTop: spacing.md,
	},
	submitDisabled: {
		opacity: 0.6,
	},
	submitText: {
		fontSize: typography.md,
		fontWeight: typography.bold,
		color: theme.white,
	},
	comingSoon: {
		alignItems: "center",
		gap: spacing.sm,
		paddingHorizontal: spacing.xl,
		paddingVertical: spacing.xxl,
	},
	comingSoonTitle: {
		fontSize: typography.md,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	comingSoonBody: {
		fontSize: typography.base,
		color: theme.textSecondary,
		textAlign: "center",
	},
	linkButton: {
		marginTop: spacing.sm,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
		borderRadius: radius.full,
		backgroundColor: brand.tealMuted,
	},
	linkText: {
		fontSize: typography.base,
		fontWeight: typography.bold,
		color: brand.tealDeep,
	},
});
