import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import type { Persistence } from "firebase/auth";

type ReactNativeAsyncStorage = {
	getItem: (key: string) => Promise<string | null> | string | null;
	setItem: (key: string, value: string) => Promise<void> | void;
	removeItem: (key: string) => Promise<void> | void;
};

type ReactNativeAuthModule = {
	getAuth: (app?: unknown) => ReturnType<typeof import("firebase/auth").getAuth>;
	initializeAuth: (app: unknown, options?: { persistence?: Persistence | Persistence[] }) => ReturnType<typeof import("firebase/auth").initializeAuth>;
	getReactNativePersistence: (storage: ReactNativeAsyncStorage) => Persistence;
};

const rnAuth = require("../../node_modules/@firebase/auth/dist/rn/index.js") as ReactNativeAuthModule;

const { getAuth, initializeAuth, getReactNativePersistence } = rnAuth;

const firebaseConfig = {
	apiKey: "AIzaSyBKkPxmyBUbTBrFiQA2JusLFOBXGQKVzKg",
	authDomain: "hi-bus-connect.firebaseapp.com",
	projectId: "hi-bus-connect",
	storageBucket: "hi-bus-connect.firebasestorage.app",
	messagingSenderId: "1023987061561",
	appId: "1:1023987061561:android:cb90f60f269901088f0ee8",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = (() => {
	try {
		return initializeAuth(app, {
			persistence: getReactNativePersistence(AsyncStorage),
		});
	} catch {
		return getAuth(app);
	}
})();

export default app;
