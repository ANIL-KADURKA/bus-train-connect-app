import type { AuthUserDto, Gender } from "../dto/user.dto";
import { api } from "./axios";

export type ProfileImageInput = {
	uri: string;
	name: string;
	type: string;
};

/** Every field is optional: PATCH /users/me only touches what it receives. */
export type UpdateProfileInput = {
	displayName?: string;
	anonymousAlias?: string;
	isProfileHidden?: boolean;
	age?: number | string;
	gender?: Gender;
	bio?: string;
	profileImage?: ProfileImageInput | null;
};

const appendIfPresent = (formData: FormData, key: string, value: unknown): void => {
	// Omit rather than sending "" — an empty string is a real value to the backend and
	// would overwrite an existing bio/alias with a blank one.
	if (value === undefined || value === null || value === "") {
		return;
	}

	formData.append(key, String(value));
};

const toFormData = (input: UpdateProfileInput): FormData => {
	const formData = new FormData();

	appendIfPresent(formData, "displayName", input.displayName);
	appendIfPresent(formData, "anonymousAlias", input.anonymousAlias);
	appendIfPresent(formData, "isProfileHidden", input.isProfileHidden);
	appendIfPresent(formData, "age", input.age);
	appendIfPresent(formData, "gender", input.gender);
	appendIfPresent(formData, "bio", input.bio);

	if (input.profileImage) {
		// React Native's FormData takes this shape for file parts; the DOM type disagrees.
		formData.append("profilePhoto", input.profileImage as unknown as Blob);
	}

	return formData;
};

export const updateMyProfile = async (input: UpdateProfileInput): Promise<AuthUserDto> => {
	const { data } = await api.patch<AuthUserDto>("/users/me", toFormData(input));

	return data;
};
