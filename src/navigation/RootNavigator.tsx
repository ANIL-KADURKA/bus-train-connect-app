import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect } from "react";

import { auth } from "../lib/firebase";
import { HomeScreen } from "../screens/HomeScreen";
import { OtpScreen } from "../screens/OtpScreen";
import { PhoneScreen } from "../screens/PhoneScreen";
import { useAuthStore } from "../store/authStore";

export type RootStackParamList = {
	Phone: undefined;
	Otp: undefined;
	Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
	const { user, setUser } = useAuthStore();

	// Keep Zustand in sync with Firebase auth state
	useEffect(() => {
		const unsub = onAuthStateChanged(auth, (u: User | null) => setUser(u));
		return unsub;
	}, [setUser]);

	return (
		<NavigationContainer>
			<Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
				{user ? (
					<Stack.Screen name="Home" component={HomeScreen} />
				) : (
					<>
						<Stack.Screen name="Phone" component={PhoneScreen} />
						<Stack.Screen name="Otp" component={OtpScreen} />
					</>
				)}
			</Stack.Navigator>
		</NavigationContainer>
	);
};
