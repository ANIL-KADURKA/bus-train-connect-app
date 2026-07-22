import { useQueryClient } from "@tanstack/react-query";
import { getAuth } from "firebase/auth";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { api } from "../api/axios";
import type { GroupMessage } from "../api/groupMessages";
import { useAllJourneys } from "../hooks/useJourneys";
import { useAuthStore } from "../store/authStore";
import { useGroupChatStore } from "../store/groupChatStore";
import { groupMessageKeys, mergeGroupMessage } from "../lib/groupMessagesCache";

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
	const joinedJourneyIdKey = joinedJourneys.map((journey) => journey.journeyId).sort().join("|");

	useEffect(() => {
		let cancelled = false;
		let nextSocket: Socket | null = null;

		const connect = async () => {
			const token = await getAuth().currentUser?.getIdToken();

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
			});
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
	}, [isConnected, joinedJourneyIdKey, joinedJourneys, joinJourneyChat]);

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

			socket.emit("journey:message", { journeyId, text: trimmed }, (response?: { ok?: boolean }) => {
				console.log("[group-chat] app received journey:message ack", {
					journeyId,
					socketId: socket.id,
					ok: response?.ok === true,
				});
			});
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
