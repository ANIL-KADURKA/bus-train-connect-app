import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import type { ApplicationVerifier, ConfirmationResult } from "firebase/auth";
import type { FC } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { sendOtp, verifyOtp } from "../api/auth";
import { OtpInput } from "../components/OtpInput";
import { getFirebaseAuthErrorMessage } from "../constants/error.constants";
import { RESEND_SEC } from "../constants/otp.constants";
import { default_country } from "../constants/phone.constants";
import { platform } from "../constants/platform.constants";
import { brand, isDarkMode, radius, spacing, theme, typography } from "../constants/theme";
import app from "../lib/firebase";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../store/authStore";
import { sanitizePhoneNumber } from "../utils/phone.utils";

type Props = {
	navigation: NativeStackNavigationProp<RootStackParamList, "Otp">;
};

const country_code = default_country.code;

export const OtpScreen: FC<Props> = ({ navigation }) => {
	const [otp, setOtp] = useState("");
	const [countdown, setCountdown] = useState(RESEND_SEC);
	const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const { confirmation, phone, setUser, setConfirmation } = useAuthStore();

	const { mutate: resend, isPending: resending } = useMutation<
		ConfirmationResult,
		Error,
		{ phone: string; recaptchaVerifier: ApplicationVerifier }
	>({
		mutationFn: sendOtp,
		onSuccess: (c: ConfirmationResult) => {
			setConfirmation(c);
			setOtp("");
			startTimer();
		},
		onError: (e: Error) => Alert.alert("Resend failed", getFirebaseAuthErrorMessage(e)),
	});

	// Countdown
	const startTimer = useCallback(() => {
		// clear existing timer if any
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}

		setCountdown(RESEND_SEC);

		timerRef.current = setInterval(() => {
			setCountdown((c) => {
				if (c <= 1) {
					if (timerRef.current) {
						clearInterval(timerRef.current);
						timerRef.current = null;
					}
					return 0;
				}
				return c - 1;
			});
		}, 1000);
	}, []);

	useEffect(() => {
		startTimer();

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [startTimer]);

	const handleResendOtp = () => {
		const recaptchaVerifier = recaptchaRef.current;
		if (!recaptchaVerifier) {
			return Alert.alert("Error", "Recaptcha is not ready yet.");
		}

		resend({
			phone: sanitizePhoneNumber(country_code, phone),
			recaptchaVerifier,
		});
	};

	const handleChangeNumber = () => {
		if (navigation.canGoBack()) {
			navigation.goBack();
			return;
		}

		navigation.navigate("Phone");
	};

	const { mutate: verify, isPending: verifying } = useMutation({
		mutationFn: verifyOtp,
		onSuccess: (user) => {
			setUser(user);
		},
		onError: (e: Error) => {
			Alert.alert("Verification failed", getFirebaseAuthErrorMessage(e));
			setOtp("");
		},
	});

	useEffect(() => {
		if (otp.length === 6 && confirmation && !verifying) {
			verify({ confirmation, otp });
		}
	}, [otp, confirmation, verifying, verify]);

	const maskedPhone = phone
		? phone.replace(/(\+\d{1,3})(\d+)(\d{4})/, (_, a, b, c) => `${a}${"•".repeat(b.length)}${c}`)
		: "";

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
				<View style={styles.hero}>
					<Text style={styles.heroIcon}>🔐</Text>
					<Text style={styles.heroTitle}>Verify your number</Text>
					<Text style={styles.heroSub}>Code sent to {maskedPhone}</Text>
				</View>

				<View style={styles.content}>
					<View style={{ gap: 8 }}>
						<Text style={styles.label}>Enter 6-digit code</Text>
						<OtpInput value={otp} onChange={setOtp} disabled={verifying} />
					</View>
					{!verifying && (
						<Pressable
							onPress={() => confirmation && verify({ confirmation, otp })}
							disabled={otp.length < 6 || verifying}
							style={[
								styles.primaryButton,
								otp.length === 6 && !verifying
									? styles.primaryButtonActive
									: styles.primaryButtonIdle,
							]}
						>
							<Text
								style={
									otp.length === 6 ? styles.primaryButtonTextActive : styles.primaryButtonTextIdle
								}
							>
								Verify & Continue
							</Text>
						</Pressable>
					)}

					{verifying && (
						<View style={styles.status}>
							<Text style={styles.statusText}>Checking your code…</Text>
						</View>
					)}
					<View style={styles.footerBlock}>
						<Text style={styles.helperText}>Didn't get a code?</Text>
						{countdown > 0 ? (
							<Text style={styles.helperTextMuted}>
								Resend in <Text style={styles.helperCountdown}>{countdown}s</Text>
							</Text>
						) : (
							<Pressable onPress={handleResendOtp} disabled={resending} style={styles.resendButton}>
								{resending ? (
									<ActivityIndicator size="small" color={brand.tealDeep} />
								) : (
									<Text style={styles.resendText}>Resend OTP</Text>
								)}
							</Pressable>
						)}
					</View>
					<Pressable onPress={handleChangeNumber} style={styles.backButton}>
						<Text style={styles.backText}>← Change number</Text>
					</Pressable>
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
	hero: {
		backgroundColor: theme.card,
		height: 208,
		borderBottomLeftRadius: 40,
		borderBottomRightRadius: 40,
		alignItems: "center",
		justifyContent: "flex-end",
		paddingBottom: spacing.xl,
		paddingHorizontal: spacing.xl,
		borderBottomWidth: isDarkMode ? 0 : 1,
		borderBottomColor: theme.border,
	},
	heroIcon: {
		fontSize: 44,
		marginBottom: 4,
	},
	heroTitle: {
		fontSize: typography.xl,
		fontWeight: typography.bold,
		color: isDarkMode ? theme.white : theme.textPrimary,
	},
	heroSub: {
		fontSize: typography.sm,
		marginTop: 4,
		color: isDarkMode ? "#DDD6FE" : theme.textSecondary,
	},
	content: {
		flex: 1,
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.xl,
		gap: 24,
	},
	label: {
		fontSize: typography.xs,
		fontWeight: typography.bold,
		color: theme.textMuted,
		textTransform: "uppercase",
		letterSpacing: typography.wide,
	},
	primaryButton: {
		height: 56,
		borderRadius: radius.lg,
		alignItems: "center",
		justifyContent: "center",
	},
	primaryButtonActive: {
		backgroundColor: brand.teal,
	},
	primaryButtonIdle: {
		backgroundColor: theme.card,
		borderWidth: 1,
		borderColor: theme.border,
	},
	primaryButtonTextActive: {
		color: theme.white,
		fontSize: typography.base,
		fontWeight: typography.bold,
	},
	primaryButtonTextIdle: {
		color: theme.textMuted,
		fontSize: typography.base,
		fontWeight: typography.bold,
	},
	inlineCenter: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	status: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.surface,
		borderRadius: radius.md,
		padding: spacing.sm + 1,
	},
	statusText: {
		color: theme.textSecondary,
		fontSize: typography.sm,
		fontWeight: typography.medium,
	},
	footerBlock: {
		alignItems: "center",
		gap: 4,
	},
	helperText: {
		color: theme.textSecondary,
		fontSize: typography.sm,
	},
	helperTextMuted: {
		color: theme.textMuted,
		fontSize: typography.sm,
	},
	helperCountdown: {
		fontWeight: typography.bold,
		color: isDarkMode ? "#A78BFA" : brand.tealDeep,
	},
	resendButton: {
		paddingHorizontal: spacing.md,
		paddingVertical: 6,
		borderRadius: radius.full,
		backgroundColor: theme.surface,
	},
	resendText: {
		color: isDarkMode ? "#C4B5FD" : brand.tealDeep,
		fontSize: typography.sm,
		fontWeight: typography.medium,
	},
	backButton: {
		alignItems: "center",
		paddingVertical: 8,
	},
	backText: {
		color: theme.textMuted,
		fontSize: typography.sm,
	},
});
