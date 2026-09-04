import { Router } from "express";
import { getIrrigationAdvice } from "../controllers/irrigation.controller.js";

const router = Router();

router.post("/advice", getIrrigationAdvice);

export default router;