import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
	Alert,
	Image,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	View,
} from "react-native";
import type { ProfileImageInput } from "../../api/users";
import { Field } from "../../components/shared/Field";
import { OverlayHost } from "../../components/shared/OverlayHost";
import { brand, radius, spacing, theme, typography } from "../../constants/theme";
import type { AuthUserDto } from "../../dto/user.dto";
import { useUpdateProfile } from "../../hooks/useUser";

interface EditProfileModalProps {
	visible: boolean;
	user: AuthUserDto;
	onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, user, onClose }) => {
	const [displayName, setDisplayName] = useState("");
	const [bio, setBio] = useState("");
	const [anonymousAlias, setAnonymousAlias] = useState("");
	const [isProfileHidden, setIsProfileHidden] = useState(false);
	const [age, setAge] = useState("");
	const [photoPreview, setPhotoPreview] = useState<string | undefined>();
	const [profileImage, setProfileImage] = useState<ProfileImageInput | null>(null);
	const [removePhoto, setRemovePhoto] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const { mutate: save, isPending } = useUpdateProfile();

	// Reload from the server copy each time the sheet opens, so a cancelled edit is
	// genuinely discarded rather than lingering in state.
	useEffect(() => {
		if (!visible) return;

		setDisplayName(user.displayName ?? "");
		setBio(user.bio ?? "");
		setAnonymousAlias(user.anonymousAlias ?? "");
		setIsProfileHidden(user.isProfileHidden);
		setAge(user.age ? String(user.age) : "");
		setPhotoPreview(user.profilePhotoUrl);
		setProfileImage(null);
		setRemovePhoto(false);
		setErrors({});
	}, [visible, user]);

	const pickImage = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});

		if (result.canceled) return;

		const asset = result.assets[0];

		setPhotoPreview(asset.uri);
		setRemovePhoto(false);
		setProfileImage({
			uri: asset.uri,
			name: asset.fileName ?? `profile-photo-${Date.now()}.jpg`,
			type: asset.mimeType ?? "image/jpeg",
		});
	};

	const handleRemovePhoto = () => {
		setPhotoPreview(undefined);
		setProfileImage(null);
		setRemovePhoto(true);
	};

	const validate = (): boolean => {
		const next: Record<string, string> = {};

		if (!displayName.trim()) next.displayName = "Display name is required";

		if (age) {
			const parsed = Number(age);
			if (!Number.isInteger(parsed) || parsed < 13 || parsed > 120) {
				next.age = "Age must be between 13 and 120";
			}
		}

		if (isProfileHidden && !anonymousAlias.trim()) {
			next.anonymousAlias = "Add an alias to hide behind, or turn hidden mode off";
		}

		setErrors(next);

		return Object.keys(next).length === 0;
	};

	const handleSave = () => {
		if (!validate()) return;

		save(
			{
				displayName: displayName.trim(),
				bio: bio.trim(),
				anonymousAlias: anonymousAlias.trim(),
				isProfileHidden,
				age: age ? Number(age) : undefined,
				profileImage,
				removeProfilePhoto: removePhoto,
				// gender and mobileNumber are deliberately not sent — both are fixed
				// after signup.
			},
			{
				onSuccess: () => onClose(),
				onError: (error: unknown) => {
					const message = error instanceof Error ? error.message : "Something went wrong.";
					Alert.alert("Could not save profile", message);
				},
			},
		);
	};

	const initial = (displayName.trim() || "?").charAt(0).toUpperCase();

	return (
		<Modal visible={visible} animationType="fade" onRequestClose={onClose} transparent>
			<View style={styles.backdrop}>
				<Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />

				<KeyboardAvoidingView
					style={styles.centerer}
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					pointerEvents="box-none"
				>
					<View style={styles.card}>
						<View style={styles.header}>
							<Text style={styles.title}>Edit profile</Text>
							<Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
								<HugeiconsIcon
									icon={Cancel01Icon}
									size={22}
									strokeWidth={1.8}
									color={theme.textMuted}
								/>
							</Pressable>
						</View>

						<ScrollView
							style={styles.scroll}
							contentContainerStyle={styles.form}
							keyboardShouldPersistTaps="handled"
							showsVerticalScrollIndicator={false}
						>
							<View style={styles.avatarWrap}>
								<Pressable onPress={pickImage} accessibilityLabel="Change photo">
									{photoPreview ? (
										<Image source={{ uri: photoPreview }} style={styles.avatar} />
									) : (
										<View style={[styles.avatar, styles.avatarPlaceholder]}>
											<Text style={styles.avatarInitial}>{initial}</Text>
										</View>
									)}
								</Pressable>

								<View style={styles.avatarActions}>
									<Pressable onPress={pickImage} hitSlop={6}>
										<Text style={styles.avatarHint}>
											{photoPreview ? "Change photo" : "Add photo"}
										</Text>
									</Pressable>
									{photoPreview ? (
										<Pressable onPress={handleRemovePhoto} hitSlop={6}>
											<Text style={styles.removeText}>Remove</Text>
										</Pressable>
									) : null}
								</View>
							</View>

							<Field label="Display name" error={errors.displayName}>
								<TextInput
									style={styles.input}
									placeholder="e.g. Aditi R."
									placeholderTextColor={theme.textMuted}
									value={displayName}
									onChangeText={setDisplayName}
									maxLength={40}
								/>
							</Field>

							<Field label="Age" error={errors.age} hint="Stays visible even when hidden">
								<TextInput
									style={styles.input}
									placeholder="e.g. 24"
									placeholderTextColor={theme.textMuted}
									value={age}
									onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ""))}
									keyboardType="number-pad"
									maxLength={3}
								/>
							</Field>

							<Field label="Bio">
								<TextInput
									style={[styles.input, styles.textArea]}
									placeholder="Tell fellow commuters a bit about yourself"
									placeholderTextColor={theme.textMuted}
									value={bio}
									onChangeText={setBio}
									multiline
									maxLength={200}
									textAlignVertical="top"
								/>
							</Field>

							<View style={styles.toggleRow}>
								<View style={styles.toggleText}>
									<Text style={styles.toggleLabel}>Hide my profile</Text>
									<Text style={styles.toggleHint}>
										Others see your alias instead of your name and photo. Age and gender stay
										visible.
									</Text>
								</View>
								<Switch
									value={isProfileHidden}
									onValueChange={setIsProfileHidden}
									trackColor={{ false: theme.inputBorder, true: brand.tealBorder }}
									thumbColor={isProfileHidden ? brand.teal : theme.textMuted}
								/>
							</View>

							{isProfileHidden ? (
								<Field label="Anonymous alias" error={errors.anonymousAlias}>
									<TextInput
										style={styles.input}
										placeholder="e.g. Night Owl"
										placeholderTextColor={theme.textMuted}
										value={anonymousAlias}
										onChangeText={setAnonymousAlias}
										maxLength={30}
									/>
								</Field>
							) : null}

							{/* Fixed at signup — shown so it's clear they aren't missing. */}
							<View style={styles.lockedRow}>
								<Text style={styles.lockedLabel}>Mobile</Text>
								<Text style={styles.lockedValue}>{user.mobileNumber}</Text>
							</View>
							<View style={styles.lockedRow}>
								<Text style={styles.lockedLabel}>Gender</Text>
								<Text style={styles.lockedValue}>{user.gender ?? "Not set"}</Text>
							</View>
							<Text style={styles.lockedNote}>Mobile number and gender can't be changed.</Text>

							<Pressable
								style={[styles.submit, isPending && styles.submitDisabled]}
								onPress={handleSave}
								disabled={isPending}
							>
								<Text style={styles.submitText}>{isPending ? "Saving..." : "Save changes"}</Text>
							</Pressable>
						</ScrollView>
					</View>
				</KeyboardAvoidingView>
			</View>
			{/* iOS can't stack a sibling Modal over this one; overlays must render inside it. */}
			<OverlayHost />
		</Modal>
	);
};

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	centerer: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.xxl,
	},
	card: {
		maxHeight: "100%",
		backgroundColor: theme.card,
		borderRadius: radius.lg + 4,
		borderWidth: 1,
		borderColor: theme.border,
		overflow: "hidden",
		...Platform.select({
			ios: {
				shadowColor: theme.black,
				shadowOpacity: 0.2,
				shadowRadius: 20,
				shadowOffset: { width: 0, height: 8 },
			},
			android: { elevation: 12 },
		}),
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.lg,
		paddingBottom: spacing.md,
	},
	title: {
		fontSize: typography.lg,
		fontWeight: typography.bold,
		color: theme.textPrimary,
	},
	scroll: {
		flexGrow: 0,
	},
	form: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.lg,
	},
	avatarWrap: {
		alignItems: "center",
		gap: spacing.xs,
		marginBottom: spacing.md,
	},
	avatar: {
		width: 84,
		height: 84,
		borderRadius: radius.full,
		backgroundColor: brand.tealMuted,
	},
	avatarPlaceholder: {
		alignItems: "center",
		justifyContent: "center",
	},
	avatarInitial: {
		fontSize: typography.xl,
		fontWeight: typography.bold,
		color: brand.tealDeep,
	},
	avatarActions: {
		flexDirection: "row",
		gap: spacing.md,
	},
	avatarHint: {
		fontSize: typography.sm,
		fontWeight: typography.medium,
		color: brand.tealDeep,
	},
	removeText: {
		fontSize: typography.sm,
		fontWeight: typography.medium,
		color: "#C2410C",
	},
	input: {
		backgroundColor: theme.inputBackground,
		borderWidth: 1,
		borderColor: theme.inputBorder,
		borderRadius: radius.md,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm + 2,
		fontSize: typography.md,
		color: theme.textPrimary,
	},
	textArea: {
		minHeight: 80,
		paddingTop: spacing.sm + 2,
	},
	toggleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		paddingVertical: spacing.md,
	},
	toggleText: {
		flex: 1,
		gap: 2,
	},
	toggleLabel: {
		fontSize: typography.base,
		fontWeight: typography.medium,
		color: theme.textPrimary,
	},
	toggleHint: {
		fontSize: typography.xs,
		color: theme.textMuted,
	},
	lockedRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: spacing.sm,
	},
	lockedLabel: {
		fontSize: typography.base,
		color: theme.textSecondary,
	},
	lockedValue: {
		fontSize: typography.base,
		fontWeight: typography.medium,
		color: theme.textMuted,
	},
	lockedNote: {
		fontSize: typography.xs,
		color: theme.textMuted,
		marginBottom: spacing.sm,
	},
	submit: {
		backgroundColor: brand.teal,
		borderRadius: radius.md,
		paddingVertical: spacing.md,
		alignItems: "center",
		marginTop: spacing.sm,
	},
	submitDisabled: {
		opacity: 0.6,
	},
	submitText: {
		fontSize: typography.md,
		fontWeight: typography.bold,
		color: theme.white,
	},
});
