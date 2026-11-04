import { isAxiosError } from "axios";
import { ERROR_CODES, ERROR_MESSAGES, getApiErrorCode } from "../constants/error.constants";
import type { ErrorCode } from "../types/error.type";

/**
 * The backend's own explanation when it gave one (Nest puts it in `message`, as a string
 * or a list of validation messages), otherwise the generic text for the error's code.
 * Use where the server's wording is the useful part, e.g. "They already sent you a request".
 */
export function getApiErrorMessage(error: unknown): string {
	if (isAxiosError(error)) {
		const message = (error.response?.data as { message?: unknown } | undefined)?.message;

		if (typeof message === "string" && message) return message;
		if (Array.isArray(message) && typeof message[0] === "string") return message[0];
	}

	return handleApiError(error).message;
}

export function handleApiError(error: unknown) {
	const code: ErrorCode = getApiErrorCode(error) ?? ERROR_CODES.UNKNOWN;

	return {
		code,
		message: ERROR_MESSAGES[code],
	};
}
