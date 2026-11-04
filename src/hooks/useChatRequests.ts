import {
	type UseMutationResult,
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import {
	type ChatRequest,
	listChatRequests,
	respondToChatRequest,
	sendChatRequest,
	withdrawChatRequest,
} from "../api/chatRequests";
import type { ChatStatus } from "../components/shared/PassengerCard";
import { useBadgeStore } from "../store/badgeStore";
import { useFirebaseAuth } from "./useUser";

export const chatRequestKeys = {
	all: ["chatRequests"] as const,
};

/**
 * GET /chat-requests. Kept fresh by socket events (see GroupChatSocketProvider), which
 * invalidate this key, so there is no polling.
 */
export const useChatRequests = (): UseQueryResult<ChatRequest[]> => {
	const { uid, ready } = useFirebaseAuth();
	const query = useQuery({
		queryKey: chatRequestKeys.all,
		queryFn: listChatRequests,
		enabled: ready && uid !== null,
	});

	// The tab bar and Chats screen already read these counters; feed them from the real list.
	const requests = query.data ?? [];
	const incomingPending = requests.filter(
		(request) => request.direction === "incoming" && request.status === "pending",
	).length;
	const dmUnread = requests.reduce((sum, request) => sum + (request.unreadCount ?? 0), 0);

	useEffect(() => {
		useBadgeStore.getState().setBadges({ pendingChatRequests: incomingPending, dmUnread });
	}, [incomingPending, dmUnread]);

	return query;
};

/**
 * What each passenger card should offer, keyed by the other traveller's userId. The
 * backend sends one request per person (the latest); accepted still wins if two ever
 * arrive, since an open chat is the more useful action.
 */
export const useChatStatuses = (): {
	statusFor: (userId: string) => ChatStatus;
	requestFor: (userId: string) => ChatRequest | undefined;
} => {
	const { data: requests } = useChatRequests();

	return useMemo(() => {
		const byUser = new Map<string, ChatRequest>();

		for (const request of requests ?? []) {
			const current = byUser.get(request.otherUser.userId);
			if (!current || request.status === "accepted") {
				byUser.set(request.otherUser.userId, request);
			}
		}

		return {
			requestFor: (userId) => byUser.get(userId),
			statusFor: (userId) => {
				const request = byUser.get(userId);

				// Rejected reads as no request on the cards: either side may ask afresh, and the
				// recipient can still reverse it from the Chat requests screen.
				if (!request || request.status === "rejected") return "none";
				if (request.status === "accepted") return "accepted";

				return request.direction === "outgoing" ? "pending" : "incoming";
			},
		};
	}, [requests]);
};

const useInvalidateOnSuccess = () => {
	const queryClient = useQueryClient();

	return () => queryClient.invalidateQueries({ queryKey: chatRequestKeys.all });
};

export const useSendChatRequest = (): UseMutationResult<ChatRequest, Error, string> => {
	const onSuccess = useInvalidateOnSuccess();

	return useMutation({ mutationFn: sendChatRequest, onSuccess });
};

export const useWithdrawChatRequest = (): UseMutationResult<ChatRequest, Error, string> => {
	const onSuccess = useInvalidateOnSuccess();

	return useMutation({ mutationFn: withdrawChatRequest, onSuccess });
};

export const useRespondToChatRequest = (): UseMutationResult<
	ChatRequest,
	Error,
	{ requestId: string; action: "accept" | "reject" }
> => {
	const onSuccess = useInvalidateOnSuccess();

	return useMutation({ mutationFn: respondToChatRequest, onSuccess });
};
