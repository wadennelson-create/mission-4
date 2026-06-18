const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

export const TINA_OPENING =
	"I'm Tina. I help you choose the right insurance policy. May I ask you a few personal questions to make sure I recommend the best policy for you?";

const SYSTEM_INSTRUCTION = `
You are Tina, a friendly Turners car insurance consultant.

Your task:
- Chat naturally with the customer and recommend one or more suitable policies at the end.
- Start from the opt-in question already shown to the customer. If the customer does not consent, respect that and do not ask personal questions.
- Ask one short, adaptive question at a time until you have enough context.
- Do not ask the customer which main insurance product they want before making a recommendation.
- Do ask about practical needs, such as vehicle type, vehicle age, whether they want cover for their own car, third-party damage, repair budget protection, or mechanical breakdown concerns.
- When ready, recommend one or more products and explain the reasons in plain language.
- After recommending a suitable main policy, ask whether the customer would like to add Mechanical Breakdown Insurance (MBI), and theft and fire cover when those options fit the vehicle.

Products:
- Mechanical Breakdown Insurance (MBI): helps with unexpected mechanical or electrical breakdown repair costs.
- Theft and Fire Cover: helps cover the vehicle if it is stolen or damaged by fire.
- Comprehensive Car Insurance: broad cover for the customer's own vehicle plus damage to other people's vehicles or property.
- Third Party Car Insurance: covers damage the customer causes to other people's vehicles or property, but not their own car.

Business rules:
- MBI is not available to trucks or racing cars.
- Theft and Fire Cover is not available for racing cars, drift cars, track cars, or vehicles used on race tracks.
- Comprehensive Car Insurance is only available to motor vehicles less than 10 years old.
- Comprehensive Car Insurance is recommended for cars less than 10 years old when the customer wants cover for their own car.
- Third Party Car Insurance can be chosen for eligible cars of any age.
- Third Party Car Insurance is not available for racing cars, drift cars, track cars, or vehicles used on race tracks.
- Do not recommend any policy for track use.

Keep responses concise, practical, and reassuring.
`.trim();

function normaliseMessages(messages) {
	if (!Array.isArray(messages)) {
		return null;
	}

	return messages
		.filter((message) => message && ["user", "assistant"].includes(message.role) && typeof message.content === "string")
		.map((message) => ({
			role: message.role,
			content: message.content.trim(),
		}))
		.filter((message) => message.content.length > 0)
		.slice(-16);
}

function hasDeclined(messages) {
	const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
	if (!lastUserMessage) {
		return false;
	}

	return /\b(no|nope|nah|not now|stop|decline)\b/i.test(lastUserMessage.content) || /\b(don't|do not)\s+(want|consent|agree|answer|share)\b/i.test(lastUserMessage.content);
}

function extractVehicleAge(text) {
	const ageMatch = text.match(/\b(\d{1,2})\s*(year|years|yr|yrs)\s*old\b/i);
	if (ageMatch) {
		return Number(ageMatch[1]);
	}

	const yearMatch = text.match(/\b(19|20)\d{2}\b/);
	if (!yearMatch) {
		return null;
	}

	return new Date().getFullYear() - Number(yearMatch[0]);
}

function buildFallbackReply(messages) {
	const transcript = messages.map((message) => message.content).join(" ").toLowerCase();

	if (hasDeclined(messages)) {
		return "No problem. I won't ask personal questions. If you change your mind later, I can help compare the policy options.";
	}

	const isTruckOrRacing = /\b(truck|ute used as a truck|racing car|race car|track car|drift car)\b/i.test(transcript);
	const isRaceOrTrackUse = /\b(racing car|race car|track car|drift car|drift|drifting|race track|racetrack|track use|on track|skyline drift)\b/i.test(
		transcript,
	);
	const vehicleAge = extractVehicleAge(transcript);
	const wantsOwnCarCover = /\b(my car|own car|comprehensive|stolen|theft|accident|crash|damage to my)\b/i.test(transcript);
	const mentionsBreakdown = /\b(breakdown|mechanical|electrical|repairs?|warranty)\b/i.test(transcript);
	const mentionsThirdParty = /\b(third party|cheap|budget|other people's|other cars|liability)\b/i.test(transcript);
	const mentionsAddOns = /\b(mbi|mechanical breakdown|breakdown|theft|stolen|fire)\b/i.test(transcript);

	if (!/\b(car|vehicle|truck|ute|van|suv|hatchback|sedan|wagon|coupe|convertible|racing|drift|skyline)\b/i.test(transcript)) {
		return "Thanks. What type of vehicle do you drive, and roughly how old is it?";
	}

	if (isRaceOrTrackUse && mentionsThirdParty) {
		return "Based on what you've told me, I can't recommend Third Party Car Insurance for this vehicle. Third Party Car Insurance is not available for race, drift, or track cars and does not cover track use.";
	}

	if (vehicleAge === null) {
		return "Roughly how old is the vehicle? That affects whether Comprehensive Car Insurance is available.";
	}

	const addOnOptions = [];
	if (!isTruckOrRacing && !mentionsBreakdown) {
		addOnOptions.push("Mechanical Breakdown Insurance (MBI)");
	}

	if (!isRaceOrTrackUse && !/\b(theft|stolen|fire)\b/i.test(transcript)) {
		addOnOptions.push("theft and fire cover");
	}

	const addOnQuestion =
		!mentionsAddOns && addOnOptions.length > 0
			? ` Would you like to add ${addOnOptions.join(" and ")}?`
			: "";

	if (vehicleAge < 10 && wantsOwnCarCover && !mentionsThirdParty && !isRaceOrTrackUse) {
		return `Based on what you've told me, I recommend Comprehensive Car Insurance, because your vehicle is under 10 years old.${addOnQuestion}`;
	}

	if (!wantsOwnCarCover && !mentionsBreakdown && !mentionsThirdParty) {
		return "Would you like protection for your own car as well, or mainly cover for damage you might cause to other people's vehicles or property?";
	}

	const recommendations = [];
	const exclusions = [];

	if (wantsOwnCarCover && vehicleAge < 10 && !isRaceOrTrackUse) {
		recommendations.push("Comprehensive Car Insurance, because your vehicle is under 10 years old and you want cover for your own car as well as third-party damage");
	}

	if (mentionsBreakdown && !isTruckOrRacing) {
		recommendations.push("Mechanical Breakdown Insurance (MBI), because you mentioned concern about unexpected repair costs");
	}

	if (mentionsThirdParty && !isRaceOrTrackUse) {
		recommendations.push("Third Party Car Insurance, because it gives a lower-cost way to cover damage you cause to other people's vehicles or property");
	}

	if (wantsOwnCarCover && vehicleAge >= 10 && !isRaceOrTrackUse) {
		recommendations.push("Third Party Car Insurance, because Comprehensive Car Insurance is only available for vehicles less than 10 years old");
	}

	if (wantsOwnCarCover && vehicleAge >= 10) {
		exclusions.push("Comprehensive Car Insurance is only available for vehicles less than 10 years old");
	}

	if (mentionsBreakdown && isTruckOrRacing) {
		exclusions.push("MBI is not available for trucks or racing cars");
	}

	if (isRaceOrTrackUse) {
		exclusions.push("Third Party Car Insurance is not available for race, drift, or track cars and does not cover track use");
	}

	if (recommendations.length === 0 && exclusions.length > 0) {
		return `Based on what you've told me, I can't recommend one of these policies for this vehicle. ${exclusions.join("; ")}.`;
	}

	const explanation = [...recommendations, ...exclusions].join("; ");
	return `Based on what you've told me, I recommend ${explanation}.${recommendations.length > 0 ? addOnQuestion : ""}`;
}

function toGeminiContents(messages) {
	return messages.map((message) => ({
		role: message.role === "assistant" ? "model" : "user",
		parts: [{ text: message.content }],
	}));
}

export async function getTinaReply(messages, fetchImpl = globalThis.fetch) {
	if (messages.length === 0) {
		return { reply: TINA_OPENING, source: "opening" };
	}

	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		return { reply: buildFallbackReply(messages), source: "local-fallback" };
	}

	if (!fetchImpl) {
		throw new Error("Fetch API is not available in this runtime.");
	}

	const response = await fetchImpl(GEMINI_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-goog-api-key": apiKey,
		},
		body: JSON.stringify({
			systemInstruction: {
				parts: [{ text: SYSTEM_INSTRUCTION }],
			},
			contents: toGeminiContents(messages),
			generationConfig: {
				temperature: 0.6,
				maxOutputTokens: 320,
			},
		}),
	});

	const data = await response.json();

	if (!response.ok) {
		const detail = data?.error?.message || "Gemini request failed.";
		throw new Error(detail);
	}

	const reply = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join(" ").trim();
	if (!reply) {
		throw new Error("Gemini did not return a response.");
	}

	return { reply, source: MODEL_NAME };
}

export async function createInsuranceChatReply(req, res) {
	const messages = normaliseMessages(req.body?.messages);

	if (!messages) {
		return res.status(400).json({ error: "messages must be an array of chat messages." });
	}

	try {
		const result = await getTinaReply(messages);
		return res.status(200).json(result);
	} catch (error) {
		console.error("Insurance chat failed:", error);
		return res.status(200).json({
			reply: buildFallbackReply(messages),
			source: "local-fallback",
		});
	}
}
