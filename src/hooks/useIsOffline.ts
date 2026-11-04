import NetInfo, { useNetInfo } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

/**
 * A blip shorter than this (switching Wi-Fi to mobile data, a lift) shouldn't throw a
 * full-screen block at the user; a real outage outlasts it easily.
 */
const OFFLINE_GRACE_MS = 1500;

/**
 * True once the device has been without internet for a moment. `isInternetReachable` is
 * null until NetInfo's first probe finishes, so null counts as online — the app should
 * never open on an "offline" screen just because it hasn't checked yet.
 */
export const useIsOffline = (): { offline: boolean; retry: () => void } => {
	const { isConnected, isInternetReachable } = useNetInfo();
	const disconnected = isConnected === false || isInternetReachable === false;
	const [offline, setOffline] = useState(false);

	useEffect(() => {
		if (!disconnected) {
			// Back online: drop the block immediately.
			setOffline(false);
			return;
		}

		const timer = setTimeout(() => setOffline(true), OFFLINE_GRACE_MS);
		return () => clearTimeout(timer);
	}, [disconnected]);

	return {
		offline,
		// Re-probes now instead of waiting for NetInfo's next periodic check.
		retry: () => {
			void NetInfo.refresh();
		},
	};
};
