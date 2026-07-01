import type { ERROR_CODES } from "../constants/error.constants";

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
