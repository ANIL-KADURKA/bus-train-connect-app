import React, { type ComponentRef, useRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { brand, isDarkMode, radius, theme } from "../constants/theme";

const OTP_LEN = 6;

interface Props {
	value: string;
	onChange: (v: string) => void;
	disabled?: boolean;
}

export const OtpInput: React.FC<Props> = ({ value, onChange, disabled }) => {
	const ref = useRef<ComponentRef<typeof TextInput>>(null);
	const digits = Array.from({ length: OTP_LEN }, (_, i) => value[i] ?? "");

	return (
		<Pressable onPress={() => ref.current?.focus()} style={styles.row}>
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
				style={styles.hiddenInput}
				autoFocus
			/>
			{digits.map((d, i) => {
				const active = i === value.length && !disabled;
				const filled = d !== "";
				const key = `otp-cell-${i + 1}-${d || "empty"}`;
				return (
					<View
						key={key}
						style={[styles.cell, filled ? styles.filled : active ? styles.active : styles.empty]}
					>
						{filled ? (
							<Text style={styles.digit}>{d}</Text>
						) : active ? (
							<View style={styles.caret} />
						) : null}
					</View>
				);
			})}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		gap: 8,
		width: "100%",
		justifyContent: "space-between",
	},
	hiddenInput: {
		position: "absolute",
		opacity: 0,
		width: "100%",
		height: "100%",
	},
	cell: {
		flex: 1,
		height: 56,
		borderRadius: radius.lg,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
	},
	filled: {
		borderColor: brand.teal,
		backgroundColor: isDarkMode ? "rgba(0,201,167,0.10)" : "#E7FBF7",
	},
	active: {
		borderColor: theme.background,
		backgroundColor: theme.card,
	},
	empty: {
		borderColor: theme.border,
		backgroundColor: theme.surface,
	},
	digit: {
		fontSize: 24,
		fontWeight: "700",
		color: theme.textPrimary,
	},
	caret: {
		width: 2,
		height: 20,
		backgroundColor: theme.background,
	},
});
