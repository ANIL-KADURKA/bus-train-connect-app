import { create } from "zustand";

interface OverlayState {
	/** Mounted OverlayHosts, innermost last. Only the last one renders. */
	hosts: number[];
	registerHost: (id: number) => void;
	unregisterHost: (id: number) => void;
}

export const useOverlayStore = create<OverlayState>((set) => ({
	hosts: [],
	registerHost: (id) => set((state) => ({ hosts: [...state.hosts, id] })),
	unregisterHost: (id) => set((state) => ({ hosts: state.hosts.filter((host) => host !== id) })),
}));
