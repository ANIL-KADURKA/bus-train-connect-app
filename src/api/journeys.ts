import type { TransportMode } from "../store/modeStore";
import { api } from "./axios";

export interface CreateJourneyInput {
	transportType: TransportMode;
	serviceNumber: string;
	serviceName?: string;
	/** Calendar date, "YYYY-MM-DD". */
	journeyDate: string;
	sourceLocation: string;
	destinationLocation: string;
	/** Train-only. */
	pnr?: string;
	coachNumber?: string;
	seatNo?: string;
	creationMethod?: "manual" | "ocr";
}

export interface Journey {
	journeyId: string;
	transportType: TransportMode;
	serviceNumber: string;
	serviceName?: string;
	journeyDate: string;
	sourceLocation: string;
	destinationLocation: string;
	status: string;
}

export interface JourneyListItem extends Journey {
	memberCount: number;
	/** True when you're already in this journey's group chat. */
	isMember: boolean;
}

export const listJourneys = async (transportType?: TransportMode): Promise<JourneyListItem[]> => {
	const { data } = await api.get<JourneyListItem[]>("/journeys", {
		params: transportType ? { transportType } : undefined,
	});

	return data;
};

export const joinJourney = async (journeyId: string): Promise<void> => {
	await api.post(`/journeys/${journeyId}/members`);
};

export interface CreateJourneyResult {
	journey: Journey;
	/** True when someone had already created this service+date and we joined it. */
	joinedExisting: boolean;
}

export const createJourney = async (input: CreateJourneyInput): Promise<CreateJourneyResult> => {
	const { data } = await api.post<CreateJourneyResult>("/journeys", input);

	return data;
};
