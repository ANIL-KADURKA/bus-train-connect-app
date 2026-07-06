import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import type { ApplicationVerifier, ConfirmationResult } from "firebase/auth";
import type { FC } from "react";
import React, { useRef, useState } from "react";
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
import { getFirebaseAuthErrorMessage } from "../constants/error.constants";
import { default_country } from "../constants/phone.constants";
import { platform } from "../constants/platform.constants";
import { brand, isDarkMode, radius, spacing, theme, typography } from "../constants/theme";
import app from "../lib/firebase";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../store/authStore";
import { sanitizePhoneNumber, validatePhoneNumber } from "../utils/phone.utils";

type Props = {
	navigation: NativeStackNavigationProp<RootStackParamList, "Phone">;
};

const country_code = default_country.code;

export const PhoneScreen: FC<Props> = ({ navigation }) => {
	const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);
	const [phone, setPhone] = useState("");
	const { setConfirmation, setPhone: storePhone } = useAuthStore();

	const { mutate, isPending } = useMutation<
		ConfirmationResult,
		Error,
		{ phone: string; recaptchaVerifier: ApplicationVerifier }
	>({
		mutationFn: sendOtp,
		onSuccess: (confirmation: ConfirmationResult, variables) => {
			setConfirmation(confirmation);
			storePhone(variables.phone);
			navigation.navigate("Otp");
		},
		onError: (e: Error) => {
			Alert.alert("Error", getFirebaseAuthErrorMessage(e));
		},
	});

	const canSend = validatePhoneNumber(phone, country_code);

	const handleSendOtp = () => {
		const recaptchaVerifier = recaptchaRef.current;
		if (!recaptchaVerifier) {
			return Alert.alert("Error", "Recaptcha is not ready yet.");
		}

		mutate({
			phone: sanitizePhoneNumber(country_code, phone),
			recaptchaVerifier,
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
				<TransitHero height={150} />
				<View style={styles.heroText}>
					<View style={styles.appBadge}>
						<Text style={styles.appBadgeText}>Transit Connect</Text>
					</View>
					<Text style={styles.heroTitle}>Enter your number</Text>
					<Text style={styles.heroSub}>We'll send a one-time code via SMS</Text>
				</View>
				<View style={styles.form}>
					<Text style={styles.inputLabel}>Phone number</Text>
					<View style={styles.phoneRow}>
						<Text style={styles.prefix}>{country_code}</Text>
						<View style={styles.divider} />
						<TextInput
							value={phone}
							onChangeText={setPhone}
							keyboardType="phone-pad"
							placeholder="98765 43210"
							placeholderTextColor={theme.textMuted}
							style={styles.phoneInput}
							maxLength={14}
							autoFocus
						/>
					</View>
					<Pressable
						onPress={handleSendOtp}
						disabled={!canSend || isPending}
						style={[styles.otpBtn, (!canSend || isPending) && styles.otpBtnDisabled]}
					>
						{isPending ? (
							<ActivityIndicator color={theme.textPrimary} />
						) : (
							<Text style={[styles.otpBtnText, !canSend && styles.otpBtnTextDisabled]}>
								Send OTP →
							</Text>
						)}
					</Pressable>
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
		backgroundColor: theme.background,
	},
	scroll: {
		flexGrow: 1,
	},

	heroText: {
		backgroundColor: theme.background,
		alignItems: "center",
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
	},
	appBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: brand.tealMuted,
		borderWidth: 0.5,
		borderColor: brand.tealBorder,
		borderRadius: radius.full,
		paddingVertical: 3,
		paddingHorizontal: spacing.sm + 2,
		marginBottom: spacing.sm,
	},
	appBadgeText: {
		fontSize: typography.xs,
		color: brand.teal,
		fontWeight: typography.medium,
	},
	heroTitle: {
		fontSize: typography.lg,
		fontWeight: typography.medium,
		color: theme.textPrimary,
		letterSpacing: -0.3,
	},
	heroSub: {
		fontSize: typography.sm,
		color: theme.textSecondary,
		marginTop: 3,
	},
	form: {
		flex: 1,
		backgroundColor: theme.background,
		paddingHorizontal: spacing.md,
		paddingTop: spacing.md,
		paddingBottom: spacing.xl,
		gap: spacing.sm + 4,
	},
	inputLabel: {
		fontSize: typography.xs,
		fontWeight: typography.medium,
		color: theme.textMuted,
		textTransform: "uppercase",
		letterSpacing: typography.wide,
		marginBottom: 2,
	},
	phoneRow: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.inputBackground,
		borderWidth: 0.5,
		borderColor: theme.inputBorder,
		borderRadius: radius.md,
		paddingHorizontal: spacing.md,
		height: 48,
		gap: spacing.sm + 2,
	},
	prefix: {
		fontSize: typography.base,
		fontWeight: typography.medium,
		color: theme.textPrimary,
		opacity: 0.75,
	},
	divider: {
		width: 1,
		height: 20,
		backgroundColor: theme.divider,
	},
	phoneInput: {
		flex: 1,
		fontSize: typography.base,
		color: theme.textPrimary,
		fontWeight: typography.medium,
	},
	otpBtn: {
		height: 48,
		borderRadius: radius.md,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: isDarkMode ? theme.background : brand.teal,
		marginTop: spacing.xs,
	},
	otpBtnDisabled: {
		backgroundColor: theme.inputBackground,
	},
	otpBtnText: {
		fontSize: typography.base,
		fontWeight: typography.medium,
		color: isDarkMode ? theme.textPrimary : theme.white,
	},
	otpBtnTextDisabled: {
		color: theme.textMuted,
	},
	disclaimer: {
		fontSize: 9.5,
		color: theme.textMuted,
		textAlign: "center",
		lineHeight: 15,
		opacity: 0.75,
	},
});
