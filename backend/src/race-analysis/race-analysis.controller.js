const TRACK_TYPES = ["technical", "flowing", "street", "oval", "mixed"];
const SURFACE_CONDITIONS = ["dry", "damp", "wet"];
const SESSION_MODES = ["practice", "race"];

function asNumber(value) {
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

function round(value, decimals = 1) {
	return Number(value.toFixed(decimals));
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function validateSession(session) {
	if (!session || typeof session !== "object") {
		return "Session data is required.";
	}

	const requiredStrings = ["trackName", "carClass", "trackType", "surfaceCondition", "sessionMode"];
	for (const field of requiredStrings) {
		if (!session[field] || typeof session[field] !== "string") {
			return `${field} is required.`;
		}
	}

	if (!SESSION_MODES.includes(session.sessionMode)) {
		return `sessionMode must be one of: ${SESSION_MODES.join(", ")}.`;
	}

	if (!TRACK_TYPES.includes(session.trackType)) {
		return `trackType must be one of: ${TRACK_TYPES.join(", ")}.`;
	}

	if (!SURFACE_CONDITIONS.includes(session.surfaceCondition)) {
		return `surfaceCondition must be one of: ${SURFACE_CONDITIONS.join(", ")}.`;
	}

	const numericFields = [
		"lapTime",
		"referenceLapTime",
		"averageSpeed",
		"droneCount",
		"sensorQuality",
		"trackMapAccuracy",
		"apexAccuracy",
		"brakingConsistency",
		"throttleSmoothness",
	];

	for (const field of numericFields) {
		if (asNumber(session[field]) === null) {
			return `${field} must be a number.`;
		}
	}

	if (asNumber(session.lapTime) <= 0 || asNumber(session.referenceLapTime) <= 0) {
		return "Lap times must be greater than zero.";
	}

	if (asNumber(session.droneCount) < 0) {
		return "Drone count cannot be negative.";
	}

	if (session.sessionMode === "practice" && asNumber(session.droneCount) < 1) {
		return "Practice capture needs at least one drone.";
	}

	return null;
}

function getTrackBias(trackType) {
	const bias = {
		technical: { braking: 1.2, apex: 1.35, throttle: 0.9 },
		flowing: { braking: 0.85, apex: 1.15, throttle: 1.25 },
		street: { braking: 1.35, apex: 1.2, throttle: 0.85 },
		oval: { braking: 0.6, apex: 0.85, throttle: 1.5 },
		mixed: { braking: 1, apex: 1, throttle: 1 },
	};

	return bias[trackType];
}

function buildCornerFocus(apexAccuracy, brakingConsistency, throttleSmoothness, trackType) {
	const bias = getTrackBias(trackType);
	const corners = [
		{
			name: "Turn 1 entry",
			issue: "Brake release is costing rotation into the first apex.",
			action: "Trail brake 8-12 m deeper, then release pressure earlier as steering angle builds.",
			severity: (100 - brakingConsistency) * bias.braking,
		},
		{
			name: "Mid-sector switchback",
			issue: "Car placement is late across the direction change.",
			action: "Open the first apex by half a car width to straighten the second exit.",
			severity: (100 - apexAccuracy) * bias.apex,
		},
		{
			name: "Final corner exit",
			issue: "Throttle pickup is creating a small correction before the straight.",
			action: "Delay full throttle until the car crosses the drone-projected exit vector.",
			severity: (100 - throttleSmoothness) * bias.throttle,
		},
	];

	return corners
		.sort((a, b) => b.severity - a.severity)
		.map((corner, index) => ({
			priority: index + 1,
			name: corner.name,
			issue: corner.issue,
			action: corner.action,
			lossEstimate: `${round(clamp(corner.severity / 42, 0.1, 1.8), 2)}s`,
		}));
}

export function calculateRaceAnalysis(session) {
	const validationError = validateSession(session);

	if (validationError) {
		return { error: validationError };
	}

	const lapTime = asNumber(session.lapTime);
	const referenceLapTime = asNumber(session.referenceLapTime);
	const averageSpeed = asNumber(session.averageSpeed);
	const droneCount = asNumber(session.droneCount);
	const sensorQuality = clamp(asNumber(session.sensorQuality), 0, 100);
	const trackMapAccuracy = clamp(asNumber(session.trackMapAccuracy), 0, 100);
	const apexAccuracy = clamp(asNumber(session.apexAccuracy), 0, 100);
	const brakingConsistency = clamp(asNumber(session.brakingConsistency), 0, 100);
	const throttleSmoothness = clamp(asNumber(session.throttleSmoothness), 0, 100);

	const lapDelta = lapTime - referenceLapTime;
	const lineScore = round(
		clamp(
			apexAccuracy * 0.42 +
				brakingConsistency * 0.34 +
				throttleSmoothness * 0.24 -
				Math.max(lapDelta, 0) * 1.8,
			0,
			100,
		),
	);
	const droneConfidence =
		session.sessionMode === "practice"
			? clamp(42 + droneCount * 12 + averageSpeed / 14, 40, 98)
			: clamp(18 + droneCount * 10, 0, 60);
	const dataConfidence = round(
		clamp(
			trackMapAccuracy * 0.34 +
				sensorQuality * 0.42 +
				droneConfidence * 0.24 -
				(session.surfaceCondition === "wet" ? 7 : 0),
			35,
			98,
		),
	);
	const projectedGain = round(
		clamp(
			Math.max(lapDelta, 0) * 0.38 +
				(100 - lineScore) / 32 +
				(session.trackType === "technical" ? 0.25 : 0),
			0.15,
			4.8,
		),
		2,
	);

	const recommendedLine =
		session.sessionMode === "race"
			? "Compare race-day telemetry against the practice baseline and flag only repeatable losses the driver can act on without drone support."
			: lineScore >= 86
				? "Refine exit width and use drone overlays to hunt small throttle timing gains for the race-day baseline."
				: "Use drone video to lock the reference line, then pair it with sensor traces for race-day comparison.";

	return {
		trackName: session.trackName.trim(),
		carClass: session.carClass.trim(),
		sessionMode: session.sessionMode,
		lapDelta: round(lapDelta, 2),
		lineScore,
		dataConfidence,
		projectedGain,
		recommendedLine,
		baselinePlan:
			session.sessionMode === "practice"
				? "Capture drone video, RTK/GPS trace, brake/throttle/steering data, and track-map gates as the reference pack."
				: "Use the practice reference pack to compare race laps from car sensors only, with drone layers locked out.",
		dronePlan: {
			count: droneCount,
			primary:
				session.sessionMode === "practice"
					? "High static overview locked to braking, apex, and exit gates."
					: "Race-day drone capture disabled; use mapped gates and car sensor traces.",
			secondary:
				session.sessionMode === "race"
					? "Telemetry comparison remains active for GPS line, braking, throttle, steering, and yaw."
					: droneCount > 1
					? "Low chase angle through priority corners for yaw, roll, and throttle pickup review."
					: "Add a chase drone for next session to improve driver-line validation.",
		},
		cornerFocus: buildCornerFocus(apexAccuracy, brakingConsistency, throttleSmoothness, session.trackType),
	};
}

export function analyseRaceSession(req, res) {
	const result = calculateRaceAnalysis(req.body);

	if (result.error) {
		return res.status(400).json(result);
	}

	return res.status(200).json(result);
}
