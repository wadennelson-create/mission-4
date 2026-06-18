import { calculateRaceAnalysis } from "./race-analysis.controller.js";

describe("Race analysis", () => {
	test("returns line analysis for a technical track session", () => {
		const result = calculateRaceAnalysis({
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
		});

		expect(result.error).toBeUndefined();
		expect(result.trackName).toBe("Highlands Motorsport Park");
		expect(result.lineScore).toBeGreaterThan(70);
		expect(result.dataConfidence).toBeGreaterThan(80);
		expect(result.projectedGain).toBeGreaterThan(0);
		expect(result.cornerFocus).toHaveLength(3);
	});

	test("allows race-day analysis without drones", () => {
		const result = calculateRaceAnalysis({
			trackName: "Taupo",
			carClass: "TCR",
			sessionMode: "race",
			trackType: "mixed",
			surfaceCondition: "dry",
			lapTime: 100,
			referenceLapTime: 98,
			averageSpeed: 130,
			droneCount: 0,
			sensorQuality: 88,
			trackMapAccuracy: 94,
			apexAccuracy: 80,
			brakingConsistency: 80,
			throttleSmoothness: 80,
		});

		expect(result.error).toBeUndefined();
		expect(result.dronePlan.primary).toMatch(/disabled/);
	});

	test("requires a drone for practice capture", () => {
		const result = calculateRaceAnalysis({
			trackName: "Taupo",
			carClass: "TCR",
			sessionMode: "practice",
			trackType: "mixed",
			surfaceCondition: "dry",
			lapTime: 100,
			referenceLapTime: 98,
			averageSpeed: 130,
			droneCount: 0,
			sensorQuality: 88,
			trackMapAccuracy: 94,
			apexAccuracy: 80,
			brakingConsistency: 80,
			throttleSmoothness: 80,
		});

		expect(result.error).toBe("Practice capture needs at least one drone.");
	});
});
