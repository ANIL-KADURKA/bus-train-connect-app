import { create } from "zustand";

interface BadgeState {
	journeyUnread: number;
	dmUnread: number;
	pendingChatRequests: number;
	activeParcels: number;
	setBadges: (badges: Partial<Omit<BadgeState, "setBadges">>) => void;
}

/**
 * Unread/activity counters surfaced on the bottom tab bar.
 *
 * Everything starts at zero: the backend has no chat, parcel or notification endpoints
 * yet, so nothing populates these. Wire them up when those APIs land — the UI already
 * reacts to whatever is set here.
 */
export const useBadgeStore = create<BadgeState>((set) => ({
	journeyUnread: 0,
	dmUnread: 0,
	pendingChatRequests: 0,
	activeParcels: 0,
	setBadges: (badges) => set(badges),
}));

/** Bottom-tab Chats badge is the sum of both sub-tabs. */
export const selectChatsUnread = (state: BadgeState): number =>
	state.journeyUnread + state.dmUnread;
