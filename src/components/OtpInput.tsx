import type React from "react";
import { useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const OTP_LEN = 6;

interface Props {
	value: string;
	onChange: (v: string) => void;
	disabled?: boolean;
}

export const OtpInput: React.FC<Props> = ({ value, onChange, disabled }) => {
	const ref = useRef<TextInput>(null);
	const digits = Array.from({ length: OTP_LEN }, (_, i) => value[i] ?? "");

	return (
		<Pressable
			onPress={() => ref.current?.focus()}
			className="flex-row gap-x-2 w-full justify-between"
		>
			{/* Hidden input captures real keystrokes */}
			<TextInput
				ref={ref}
				value={value}
				onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, OTP_LEN))}
				keyboardType="number-pad"
				maxLength={OTP_LEN}
				editable={!disabled}
				textContentType="oneTimeCode"
				autoComplete="sms-otp"
				className="absolute opacity-0 w-full h-full"
				autoFocus
			/>
			{digits.map((d, i) => {
				const active = i === value.length && !disabled;
				const filled = d !== "";
				const key = `otp-cell-${i + 1}-${d || "empty"}`;
				return (
					<View
						key={key}
						className={[
							"flex-1 h-14 rounded-2xl items-center justify-center border-2",
							filled
								? "border-violet-500 bg-violet-50"
								: active
									? "border-violet-400 bg-white"
									: "border-slate-200 bg-slate-50",
						].join(" ")}
					>
						{filled ? (
							<Text className="text-2xl font-bold text-slate-800">{d}</Text>
						) : active ? (
							<View className="w-0.5 h-5 bg-violet-500" />
						) : null}
					</View>
				);
			})}
		</Pressable>
	);
};
