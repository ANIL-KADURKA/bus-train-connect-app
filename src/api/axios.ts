import axios, { type AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { getAuth } from "firebase/auth";

export const api = axios.create({
	baseURL: "https://7312-2409-40f0-600c-be63-40d2-83d7-64f1-dfa4.ngrok-free.app",  
	timeout: 10_000,
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use(
	async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
		const user = getAuth().currentUser;
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
	(error: any): Promise<never> => {
        // console.log("Response error:", error);
		if (error.response?.status === 401) {
			// console.log("Unauthorized");
		}
		return Promise.reject(error);
	},
);
