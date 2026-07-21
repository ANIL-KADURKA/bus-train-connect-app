import {
	type UseMutationResult,
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	type CreateJourneyInput,
	type CreateJourneyResult,
	createJourney,
	type JourneyListItem,
	joinJourney,
	listJourneys,
} from "../api/journeys";
import type { TransportMode } from "../store/modeStore";
import { useFirebaseAuth } from "./useUser";

export const journeyKeys = {
	all: ["journeys"] as const,
	list: (transportType: TransportMode) => [...journeyKeys.all, "list", transportType] as const,
	allList: () => [...journeyKeys.all, "list", "all"] as const,
};

/** GET /journeys — upcoming journeys for the active transport mode, soonest first. */
export const useJourneys = (transportType: TransportMode): UseQueryResult<JourneyListItem[]> => {
	const { uid, ready } = useFirebaseAuth();

	return useQuery({
		queryKey: journeyKeys.list(transportType),
		queryFn: () => listJourneys(transportType),
		enabled: ready && uid !== null,
	});
};

/** GET /journeys — upcoming journeys across both transport modes. */
export const useAllJourneys = (): UseQueryResult<JourneyListItem[]> => {
	const { uid, ready } = useFirebaseAuth();

	return useQuery({
		queryKey: journeyKeys.allList(),
		queryFn: () => listJourneys(),
		enabled: ready && uid !== null,
	});
};

/** POST /journeys — creates the journey, or joins the existing one with the same identity. */
export const useCreateJourney = (): UseMutationResult<
	CreateJourneyResult,
	Error,
	CreateJourneyInput
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createJourney,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: journeyKeys.all });
		},
	});
};

/** POST /journeys/:id/members — joins an existing journey's group chat. */
export const useJoinJourney = (): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: joinJourney,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: journeyKeys.all });
		},
	});
};
