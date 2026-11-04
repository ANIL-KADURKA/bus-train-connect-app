import { useQueryClient } from "@tanstack/react-query";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { api } from "../api/axios";
import type { DirectMessage } from "../api/directChats";
import type { GroupMessage } from "../api/groupMessages";
import { chatRequestKeys } from "../hooks/useChatRequests";
import { directChatKeys, mergeDirectMessage } from "../hooks/useDirectChat";
import { useAllJourneys } from "../hooks/useJourneys";
import { firebaseAuth } from "../lib/firebase";
import { groupMessageKeys, mergeGroupMessage } from "../lib/groupMessagesCache";
import { useAuthStore } from "../store/authStore";
import { useGroupChatStore } from "../store/groupChatStore";

const socketUrl = String(api.defaults.baseURL ?? "").replace(/\/$/, "");

interface GroupChatSocketContextValue {
	isConnected: boolean;
	joinedJourneyIds: Set<string>;
	joinJourneyChat: (journeyId: string) => void;
	sendMessage: (journeyId: string, text: string) => void;
}

const GroupChatSocketContext = createContext<GroupChatSocketContextValue | null>(null);

export const useGroupChatSocket = (): GroupChatSocketContextValue => {
	const value = useContext(GroupChatSocketContext);

	if (!value) {
		throw new Error("useGroupChatSocket must be used inside GroupChatSocketProvider");
	}

	return value;
};

export const GroupChatSocketProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
	const queryClient = useQueryClient();
	const currentUserId = useAuthStore((state) => state.user?.userId);
	const { data: journeys } = useAllJourneys();
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [joinedJourneyIds, setJoinedJourneyIds] = useState<Set<string>>(new Set());
	const joinedJourneys = useMemo(
		() => (journeys ?? []).filter((journey) => journey.isMember),
		[journeys],
	);
	useEffect(() => {
		let cancelled = false;
		let nextSocket: Socket | null = null;

		const connect = async () => {
			const token = await firebaseAuth.currentUser?.getIdToken();

			if (!token || cancelled) {
				console.log("[group-chat] app socket connect skipped", {
					reason: token ? "cancelled" : "missing-token",
				});
				return;
			}

			console.log("[group-chat] app socket connecting", { socketUrl });

			nextSocket = io(socketUrl, {
				transports: ["websocket"],
				auth: { token },
			});

			nextSocket.on("connect", () => {
				console.log("[group-chat] app socket connected", { socketId: nextSocket?.id });
				setIsConnected(true);
				// Events sent while we were offline are gone, so resync on every (re)connect.
				queryClient.invalidateQueries({ queryKey: chatRequestKeys.all });
				queryClient.invalidateQueries({ queryKey: directChatKeys.all });
			});
			nextSocket.on("dm:message", (message: DirectMessage) => {
				mergeDirectMessage(queryClient, message);
			});
			// Either person declined or reopened: the chat's canMessage and the list labels change.
			nextSocket.on("dm:chat-updated", ({ chatId }: { chatId: string }) => {
				queryClient.invalidateQueries({ queryKey: directChatKeys.chat(chatId) });
				queryClient.invalidateQueries({ queryKey: chatRequestKeys.all });
			});
			// The server pushes these to the other side of a request (received/withdrawn to the
			// recipient, accepted/rejected to the requester). Refetching is enough: the list
			// endpoint is what every card label and the Chat requests screen derive from.
			for (const event of [
				"chat-request:received",
				"chat-request:withdrawn",
				"chat-request:accepted",
				"chat-request:rejected",
			]) {
				nextSocket.on(event, () => {
					queryClient.invalidateQueries({ queryKey: chatRequestKeys.all });
				});
			}
			nextSocket.on("disconnect", (reason) => {
				console.log("[group-chat] app socket disconnected", { reason });
				setIsConnected(false);
				setJoinedJourneyIds(new Set());
			});
			nextSocket.on("connect_error", (error) => {
				console.log("[group-chat] app socket connect_error", { message: error.message });
			});
			nextSocket.on("journey:message", (message: GroupMessage) => {
				console.log("[group-chat] app received journey:message", {
					journeyId: message.journeyId,
					messageId: message.messageId,
					senderId: message.senderId,
				});
				queryClient.setQueryData<GroupMessage[]>(
					groupMessageKeys.list(message.journeyId),
					(messages) => mergeGroupMessage(messages, message),
				);

				const { activeJourneyId, addUnread } = useGroupChatStore.getState();
				if (message.senderId !== currentUserId && activeJourneyId !== message.journeyId) {
					addUnread(message.journeyId);
				}
			});

			setSocket(nextSocket);
		};

		void connect();

		return () => {
			cancelled = true;
			nextSocket?.disconnect();
			setSocket(null);
			setIsConnected(false);
			setJoinedJourneyIds(new Set());
		};
	}, [currentUserId, queryClient]);

	const joinJourneyChat = useCallback(
		(journeyId: string) => {
			if (!socket || !isConnected || joinedJourneyIds.has(journeyId)) {
				return;
			}

			socket.emit("journey:join", { journeyId }, (response?: { ok?: boolean }) => {
				const joined = response?.ok === true;

				console.log("[group-chat] app received journey:join ack", {
					journeyId,
					socketId: socket.id,
					joined,
				});

				if (joined) {
					setJoinedJourneyIds((ids) => new Set(ids).add(journeyId));
				}
			});
			console.log("[group-chat] app emitted journey:join", {
				journeyId,
				socketId: socket.id,
			});
		},
		[isConnected, joinedJourneyIds, socket],
	);

	useEffect(() => {
		if (!isConnected) {
			return;
		}

		for (const journey of joinedJourneys) {
			joinJourneyChat(journey.journeyId);
		}
	}, [isConnected, joinedJourneys, joinJourneyChat]);

	const sendMessage = useCallback(
		(journeyId: string, text: string) => {
			const trimmed = text.trim();

			if (!trimmed || !socket || !joinedJourneyIds.has(journeyId)) {
				console.log("[group-chat] app send skipped", {
					journeyId,
					hasSocket: Boolean(socket),
					joined: joinedJourneyIds.has(journeyId),
					textLength: trimmed.length,
				});
				return;
			}

			socket.emit(
				"journey:message",
				{ journeyId, text: trimmed },
				(response?: { ok?: boolean }) => {
					console.log("[group-chat] app received journey:message ack", {
						journeyId,
						socketId: socket.id,
						ok: response?.ok === true,
					});
				},
			);
			console.log("[group-chat] app emitted journey:message", {
				journeyId,
				socketId: socket.id,
				textLength: trimmed.length,
			});
		},
		[joinedJourneyIds, socket],
	);

	const value = useMemo(
		() => ({ isConnected, joinedJourneyIds, joinJourneyChat, sendMessage }),
		[isConnected, joinedJourneyIds, joinJourneyChat, sendMessage],
	);

	return (
		<GroupChatSocketContext.Provider value={value}>{children}</GroupChatSocketContext.Provider>
	);
};
