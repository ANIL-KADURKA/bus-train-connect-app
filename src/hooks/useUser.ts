import { onAuthStateChanged, signOut } from "@firebase/auth";
import {
	type UseMutationResult,
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getCurrentUser, login } from "../api/auth";
import { type UpdateProfileInput, updateMyProfile } from "../api/users";
import type { AuthUserDto } from "../dto/user.dto";
import { firebaseAuth } from "../lib/firebase";
import { useAuthStore } from "../store/authStore";

export const userKeys = {
	all: ["users"] as const,
	// Scoped by Firebase uid so a signed-out account's cached profile can never be read
	// back by the next one — that showed up as Home flashing before Profile creation.
	me: (uid: string | null) => [...userKeys.all, "me", uid] as const,
};

type FirebaseAuthState = {
	uid: string | null;
	/** False until Firebase has restored any persisted session. */
	ready: boolean;
};

/**
 * Every user endpoint sits behind the Firebase token that the axios interceptor attaches,
 * so queries must wait for Firebase to resolve its session or they fire a guaranteed 401.
 */
export const useFirebaseAuth = (): FirebaseAuthState => {
	const [state, setState] = useState<FirebaseAuthState>({ uid: null, ready: false });

	useEffect(() => {
		return onAuthStateChanged(firebaseAuth, (firebaseUser) => {
			setState({ uid: firebaseUser?.uid ?? null, ready: true });
		});
	}, []);

	return state;
};

const isUnauthorized = (error: unknown): boolean =>
	typeof error === "object" &&
	error !== null &&
	"response" in error &&
	(error as { response?: { status?: number } }).response?.status === 401;

/** GET /auth/me — the signed-in user's profile. */
export const useCurrentUser = (): UseQueryResult<AuthUserDto> => {
	const { uid, ready } = useFirebaseAuth();
	const setUser = useAuthStore((state) => state.setUser);

	const query = useQuery({
		queryKey: userKeys.me(uid),
		queryFn: getCurrentUser,
		enabled: ready && uid !== null,
		// A 401 means the token is bad, not that the network flaked — retrying cannot help.
		retry: (failureCount, error) => !isUnauthorized(error) && failureCount < 1,
	});

	// Mirror into Zustand so screens still reading the store stay in sync.
	useEffect(() => {
		if (query.data) {
			setUser(query.data);
		}
	}, [query.data, setUser]);

	return query;
};

/** POST /auth/login — creates the backend user on first call, idempotent afterwards. */
export const useLogin = (): UseMutationResult<AuthUserDto, Error, void> => {
	const queryClient = useQueryClient();
	const setUser = useAuthStore((state) => state.setUser);

	return useMutation({
		mutationFn: login,
		onSuccess: (user) => {
			queryClient.setQueryData(userKeys.me(user.firebaseUid), user);
			setUser(user);
		},
	});
};

/** PATCH /users/me — partial profile update, optionally with a new photo. */
export const useUpdateProfile = (): UseMutationResult<AuthUserDto, Error, UpdateProfileInput> => {
	const queryClient = useQueryClient();
	const setUser = useAuthStore((state) => state.setUser);

	return useMutation({
		mutationFn: updateMyProfile,
		onSuccess: (user) => {
			// The response is the full updated user, so seed the cache instead of refetching.
			queryClient.setQueryData(userKeys.me(user.firebaseUid), user);
			setUser(user);
		},
	});
};

/**
 * Signs out of Firebase and drops every cached user. Without the cache removal the next
 * account briefly renders the previous one's profile — Home flashing before Profile.
 */
export const useSignOut = (): (() => Promise<void>) => {
	const queryClient = useQueryClient();
	const reset = useAuthStore((state) => state.reset);

	return async () => {
		await signOut(firebaseAuth);
		queryClient.removeQueries({ queryKey: userKeys.all });
		reset();
	};
};
