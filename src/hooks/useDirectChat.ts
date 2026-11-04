import {
	type QueryClient,
	type UseMutationResult,
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	acceptDirectChat,
	type DirectChat,
	type DirectMessage,
	declineDirectChat,
	getDirectChat,
	listDirectMessages,
	sendDirectMessage,
} from "../api/directChats";
import { chatRequestKeys } from "./useChatRequests";
import { useFirebaseAuth } from "./useUser";

export const directChatKeys = {
	all: ["directChats"] as const,
	chat: (chatId: string) => [...directChatKeys.all, "chat", chatId] as const,
	messages: (chatId: string) => [...directChatKeys.all, "messages", chatId] as const,
};

/**
 * Adds a message to a chat's cached history, once. The sender gets it twice — from the
 * POST response and from the socket echo — so this has to be idempotent.
 */
export const mergeDirectMessage = (queryClient: QueryClient, message: DirectMessage): void => {
	queryClient.setQueryData<DirectMessage[]>(directChatKeys.messages(message.chatId), (current) => {
		if (current?.some((item) => item.messageId === message.messageId)) {
			return current;
		}

		return [...(current ?? []), message].sort(
			(left, right) => new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime(),
		);
	});
};

/** GET /chats/:id — who you're talking to and whether messages can flow. */
export const useDirectChat = (chatId: string): UseQueryResult<DirectChat> => {
	const { uid, ready } = useFirebaseAuth();

	return useQuery({
		queryKey: directChatKeys.chat(chatId),
		queryFn: () => getDirectChat(chatId),
		enabled: ready && uid !== null,
	});
};

/** GET /chats/:id/messages. New messages arrive by socket (see GroupChatSocketProvider). */
export const useDirectMessages = (chatId: string): UseQueryResult<DirectMessage[]> => {
	const { uid, ready } = useFirebaseAuth();

	return useQuery({
		queryKey: directChatKeys.messages(chatId),
		queryFn: () => listDirectMessages(chatId),
		enabled: ready && uid !== null,
	});
};

export const useSendDirectMessage = (): UseMutationResult<
	DirectMessage,
	Error,
	{ chatId: string; text: string }
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: sendDirectMessage,
		onSuccess: (message) => mergeDirectMessage(queryClient, message),
	});
};

/**
 * Decline / accept again. Both refresh the chat itself and the chat-request list, since
 * the Chat requests screen and the DM list label rows by these flags too.
 */
const useChatDecision = (
	mutationFn: (chatId: string) => Promise<DirectChat>,
): UseMutationResult<DirectChat, Error, string> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn,
		onSuccess: (chat) => {
			queryClient.setQueryData(directChatKeys.chat(chat.chatId), chat);
			return queryClient.invalidateQueries({ queryKey: chatRequestKeys.all });
		},
	});
};

export const useDeclineDirectChat = () => useChatDecision(declineDirectChat);

export const useAcceptDirectChat = () => useChatDecision(acceptDirectChat);
