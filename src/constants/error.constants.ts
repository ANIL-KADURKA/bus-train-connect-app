export const ERROR_CODES = {
	INVALID_PHONE: "INVALID_PHONE",
	INVALID_OTP: "INVALID_OTP",
	OTP_EXPIRED: "OTP_EXPIRED",
	USER_NOT_FOUND: "USER_NOT_FOUND",

	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",

	NETWORK_ERROR: "NETWORK_ERROR",
	SERVER_ERROR: "SERVER_ERROR",

	UNKNOWN: "UNKNOWN",
	RECAPTCHA_ERROR: "RECAPTCHA_ERROR",

	AUTH_INVALID_APP_CREDENTIAL: "auth/invalid-app-credential",
	AUTH_INVALID_PHONE_NUMBER: "auth/invalid-phone-number",
	AUTH_MISSING_PHONE_NUMBER: "auth/missing-phone-number",
	AUTH_QUOTA_EXCEEDED: "auth/quota-exceeded",
	AUTH_CAPTCHA_CHECK_FAILED: "auth/captcha-check-failed",
	AUTH_TOO_MANY_REQUESTS: "auth/too-many-requests",
	AUTH_NETWORK_REQUEST_FAILED: "auth/network-request-failed",
	AUTH_INTERNAL_ERROR: "auth/internal-error",
	AUTH_APP_NOT_AUTHORIZED: "auth/app-not-authorized",
	AUTH_OPERATION_NOT_ALLOWED: "auth/operation-not-allowed",
	AUTH_MISSING_APP_CREDENTIAL: "auth/missing-app-credential",
	AUTH_CODE_EXPIRED: "auth/code-expired",
	AUTH_INVALID_VERIFICATION_CODE: "auth/invalid-verification-code",
	AUTH_INVALID_VERIFICATION_ID: "auth/invalid-verification-id",
	AUTH_SESSION_EXPIRED: "auth/session-expired",
	AUTH_MISSING_VERIFICATION_CODE: "auth/missing-verification-code",
	AUTH_MISSING_VERIFICATION_ID: "auth/missing-verification-id",
} as const;

export const ERROR_MESSAGES = {
	[ERROR_CODES.INVALID_PHONE]: "Please enter a valid phone number",

	[ERROR_CODES.INVALID_OTP]: "Invalid OTP. Please try again",

	[ERROR_CODES.OTP_EXPIRED]: "OTP expired. Request a new one",

	[ERROR_CODES.USER_NOT_FOUND]: "User account not found",

	[ERROR_CODES.UNAUTHORIZED]: "Session expired. Please login again",

	[ERROR_CODES.FORBIDDEN]: "You don't have permission",

	[ERROR_CODES.NETWORK_ERROR]: "Check your internet connection",

	[ERROR_CODES.SERVER_ERROR]: "Something went wrong. Try again later",

	[ERROR_CODES.UNKNOWN]: "Unexpected error occurred",

	[ERROR_CODES.RECAPTCHA_ERROR]: "reCAPTCHA is not ready yet. Please try again.",

	[ERROR_CODES.AUTH_INVALID_APP_CREDENTIAL]: "App verification failed. Please try again.",
	[ERROR_CODES.AUTH_INVALID_PHONE_NUMBER]: "Please enter a valid phone number.",
	[ERROR_CODES.AUTH_MISSING_PHONE_NUMBER]: "Please enter a phone number.",
	[ERROR_CODES.AUTH_QUOTA_EXCEEDED]: "SMS quota exceeded. Please try again later.",
	[ERROR_CODES.AUTH_CAPTCHA_CHECK_FAILED]: "reCAPTCHA verification failed. Please try again.",
	[ERROR_CODES.AUTH_TOO_MANY_REQUESTS]: "Too many requests. Please wait and try again.",
	[ERROR_CODES.AUTH_NETWORK_REQUEST_FAILED]: "Network error. Check your internet connection.",
	[ERROR_CODES.AUTH_INTERNAL_ERROR]: "Temporary Firebase issue. Please try again.",
	[ERROR_CODES.AUTH_APP_NOT_AUTHORIZED]: "App isn't authorized. Please check Firebase config.",
	[ERROR_CODES.AUTH_OPERATION_NOT_ALLOWED]: "Phone authentication is disabled in Firebase.",
	[ERROR_CODES.AUTH_MISSING_APP_CREDENTIAL]: "Missing app credential. Please try again.",
	[ERROR_CODES.AUTH_CODE_EXPIRED]: "OTP expired. Request a new code.",
	[ERROR_CODES.AUTH_INVALID_VERIFICATION_CODE]: "Incorrect OTP. Please try again.",
	[ERROR_CODES.AUTH_INVALID_VERIFICATION_ID]:
		"Verification session is invalid. Please request a new OTP.",
	[ERROR_CODES.AUTH_SESSION_EXPIRED]: "Verification session expired. Request a new OTP.",
	[ERROR_CODES.AUTH_MISSING_VERIFICATION_CODE]: "Please enter the OTP.",
	[ERROR_CODES.AUTH_MISSING_VERIFICATION_ID]: "Verification session missing. Request a new OTP.",
};

export const ERROR_RESPONSE_MESSAGES = {
	[ERROR_CODES.NETWORK_ERROR]: "Network Error",
};

const FIREBASE_AUTH_ERROR_CODES = [
	ERROR_CODES.AUTH_INVALID_APP_CREDENTIAL,
	ERROR_CODES.AUTH_INVALID_PHONE_NUMBER,
	ERROR_CODES.AUTH_MISSING_PHONE_NUMBER,
	ERROR_CODES.AUTH_QUOTA_EXCEEDED,
	ERROR_CODES.AUTH_CAPTCHA_CHECK_FAILED,
	ERROR_CODES.AUTH_TOO_MANY_REQUESTS,
	ERROR_CODES.AUTH_NETWORK_REQUEST_FAILED,
	ERROR_CODES.AUTH_INTERNAL_ERROR,
	ERROR_CODES.AUTH_APP_NOT_AUTHORIZED,
	ERROR_CODES.AUTH_OPERATION_NOT_ALLOWED,
	ERROR_CODES.AUTH_MISSING_APP_CREDENTIAL,
	ERROR_CODES.AUTH_CODE_EXPIRED,
	ERROR_CODES.AUTH_INVALID_VERIFICATION_CODE,
	ERROR_CODES.AUTH_INVALID_VERIFICATION_ID,
	ERROR_CODES.AUTH_SESSION_EXPIRED,
	ERROR_CODES.AUTH_MISSING_VERIFICATION_CODE,
	ERROR_CODES.AUTH_MISSING_VERIFICATION_ID,
] as const;

type FirebaseAuthErrorCode = (typeof FIREBASE_AUTH_ERROR_CODES)[number];

const isFirebaseAuthErrorCode = (code: string): code is FirebaseAuthErrorCode =>
	(FIREBASE_AUTH_ERROR_CODES as readonly string[]).includes(code);

export const getFirebaseAuthErrorCode = (error: unknown): FirebaseAuthErrorCode | undefined => {
	if (typeof error !== "object" || error === null || !("code" in error)) {
		return undefined;
	}

	const code = (error as { code?: unknown }).code;
	return typeof code === "string" && isFirebaseAuthErrorCode(code) ? code : undefined;
};

export const getFirebaseAuthErrorMessage = (error: unknown): string => {
	const code = getFirebaseAuthErrorCode(error);
	return code ? ERROR_MESSAGES[code] : ERROR_MESSAGES[ERROR_CODES.UNKNOWN];
};
