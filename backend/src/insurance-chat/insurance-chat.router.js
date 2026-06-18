import express from "express";
import { createInsuranceChatReply } from "./insurance-chat.controller.js";

const router = express.Router();

router.post("/", createInsuranceChatReply);

export default router;
