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
	type JourneyMember,
	type JourneySearch,
	joinJourney,
	listJourneyMembers,
	listJourneys,
	listPassengers,
	type Passenger,
} from "../api/journeys";
import type { TransportMode } from "../store/modeStore";
import { useFirebaseAuth } from "./useUser";

/**
 * Stable cache key for a search. Only the fields the backend actually filters on, so
 * re-picking the same city from a different suggestion does not refetch.
 */
const searchKey = (search?: JourneySearch): unknown => {
	if (!search) {
		return null;
	}

	return search.kind === "registration"
		? { kind: "registration", registrationNumber: search.registrationNumber }
		: {
				kind: "route",
				journeyDate: search.journeyDate,
				source: [search.source.latitude, search.source.longitude],
				destination: [search.destination.latitude, search.destination.longitude],
			};
};

export const journeyKeys = {
	all: ["journeys"] as const,
	list: (transportType: TransportMode, search?: JourneySearch) =>
		[...journeyKeys.all, "list", transportType, searchKey(search)] as const,
	allList: () => [...journeyKeys.all, "list", "all", null] as const,
	members: (journeyId: string) => [...journeyKeys.all, "members", journeyId] as const,
	// Sorted so the same set of journeys in a different order reuses one cache entry.
	passengers: (journeyIds: string[]) =>
		[...journeyKeys.all, "passengers", [...journeyIds].sort().join(",")] as const,
};

/**
 * GET /journeys — upcoming journeys for the active transport mode.
 *
 * With no `search` this is the browse list, soonest first. With one it is the Home
 * search: by route (each end within the backend's radius, on a given date) or by
 * registration number.
 */
export const useJourneys = (
	transportType: TransportMode,
	search?: JourneySearch,
): UseQueryResult<JourneyListItem[]> => {
	const { uid, ready } = useFirebaseAuth();

	return useQuery({
		queryKey: journeyKeys.list(transportType, search),
		queryFn: () => listJourneys(transportType, search),
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

/**
 * GET /journeys/:id/members — everyone travelling on this journey.
 *
 * `enabled` gates on more than auth: the endpoint requires membership, so firing it
 * before the caller has joined would 403 and cache the failure. Callers pass false
 * while the members sheet is closed to keep the list fresh on each open.
 */
export const useJourneyMembers = (
	journeyId: string,
	enabled = true,
): UseQueryResult<JourneyMember[]> => {
	const { uid, ready } = useFirebaseAuth();

	return useQuery({
		queryKey: journeyKeys.members(journeyId),
		queryFn: () => listJourneyMembers(journeyId),
		enabled: enabled && ready && uid !== null,
	});
};

/** GET /journeys/passengers — distinct travellers across the journeys on screen. */
export const usePassengers = (journeyIds: string[]): UseQueryResult<Passenger[]> => {
	const { uid, ready } = useFirebaseAuth();

	return useQuery({
		queryKey: journeyKeys.passengers(journeyIds),
		queryFn: () => listPassengers(journeyIds),
		enabled: ready && uid !== null && journeyIds.length > 0,
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
