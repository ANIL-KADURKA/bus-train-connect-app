import { api } from "./axios";

export interface GroupMessage {
	messageId: string;
	journeyId: string;
	senderId: string;
	senderName: string;
	renderedText: string;
	messageType: string;
	createdAt: string;
}

export const listGroupMessages = async (journeyId: string): Promise<GroupMessage[]> => {
	const { data } = await api.get<GroupMessage[]>(`/journeys/${journeyId}/group-messages`);

	return data;
};
