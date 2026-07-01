import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import type React from "react";
import { useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { sendOtp } from "../api/auth";
import { TransitHero } from "../components/TrainBusHero";
import { ERROR_MESSAGES } from "../constants/error.constants";
import { default_country } from "../constants/phone.constants";
import { platform } from "../constants/platform.constants";
import { colors, radius, spacing, typography } from "../constants/theme";
import app from "../lib/firebase";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../store/authStore";
// import { handleRecaptcha } from "../utils/errorhandler.utils";
import { sanitizePhoneNumber, validatePhoneNumber } from "../utils/phone.utils";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Phone"> };

const country_code: string = default_country?.code;

export const PhoneScreen: React.FC<Props> = ({ navigation }) => {
	const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);
	const [phone, setPhone] = useState("");
	const { setConfirmation, setPhone: storePhone } = useAuthStore();

	const { mutate, isPending } = useMutation({
		mutationFn: sendOtp,
		onSuccess: (confirmation) => {
			setConfirmation(confirmation);
			storePhone(`${country_code}${phone}`);
			navigation.navigate("Otp");
		},
		onError: (e: Error) => Alert.alert("Error", e.message),
	});

	const canSend = validatePhoneNumber(phone, country_code);

	const handleSendOtp = () => {
		if (!recaptchaRef) {
			return Alert.alert("Error", ERROR_MESSAGES.RECAPTCHA_ERROR);
		}
		const recaptchaVerifier = recaptchaRef.current;
		if (!recaptchaVerifier) {
			return Alert.alert("Error", ERROR_MESSAGES.RECAPTCHA_ERROR);
		}
		mutate({
			phone: sanitizePhoneNumber(country_code, phone),
		});
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === platform.IOS ? "padding" : "height"}
			style={styles.root}
		>
			<FirebaseRecaptchaVerifierModal
				ref={recaptchaRef}
				firebaseConfig={app.options}
				attemptInvisibleVerification
			/>

			<ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
				{/* ── Animated hero ───────────────────────────────────── */}
				<TransitHero height={150} />

				{/* ── Hero text ───────────────────────────────────────── */}
				<View style={styles.heroText}>
					<View style={styles.appBadge}>
						<Text style={styles.appBadgeText}>Transit Connect</Text>
					</View>
					<Text style={styles.heroTitle}>Enter your number</Text>
					<Text style={styles.heroSub}>We'll send a one-time code via SMS</Text>
				</View>

				{/* ── Form ────────────────────────────────────────────── */}
				<View style={styles.form}>
					{/* Input label */}
					<Text style={styles.inputLabel}>Phone number</Text>

					{/* Phone row */}
					<View style={styles.phoneRow}>
						<Text style={styles.prefix}>{country_code}</Text>
						<View style={styles.divider} />
						<TextInput
							value={phone}
							onChangeText={setPhone}
							keyboardType="phone-pad"
							placeholder="98765 43210"
							placeholderTextColor={colors.textMuted}
							style={styles.phoneInput}
							maxLength={14}
							autoFocus
						/>
					</View>

					{/* CTA */}
					<Pressable
						onPress={handleSendOtp}
						disabled={!canSend || isPending}
						style={[styles.otpBtn, (!canSend || isPending) && styles.otpBtnDisabled]}
					>
						{isPending ? (
							<ActivityIndicator color={colors.navyDeep} />
						) : (
							<Text
								style={[styles.otpBtnText, !canSend && styles.otpBtnTextDisabled]}
							>
								Send OTP →
							</Text>
						)}
					</Pressable>

					{/* Disclaimer */}
					<Text style={styles.disclaimer}>
						By continuing, you agree to receive an SMS.{"\n"}Standard rates may apply.
					</Text>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: colors.navyDeep,
	},
	scroll: {
		flexGrow: 1,
	},

	// Hero text block
	heroText: {
		backgroundColor: colors.navyDeep,
		alignItems: "center",
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
	},
	appBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.tealMuted,
		borderWidth: 0.5,
		borderColor: colors.tealBorder,
		borderRadius: radius.full,
		paddingVertical: 3,
		paddingHorizontal: spacing.sm + 2,
		marginBottom: spacing.sm,
	},
	appBadgeText: {
		fontSize: typography.xs,
		color: colors.teal,
		fontWeight: typography.medium,
	},
	heroTitle: {
		fontSize: typography.lg,
		fontWeight: typography.medium,
		color: colors.textPrimary,
		letterSpacing: -0.3,
	},
	heroSub: {
		fontSize: typography.sm,
		color: colors.textSecondary,
		marginTop: 3,
	},

	// Form
	form: {
		flex: 1,
		backgroundColor: colors.navyCard,
		paddingHorizontal: spacing.md,
		paddingTop: spacing.md,
		paddingBottom: spacing.xl,
		gap: spacing.sm + 4,
	},
	inputLabel: {
		fontSize: typography.xs,
		fontWeight: typography.medium,
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: typography.wide,
		marginBottom: 2,
	},
	phoneRow: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255,255,255,0.04)",
		borderWidth: 0.5,
		borderColor: "rgba(255,255,255,0.09)",
		borderRadius: radius.md,
		paddingHorizontal: spacing.md,
		height: 48,
		gap: spacing.sm + 2,
	},
	prefix: {
		fontSize: typography.base,
		fontWeight: typography.medium,
		color: colors.textPrimary,
		opacity: 0.75,
	},
	divider: {
		width: 1,
		height: 20,
		backgroundColor: "rgba(255,255,255,0.10)",
	},
	phoneInput: {
		flex: 1,
		fontSize: typography.base,
		color: colors.textPrimary,
		fontWeight: typography.medium,
	},

	// Button
	otpBtn: {
		height: 48,
		borderRadius: radius.md,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.teal,
		marginTop: spacing.xs,
	},
	otpBtnDisabled: {
		backgroundColor: "rgba(255,255,255,0.06)",
	},
	otpBtnText: {
		fontSize: typography.base,
		fontWeight: typography.medium,
		color: colors.navyDeep,
	},
	otpBtnTextDisabled: {
		color: colors.textMuted,
	},

	// Disclaimer
	disclaimer: {
		fontSize: 9.5,
		color: colors.textMuted,
		textAlign: "center",
		lineHeight: 15,
		opacity: 0.75,
	},
});
