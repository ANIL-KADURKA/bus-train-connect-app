import { create } from "zustand";
import { useBadgeStore } from "./badgeStore";

interface GroupChatState {
	activeJourneyId: string | null;
	unreadByJourney: Record<string, number>;
	setActiveJourneyId: (journeyId: string | null) => void;
	addUnread: (journeyId: string) => void;
	markRead: (journeyId: string) => void;
}

const syncJourneyUnreadBadge = (unreadByJourney: Record<string, number>) => {
	const journeyUnread = Object.values(unreadByJourney).reduce((sum, count) => sum + count, 0);

	useBadgeStore.getState().setBadges({ journeyUnread });
};

export const useGroupChatStore = create<GroupChatState>((set, get) => ({
	activeJourneyId: null,
	unreadByJourney: {},
	setActiveJourneyId: (activeJourneyId) => set({ activeJourneyId }),
	addUnread: (journeyId) => {
		const unreadByJourney = {
			...get().unreadByJourney,
			[journeyId]: (get().unreadByJourney[journeyId] ?? 0) + 1,
		};

		set({ unreadByJourney });
		syncJourneyUnreadBadge(unreadByJourney);
	},
	markRead: (journeyId) => {
		if (!get().unreadByJourney[journeyId]) {
			return;
		}

		const unreadByJourney = { ...get().unreadByJourney };
		delete unreadByJourney[journeyId];

		set({ unreadByJourney });
		syncJourneyUnreadBadge(unreadByJourney);
	},
}));
