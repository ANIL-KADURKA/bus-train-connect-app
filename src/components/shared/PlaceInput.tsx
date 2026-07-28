import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { radius, spacing, theme, typography } from "../../constants/theme";

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

/** Expo inlines EXPO_PUBLIC_* at build time. */
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

interface Suggestion {
	placeId: string;
	text: string;
}

interface AutocompleteResponse {
	suggestions?: {
		placePrediction?: {
			placeId?: string;
			text?: { text?: string };
		};
	}[];
}

const fetchSuggestions = async (input: string): Promise<Suggestion[]> => {
	const response = await fetch(AUTOCOMPLETE_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Goog-Api-Key": API_KEY ?? "",
		},
		// Restrict suggestions to Indian cities.
		body: JSON.stringify({
			input,
			includedPrimaryTypes: ["(cities)"],
			includedRegionCodes: ["in"],
		}),
	});

	if (!response.ok) {
		throw new Error(`Places request failed (${response.status})`);
	}

	const data = (await response.json()) as AutocompleteResponse;

	return (data.suggestions ?? [])
		.map((item) => ({
			placeId: item.placePrediction?.placeId ?? "",
			text: item.placePrediction?.text?.text ?? "",
		}))
		.filter((item) => item.text.length > 0);
};

interface PlaceInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
}

/**
 * Google Places autocomplete for Indian cities.
 */
export const PlaceInput: React.FC<PlaceInputProps> = ({ value, onChange, placeholder }) => {
	const [query, setQuery] = useState(value);
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// Set when the user picks a suggestion, so we don't immediately re-search that text.
	const justSelected = useRef(false);

	useEffect(() => {
		if (justSelected.current) {
			justSelected.current = false;
			return;
		}

		if (query.trim().length < MIN_QUERY_LENGTH) {
			setSuggestions([]);
			return;
		}

		if (!API_KEY) {
			setError("Missing EXPO_PUBLIC_GOOGLE_PLACES_API_KEY");
			return;
		}

		let cancelled = false;
		const timer = setTimeout(() => {
			setLoading(true);
			setError(null);

			fetchSuggestions(query.trim())
				.then((results) => {
					if (!cancelled) setSuggestions(results);
				})
				.catch((cause: unknown) => {
					if (!cancelled) {
						setError(cause instanceof Error ? cause.message : "Could not search places");
					}
				})
				.finally(() => {
					if (!cancelled) setLoading(false);
				});
		}, DEBOUNCE_MS);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [query]);

	const handleSelect = (suggestion: Suggestion) => {
		justSelected.current = true;
		setQuery(suggestion.text);
		setSuggestions([]);
		onChange(suggestion.text);
	};

	return (
		<View>
			<View style={styles.inputRow}>
				<TextInput
					style={styles.input}
					placeholder={placeholder}
					placeholderTextColor={theme.textMuted}
					value={query}
					onChangeText={(text) => {
						setQuery(text);
						// Clear the committed value until a suggestion is chosen, so a
						// half-typed place can't be submitted.
						onChange("");
					}}
					autoCorrect={false}
				/>
				{loading ? <ActivityIndicator size="small" color={theme.textMuted} /> : null}
			</View>

			{error ? <Text style={styles.error}>{error}</Text> : null}

			{suggestions.length > 0 ? (
				<View style={styles.dropdown}>
					{suggestions.slice(0, 5).map((suggestion) => (
						<Pressable
							key={suggestion.placeId}
							style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
							onPress={() => handleSelect(suggestion)}
						>
							<Text style={styles.optionText} numberOfLines={2}>
								{suggestion.text}
							</Text>
						</Pressable>
					))}
				</View>
			) : null}
		</View>
	);
};

const styles = StyleSheet.create({
	inputRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		backgroundColor: theme.inputBackground,
		borderWidth: 1,
		borderColor: theme.inputBorder,
		borderRadius: radius.md,
		paddingHorizontal: spacing.md,
	},
	input: {
		flex: 1,
		paddingVertical: spacing.sm + 2,
		fontSize: typography.md,
		color: theme.textPrimary,
	},
	dropdown: {
		marginTop: spacing.xs,
		backgroundColor: theme.card,
		borderWidth: 1,
		borderColor: theme.border,
		borderRadius: radius.md,
		overflow: "hidden",
	},
	option: {
		paddingVertical: spacing.sm + 2,
		paddingHorizontal: spacing.md,
	},
	optionPressed: {
		backgroundColor: theme.surface,
	},
	optionText: {
		fontSize: typography.base,
		color: theme.textPrimary,
	},
	error: {
		marginTop: spacing.xs,
		fontSize: typography.sm,
		color: "#C2410C",
	},
});
