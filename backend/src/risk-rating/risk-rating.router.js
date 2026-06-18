import express from "express";
import { getRiskRating } from "./risk-rating.controller.js";

const router = express.Router();

router.post("/", getRiskRating);

export default router;
