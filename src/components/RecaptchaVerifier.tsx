import type { ApplicationVerifier } from "@firebase/auth";
import { SDK_VERSION } from "firebase/app";
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Modal, StyleSheet } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { firebaseConfig } from "../lib/firebase";

/**
 * What `signInWithPhoneNumber` needs from a verifier. `_reset` is not in Firebase's public
 * type, but the SDK calls it after every attempt, so it has to exist.
 */
export type RecaptchaHandle = ApplicationVerifier & { _reset: () => void };

type Message = { type: "token"; token: string } | { type: "error"; message: string };

type Pending = { resolve: (token: string) => void; reject: (error: Error) => void };

/**
 * Firebase's invisible reCAPTCHA, run inside a WebView because the JS SDK only knows how to
 * verify in a browser. Most requests pass silently; the WebView only becomes visible when
 * Google decides to show a challenge.
 *
 * Served from the project's authDomain so reCAPTCHA accepts it as an authorised origin.
 */
const buildHtml = () => `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script src="https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth-compat.js"></script>
<script>
function send(message) {
	window.ReactNativeWebView.postMessage(JSON.stringify(message));
}
window.onload = function () {
	try {
		firebase.initializeApp(${JSON.stringify(firebaseConfig)});
		var verifier = new firebase.auth.RecaptchaVerifier("recaptcha", { size: "invisible" });
		verifier
			.verify()
			.then(function (token) { send({ type: "token", token: token }); })
			.catch(function (error) { send({ type: "error", message: String((error && error.message) || error) }); });
	} catch (error) {
		send({ type: "error", message: String((error && error.message) || error) });
	}
};
</script>
</head>
<body style="background: transparent; margin: 0;"><div id="recaptcha"></div></body>
</html>`;

export const RecaptchaVerifier = forwardRef<RecaptchaHandle>((_, ref) => {
	const [visible, setVisible] = useState(false);
	// Bumped per attempt so each verify() gets a fresh page and a fresh reCAPTCHA widget.
	const [attempt, setAttempt] = useState(0);
	const pending = useRef<Pending | null>(null);

	const settle = (outcome: { token: string } | { error: Error }) => {
		const current = pending.current;
		pending.current = null;
		setVisible(false);

		if (!current) return;
		if ("token" in outcome) current.resolve(outcome.token);
		else current.reject(outcome.error);
	};

	useImperativeHandle(ref, () => ({
		type: "recaptcha",
		verify: () =>
			new Promise<string>((resolve, reject) => {
				pending.current?.reject(new Error("Verification was restarted."));
				pending.current = { resolve, reject };
				setAttempt((n) => n + 1);
				setVisible(true);
			}),
		_reset: () => {},
	}));

	const handleMessage = (event: WebViewMessageEvent) => {
		const message = JSON.parse(event.nativeEvent.data) as Message;

		if (message.type === "token") settle({ token: message.token });
		else settle({ error: new Error(message.message) });
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="none"
			onRequestClose={() => settle({ error: new Error("Verification was cancelled.") })}
		>
			{visible && (
				<WebView
					key={attempt}
					style={styles.webView}
					originWhitelist={["*"]}
					javaScriptEnabled
					source={{ html: buildHtml(), baseUrl: `https://${firebaseConfig.authDomain}` }}
					onMessage={handleMessage}
					onError={() =>
						settle({ error: new Error("Could not reach verification. Check your connection.") })
					}
				/>
			)}
		</Modal>
	);
});

const styles = StyleSheet.create({
	webView: {
		flex: 1,
		backgroundColor: "transparent",
	},
});
