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
};

export const ERROR_RESPONSE_MESSAGES = {
	[ERROR_CODES.NETWORK_ERROR]: "Network Error",
};
