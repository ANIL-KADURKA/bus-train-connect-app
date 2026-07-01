import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { signOut } from "firebase/auth";
import React from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { auth } from "../lib/firebase";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../store/authStore";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Home"> };

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
	const { user, phone, reset } = useAuthStore();

	const handleSignOut = async () => {
		try {
			await signOut(auth);
			reset();
			navigation.replace("Phone");
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Something went wrong.";
			Alert.alert("Error", message);
		}
	};

	return (
		<View className="flex-1 bg-white">
			{/* Top */}
			<View
				className="bg-violet-600 rounded-b-[40px] pt-16 pb-12 px-6 items-center"
				style={{ gap: 8 }}
			>
				<View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center">
					<Text className="text-4xl">👤</Text>
				</View>
				<Text className="text-white text-xl font-bold">You're in!</Text>
				<View
					className="flex-row items-center bg-white/10 px-3 py-1 rounded-full"
					style={{ gap: 6 }}
				>
					<Text className="text-green-300 text-xs">●</Text>
					<Text className="text-white/80 text-sm">{phone || user?.phoneNumber}</Text>
				</View>
			</View>

			{/* Cards */}
			<View className="px-6 pt-8" style={{ gap: 12 }}>
				<View className="bg-slate-50 border border-slate-100 rounded-2xl p-4" style={{ gap: 4 }}>
					<Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
						User ID
					</Text>
					<Text
						className="text-slate-700 font-mono text-sm"
						numberOfLines={1}
						ellipsizeMode="middle"
					>
						{user?.uid ?? "—"}
					</Text>
				</View>

				<View className="bg-slate-50 border border-slate-100 rounded-2xl p-4" style={{ gap: 4 }}>
					<Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
						Phone
					</Text>
					<Text className="text-slate-700 text-sm font-medium">
						{user?.phoneNumber ?? phone ?? "—"}
					</Text>
				</View>

				<View
					className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex-row items-center"
					style={{ gap: 12 }}
				>
					<View className="w-9 h-9 bg-violet-600 rounded-full items-center justify-center">
						<Text className="text-white font-bold">✓</Text>
					</View>
					<View>
						<Text className="text-xs font-semibold text-violet-400 uppercase tracking-widest">
							Auth provider
						</Text>
						<Text className="text-violet-700 font-semibold text-sm">Firebase Phone Auth</Text>
					</View>
				</View>
			</View>

			{/* Sign out */}
			<View className="mt-auto px-6 pb-12">
				<Pressable
					onPress={handleSignOut}
					className="h-14 rounded-2xl items-center justify-center border border-rose-200 bg-rose-50"
				>
					<Text className="text-rose-600 font-bold text-base">Sign Out</Text>
				</Pressable>
			</View>
		</View>
	);
};
