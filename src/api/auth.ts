import {
	type ApplicationVerifier,
	type ConfirmationResult,
	signInWithPhoneNumber,
} from "firebase/auth";
import type { AuthUserDto } from "../dto/user.dto";
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
	confirmation: ConfirmationResult;
	otp: string;
}): Promise<AuthUserDto> => {
	await confirmation.confirm(otp);

	return login();
};

/** Creates the backend user on first call, returns the existing one afterwards. */
export const login = async (): Promise<AuthUserDto> => {
	const { data } = await api.post<AuthUserDto>("/auth/login");

	return data;
};

export const getCurrentUser = async (): Promise<AuthUserDto> => {
	const { data } = await api.get<AuthUserDto>("/auth/me");

	return data;
};
