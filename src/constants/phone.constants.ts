import type { CountryPhoneConfig } from "../types/phone.type";

// countries
export const countries = {
	INDIA: "India",
} as const;

// phone codes
export const phone_codes = {
	INDIA: "+91",
} as const;

// flags
export const flags = {
	INDIA: "🇮🇳",
} as const;

// phone number length rules
export const phone_length = {
	INDIA: 10,
} as const;

export const india = {
	flag: flags.INDIA,
	code: phone_codes.INDIA,
	country: countries.INDIA,
	length: phone_length.INDIA,
};

// unified map
export const country_to_phone_map: CountryPhoneConfig[] = [
	{
		flag: flags.INDIA,
		code: phone_codes.INDIA,
		country: countries.INDIA,
		length: phone_length.INDIA,
	},
];

// default country
export const default_country =
	country_to_phone_map.find((c) => c.country === countries.INDIA) || india;
