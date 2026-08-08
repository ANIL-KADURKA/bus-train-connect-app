const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Formats a Date as the 'YYYY-MM-DD' the API expects, in local time.
 *
 * Deliberately not toISOString(): that converts to UTC first, which shifts the calendar
 * day backwards for anyone east of Greenwich — including every user of this app.
 */
export const toIsoDate = (date: Date): string => {
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const day = `${date.getDate()}`.padStart(2, "0");

	return `${date.getFullYear()}-${month}-${day}`;
};

/** "2026-07-21" -> "21 Jul". Kept local so no date library is needed. */
export const formatShortDate = (isoDate: string): string => {
	const [year, month, day] = isoDate.split("-").map(Number);

	if (!year || !month || !day) {
		return isoDate;
	}

	return `${day} ${MONTHS[month - 1]}`;
};
