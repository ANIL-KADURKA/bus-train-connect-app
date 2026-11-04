import Constants from "expo-constants";
import React, { useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { radius, spacing, theme, typography } from "../../constants/theme";

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places";
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

/** Expo inlines EXPO_PUBLIC_* at build time. */
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

/**
 * The key is restricted to this app's iOS bundle id and Android package. Google's native
 * SDKs send these automatically; a plain fetch does not, so without them every call is a 403.
 * Read from app.json so Expo Go (whose own bundle id the key rejects) identifies as this app.
 */
const appIdentityHeaders = (): Record<string, string> => {
	const config = Constants.expoConfig;

	if (Platform.OS === "ios" && config?.ios?.bundleIdentifier) {
		return { "X-Ios-Bundle-Identifier": config.ios.bundleIdentifier };
	}

	if (Platform.OS === "android" && config?.android?.package) {
		return { "X-Android-Package": config.android.package };
	}

	return {};
};

const placesHeaders = (): Record<string, string> => ({
	"X-Goog-Api-Key": API_KEY ?? "",
	...appIdentityHeaders(),
});

/** A place the user has committed to, with the coordinates radius search needs. */
export interface SelectedPlace {
	placeId: string;
	text: string;
	latitude: number;
	longitude: number;
}

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

interface PlaceDetailsResponse {
	location?: { latitude?: number; longitude?: number };
}

const fetchSuggestions = async (input: string): Promise<Suggestion[]> => {
	const response = await fetch(AUTOCOMPLETE_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...placesHeaders(),
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

/**
 * Autocomplete does not return coordinates, so committing a place costs a second call.
 * It only fires on selection, not per keystroke.
 */
const fetchCoordinates = async (
	placeId: string,
): Promise<{ latitude: number; longitude: number }> => {
	const response = await fetch(`${PLACE_DETAILS_URL}/${placeId}`, {
		headers: {
			...placesHeaders(),
			"X-Goog-FieldMask": "location",
		},
	});

	if (!response.ok) {
		throw new Error(`Place details request failed (${response.status})`);
	}

	const data = (await response.json()) as PlaceDetailsResponse;
	const { latitude, longitude } = data.location ?? {};

	if (typeof latitude !== "number" || typeof longitude !== "number") {
		throw new Error("That place has no coordinates");
	}

	return { latitude, longitude };
};

interface PlaceInputProps {
	value: SelectedPlace | null;
	onChange: (place: SelectedPlace | null) => void;
	placeholder: string;
}

/**
 * Google Places autocomplete for Indian cities, resolving the picked place to
 * coordinates so journeys can be matched by distance rather than by spelling.
 *
 * Internal query text is not synced back from `value`: the parent clears `value` on every
 * keystroke, so mirroring it would wipe what the user is typing. Parents that need to
 * reset the field remount it with a changed `key`.
 */
export const PlaceInput: React.FC<PlaceInputProps> = ({ value, onChange, placeholder }) => {
	const [query, setQuery] = useState(value?.text ?? "");
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [loading, setLoading] = useState(false);
	const [resolving, setResolving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// Set when the user picks a suggestion, so we don't immediately re-search that text.
	const justSelected = useRef(false);

	useEffect(() => {
		if (justSelected.current) {
			justSelected.current = false;
			return;
		}

		if (value?.text === query) {
			setSuggestions([]);
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
	}, [query, value?.text]);

	const handleSelect = (suggestion: Suggestion) => {
		justSelected.current = true;
		setQuery(suggestion.text);
		setSuggestions([]);
		setResolving(true);
		setError(null);

		fetchCoordinates(suggestion.placeId)
			.then(({ latitude, longitude }) => {
				onChange({ ...suggestion, latitude, longitude });
			})
			.catch((cause: unknown) => {
				// Without coordinates the place is unusable, so leave the field uncommitted
				// rather than letting a half-resolved place through.
				onChange(null);
				setError(cause instanceof Error ? cause.message : "Could not locate that place");
			})
			.finally(() => {
				setResolving(false);
			});
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
						onChange(null);
					}}
					autoCorrect={false}
				/>
				{loading || resolving ? <ActivityIndicator size="small" color={theme.textMuted} /> : null}
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
