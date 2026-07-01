import { ERROR_CODES, ERROR_MESSAGES, ERROR_RESPONSE_MESSAGES } from "../constants/error.constants";
import type { ErrorCode } from "../types/error.type";

type ApiError = {
	response?: {
		data?: {
			code?: ErrorCode;
		};
	};
};

export function handleApiError(error: unknown) {
	let code: ErrorCode = ERROR_CODES.UNKNOWN;

	if (typeof error === "object" && error !== null && "response" in error) {
		const apiError = error as ApiError;
		code = apiError.response?.data?.code ?? ERROR_CODES.SERVER_ERROR;
	} else if (error instanceof Error && error.message === ERROR_RESPONSE_MESSAGES.NETWORK_ERROR) {
		code = ERROR_CODES.NETWORK_ERROR;
	}

	return {
		code,
		message: ERROR_MESSAGES[code],
	};
}
