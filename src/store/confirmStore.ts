import { create } from "zustand";

export interface ConfirmOptions {
	title: string;
	message?: string;
	confirmLabel: string;
	/** Defaults to "Cancel". */
	cancelLabel?: string;
	/** Destructive paints the confirm button red, for actions that undo something. */
	tone?: "default" | "destructive";
	onConfirm: () => void;
}

interface ConfirmState {
	request: ConfirmOptions | null;
	/** Mounted hosts, innermost last — see ConfirmModalHost. */
	hosts: number[];
	open: (options: ConfirmOptions) => void;
	close: () => void;
	registerHost: (id: number) => void;
	unregisterHost: (id: number) => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
	request: null,
	hosts: [],
	open: (request) => set({ request }),
	close: () => set({ request: null }),
	registerHost: (id) => set((state) => ({ hosts: [...state.hosts, id] })),
	unregisterHost: (id) => set((state) => ({ hosts: state.hosts.filter((host) => host !== id) })),
}));

/**
 * App-wide confirmation dialog, callable from anywhere (handlers, hooks, outside React):
 *
 *   confirm({ title: "Withdraw request?", confirmLabel: "Withdraw", tone: "destructive",
 *             onConfirm: () => withdraw(id) });
 *
 * Cancelling just closes it. Rendering is done by ConfirmModalHost.
 */
export const confirm = (options: ConfirmOptions): void => useConfirmStore.getState().open(options);
