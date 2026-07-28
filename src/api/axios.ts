import axios, { type AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { firebaseAuth } from "../lib/firebase";

export const api = axios.create({
	baseURL: "https://cb08-2409-40f0-6053-fb25-c470-4593-e02d-8305.ngrok-free.app",
	timeout: 10_000,
	headers: {
		"Content-Type": "application/json",
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
