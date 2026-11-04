import type { Gender } from "../api/journeys";

const LABELS: Record<Gender, string> = {
	male: "Male",
	female: "Female",
	other: "Other",
	prefer_not_to_say: "Not specified",
};

/** Empty string rather than a placeholder: an unset gender should take no visual room. */
export const genderLabel = (gender?: Gender): string => (gender ? LABELS[gender] : "");
