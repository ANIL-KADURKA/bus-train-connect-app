import type { FC } from "react";
import React, { useEffect, useRef } from "react";
import { useIsOffline } from "../../hooks/useIsOffline";
import { useConfirmStore } from "../../store/confirmStore";
import { useOverlayStore } from "../../store/overlayStore";
import { ConfirmModal } from "./ConfirmModal";
import { OfflineModal } from "./OfflineModal";

let nextHostId = 0;

/**
 * Where app-wide overlays draw: the offline block, and whatever `confirm()` asked for.
 * Mount one at the app root, and one inside any full-screen Modal that should still show
 * them while it is open.
 *
 * Why more than one: iOS cannot present a Modal while another Modal is showing unless it
 * is nested inside it, so an overlay rendered only at the root would silently fail to
 * appear over, say, the Passengers sheet. Hosts register on mount and only the innermost
 * (most recently mounted) one renders — a Modal's children only mount while it is visible,
 * so the host inside the topmost open Modal is always the one that draws.
 *
 * Offline wins over a pending confirm: confirming anything without a connection would
 * just fail, and iOS can't show the two at once anyway. The confirm comes back after.
 */
export const OverlayHost: FC = () => {
	const id = useRef(++nextHostId).current;
	const isTop = useOverlayStore((state) => state.hosts[state.hosts.length - 1] === id);
	const request = useConfirmStore((state) => state.request);
	const close = useConfirmStore((state) => state.close);
	const { offline, retry } = useIsOffline();

	useEffect(() => {
		const { registerHost, unregisterHost } = useOverlayStore.getState();
		registerHost(id);

		return () => unregisterHost(id);
	}, [id]);

	if (!isTop) {
		return null;
	}

	if (offline) {
		return <OfflineModal visible onRetry={retry} />;
	}

	if (!request) {
		return null;
	}

	return (
		<ConfirmModal
			visible
			title={request.title}
			message={request.message}
			confirmLabel={request.confirmLabel}
			cancelLabel={request.cancelLabel}
			tone={request.tone}
			onCancel={close}
			onConfirm={() => {
				close();
				request.onConfirm();
			}}
		/>
	);
};
