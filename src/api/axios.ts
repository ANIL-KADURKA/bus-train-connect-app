import axios, { type AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { firebaseAuth } from "../lib/firebase";

/** Expo inlines EXPO_PUBLIC_* at build time, so this must be a literal member access. */
const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
	throw new Error(
		"Missing EXPO_PUBLIC_API_URL. Point it at the backend and restart the dev server with `--clear`.",
	);
}

export const api = axios.create({
	baseURL,
	timeout: 10_000,
	headers: {
		"Content-Type": "application/json",
		// ngrok's free tier serves an HTML interstitial to unknown user agents, which would
		// surface as a JSON parse failure rather than a real API error. This opts out.
		"ngrok-skip-browser-warning": "true",
	},
});

api.interceptors.request.use(
	async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
		const user = firebaseAuth.currentUser;
		// console.log("Current user in request interceptor:", user);

		if (user) {
			const token = await user.getIdToken();
			// console.log("Adding Authorization header with token:", token);
			if (config.headers instanceof AxiosHeaders) {
				config.headers.set("Authorization", `Bearer ${token}`);
			} else {
				config.headers = Object.assign({}, config.headers, {
					Authorization: `Bearer ${token}`,
				});
			}
		}

		if (config.data instanceof FormData) {
			if (config.headers instanceof AxiosHeaders) {
				config.headers.delete("Content-Type");
			} else if (config.headers) {
				delete (config.headers as Record<string, string>)["Content-Type"];
				delete (config.headers as Record<string, string>)["content-type"];
			}
		}

		return config;
	},
	(error: AxiosError): Promise<never> => Promise.reject(error),
);

api.interceptors.response.use(
	(response) => response,
	(error: AxiosError): Promise<never> => {
		// console.log("Response error:", error);
		if (error.response?.status === 401) {
			// console.log("Unauthorized");
		}
		return Promise.reject(error);
	},
);
