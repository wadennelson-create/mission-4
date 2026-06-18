// Risk rating keywords for severity assessment
export const RISK_KEYWORDS = {
	SEVERE: [
		"total loss",
		"serious injury",
		"multiple crashes",
		"fatality",
		"fatal",
		"critical",
	],
	MODERATE: ["collision", "accident", "crash", "damage", "injury", "hit"],
	MINOR: ["scratch", "dent", "bump", "scrape", "minor damage"],
};

// Claim history validation
export const CLAIM_HISTORY_BOUNDARIES = {
	MIN_LENGTH: 10,
	MAX_LENGTH: 5000,
};
