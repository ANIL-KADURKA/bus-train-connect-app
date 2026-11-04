/**
 * Transit Connect Design System
 *
 * Brand -> Common colors used across all themes
 * Dark  -> Default app theme
 * Light -> Optional light theme
 */

// ==============================
// Brand Colors
// ==============================

export const brand = {
	// teal: "#00C9A7",
	teal: "#128C7E",
	tealDeep: "#007A67",
	tealMuted: "rgba(0,201,167,0.12)",
	tealBorder: "rgba(0,201,167,0.25)",
	amber: "#F4A72A",
	amberDeep: "#B87A1A",
	// Destructive actions only (withdraw, reject) — not for errors or warnings.
	danger: "#D64545",
} as const;

// Flip this to switch the entire app between dark and light mode for now.
export const isDarkMode = false;

// ==============================
// Dark Theme
// ==============================

export const dark = {
	background: "#0D1B2A",
	surface: "#111D2B",
	card: "#1A2E45",
	textPrimary: "#F0F4F8",
	textSecondary: "#7A8FA6",
	textMuted: "#4A6A8A",
	border: "rgba(255,255,255,0.10)",
	divider: "rgba(255,255,255,0.10)",
	inputBackground: "rgba(255,255,255,0.04)",
	inputBorder: "rgba(255,255,255,0.09)",
	white: "#FFFFFF",
	black: "#000000",
} as const;

// ==============================
// Light Theme
// ==============================

export const light = {
	// Backgrounds
	background: "#F0F6FF",
	surface: "#EBF2FA",
	card: "#FFFFFF",

	// Text
	textPrimary: "#0D1B2A",
	textSecondary: "#36526B",
	textMuted: "#7A9AAA",

	// Borders
	border: "rgba(0,0,0,0.10)",
	divider: "rgba(0,0,0,0.08)",

	// Inputs
	inputBackground: "#FFFFFF",
	inputBorder: "rgba(0,0,0,0.10)",

	white: "#FFFFFF",
	black: "#000000",
} as const;

export const theme = isDarkMode ? dark : light;

export const spacing = {
	xs: 4,
	sm: 8,
	md: 16,
	lg: 20,
	xl: 24,
	xxl: 32,
} as const;

export const radius = {
	sm: 8,
	md: 12,
	lg: 16,
	full: 999,
} as const;

export const typography = {
	xs: 10,
	sm: 11,
	base: 14,
	md: 16,
	lg: 19,
	xl: 24,

	regular: "400" as const,
	medium: "500" as const,
	bold: "700" as const,

	wide: 0.09,
	wider: 0.12,
} as const;
