export type UserStatus = "active" | "suspended" | "deleted";
export type OnBoardingStatus = "phone_verified" | "profile_created";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export interface AuthUserDto {
	userId: string;
	firebaseUid: string;
	mobileNumber: string;
	displayName?: string;
	/** Presigned S3 URL. It expires, so refetch rather than persisting it. */
	profilePhotoUrl?: string;
	isProfileHidden: boolean;
	status: UserStatus;
	/** ISO strings over the wire — JSON has no Date type. */
	createdAt: string;
	updatedAt: string;
	bio?: string;
	anonymousAlias?: string;
	onBoardingStatus: OnBoardingStatus;
	age?: number;
	gender?: Gender;
}
