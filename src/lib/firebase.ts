import { getAuth, getReactNativePersistence, initializeAuth } from "@firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";

export const firebaseConfig = {
	apiKey: "AIzaSyBKkPxmyBUbTBrFiQA2JusLFOBXGQKVzKg",
	authDomain: "hi-bus-connect.firebaseapp.com",
	projectId: "hi-bus-connect",
	storageBucket: "hi-bus-connect.firebasestorage.app",
	messagingSenderId: "1023987061561",
	appId: "1:1023987061561:android:cb90f60f269901088f0ee8",
};

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const createFirebaseAuth = () => {
	try {
		return initializeAuth(firebaseApp, {
			persistence: getReactNativePersistence(AsyncStorage),
		});
	} catch {
		return getAuth(firebaseApp);
	}
};

export const firebaseAuth = createFirebaseAuth();
