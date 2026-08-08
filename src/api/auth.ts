import {
	type ApplicationVerifier,
	type ConfirmationResult,
	signInWithPhoneNumber,
} from "@firebase/auth";
import type { AuthUserDto } from "../dto/user.dto";
import { firebaseAuth } from "../lib/firebase";
import { api } from "./axios";

export const sendOtp = async ({
	phone,
	verifier,
}: {
	phone: string;
	verifier: ApplicationVerifier;
}): Promise<ConfirmationResult> => {
	return signInWithPhoneNumber(firebaseAuth, phone, verifier);
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
