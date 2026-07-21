import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  brand,
  radius,
  spacing,
  theme,
  typography,
} from "../../constants/theme";
import { Field } from "../../components/shared/Field";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useUpdateProfile } from "../../hooks/useUser";

type Gender = "male" | "female" | "other";

const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

export interface ProfileFormValues {
  displayName: string;
  profilePhotoUrl?: string;
  anonymousAlias: string;
  isProfileHidden: boolean;
  age: string;
  gender?: Gender;
  bio: string;
}

export function ProfileCreation() {
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | undefined>();
  const [profileImage, setProfileImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [anonymousAlias, setAnonymousAlias] = useState("");
  const [isProfileHidden, setIsProfileHidden] = useState(false);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | undefined>();
  const [bio, setBio] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // The hook seeds the user cache on success, which flips RootNavigator over to Home
  // once the backend returns onBoardingStatus: "profile_created".
  const { mutate: saveProfile, isPending: submitting } = useUpdateProfile();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setProfilePhotoUrl(asset.uri);
      setProfileImage({
        uri: asset.uri,
        name: asset.fileName ?? `profile-photo-${Date.now()}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      });
    }
  };

  const canSave =
    displayName.trim() !== "" &&
    (!isProfileHidden || anonymousAlias.trim() !== "") &&
    !submitting &&
    age &&
    Number.isInteger(Number(age));
  const validate = () => {
    const next: Record<string, string> = {};
    if (!displayName.trim()) next.displayName = "Display name is required";
    if (age) {
      const n = Number(age);
      if (!Number.isInteger(n) || n < 13 || n > 120) {
        next.age = "Age should be greater than 13 and less than 120";
      }
    }
    if (isProfileHidden && !anonymousAlias.trim()) {
      next.anonymousAlias =
        "Add an alias to hide behind, or turn hidden mode off";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    saveProfile(
      {
        displayName: displayName.trim(),
        anonymousAlias: anonymousAlias.trim() || undefined,
        isProfileHidden,
        age: Number(age),
        gender,
        bio: bio.trim() || undefined,
        profileImage,
      },
      {
        onError: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : "Something went wrong.";
          Alert.alert("Profile Save Failed", message);
        },
      },
    );
  };

  const initials = displayName.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.container, { paddingBottom: spacing.xxl * 2 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Text style={styles.title}>Create your profile</Text>
          <Text style={styles.subtitle}>
            This is how other riders will see you.
          </Text>
          <View style={styles.avatarSection}>
            <TouchableOpacity activeOpacity={0.8} onPress={pickImage}>
              {profilePhotoUrl ? (
                <Image source={{ uri: profilePhotoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Field
            label="Name"
            error={errors.displayName}
            hint="You can hide you name and profile photo if you want to be anonymous"
          >
            <TextInput
              style={styles.input}
              placeholder="e.g. Aditi R."
              placeholderTextColor={theme.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={40}
            />
          </Field>

          <Field
            label="Age"
            error={errors.age}
            hint="Always visible, even if your profile is hidden"
          >
            <TextInput
              style={styles.input}
              placeholder="e.g. 24"
              placeholderTextColor={theme.textMuted}
              value={age}
              onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={3}
            />
          </Field>

          <Field label="Gender">
            <View style={styles.segmentRow}>
              {GENDER_OPTIONS.map((opt) => {
                const selected = gender === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.segment, selected && styles.segmentSelected]}
                    onPress={() => setGender(opt.value)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        selected && styles.segmentTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          <Field label="Bio">
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell fellow commuters a bit about yourself"
              placeholderTextColor={theme.textMuted}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{bio.length}/200</Text>
          </Field>

          <View style={styles.toggleRow}>
            <View style={styles.flexShrink}>
              <Text style={styles.toggleLabel}>Hide my profile</Text>
              <Text style={styles.toggleHint}>
                Others will see your anonymous alias instead of your name and
                photo.
              </Text>
            </View>
            <Switch
              value={isProfileHidden}
              onValueChange={setIsProfileHidden}
              trackColor={{ false: theme.inputBorder, true: brand.tealBorder }}
              thumbColor={isProfileHidden ? brand.teal : theme.textMuted}
            />
          </View>

          {isProfileHidden && (
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
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (submitting || !canSave) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || !canSave}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? "Saving..." : "Save profile"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: theme.background,
    // marginTop: Platform.OS === "android" ? 25 : 0,
  },
  container: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl * 2,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: theme.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.base,
    fontWeight: typography.regular,
    color: theme.textSecondary,
    marginBottom: spacing.xl,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: brand.teal,
  },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: brand.teal,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: theme.background,
  },
  avatarBadgeText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: theme.background,
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
    minHeight: 96,
    paddingTop: spacing.sm + 2,
  },
  charCount: {
    fontSize: typography.xs,
    color: theme.textMuted,
    textAlign: "right",
    marginTop: spacing.xs,
  },
  segmentRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBackground,
    alignItems: "center",
  },
  segmentSelected: {
    backgroundColor: brand.tealMuted,
    borderColor: brand.tealBorder,
  },
  segmentText: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: theme.textSecondary,
  },
  segmentTextSelected: {
    color: brand.tealDeep,
    fontWeight: typography.bold,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  flexShrink: {
    flexShrink: 1,
  },
  toggleLabel: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: theme.textPrimary,
    marginBottom: 2,
  },
  toggleHint: {
    fontSize: typography.xs,
    color: theme.textMuted,
  },
  submitButton: {
    backgroundColor: brand.teal,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: theme.background,
  },
});
