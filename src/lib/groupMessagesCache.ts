import type { GroupMessage } from "../api/groupMessages";

export const groupMessageKeys = {
	all: ["groupMessages"] as const,
	list: (journeyId: string) => [...groupMessageKeys.all, journeyId] as const,
};

export const mergeGroupMessage = (
	messages: GroupMessage[] | undefined,
	message: GroupMessage,
): GroupMessage[] => {
	if (messages?.some((item) => item.messageId === message.messageId)) {
		return messages;
	}

	return [...(messages ?? []), message].sort(
		(left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
	);
};
