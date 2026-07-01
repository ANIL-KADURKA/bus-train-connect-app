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
	Text,
	View,
} from "react-native";
import { sendOtp, verifyOtp } from "../api/auth";
import { OtpInput } from "../components/OtpInput";
import { RESEND_SEC } from "../constants/otp.constants";
import { default_country } from "../constants/phone.constants";
import { platform } from "../constants/platform.constants";
import app from "../lib/firebase";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../store/authStore";
import { sanitizePhoneNumber } from "../utils/phone.utils";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Otp"> };

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
		onError: (e: Error) => Alert.alert("Resend failed", e.message),
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

	// Verify
	const { mutate: verify, isPending: verifying } = useMutation({
		mutationFn: verifyOtp,
		onSuccess: (user) => {
			setUser(user);
			navigation.replace("Home");
		},
		onError: (e: Error) => {
			Alert.alert("Wrong code", e.message);
			setOtp("");
		},
	});

	// Resend

	// Auto-submit on 6 digits
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
			className="flex-1 bg-white"
		>
			<FirebaseRecaptchaVerifierModal
				ref={recaptchaRef}
				firebaseConfig={app.options}
				attemptInvisibleVerification
			/>

			<ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
				{/* Hero */}
				<View className="bg-violet-600 h-52 rounded-b-[40px] items-center justify-end pb-8 px-6">
					<Text className="text-5xl mb-2">🔐</Text>
					<Text className="text-white text-2xl font-bold">Verify your number</Text>
					<Text className="text-violet-200 text-sm mt-1">Code sent to {maskedPhone}</Text>
				</View>

				<View className="flex-1 px-6 pt-8" style={{ gap: 24 }}>
					{/* OTP boxes */}
					<View style={{ gap: 8 }}>
						<Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
							Enter 6-digit code
						</Text>
						<OtpInput value={otp} onChange={setOtp} disabled={verifying} />
					</View>

					{/* Verify button */}
					<Pressable
						onPress={() => confirmation && verify({ confirmation, otp })}
						disabled={otp.length < 6 || verifying}
						className={[
							"h-14 rounded-2xl items-center justify-center",
							otp.length === 6 && !verifying ? "bg-violet-600" : "bg-slate-100",
						].join(" ")}
					>
						{verifying ? (
							<View className="flex-row items-center" style={{ gap: 8 }}>
								<ActivityIndicator color="#fff" />
								<Text className="text-white font-bold">Verifying…</Text>
							</View>
						) : (
							<Text
								className={
									otp.length === 6
										? "text-white font-bold text-base"
										: "text-slate-400 font-bold text-base"
								}
							>
								Verify & Continue
							</Text>
						)}
					</Pressable>

					{/* Verifying status */}
					{verifying && (
						<View
							className="flex-row items-center justify-center bg-violet-50 rounded-xl p-3"
							style={{ gap: 8 }}
						>
							<Text className="text-violet-600 text-sm font-medium">Checking your code…</Text>
						</View>
					)}

					{/* Resend */}
					<View className="items-center" style={{ gap: 4 }}>
						<Text className="text-slate-500 text-sm">Didn't get a code?</Text>
						{countdown > 0 ? (
							<Text className="text-slate-400 text-sm">
								Resend in <Text className="font-bold text-violet-500">{countdown}s</Text>
							</Text>
						) : (
							<Pressable
								onPress={handleResendOtp}
								disabled={resending}
								className="px-4 py-1.5 rounded-full bg-violet-50"
							>
								{resending ? (
									<ActivityIndicator size="small" color="#7c3aed" />
								) : (
									<Text className="text-violet-600 font-semibold text-sm">Resend OTP</Text>
								)}
							</Pressable>
						)}
					</View>

					{/* Back */}
					<Pressable onPress={() => navigation.goBack()} className="items-center py-2">
						<Text className="text-slate-400 text-sm">← Change number</Text>
					</Pressable>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};
