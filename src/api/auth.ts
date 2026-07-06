import {
	type ApplicationVerifier,
	type ConfirmationResult,
	signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { api } from "./axios";

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
	await confirmation.confirm(otp);
	return login();
};

export const login = async () => {
	try {
		const { data } = await api.post("/auth/login");
		return data;
	} catch (error) {
		console.error("Login failed:", error);
		throw error;
	}
};

export const getCurrentUser = async () => {
	const { data } = await api.get("/auth/me");
	console.log("Current user:", data);
	return data;
};
