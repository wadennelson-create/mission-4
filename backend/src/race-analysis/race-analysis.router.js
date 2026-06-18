import express from "express";
import { analyseRaceSession } from "./race-analysis.controller.js";

const router = express.Router();

router.post("/", analyseRaceSession);

export default router;
