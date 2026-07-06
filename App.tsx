import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { queryClient } from "./src/lib/queryClient";
import { RootNavigator } from "./src/navigation/RootNavigator";
import "./global.css";

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<RootNavigator />
		</QueryClientProvider>
	);
}
