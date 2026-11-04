import { ERROR_CODES, ERROR_MESSAGES, getApiErrorCode } from "../constants/error.constants";
import type { ErrorCode } from "../types/error.type";

export function handleApiError(error: unknown) {
	const code: ErrorCode = getApiErrorCode(error) ?? ERROR_CODES.UNKNOWN;

	return {
		code,
		message: ERROR_MESSAGES[code],
	};
}
