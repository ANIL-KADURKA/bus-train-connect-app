import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { listGroupMessages, type GroupMessage } from "../api/groupMessages";
import { groupMessageKeys } from "../lib/groupMessagesCache";
import { useGroupChatSocket } from "../providers/GroupChatSocketProvider";
import { useGroupChatStore } from "../store/groupChatStore";

interface UseGroupChatResult {
	messages: GroupMessage[];
	isLoading: boolean;
	isConnected: boolean;
	sendMessage: (text: string) => void;
}

export const useGroupChat = (journeyId: string): UseGroupChatResult => {
	const {
		joinedJourneyIds,
		joinJourneyChat,
		sendMessage: sendSocketMessage,
	} = useGroupChatSocket();
	const setActiveJourneyId = useGroupChatStore((state) => state.setActiveJourneyId);
	const markRead = useGroupChatStore((state) => state.markRead);
	const history = useQuery({
		queryKey: groupMessageKeys.list(journeyId),
		queryFn: async () => {
			const messages = await listGroupMessages(journeyId);

			console.log("[group-chat] fetched message history", {
				journeyId,
				count: messages.length,
			});

			return messages;
		},
	});

	useEffect(() => {
		setActiveJourneyId(journeyId);
		markRead(journeyId);
		joinJourneyChat(journeyId);

		return () => setActiveJourneyId(null);
	}, [joinJourneyChat, journeyId, markRead, setActiveJourneyId]);

	const sendMessage = (text: string) => {
		sendSocketMessage(journeyId, text);
	};

	return {
		messages: history.data ?? [],
		isLoading: history.isLoading,
		isConnected: joinedJourneyIds.has(journeyId),
		sendMessage,
	};
};
