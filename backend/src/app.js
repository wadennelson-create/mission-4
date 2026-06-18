import express from "express";
import cors from "cors";
import riskRatingRouter from "./risk-rating/risk-rating.router.js";
import raceAnalysisRouter from "./race-analysis/race-analysis.router.js";
import insuranceChatRouter from "./insurance-chat/insurance-chat.router.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.json({
		message: "Turners Insurance AI API is running",
		endpoints: [
			"/api/insurance-chat",
			"/api/race-analysis",
			"/api/risk-rating",
		],
	});
});

app.use("/api/insurance-chat", insuranceChatRouter);
app.use("/api/risk-rating", riskRatingRouter);
app.use("/api/race-analysis", raceAnalysisRouter);

export default app;
