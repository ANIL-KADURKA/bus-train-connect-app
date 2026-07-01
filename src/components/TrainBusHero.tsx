/**
 * TransitHero
 * Animated hero scene: realistic bus + train ride across a night cityscape.
 * Drop this anywhere — it manages its own animation loop via useEffect.
 *
 * Props:
 *   height?  — scene height in px (default 150)
 *   style?   — extra ViewStyle applied to the outer container
 */

import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, Line, Path, Rect, Text as SvgText } from "react-native-svg";

import { colors } from "../constants/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransitHeroProps {
	height?: number;
	style?: object;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Detailed city skyline silhouette */
const CitySkyline: React.FC = () => (
	<Svg width={300} height={55} viewBox="0 0 300 55" style={StyleSheet.absoluteFillObject}>
		{/* Left cluster */}
		<Rect x={10} y={25} width={18} height={30} fill="#0F2235" opacity={0.8} />
		<Rect x={13} y={28} width={3} height={3} fill={colors.amber} opacity={0.4} />
		<Rect x={19} y={28} width={3} height={3} fill={colors.amber} opacity={0.3} />
		<Rect x={13} y={34} width={3} height={3} fill={colors.teal} opacity={0.3} />

		<Rect x={32} y={10} width={14} height={45} fill="#0F2235" opacity={0.85} />
		<Rect x={35} y={14} width={3} height={3} fill={colors.teal} opacity={0.4} />
		<Rect x={40} y={14} width={3} height={3} fill={colors.teal} opacity={0.3} />
		<Rect x={35} y={20} width={3} height={3} fill="#5A9AB5" opacity={0.3} />
		<Rect x={40} y={20} width={3} height={3} fill={colors.amber} opacity={0.35} />
		<Rect x={36} y={0} width={4} height={10} fill="#0F2235" opacity={0.7} />

		<Rect x={50} y={18} width={22} height={37} fill="#112030" opacity={0.8} />
		<Rect x={53} y={22} width={4} height={5} fill="#5A9AB5" opacity={0.4} />
		<Rect x={60} y={22} width={4} height={5} fill="#5A9AB5" opacity={0.35} />
		<Rect x={53} y={30} width={4} height={5} fill={colors.amber} opacity={0.3} />
		<Rect x={60} y={30} width={4} height={5} fill={colors.teal} opacity={0.3} />

		<Rect x={76} y={30} width={12} height={25} fill="#0F2235" opacity={0.75} />
		<Rect x={79} y={33} width={3} height={3} fill={colors.amber} opacity={0.4} />

		{/* Right cluster */}
		<Rect x={200} y={20} width={16} height={35} fill="#0F2235" opacity={0.8} />
		<Rect x={203} y={24} width={4} height={5} fill={colors.teal} opacity={0.4} />
		<Rect x={209} y={24} width={4} height={5} fill={colors.teal} opacity={0.3} />

		<Rect x={220} y={8} width={18} height={47} fill="#112030" opacity={0.85} />
		<Rect x={223} y={12} width={4} height={5} fill={colors.amber} opacity={0.45} />
		<Rect x={230} y={12} width={4} height={5} fill={colors.amber} opacity={0.3} />
		<Rect x={223} y={20} width={4} height={5} fill="#5A9AB5" opacity={0.35} />
		<Rect x={230} y={20} width={4} height={5} fill={colors.teal} opacity={0.3} />
		<Rect x={225} y={0} width={5} height={8} fill="#112030" opacity={0.7} />

		<Rect x={242} y={22} width={20} height={33} fill="#0F2235" opacity={0.8} />
		<Rect x={245} y={26} width={4} height={4} fill={colors.teal} opacity={0.4} />
		<Rect x={252} y={26} width={4} height={4} fill={colors.teal} opacity={0.35} />

		<Rect x={265} y={15} width={14} height={40} fill="#112030" opacity={0.8} />
		<Rect x={268} y={19} width={3} height={4} fill={colors.amber} opacity={0.4} />
		<Rect x={273} y={19} width={3} height={4} fill={colors.amber} opacity={0.3} />

		<Rect x={282} y={28} width={18} height={27} fill="#0F2235" opacity={0.75} />
		<Rect x={285} y={31} width={3} height={3} fill="#5A9AB5" opacity={0.4} />
	</Svg>
);

/** Detailed realistic city bus (right-facing) */
const BusSvg: React.FC = () => (
	<Svg width={110} height={52} viewBox="0 0 110 52">
		{/* Shadow */}
		<Ellipse cx={55} cy={51} rx={48} ry={3} fill="#000" opacity={0.25} />
		{/* Body */}
		<Rect x={3} y={6} width={104} height={36} rx={6} fill="#1E8A72" />
		<Rect x={3} y={6} width={104} height={10} rx={6} fill="#22A080" />
		<Rect x={3} y={12} width={104} height={4} fill="#22A080" />
		{/* White stripe */}
		<Rect x={3} y={20} width={104} height={3} fill="#E8F8F4" opacity={0.85} />
		{/* Lower body */}
		<Rect x={3} y={23} width={104} height={19} fill="#1A7060" />
		<Rect x={3} y={38} width={104} height={4} rx={3} fill="#155A4E" />
		{/* Front face */}
		<Rect x={93} y={6} width={14} height={36} fill="#1A7060" />
		<Rect x={100} y={6} width={7} height={36} rx={6} fill="#1A7060" />
		{/* Windshield */}
		<Rect x={88} y={9} width={14} height={16} rx={3} fill="#7ECFEC" opacity={0.85} />
		<Line x1={95} y1={9} x2={95} y2={25} stroke="#5ABBD8" strokeWidth={0.7} opacity={0.5} />
		{/* Headlights */}
		<Rect x={98} y={10} width={7} height={5} rx={2} fill="#FFF5CC" />
		<Ellipse cx={101} cy={12} rx={3} ry={1.5} fill="#FFE066" opacity={0.7} />
		{/* Turn signal */}
		<Rect x={98} y={17} width={7} height={3} rx={1} fill={colors.amber} />
		{/* Bumper */}
		<Rect x={99} y={35} width={8} height={4} rx={2} fill="#0F4A3C" />
		{/* Rear light */}
		<Rect x={3} y={9} width={9} height={14} rx={2} fill="#7ECFEC" opacity={0.7} />
		<Rect x={3} y={25} width={6} height={5} rx={1} fill="#FF4444" opacity={0.9} />
		{/* Windows */}
		{[18, 35, 52, 69].map((x) => (
			<React.Fragment key={`bus-window-${x}`}>
				<Rect x={x} y={9} width={14} height={11} rx={2.5} fill="#7ECFEC" opacity={0.9} />
				<Line
					x1={x + 7}
					y1={9}
					x2={x + 7}
					y2={20}
					stroke="#5ABBD8"
					strokeWidth={0.6}
					opacity={0.5}
				/>
				<Rect x={x + 1} y={10} width={4} height={4} rx={1} fill="#fff" opacity={0.18} />
			</React.Fragment>
		))}
		{/* Door */}
		<Rect x={35} y={22} width={16} height={16} rx={2} fill="#155A4E" />
		<Rect x={36} y={23} width={14} height={9} rx={1.5} fill="#7ECFEC" opacity={0.6} />
		<Rect x={43} y={32} width={2} height={4} rx={1} fill="#0F4A3C" />
		{/* Destination board */}
		<Rect x={17} y={23} width={16} height={7} rx={1.5} fill="#0A1A14" />
		<Rect x={18} y={24} width={7} height={2} rx={0.5} fill={colors.teal} opacity={0.9} />
		<Rect x={18} y={27} width={5} height={1.5} rx={0.5} fill={colors.teal} opacity={0.5} />
		{/* Undercarriage */}
		<Rect x={8} y={38} width={90} height={3} rx={1} fill="#0F4A3C" />
		{/* Wheels */}
		{[22, 86].map((cx) => (
			<React.Fragment key={`bus-wheel-${cx}`}>
				<Circle cx={cx} cy={44} r={7} fill="#1A1A2E" />
				<Circle cx={cx} cy={44} r={5} fill="#2A2A3E" />
				<Circle cx={cx} cy={44} r={3} fill="#3A3A4E" />
				<Circle cx={cx} cy={44} r={1.5} fill="#C0C8D8" />
				<Circle cx={cx} cy={40} r={0.8} fill="#8A9AB5" />
				<Circle cx={cx} cy={48} r={0.8} fill="#8A9AB5" />
				<Circle cx={cx - 4} cy={44} r={0.8} fill="#8A9AB5" />
				<Circle cx={cx + 4} cy={44} r={0.8} fill="#8A9AB5" />
			</React.Fragment>
		))}
		{/* Mud flaps */}
		<Rect x={28} y={39} width={3} height={6} rx={1} fill="#0F4A3C" />
		<Rect x={78} y={39} width={3} height={6} rx={1} fill="#0F4A3C" />
		{/* Label */}
		<SvgText
			x={55}
			y={35}
			textAnchor="middle"
			fontSize={5.5}
			fontWeight="700"
			fill="#E8F8F4"
			opacity={0.85}
			fontFamily="sans-serif"
			letterSpacing={2}
		>
			BEST BUS
		</SvgText>
	</Svg>
);

/** Detailed realistic metro train (left-facing) */
const TrainSvg: React.FC = () => (
	<Svg width={130} height={44} viewBox="0 0 130 44">
		{/* Shadow */}
		<Ellipse cx={65} cy={43} rx={58} ry={2.5} fill="#000" opacity={0.2} />
		{/* Underframe */}
		<Rect x={5} y={28} width={120} height={8} rx={2} fill="#1A2E3A" />
		{/* Body */}
		<Rect x={4} y={6} width={122} height={26} rx={5} fill="#2B4A6A" />
		{/* Roof */}
		<Rect x={4} y={6} width={122} height={8} rx={5} fill="#1E3858" />
		<Rect x={4} y={11} width={122} height={3} fill="#1E3858" />
		{/* Amber stripe */}
		<Rect x={4} y={14} width={122} height={4} fill={colors.amber} />
		{/* Blue mid band */}
		<Rect x={4} y={18} width={122} height={3} fill="#3A6A96" />
		{/* Front cab */}
		<Rect x={108} y={6} width={18} height={28} rx={5} fill="#1E3858" />
		<Path d="M108 8 Q120 7 126 14 L126 24 Q120 26 108 26 Z" fill="#5AB8E0" opacity={0.85} />
		<Path d="M115 8 Q122 8 126 14" stroke="#3A9ACC" strokeWidth={0.7} fill="none" opacity={0.5} />
		<Rect x={118} y={9} width={8} height={4} rx={2} fill="#FFF5CC" />
		<Ellipse cx={122} cy={11} rx={3} ry={1.5} fill="#FFE066" opacity={0.7} />
		<Rect x={118} y={15} width={8} height={2.5} rx={1} fill={colors.amber} />
		<Rect x={124} y={22} width={6} height={4} rx={1} fill="#1A2E3A" />
		{/* Rear */}
		<Rect x={0} y={8} width={8} height={18} rx={3} fill="#5AB8E0" opacity={0.7} />
		<Rect x={0} y={23} width={6} height={4} rx={1} fill="#FF4444" opacity={0.9} />
		{/* Windows */}
		{[10, 32, 54, 76].map((x) => (
			<React.Fragment key={`train-window-${x}`}>
				<Rect x={x} y={7} width={18} height={11} rx={2.5} fill="#5AB8E0" opacity={0.85} />
				<Line
					x1={x + 9}
					y1={7}
					x2={x + 9}
					y2={18}
					stroke="#3A9ACC"
					strokeWidth={0.7}
					opacity={0.5}
				/>
				<Rect x={x + 1} y={8} width={5} height={4} rx={1} fill="#fff" opacity={0.15} />
			</React.Fragment>
		))}
		{/* Coach dividers */}
		{[29, 51, 73, 95].map((x) => (
			<Rect key={`train-divider-${x}`} x={x} y={6} width={2} height={28} rx={1} fill="#1A2E3A" />
		))}
		{/* Doors */}
		{[27, 49, 71, 93].map((x) => (
			<Rect key={`train-door-${x}`} x={x} y={18} width={4} height={14} rx={1} fill="#1A2E3A" />
		))}
		{/* Pantograph */}
		<Line x1={60} y1={6} x2={55} y2={0} stroke="#7AAABB" strokeWidth={1.2} />
		<Line x1={60} y1={6} x2={65} y2={0} stroke="#7AAABB" strokeWidth={1.2} />
		<Line x1={55} y1={0} x2={65} y2={0} stroke="#7AAABB" strokeWidth={1.5} />
		{/* Wheels */}
		{[18, 42, 88, 112].map((cx) => (
			<React.Fragment key={`train-wheel-${cx}`}>
				<Circle cx={cx} cy={38} r={5} fill="#1A1A2E" />
				<Circle cx={cx} cy={38} r={3.5} fill="#252535" />
				<Circle cx={cx} cy={38} r={2} fill="#3A3A50" />
				<Circle cx={cx} cy={38} r={1} fill="#8A9AB5" />
			</React.Fragment>
		))}
		{/* Axle bars */}
		<Rect x={13} y={37} width={34} height={2} rx={1} fill="#2A3A4A" />
		<Rect x={83} y={37} width={34} height={2} rx={1} fill="#2A3A4A" />
		{/* Route board */}
		<Rect x={10} y={20} width={18} height={6} rx={1.5} fill="#0A1520" />
		<Rect x={11} y={21} width={8} height={1.5} rx={0.5} fill={colors.teal} opacity={0.9} />
		<Rect x={11} y={23.5} width={6} height={1.5} rx={0.5} fill={colors.amber} opacity={0.7} />
	</Svg>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const TransitHero: React.FC<TransitHeroProps> = ({ height = 150, style }) => {
	const busX = useRef(new Animated.Value(-120)).current;
	const trainX = useRef(new Animated.Value(320)).current;

	useEffect(() => {
		const SCENE_W = 300;
		const BUS_W = 120;
		const TRAIN_W = 140;
		const SPEED_MS = 2200; // ms to cross the screen

		const runLoop = () => {
			// 1. Bus enters left → exits right
			busX.setValue(-BUS_W);
			Animated.timing(busX, {
				toValue: SCENE_W + 10,
				duration: SPEED_MS,
				easing: Easing.linear,
				useNativeDriver: true,
			}).start(() => {
				// 2. Short pause, then train enters right → exits left
				setTimeout(() => {
					trainX.setValue(SCENE_W + 10);
					Animated.timing(trainX, {
						toValue: -TRAIN_W,
						duration: SPEED_MS,
						easing: Easing.linear,
						useNativeDriver: true,
					}).start(() => {
						// 3. Pause, repeat
						setTimeout(runLoop, 600);
					});
				}, 500);
			});
		};

		runLoop();
		return () => {
			busX.stopAnimation();
			trainX.stopAnimation();
		};
	}, [busX, trainX]);

	return (
		<View style={[styles.container, { height }, style]}>
			{/* Sky glow */}
			<View style={styles.skyGlow} />

			{/* Stars */}
			<Svg width={300} height={60} style={styles.stars} viewBox="0 0 300 60">
				{[
					[20, 8, 0.8, 0.6],
					[55, 15, 0.6, 0.4],
					[90, 6, 1, 0.7],
					[130, 18, 0.7, 0.5],
					[165, 9, 0.8, 0.6],
					[200, 20, 0.6, 0.4],
					[240, 7, 1, 0.7],
					[275, 14, 0.7, 0.5],
					[42, 28, 0.5, 0.3],
					[110, 30, 0.6, 0.35],
					[180, 32, 0.5, 0.3],
					[255, 26, 0.6, 0.35],
				].map(([cx, cy, r, op]) => (
					<Circle
						key={`star-${cx}-${cy}-${r}-${op}`}
						cx={cx}
						cy={cy}
						r={r}
						fill="#fff"
						opacity={op}
					/>
				))}
			</Svg>

			{/* City skyline */}
			<View style={[styles.cityLayer, { bottom: 38 }]}>
				<CitySkyline />
			</View>

			{/* Road surface */}
			<View style={styles.road}>
				{/* Dashed center line */}
				<View style={styles.roadLine} />
			</View>

			{/* Rail sleepers */}
			<View style={styles.sleepersRow}>
				{Array.from({ length: 30 }, (_, index) => ({ id: `sleeper-${index + 1}` })).map(
					(sleeper) => (
						<View key={sleeper.id} style={styles.sleeper} />
					),
				)}
			</View>

			{/* Rails */}
			<View style={[styles.rail, { bottom: 36 }]} />
			<View style={[styles.rail, { bottom: 28 }]} />

			{/* Bus (road level, above rails visually) */}
			<Animated.View style={[styles.vehicle, { bottom: 36, transform: [{ translateX: busX }] }]}>
				<BusSvg />
			</Animated.View>

			{/* Train (rail level) */}
			<Animated.View style={[styles.vehicle, { bottom: 28, transform: [{ translateX: trainX }] }]}>
				<TrainSvg />
			</Animated.View>
		</View>
	);
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	container: {
		width: "100%",
		backgroundColor: colors.navyDeep,
		overflow: "hidden",
		position: "relative",
	},
	skyGlow: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 70,
		// RN doesn't support radial-gradient; a subtle dark-to-slightly-lighter is enough
		backgroundColor: "#132233",
		opacity: 0.9,
	},
	stars: {
		position: "absolute",
		top: 0,
		left: 0,
	},
	cityLayer: {
		position: "absolute",
		left: 0,
		width: 300,
		height: 55,
	},
	road: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		height: 38,
		backgroundColor: "#141E2B",
	},
	roadLine: {
		position: "absolute",
		top: 17,
		left: 0,
		right: 0,
		height: 2,
		// Dashed via backgroundColor repeating — use a View array for true dashes
		backgroundColor: "transparent",
		borderStyle: "dashed",
		borderTopWidth: 2,
		borderTopColor: colors.amber,
		opacity: 0.5,
	},
	sleepersRow: {
		position: "absolute",
		bottom: 25,
		left: 0,
		flexDirection: "row",
		gap: 10,
		paddingHorizontal: 2,
		height: 14,
	},
	sleeper: {
		width: 7,
		height: 14,
		backgroundColor: "#1E3348",
		borderRadius: 1,
		opacity: 0.5,
	},
	rail: {
		position: "absolute",
		left: 0,
		right: 0,
		height: 2,
		backgroundColor: colors.slate,
		opacity: 0.6,
	},
	vehicle: {
		position: "absolute",
		left: 0,
	},
});
