import { country_to_phone_map } from "../constants/phone.constants";

export function validatePhoneNumber(phone: string, countrycode: string): boolean {
	if (!countrycode) {
		return false;
	}

	const selected_country = country_to_phone_map.find((country) => country.code === countrycode);

	if (!selected_country) {
		return false;
	}

	const digits = phone.replace(/\D/g, "");
	return digits.length === selected_country.length;
}

export function sanitizePhoneNumber(country_code: string, phone: string): string {
	return `${country_code}${phone.replace(/\D/g, "")}`;
}
