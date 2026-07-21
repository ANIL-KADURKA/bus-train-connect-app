import type { ConfirmationResult } from "firebase/auth";
import { create } from "zustand";
import type { AuthUserDto } from "../dto/user.dto";

interface AuthState {
	user: AuthUserDto | null;
	confirmation: ConfirmationResult | null;
	phone: string;
	setUser: (user: AuthUserDto | null) => void;
	setConfirmation: (c: ConfirmationResult | null) => void;
	setPhone: (phone: string) => void;
	reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	confirmation: null,
	phone: "",
	setUser: (user: AuthUserDto | null) => set({ user }),
	setConfirmation: (confirmation) => set({ confirmation }),
	setPhone: (phone) => set({ phone }),
	reset: () => set({ user: null, confirmation: null, phone: "" }),
}));
