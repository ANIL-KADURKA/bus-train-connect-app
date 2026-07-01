import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		mutations: { retry: 0 },
		queries: { retry: 1, staleTime: 1000 * 60 * 5 },
	},
});
