import { Router } from "express";
import { getStage, getSowingWindow } from "../controllers/calendar.controller.js";

const router = Router();

router.post("/stage", getStage);
router.get("/sowing-window/:crop", getSowingWindow);

export default router;