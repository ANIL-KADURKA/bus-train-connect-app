import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { ChatsScreen } from "../screens/Chats/ChatsScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ParcelsScreen } from "../screens/Parcels/ParcelsScreen";
import { ProfileScreen } from "../screens/Profile/ProfileScreen";
import { BottomTabBar } from "./BottomTabBar";

export type MainTabParamList = {
	Home: undefined;
	Chats: undefined;
	Parcels: undefined;
	Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator = () => (
	<Tab.Navigator
		screenOptions={{ headerShown: false }}
		tabBar={(props) => <BottomTabBar {...props} />}
	>
		<Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
		<Tab.Screen name="Chats" component={ChatsScreen} options={{ title: "Chats" }} />
		<Tab.Screen name="Parcels" component={ParcelsScreen} options={{ title: "Parcels" }} />
		<Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
	</Tab.Navigator>
);
