import { useState } from "react";
import { analyseRaceSession } from "../services/api.js";

const initialSession = {
	trackName: "Highlands Motorsport Park",
	carClass: "GT4",
	sessionMode: "practice",
	trackType: "technical",
	surfaceCondition: "dry",
	lapTime: 94.8,
	referenceLapTime: 92.9,
	averageSpeed: 148,
	droneCount: 2,
	sensorQuality: 91,
	trackMapAccuracy: 96,
	apexAccuracy: 78,
	brakingConsistency: 71,
	throttleSmoothness: 82,
};

export function useRaceAnalysis() {
	const [session, setSession] = useState(initialSession);
	const [result, setResult] = useState(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const updateSession = (field, value) => {
		setSession((current) => ({
			...current,
			[field]: value,
		}));
	};

	const runAnalysis = async (event) => {
		event.preventDefault();
		setError("");
		setLoading(true);

		const data = await analyseRaceSession(session);

		if (data.error) {
			setError(data.error);
			setResult(null);
		} else {
			setResult(data);
		}

		setLoading(false);
	};

	const resetSession = () => {
		setSession(initialSession);
		setResult(null);
		setError("");
	};

	return {
		session,
		result,
		error,
		loading,
		updateSession,
		runAnalysis,
		resetSession,
	};
}
