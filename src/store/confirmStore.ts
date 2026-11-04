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
	open: (options: ConfirmOptions) => void;
	close: () => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
	request: null,
	open: (request) => set({ request }),
	close: () => set({ request: null }),
}));

/**
 * App-wide confirmation dialog, callable from anywhere (handlers, hooks, outside React):
 *
 *   confirm({ title: "Withdraw request?", confirmLabel: "Withdraw", tone: "destructive",
 *             onConfirm: () => withdraw(id) });
 *
 * Cancelling just closes it. Rendering is done by OverlayHost.
 */
export const confirm = (options: ConfirmOptions): void => useConfirmStore.getState().open(options);
