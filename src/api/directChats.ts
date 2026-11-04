import { api } from "./axios";
import type { ChatRequestUser } from "./chatRequests";

/** Mirrors the backend's MAX_DIRECT_MESSAGE_LENGTH. */
export const MAX_DIRECT_MESSAGE_LENGTH = 2000;

/**
 * A private chat from the signed-in user's side. `canMessage` is false while either person
 * has declined; only the one who declined can reopen it.
 */
export interface DirectChat {
	chatId: string;
	otherUser: ChatRequestUser;
	declinedByMe: boolean;
	declinedByThem: boolean;
	canMessage: boolean;
}

export interface DirectMessage {
	messageId: string;
	chatId: string;
	senderId: string;
	text: string;
	sentAt: string;
}

export const getDirectChat = async (chatId: string): Promise<DirectChat> => {
	const { data } = await api.get<DirectChat>(`/chats/${chatId}`);

	return data;
};

/** Oldest first — the latest page of history. */
export const listDirectMessages = async (chatId: string): Promise<DirectMessage[]> => {
	const { data } = await api.get<DirectMessage[]>(`/chats/${chatId}/messages`);

	return data;
};

export const sendDirectMessage = async ({
	chatId,
	text,
}: {
	chatId: string;
	text: string;
}): Promise<DirectMessage> => {
	const { data } = await api.post<DirectMessage>(`/chats/${chatId}/messages`, { text });

	return data;
};

export const declineDirectChat = async (chatId: string): Promise<DirectChat> => {
	const { data } = await api.post<DirectChat>(`/chats/${chatId}/decline`);

	return data;
};

/** Marks everything they sent you in this chat as read. */
export const markDirectChatRead = async (chatId: string): Promise<{ readCount: number }> => {
	const { data } = await api.post<{ readCount: number }>(`/chats/${chatId}/read`);

	return data;
};

/** Undoes your own decline. The chat only reopens if the other person hasn't declined too. */
export const acceptDirectChat = async (chatId: string): Promise<DirectChat> => {
	const { data } = await api.post<DirectChat>(`/chats/${chatId}/accept`);

	return data;
};
