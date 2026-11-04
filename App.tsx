import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { OverlayHost } from "./src/components/shared/OverlayHost";
import { queryClient } from "./src/lib/queryClient";
import { RootNavigator } from "./src/navigation/RootNavigator";
import "./global.css";

export default function App() {
	return (
		<SafeAreaProvider>
			<QueryClientProvider client={queryClient}>
				<RootNavigator />
				{/* Offline block and confirm dialogs, above every screen. */}
				<OverlayHost />
			</QueryClientProvider>
		</SafeAreaProvider>
	);
}
