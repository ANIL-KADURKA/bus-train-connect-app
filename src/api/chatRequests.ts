import { api } from "./axios";
import type { Passenger } from "./journeys";

export type ChatRequestStatus = "pending" | "accepted" | "rejected" | "withdrawn";

/** A traveller as seen in a request — the passenger view without the "is this me" flag. */
export type ChatRequestUser = Omit<Passenger, "isYou">;

/**
 * Built per viewer by the backend: `direction` and `otherUser` are always relative to the
 * signed-in user, so the same request reads "outgoing" on one phone and "incoming" on the other.
 */
export interface ChatRequest {
	requestId: string;
	status: ChatRequestStatus;
	direction: "incoming" | "outgoing";
	otherUser: ChatRequestUser;
	createdAt: string;
	respondedAt?: string;
	/** Set once accepted: the private chat the two now share. */
	chatId?: string;
}

/** Pending and accepted requests on either side of you, newest first. */
export const listChatRequests = async (): Promise<ChatRequest[]> => {
	const { data } = await api.get<ChatRequest[]>("/chat-requests");

	return data;
};

/** Returns the existing request instead of stacking a second one if you tap twice. */
export const sendChatRequest = async (recipientUserId: string): Promise<ChatRequest> => {
	const { data } = await api.post<ChatRequest>("/chat-requests", { recipientUserId });

	return data;
};

export const withdrawChatRequest = async (requestId: string): Promise<ChatRequest> => {
	const { data } = await api.post<ChatRequest>(`/chat-requests/${requestId}/withdraw`);

	return data;
};

export const respondToChatRequest = async ({
	requestId,
	action,
}: {
	requestId: string;
	action: "accept" | "reject";
}): Promise<ChatRequest> => {
	const { data } = await api.post<ChatRequest>(`/chat-requests/${requestId}/respond`, { action });

	return data;
};
