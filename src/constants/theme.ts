/**
 * Transit Connect — design tokens
 * Single source of truth for colors, spacing, radius, typography.
 * Import { colors, spacing, radius, typography } wherever needed.
 */

export const colors = {
	// ── Backgrounds ───────────────────────────────────────────────
	navyDeep: "#0D1B2A", // darkest bg, hero, dark screens
	navyMid: "#1A2E45", // card / input bg (dark)
	navyCard: "#111D2B", // screen body bg (dark)

	// ── Brand accents ─────────────────────────────────────────────
	teal: "#00C9A7", // primary CTA, bus color, live-dot
	tealDeep: "#007A67", // teal pressed / dark variant
	tealMuted: "rgba(0,201,167,0.12)", // teal ghost bg
	tealBorder: "rgba(0,201,167,0.25)", // teal ghost border

	amber: "#F4A72A", // train stripe, warnings, highlights
	amberDeep: "#B87A1A", // amber pressed

	// ── Text ──────────────────────────────────────────────────────
	textPrimary: "#F0F4F8", // headings on dark
	textSecondary: "#7A8FA6", // body on dark
	textMuted: "#4A6A8A", // labels, placeholders

	// ── Light mode overrides ──────────────────────────────────────
	light: {
		bg: "#F0F6FF",
		card: "#EBF2FA",
		inputBg: "#FFFFFF",
		inputBorder: "rgba(0,0,0,0.10)",
		textPrimary: "#0D1B2A",
		textMuted: "#7A9AAA",
	},

	// ── Misc ──────────────────────────────────────────────────────
	slate: "#2A4A6A", // rail track color
	white: "#FFFFFF",
	black: "#000000",
} as const;

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
	// font sizes
	xs: 10,
	sm: 11,
	base: 14,
	md: 16,
	lg: 19,
	xl: 24,

	// weights
	regular: "400" as const,
	medium: "500" as const,
	bold: "700" as const,

	// letter spacing
	wide: 0.09,
	wider: 0.12,
} as const;
