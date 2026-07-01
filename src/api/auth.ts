import {
	type ApplicationVerifier,
	type ConfirmationResult,
	signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "../lib/firebase";

export const sendOtp = async ({
	phone,
	recaptchaVerifier,
}: {
	phone: string;
	recaptchaVerifier: ApplicationVerifier;
}): Promise<ConfirmationResult> => {
	return signInWithPhoneNumber(auth, phone, recaptchaVerifier);
};

export const verifyOtp = async ({
	confirmation,
	otp,
}: {
	confirmation: Awaited<ReturnType<typeof sendOtp>>;
	otp: string;
}) => {
	const result = await confirmation.confirm(otp);
	return result?.user ?? null;
};
