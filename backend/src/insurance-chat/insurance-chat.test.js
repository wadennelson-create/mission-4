import { jest } from "@jest/globals";
import { getTinaReply, TINA_OPENING } from "./insurance-chat.controller.js";

describe("Insurance chat", () => {
	const originalApiKey = process.env.GEMINI_API_KEY;

	afterEach(() => {
		process.env.GEMINI_API_KEY = originalApiKey;
	});

	test("starts with Tina's opt-in message", async () => {
		process.env.GEMINI_API_KEY = "";

		const result = await getTinaReply([]);

		expect(result.reply).toBe(TINA_OPENING);
		expect(result.source).toBe("opening");
	});

	test("respects a declined opt-in before asking personal questions", async () => {
		process.env.GEMINI_API_KEY = "";

		const result = await getTinaReply([{ role: "user", content: "No thanks" }]);

		expect(result.reply).toMatch(/No problem/);
		expect(result.reply).not.toMatch(/what type/i);
	});

	test("applies race car exclusions in fallback mode", async () => {
		process.env.GEMINI_API_KEY = "";

		const result = await getTinaReply([
			{ role: "assistant", content: TINA_OPENING },
			{ role: "user", content: "Yes. I have a 12 year old racing car and worry about mechanical breakdowns." },
			{ role: "assistant", content: "Would you like protection for your own car too?" },
			{ role: "user", content: "Yes, I want cover for my car and damage to others." },
		]);

		expect(result.reply).toMatch(/can't recommend/);
		expect(result.reply).toMatch(/Comprehensive Car Insurance is only available/);
		expect(result.reply).toMatch(/MBI is not available/);
		expect(result.reply).toMatch(/Third Party Car Insurance is not available/);
		expect(result.reply).not.toMatch(/I recommend Third Party Car Insurance/);
	});

	test("does not recommend third party for a Skyline drift race car", async () => {
		process.env.GEMINI_API_KEY = "";

		const result = await getTinaReply([
			{ role: "assistant", content: TINA_OPENING },
			{ role: "user", content: "Yes. I have a Skyline drift car race car and need third party cover for track days." },
		]);

		expect(result.reply).toMatch(/can't recommend/);
		expect(result.reply).toMatch(/Third Party Car Insurance is not available/);
		expect(result.reply).toMatch(/track use/);
		expect(result.reply).not.toMatch(/I recommend Third Party Car Insurance/);
	});

	test("can recommend third party for cars under 10 years old when requested", async () => {
		process.env.GEMINI_API_KEY = "";

		const result = await getTinaReply([
			{ role: "assistant", content: TINA_OPENING },
			{ role: "user", content: "Yes. I drive a 6 year old hatchback and only want third party cover." },
		]);

		expect(result.reply).toMatch(/I recommend Third Party Car Insurance/);
	});

	test("can recommend third party for eligible cars 10 years old or older", async () => {
		process.env.GEMINI_API_KEY = "";

		const result = await getTinaReply([
			{ role: "assistant", content: TINA_OPENING },
			{ role: "user", content: "Yes. I drive a 12 year old sedan and only want third party cover." },
		]);

		expect(result.reply).toMatch(/I recommend Third Party Car Insurance/);
	});

	test("recommends comprehensive for cars under 10 years old when own-car cover matters", async () => {
		process.env.GEMINI_API_KEY = "";

		const result = await getTinaReply([
			{ role: "assistant", content: TINA_OPENING },
			{ role: "user", content: "Yes. I have a 6 year old hatchback and want cover for my car." },
		]);

		expect(result.reply).toMatch(/I recommend Comprehensive Car Insurance/);
	});

	test("asks about adding MBI plus theft and fire cover after a suitable recommendation", async () => {
		process.env.GEMINI_API_KEY = "";

		const result = await getTinaReply([
			{ role: "assistant", content: TINA_OPENING },
			{ role: "user", content: "Yes. I have a 6 year old hatchback and want cover for my car." },
		]);

		expect(result.reply).toMatch(/I recommend Comprehensive Car Insurance/);
		expect(result.reply).toMatch(/Would you like to add Mechanical Breakdown Insurance \(MBI\)/);
		expect(result.reply).toMatch(/theft and fire cover/);
	});

	test("does not ask about MBI or theft and fire cover for track vehicles", async () => {
		process.env.GEMINI_API_KEY = "";

		const result = await getTinaReply([
			{ role: "assistant", content: TINA_OPENING },
			{ role: "user", content: "Yes. I have a 6 year old drift car for track use and want third party cover." },
		]);

		expect(result.reply).toMatch(/can't recommend/);
		expect(result.reply).not.toMatch(/Would you like to add/);
	});

	test("recommends MBI in fallback mode when repair concerns are eligible for cars 10 years old or older", async () => {
		process.env.GEMINI_API_KEY = "";

		const result = await getTinaReply([
			{ role: "assistant", content: TINA_OPENING },
			{ role: "user", content: "Yes. I have a 12 year old hatchback and worry about expensive repairs." },
		]);

		expect(result.reply).toMatch(/Mechanical Breakdown Insurance \(MBI\)/);
	});

	test("calls Gemini when an API key is configured", async () => {
		process.env.GEMINI_API_KEY = "test-key";
		const fetchImpl = jest.fn(async () => ({
			ok: true,
			json: async () => ({
				candidates: [{ content: { parts: [{ text: "A Gemini answer." }] } }],
			}),
		}));

		const result = await getTinaReply([{ role: "user", content: "Yes" }], fetchImpl);

		expect(fetchImpl).toHaveBeenCalledTimes(1);
		expect(result.reply).toBe("A Gemini answer.");
		expect(result.source).toBe("gemini-3.5-flash");
	});
});
