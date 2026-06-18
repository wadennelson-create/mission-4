export function calculateRiskRating(claimHistory) {
	if (!claimHistory) {
		return {
			error: "Claim history is required.",
		};
	}

	if (typeof claimHistory !== "string") {
		return {
			error: "Claim history must be a string.",
		};
	}

	const text = claimHistory.toLowerCase();

	let score = 0;

	const riskWords = [
		"claim",
		"claims",
		"accident",
		"accidents",
		"crash",
		"crashes",
		"collision",
		"collisions",
		"damage",
		"damaged",
	];

	riskWords.forEach((word) => {
		const matches = text.match(new RegExp(`\\b${word}\\b`, "g"));

		if (matches) {
			score += matches.length;
		}
	});

	let riskLevel = "";

	if (score === 0) {
		riskLevel = "Low Risk";
	} else if (score <= 2) {
		riskLevel = "Medium Risk";
	} else {
		riskLevel = "High Risk";
	}

	return {
		score,
		riskLevel,
	};
}

export function getRiskRating(req, res) {
	const { claimHistory } = req.body;

	console.log(
		`[${new Date().toISOString()}] [INFO] Risk rating request received | ${JSON.stringify(
			req.body,
		)}`,
	);

	const result = calculateRiskRating(claimHistory);

	if (result.error) {
		console.log(
			`[${new Date().toISOString()}] [WARN] Risk rating validation failed | ${JSON.stringify(
				result,
			)}`,
		);

		return res.status(400).json(result);
	}

	return res.status(200).json(result);
}
