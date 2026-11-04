import NetInfo from "@react-native-community/netinfo";
import { onlineManager, QueryClient } from "@tanstack/react-query";

// React Query assumes a browser's online/offline events, which React Native doesn't have.
// Feeding it NetInfo means requests pause while offline instead of failing, and every
// stale query refetches the moment the connection comes back.
onlineManager.setEventListener((setOnline) =>
	NetInfo.addEventListener((state) => {
		setOnline(state.isConnected !== false && state.isInternetReachable !== false);
	}),
);

export const queryClient = new QueryClient({
	defaultOptions: {
		mutations: { retry: 0 },
		queries: { retry: 1, staleTime: 1000 * 60 * 5 },
	},
});
