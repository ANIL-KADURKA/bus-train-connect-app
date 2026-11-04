import { create } from "zustand";

interface DirectChatState {
	/** The chat on screen right now, if any: its incoming messages are read, not unread. */
	activeChatId: string | null;
	setActiveChatId: (chatId: string | null) => void;
}

export const useDirectChatStore = create<DirectChatState>((set) => ({
	activeChatId: null,
	setActiveChatId: (activeChatId) => set({ activeChatId }),
}));
