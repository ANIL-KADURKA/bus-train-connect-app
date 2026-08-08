import type { SelectedPlace } from "../components/shared/PlaceInput";
import type { TransportMode } from "../store/modeStore";
import { api } from "./axios";

export interface CreateJourneyInput {
	transportType: TransportMode;
	/** Vehicle registration for a bus, train number for a train. */
	registrationNumber: string;
	serviceName?: string;
	/** Calendar date, "YYYY-MM-DD". */
	journeyDate: string;
	sourceLocation: string;
	sourcePlaceId: string;
	sourceLatitude: number;
	sourceLongitude: number;
	destinationLocation: string;
	destinationPlaceId: string;
	destinationLatitude: number;
	destinationLongitude: number;
	/** Train-only. */
	pnr?: string;
	coachNumber?: string;
	seatNo?: string;
	creationMethod?: "manual" | "ocr";
}

export interface Journey {
	journeyId: string;
	transportType: TransportMode;
	registrationNumber: string;
	serviceName?: string;
	pnr?: string;
	coachNumber?: string;
	seatNo?: string;
	journeyDate: string;
	sourceLocation: string;
	destinationLocation: string;
	status: string;
}

export interface JourneyListItem extends Journey {
	memberCount: number;
	/** True when you're already in this journey's group chat. */
	isMember: boolean;
	/** Distance from the searched cities. Only present on a route search. */
	sourceDistanceKm?: number;
	destinationDistanceKm?: number;
}

/** The default radius the backend applies; repeated here only for display. */
export const DEFAULT_RADIUS_KM = 10;

export type JourneySearch =
	| {
			kind: "route";
			source: SelectedPlace;
			destination: SelectedPlace;
			/** Calendar date, "YYYY-MM-DD". */
			journeyDate: string;
	  }
	| { kind: "registration"; registrationNumber: string };

interface JourneyListResponseItem extends Journey {
	memberCount: number | string;
	isMember: boolean | string | null;
	sourceDistanceKm?: number | string | null;
	destinationDistanceKm?: number | string | null;
}

const toBoolean = (value: boolean | string | null): boolean => value === true || value === "true";

const toOptionalNumber = (value: number | string | null | undefined): number | undefined => {
	if (value === null || value === undefined) {
		return undefined;
	}

	const parsed = Number(value);

	return Number.isFinite(parsed) ? parsed : undefined;
};

const searchParams = (search: JourneySearch): Record<string, string | number> => {
	if (search.kind === "registration") {
		return { registrationNumber: search.registrationNumber };
	}

	return {
		journeyDate: search.journeyDate,
		sourceLatitude: search.source.latitude,
		sourceLongitude: search.source.longitude,
		destinationLatitude: search.destination.latitude,
		destinationLongitude: search.destination.longitude,
		// Lets the backend also reach journeys created before coordinates existed.
		sourceLocation: search.source.text,
		destinationLocation: search.destination.text,
	};
};

export const listJourneys = async (
	transportType?: TransportMode,
	search?: JourneySearch,
): Promise<JourneyListItem[]> => {
	const { data } = await api.get<JourneyListResponseItem[]>("/journeys", {
		params: {
			...(transportType ? { transportType } : {}),
			...(search ? searchParams(search) : {}),
		},
	});

	return data.map((journey) => ({
		...journey,
		memberCount: Number(journey.memberCount ?? 0),
		isMember: toBoolean(journey.isMember),
		sourceDistanceKm: toOptionalNumber(journey.sourceDistanceKm),
		destinationDistanceKm: toOptionalNumber(journey.destinationDistanceKm),
	}));
};

export const joinJourney = async (journeyId: string): Promise<void> => {
	await api.post(`/journeys/${journeyId}/members`);
};

export interface CreateJourneyResult {
	journey: Journey;
	/** True when someone had already created this vehicle+date+origin and we joined it. */
	joinedExisting: boolean;
}

export const createJourney = async (input: CreateJourneyInput): Promise<CreateJourneyResult> => {
	const { data } = await api.post<CreateJourneyResult>("/journeys", input);

	return data;
};
