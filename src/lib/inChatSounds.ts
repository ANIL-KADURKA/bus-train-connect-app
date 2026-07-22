import { useAudioPlayer } from "expo-audio";
import { useCallback } from "react";

type SoundEvent = "send" | "receive";

const sendSound = require("../../assets/sounds/chat-send.wav");
const receiveSound = require("../../assets/sounds/chat-receive.wav");

export const useInChatSounds = () => {
	const sendPlayer = useAudioPlayer(sendSound);
	const receivePlayer = useAudioPlayer(receiveSound);

	return useCallback(
		(event: SoundEvent) => {
			const player = event === "send" ? sendPlayer : receivePlayer;

			try {
				player.seekTo(0);
				player.play();
			} catch {
				// In-chat sounds are best-effort feedback, not part of message delivery.
			}
		},
		[receivePlayer, sendPlayer],
	);
};
