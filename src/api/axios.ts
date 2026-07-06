import axios, { type AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { getAuth } from "firebase/auth";

export const api = axios.create({
	baseURL: "https://0cf1-2409-40f0-604f-20c4-90d2-ecf4-abca-ff43.ngrok-free.app",  
	timeout: 10_000,
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use(
	async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
		const user = getAuth().currentUser;
        console.log("Current user in request interceptor:", user);

		if (user) {
			const token = await user.getIdToken();
            console.log("Adding Authorization header with token:", token);
			if (config.headers instanceof AxiosHeaders) {
				config.headers.set("Authorization", `Bearer ${token}`);
			} else {
				config.headers = Object.assign({}, config.headers, {
					Authorization: `Bearer ${token}`,
				});
			}
		}
		return config;
	},
	(error: AxiosError): Promise<never> => Promise.reject(error),
);

api.interceptors.response.use(
	(response) => response,
	(error: any): Promise<never> => {
        console.log("Response error:", error);
		if (error.response?.status === 401) {
			console.log("Unauthorized");
		}
		return Promise.reject(error);
	},
);
