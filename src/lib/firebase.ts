import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
// @ts-expect-error
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { Platform } from "react-native";

// Firebase configuration from android/app/google-services.json
const firebaseConfig = {
	apiKey: "AIzaSyAAZoaa4lw3Ru0hkq-vIx83n0-5xHHTyE8",
	authDomain: "bus-train-connect.firebaseapp.com",
	projectId: "bus-train-connect",
	storageBucket: "bus-train-connect.firebasestorage.app",
	messagingSenderId: "569375101829",
	appId: "1:569375101829:android:567d1faae78b0b407caaec",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth =
	Platform.OS !== "web"
		? getApps().length
			? getAuth(app)
			: initializeAuth(app, {
					persistence: getReactNativePersistence(AsyncStorage),
				})
		: getAuth(app);

export default app;
