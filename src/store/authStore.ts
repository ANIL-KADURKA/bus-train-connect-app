import type { ConfirmationResult, User } from "firebase/auth";
import { create } from "zustand";

interface AuthState {
	user: User | null;
	confirmation: ConfirmationResult | null;
	phone: string;
	setUser: (user: User | null) => void;
	setConfirmation: (c: ConfirmationResult | null) => void;
	setPhone: (phone: string) => void;
	reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	confirmation: null,
	phone: "",

	setUser: (user) => set({ user }),
	setConfirmation: (confirmation) => set({ confirmation }),
	setPhone: (phone) => set({ phone }),
	reset: () => set({ user: null, confirmation: null, phone: "" }),
}));
