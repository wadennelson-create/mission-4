import { calculateRiskRating } from "./risk-rating.controller.js";

describe("Risk Rating TDD Tests", () => {
	test("returns Low Risk when claim history has no risk keywords", () => {
		const result = calculateRiskRating("No incidents reported by the customer.");

		expect(result.riskLevel).toBe("Low Risk");
		expect(result.score).toBe(0);
	});

	test("returns Medium Risk for one or two risk keywords", () => {
		const result = calculateRiskRating("One accident and minor damage.");

		expect(result.riskLevel).toBe("Medium Risk");
		expect(result.score).toBe(2);
	});

	test("returns High Risk for more than two risk keywords", () => {
		const result = calculateRiskRating("Two claims after an accident, crash, and collision damage.");

		expect(result.riskLevel).toBe("High Risk");
		expect(result.score).toBe(5);
	});

	test("returns error when claim history is missing", () => {
		const result = calculateRiskRating("");

		expect(result.error).toBe("Claim history is required.");
	});

	test("returns error when claim history is not a string", () => {
		const result = calculateRiskRating(123);

		expect(result.error).toBe("Claim history must be a string.");
	});
});
