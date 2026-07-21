import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { brand, theme } from "../constants/theme";
import { useCurrentUser, useFirebaseAuth } from "../hooks/useUser";
import { OtpScreen } from "../screens/OtpScreen";
import { PhoneScreen } from "../screens/PhoneScreen";
import { ProfileCreation } from "../screens/Profile/ProfileCreation";
import { MainTabNavigator } from "./MainTabNavigator";

export type RootStackParamList = {
	Phone: undefined;
	Otp: undefined;
	/** The four-tab app shell, shown once onboarding is complete. */
	Main: undefined;
	Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
	const { uid, ready } = useFirebaseAuth();
	const { data: user, isLoading, isError } = useCurrentUser();

	// Hold the splash until we know both whether Firebase has a session and, if it does,
	// how far through onboarding that user is. Rendering earlier flashes the wrong screen.
	if (!ready || isLoading) {
		return (
			<View style={styles.splash}>
				<ActivityIndicator size="large" color={brand.teal} />
			</View>
		);
	}

	// isError covers a restored Firebase session whose backend user is gone or whose token
	// no longer verifies — both need the phone flow again, not a half-loaded Home.
	const signedIn = uid !== null && !isError && user !== undefined;

	return (
		<NavigationContainer>
			<Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
				{signedIn ? (
					user.onBoardingStatus === "profile_created" ? (
						<Stack.Screen name="Main" component={MainTabNavigator} />
					) : (
						<Stack.Screen name="Profile" component={ProfileCreation} />
					)
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

const styles = StyleSheet.create({
	splash: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.background,
	},
});
