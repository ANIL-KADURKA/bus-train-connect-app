import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Matches the backend's TransportType enum. */
export type TransportMode = "bus" | "train";

interface ModeState {
	mode: TransportMode;
	/** False until the persisted mode has been read back from storage. */
	hydrated: boolean;
	setMode: (mode: TransportMode) => void;
	setHydrated: () => void;
}

/**
 * App-wide transport context. Everything on Home filters by this, so it is persisted —
 * a user who mainly travels by train should not have to re-pick it every launch.
 */
export const useModeStore = create<ModeState>()(
	persist(
		(set) => ({
			mode: "bus",
			hydrated: false,
			setMode: (mode) => set({ mode }),
			setHydrated: () => set({ hydrated: true }),
		}),
		{
			name: "transport-mode",
			storage: createJSONStorage(() => AsyncStorage),
			// Only the choice is persisted; `hydrated` is runtime-only state.
			partialize: (state) => ({ mode: state.mode }),
			onRehydrateStorage: () => (state) => state?.setHydrated(),
		},
	),
);
